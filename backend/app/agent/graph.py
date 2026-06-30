"""构建 LangGraph ReAct Agent：国产 LLM + 高德 MCP 工具 + emit_itinerary 结构化输出。"""
from langchain.agents import create_agent
from langchain_core.tools import tool
from langgraph.checkpoint.memory import MemorySaver

from app.agent.llm import build_llm
from app.agent.mcp_tools import load_amap_tools
from app.agent.prompts import SYSTEM_PROMPT
from app.agent.schema import Itinerary

# 进程内会话记忆（MVP）。后续可换 langgraph-checkpoint-sqlite 做持久化。
checkpointer = MemorySaver()


@tool(args_schema=Itinerary)
def emit_itinerary(**kwargs) -> str:
    """提交最终的结构化行程。规划完成后必须调用本工具输出行程。"""
    # 真正的行程数据通过工具调用参数传出，由 SSE 层从工具调用事件中读取。
    return "行程已提交。"


_agent = None


async def get_agent():
    """惰性构建并缓存 Agent（首次拉取 MCP 工具为异步）。"""
    global _agent
    if _agent is None:
        amap_tools = await load_amap_tools()
        tools = amap_tools + [emit_itinerary]
        _agent = create_agent(
            build_llm(),
            tools=tools,
            system_prompt=SYSTEM_PROMPT,
            checkpointer=checkpointer,
        )
    return _agent
