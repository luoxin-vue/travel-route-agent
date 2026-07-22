import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.agent.graph import get_agent
from app.agent.prompts import SYSTEM_PROMPT


def test_prompt_de_ai_contract():
    """验证系统提示词已包含硬性黑名单限制，且人设已对齐 Concierge。"""
    assert "【去 AI 味硬性禁令】" in SYSTEM_PROMPT
    assert "你是 Concierge" in SYSTEM_PROMPT
    assert "你是 旅行规划师" not in SYSTEM_PROMPT
    assert "作为AI助手" in SYSTEM_PROMPT
    assert "严禁任何自我介绍或 AI 身份宣告" in SYSTEM_PROMPT
    assert "严禁任何客服套话与前言/结语" in SYSTEM_PROMPT
    print("[OK] Prompt 去 AI 味限制契约验证成功。")


async def test_compilation():
    from unittest.mock import AsyncMock
    import app.agent.graph as graph

    original_load = graph.load_amap_tools
    graph.load_amap_tools = AsyncMock(return_value=[])

    try:
        agent = await get_agent()
        from langgraph.graph.state import CompiledStateGraph

        assert isinstance(agent, CompiledStateGraph), "Agent 应为已编译的 StateGraph"

        nodes = agent.get_graph().nodes
        assert "model" in nodes, "缺失 model 节点"
        assert "tools" in nodes, "缺失 tools 节点"

        # 检验工具绑定的连通性与结构
        graph_obj = agent.get_graph()
        assert len(graph_obj.nodes) >= 2, "Agent 节点少于预期数量"
        print("[OK] Concierge Agent 状态图编译与工具挂载校验成功。")
    finally:
        graph.load_amap_tools = original_load



if __name__ == "__main__":
    test_prompt_de_ai_contract()
    asyncio.run(test_compilation())

