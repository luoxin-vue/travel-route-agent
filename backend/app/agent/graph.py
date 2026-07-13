"""构建 LangGraph Single-Agent 或 Multi-Agent 编排。

当前采用单 Agent 方案（符合 YAGNI 与 极简高效原则），原多 Agent 方案已注释保留供以后参考学习。
"""
from typing import Annotated, TypedDict
from langchain_core.messages import AnyMessage, SystemMessage, ToolMessage
from langchain_core.tools import tool
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import StateGraph, START, END
from langchain.agents import create_agent
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode

from app.agent.llm import build_llm
from app.agent.mcp_tools import load_amap_tools
from app.agent.prompts import SYSTEM_PROMPT, SUPERVISOR_PROMPT, TRANSIT_PROMPT, LODGING_PROMPT
from app.agent.schema import Itinerary

# 进程内会话记忆（MVP）。后续可换 langgraph-checkpoint-sqlite 做持久化。
checkpointer = MemorySaver()


@tool(args_schema=Itinerary)
def emit_itinerary(**kwargs) -> str:
    """提交最终的结构化行程。规划完成后必须调用本工具输出行程。"""
    return "行程已提交。"


# =====================================================================
# 单 Agent 方案 (Single-Agent Scheme)
# =====================================================================
_agent = None


async def get_agent():
    """惰性构建并缓存 Single-Agent（首次拉取 MCP 工具为异步）。"""
    global _agent
    if _agent is None:
        amap_tools = await load_amap_tools()
        llm = build_llm()
        
        # 单 Agent 方案：绑定所有高德 API 工具和行程输出工具
        agent_tools = list(amap_tools) + [emit_itinerary]
        
        # 使用 langchain.agents 的 create_agent 构建 React 风格的单智能体
        _agent = create_agent(
            model=llm,
            tools=agent_tools,
            system_prompt=SYSTEM_PROMPT,
            checkpointer=checkpointer,
        )
    return _agent


# =====================================================================
# 注释保留：多 Agent 方案 (Multi-Agent Scheme - 供学习参考)
# =====================================================================
# class AgentState(TypedDict):
#     messages: Annotated[list[AnyMessage], add_messages]
# 
# 
# @tool
# def delegate_to_transit_agent(instruction: str) -> str:
#     """委派给交通专家，指导其进行路线规划或出行时间/距离计算。参数输入具体的委派指令。"""
#     return f"已成功委派交通专家，任务指令：{instruction}"
# 
# 
# @tool
# def delegate_to_lodging_agent(instruction: str) -> str:
#     """委派给景点与酒店住宿专家，指导其寻找景点、搜索周边、推荐酒店或查询天气。参数输入具体的委派指令。"""
#     return f"已成功委派景点与酒店住宿专家，任务指令：{instruction}"
# 
# 
# async def get_multi_agent():
#     """惰性构建并缓存 Multi-Agent 编排图（已弃用，仅供参考）。"""
#     amap_tools = await load_amap_tools()
# 
#     # 1. 划分工具集
#     transit_tool_names = {
#         "direction_driving",
#         "direction_transit",
#         "direction_walking",
#         "direction_bicycling",
#         "distance",
#     }
#     lodging_tool_names = {
#         "text_search",
#         "around_search",
#         "search_detail",
#         "weather",
#         "geo",
#         "regeocode",
#         "ip_location",
#     }
# 
#     transit_tools = []
#     lodging_tools = []
#     for t in amap_tools:
#         if t.name in transit_tool_names:
#             transit_tools.append(t)
#         elif t.name in lodging_tool_names:
#             lodging_tools.append(t)
#         else:
#             lodging_tools.append(t)
# 
#     llm = build_llm()
# 
#     # 2. 构建专职子 Agent
#     transit_agent = create_agent(
#         model=llm,
#         tools=transit_tools,
#         system_prompt=TRANSIT_PROMPT,
#     )
#     lodging_agent = create_agent(
#         model=llm,
#         tools=lodging_tools,
#         system_prompt=LODGING_PROMPT,
#     )
# 
#     # 3. 定义主管 Agent 的工具节点
#     supervisor_tools_node = ToolNode([
#         delegate_to_transit_agent,
#         delegate_to_lodging_agent,
#         emit_itinerary,
#     ])
# 
#     # 4. 构造主管节点（单次调用）
#     async def supervisor_node(state: AgentState):
#         tools = [delegate_to_transit_agent, delegate_to_lodging_agent, emit_itinerary]
#         llm_with_tools = llm.bind_tools(tools)
# 
#         # 注入主管 System Prompt
#         messages = [SystemMessage(content=SUPERVISOR_PROMPT)] + state["messages"]
#         response = await llm_with_tools.ainvoke(messages)
#         return {"messages": [response]}
# 
#     # 5. 构建 LangGraph 流程图
#     workflow = StateGraph(AgentState)
# 
#     workflow.add_node("Supervisor", supervisor_node)
#     workflow.add_node("SupervisorTools", supervisor_tools_node)
#     workflow.add_node("TransitAgent", transit_agent)
#     workflow.add_node("LodgingAgent", lodging_agent)
# 
#     # 连接边
#     workflow.add_edge("TransitAgent", "Supervisor")
#     workflow.add_edge("LodgingAgent", "Supervisor")
# 
#     # 主管条件路由
#     def route_after_supervisor(state: AgentState):
#         last_message = state["messages"][-1]
#         if last_message.tool_calls:
#             return "SupervisorTools"
#         return END
# 
#     # 工具箱条件路由
#     def route_after_tools(state: AgentState):
#         for msg in reversed(state["messages"]):
#             if isinstance(msg, ToolMessage) or (hasattr(msg, "type") and msg.type == "tool"):
#                 if msg.name == "delegate_to_transit_agent":
#                     return "TransitAgent"
#                 elif msg.name == "delegate_to_lodging_agent":
#                     return "LodgingAgent"
#                 elif msg.name == "emit_itinerary":
#                     return "Supervisor"
#                 break
#         return "Supervisor"
# 
#     workflow.add_conditional_edges("Supervisor", route_after_supervisor)
#     workflow.add_conditional_edges("SupervisorTools", route_after_tools)
#     workflow.add_edge(START, "Supervisor")
# 
#     return workflow.compile(checkpointer=checkpointer)


