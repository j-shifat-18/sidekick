from playwright.async_api import async_playwright
from langchain_community.agent_toolkits import PlayWrightBrowserToolkit
from dotenv import load_dotenv
import os
import requests
try:
    from langchain_core.tools import Tool
except ImportError:
    from langchain.agents import Tool
from langchain_community.agent_toolkits import FileManagementToolkit
from langchain_community.tools.wikipedia.tool import WikipediaQueryRun
from langchain_experimental.tools import PythonREPLTool
from langchain_community.utilities import GoogleSerperAPIWrapper
from langchain_community.utilities.wikipedia import WikipediaAPIWrapper



load_dotenv(override=True)
pushover_token = os.getenv("PUSHOVER_TOKEN")
pushover_user = os.getenv("PUSHOVER_USER")
pushover_url = "https://api.pushover.net/1/messages.json"


async def playwright_tools():
    headless = os.getenv("PLAYWRIGHT_HEADLESS", "false").lower() in ("true", "1")
    playwright = await async_playwright().start()
    browser = await playwright.chromium.launch(headless=headless)
    toolkit = PlayWrightBrowserToolkit.from_browser(async_browser=browser)
    return toolkit.get_tools(), browser, playwright


def push(text: str):
    """Send a push notification to the user"""
    if not pushover_token or not pushover_user:
        return "Pushover credentials (PUSHOVER_TOKEN, PUSHOVER_USER) not configured in .env."
    try:
        requests.post(pushover_url, data={"token": pushover_token, "user": pushover_user, "message": text}, timeout=10)
        return "success"
    except Exception as e:
        return f"Failed to send notification: {e}"


def get_file_tools():
    toolkit = FileManagementToolkit(root_dir="sandbox")
    return toolkit.get_tools()


async def other_tools():
    push_tool = Tool(
        name="send_push_notification",
        func=push,
        description="Use this tool when you want to send a push notification to the user's device",
    )
    file_tools = list(get_file_tools())
    tools = file_tools + [push_tool]

    if os.getenv("SERPER_API_KEY"):
        try:
            serper = GoogleSerperAPIWrapper()
            tool_search = Tool(
                name="search",
                func=serper.run,
                description="Use this tool when you want to get the results of an online web search",
            )
            tools.append(tool_search)
        except Exception as e:
            print(f"Warning: Could not initialize Google Serper search: {e}")

    try:
        wikipedia = WikipediaAPIWrapper()
        wiki_tool = WikipediaQueryRun(api_wrapper=wikipedia)
        tools.append(wiki_tool)
    except Exception as e:
        print(f"Warning: Could not initialize Wikipedia tool: {e}")

    python_repl = PythonREPLTool()
    tools.append(python_repl)

    return tools

