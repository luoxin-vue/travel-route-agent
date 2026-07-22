"""构建 LangGraph Agent 编排。"""
from langchain_core.tools import tool
from langgraph.checkpoint.memory import MemorySaver
from langchain.agents import create_agent

from app.agent.llm import build_llm
from app.agent.mcp_tools import load_amap_tools
from app.agent.prompts import SYSTEM_PROMPT
from app.agent.schema import Itinerary


checkpointer = MemorySaver()


@tool(args_schema=Itinerary)
def emit_itinerary(**kwargs) -> str:
    """提交最终的结构化行程。规划完成后必须调用本工具输出行程。"""
    return "行程已提交。"


_agent = None


async def get_agent():
    """惰性构建并缓存 Single-Agent。"""
    global _agent
    if _agent is None:
        amap_tools = await load_amap_tools()
        llm = build_llm()
        agent_tools = list(amap_tools) + [emit_itinerary]
        
        _agent = create_agent(
            model=llm,
            tools=agent_tools,
            system_prompt=SYSTEM_PROMPT,
            checkpointer=checkpointer,
        )
    return _agent



