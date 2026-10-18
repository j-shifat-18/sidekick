import os
import sys
import json
import asyncio
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

try:
    from app.sidekick import Sidekick
except (ImportError, ModuleNotFoundError):
    from sidekick import Sidekick

# Shared Sidekick instance
sidekick_instance: Optional[Sidekick] = None
sandbox_dir = Path("sandbox")


@asynccontextmanager
async def lifespan(app: FastAPI):
    global sidekick_instance
    print("🚀 Initializing Sidekick Agent & Browser Toolkit...")
    sandbox_dir.mkdir(parents=True, exist_ok=True)
    sidekick_instance = Sidekick()
    await sidekick_instance.setup()
    print("✅ Sidekick ready for requests.")
    yield
    print("🧹 Cleaning up Sidekick resources...")
    if sidekick_instance:
        sidekick_instance.cleanup()
    print("👋 Shutdown complete.")


app = FastAPI(
    title="Sidekick Agent API",
    description="Backend API for Sidekick Autonomous Agent",
    version="0.1.0",
    lifespan=lifespan,
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RunRequest(BaseModel):
    message: str = Field(..., description="User's task or question")
    success_criteria: Optional[str] = Field(
        None, description="Explicit criteria defining task completion"
    )
    thread_id: Optional[str] = Field(
        None, description="Session ID to continue an existing thread"
    )


class SandboxFile(BaseModel):
    name: str
    size: int
    modified: float
    is_dir: bool


@app.get("/api/health")
async def health_check():
    openai_set = bool(os.getenv("OPENAI_API_KEY"))
    serper_set = bool(os.getenv("SERPER_API_KEY"))
    pushover_set = bool(os.getenv("PUSHOVER_USER") and os.getenv("PUSHOVER_TOKEN"))
    langsmith_set = bool(os.getenv("LANGSMITH_API_KEY"))

    tools = []
    if sidekick_instance and sidekick_instance.tools:
        tools = [getattr(t, "name", str(t)) for t in sidekick_instance.tools]

    return {
        "status": "healthy",
        "agent_ready": sidekick_instance is not None and sidekick_instance.graph is not None,
        "tools_count": len(tools),
        "tools": tools,
        "env": {
            "openai": openai_set,
            "serper": serper_set,
            "pushover": pushover_set,
            "langsmith": langsmith_set,
        },
    }


@app.get("/api/sandbox/files")
async def list_sandbox_files():
    sandbox_dir.mkdir(parents=True, exist_ok=True)
    files: List[Dict[str, Any]] = []
    for item in sandbox_dir.rglob("*"):
        if item.is_file():
            stat = item.stat()
            rel_path = item.relative_to(sandbox_dir).as_posix()
            files.append(
                {
                    "name": item.name,
                    "path": rel_path,
                    "size": stat.st_size,
                    "modified": stat.st_mtime,
                    "extension": item.suffix.lower(),
                }
            )
    files.sort(key=lambda x: x["modified"], reverse=True)
    return {"files": files}


@app.get("/api/sandbox/file")
async def get_sandbox_file(path: str = Query(..., description="Relative file path inside sandbox")):
    sandbox_dir.mkdir(parents=True, exist_ok=True)
    target = (sandbox_dir / path).resolve()
    # Prevent path traversal outside sandbox
    if not str(target).startswith(str(sandbox_dir.resolve())):
        raise HTTPException(status_code=400, detail="Invalid file path outside sandbox")

    if not target.exists() or not target.is_file():
        raise HTTPException(status_code=404, detail="File not found")

    try:
        content = target.read_text(encoding="utf-8")
        return {"path": path, "content": content, "binary": False}
    except UnicodeDecodeError:
        return {"path": path, "content": "[Binary file]", "binary": True}


@app.post("/api/agent/stream")
async def run_agent_stream(req: RunRequest):
    if not sidekick_instance or not sidekick_instance.graph:
        raise HTTPException(status_code=503, detail="Agent is not ready yet")

    thread_id = req.thread_id or sidekick_instance.sidekick_id
    config = {"configurable": {"thread_id": thread_id}}

    criteria = req.success_criteria or "The answer should be clear, accurate, complete, and directly address the user's request."

    initial_state = {
        "messages": req.message,
        "success_criteria": criteria,
        "feedback_on_work": None,
        "success_criteria_met": False,
        "user_input_needed": False,
    }

    async def event_generator():
        yield f"event: start\ndata: {json.dumps({'thread_id': thread_id, 'message': req.message, 'success_criteria': criteria})}\n\n"

        cycle_count = 0
        final_reply = ""
        final_evaluator_feedback = ""
        criteria_met = False
        input_needed = False

        try:
            # Stream graph updates node-by-node
            async for update in sidekick_instance.graph.astream(initial_state, config=config, stream_mode="updates"):
                for node_name, node_output in update.items():
                    if node_name == "worker":
                        cycle_count += 1
                        msgs = node_output.get("messages", [])
                        for msg in msgs:
                            # Check for tool calls
                            tool_calls = getattr(msg, "tool_calls", None) or []
                            if tool_calls:
                                for tc in tool_calls:
                                    payload = {
                                        "node": "worker",
                                        "type": "tool_call",
                                        "name": tc.get("name", "unknown_tool"),
                                        "args": tc.get("args", {}),
                                        "call_id": tc.get("id"),
                                        "cycle": cycle_count,
                                    }
                                    yield f"event: tool_call\ndata: {json.dumps(payload)}\n\n"
                            
                            # Content / thoughts
                            content = getattr(msg, "content", "")
                            if content:
                                final_reply = content
                                payload = {
                                    "node": "worker",
                                    "type": "thought",
                                    "content": content,
                                    "cycle": cycle_count,
                                    "is_question": "Question:" in content or content.strip().endswith("?"),
                                }
                                yield f"event: worker_thought\ndata: {json.dumps(payload)}\n\n"

                    elif node_name == "tools":
                        msgs = node_output.get("messages", [])
                        for msg in msgs:
                            tool_name = getattr(msg, "name", "tool")
                            tool_content = str(getattr(msg, "content", ""))
                            # Truncate large tool content for stream preview
                            preview = tool_content if len(tool_content) <= 1500 else tool_content[:1500] + "... [truncated]"
                            payload = {
                                "node": "tools",
                                "name": tool_name,
                                "output": preview,
                                "cycle": cycle_count,
                            }
                            yield f"event: tool_result\ndata: {json.dumps(payload)}\n\n"

                    elif node_name == "evaluator":
                        feedback = node_output.get("feedback_on_work", "")
                        criteria_met = bool(node_output.get("success_criteria_met", False))
                        input_needed = bool(node_output.get("user_input_needed", False))
                        final_evaluator_feedback = feedback

                        payload = {
                            "node": "evaluator",
                            "feedback": feedback,
                            "success_criteria_met": criteria_met,
                            "user_input_needed": input_needed,
                            "cycle": cycle_count,
                        }
                        yield f"event: evaluator\ndata: {json.dumps(payload)}\n\n"

            # Completion event
            done_payload = {
                "thread_id": thread_id,
                "reply": final_reply,
                "evaluator_feedback": final_evaluator_feedback,
                "success_criteria_met": criteria_met,
                "user_input_needed": input_needed,
                "cycles": cycle_count,
            }
            yield f"event: done\ndata: {json.dumps(done_payload)}\n\n"

        except Exception as e:
            err_payload = {"error": str(e), "type": type(e).__name__}
            yield f"event: error\ndata: {json.dumps(err_payload)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.server:app", host="0.0.0.0", port=8000, reload=True)
