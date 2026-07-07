import asyncio
import sys
import os

# Ensure the backend directory is in the python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.agent.graph import get_agent

async def test_compilation():
    # Patch load_amap_tools to bypass HTTP connections during offline tests
    from unittest.mock import AsyncMock
    import app.agent.graph as graph
    
    original_load = graph.load_amap_tools
    graph.load_amap_tools = AsyncMock(return_value=[])
    
    try:
        agent = await get_agent()
        
        # Check compiled graph instance
        from langgraph.graph.state import CompiledStateGraph
        assert isinstance(agent, CompiledStateGraph), "Agent should be a compiled StateGraph"
        
        # Check node configuration
        nodes = agent.get_graph().nodes
        assert "Supervisor" in nodes, "Supervisor node is missing"
        assert "SupervisorTools" in nodes, "SupervisorTools node is missing"
        assert "TransitAgent" in nodes, "TransitAgent node is missing"
        assert "LodgingAgent" in nodes, "LodgingAgent node is missing"
        print("[OK] StateGraph compiled and validated successfully with all expected nodes.")
    finally:
        graph.load_amap_tools = original_load

if __name__ == "__main__":
    asyncio.run(test_compilation())
