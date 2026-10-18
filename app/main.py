import asyncio
import sys

try:
    from app.sidekick import Sidekick
except (ImportError, ModuleNotFoundError):
    from sidekick import Sidekick


async def run_cli():
    print("=" * 60)
    print("🚀 Initializing Sidekick Autonomous Agent...")
    print("=" * 60)

    sidekick = Sidekick()
    try:
        await sidekick.setup()
        print("✅ Sidekick ready! (Type 'exit' or 'quit' to stop)\n")

        history = []
        while True:
            try:
                user_task = input("👉 Enter your task: ").strip()
                if not user_task:
                    continue
                if user_task.lower() in ("exit", "quit", "q"):
                    break

                criteria = input("🎯 Success criteria (optional, press Enter for default): ").strip()
                if not criteria:
                    criteria = "The answer should be clear, accurate, complete, and directly address the user's request."

                print("\n⏳ Sidekick is executing the task...\n")
                history = await sidekick.run_superstep(
                    message=user_task,
                    success_criteria=criteria,
                    history=history,
                )

                print("-" * 60)
                if len(history) >= 2:
                    print(f"🤖 Assistant:\n{history[-2]['content']}\n")
                    print(f"📋 Evaluator:\n{history[-1]['content']}")
                print("-" * 60 + "\n")

            except (KeyboardInterrupt, EOFError):
                break
    finally:
        print("\n🧹 Cleaning up browser & agent resources...")
        sidekick.cleanup()
        print("👋 Goodbye!")


def main():
    asyncio.run(run_cli())


if __name__ == "__main__":
    main()
