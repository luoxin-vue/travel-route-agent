"""通过 langchain-mcp-adapters 接入官方高德 MCP Server，把 MCP 工具转成 LangChain 工具。"""
import asyncio

from langchain_core.tools import BaseTool, StructuredTool
from langchain_mcp_adapters.client import MultiServerMCPClient

from app.config import get_settings

# 远程高德 MCP 端点在并发/弱网下偶发掉连接，单次成功率约 75%。
# 对工具加载与每次调用都加重试（5 次后单次约 99.9%），把传输层异常转成可恢复结果。
_MAX_RETRIES = 5


def _with_retry(tool: BaseTool) -> BaseTool:
    async def _call(**kwargs):
        last_err = None
        for attempt in range(_MAX_RETRIES):
            try:
                return await tool.ainvoke(kwargs)
            except Exception as err:  # noqa: BLE001 传输层异常，转为可恢复
                last_err = err
                await asyncio.sleep(0.4 * (attempt + 1))
        return (
            f"[工具 {tool.name} 暂时不可用：{last_err}] "
            "请基于已检索到的信息继续规划，不要因此中断。"
        )

    return StructuredTool(
        name=tool.name,
        description=tool.description,
        args_schema=tool.args_schema,
        coroutine=_call,
    )


def _server_config() -> dict:
    s = get_settings()
    transport = s.amap_mcp_transport

    if transport == "stdio":
        # 本地用 npx 启动官方高德 MCP Server。
        # 合并当前环境（含 HTTP(S)_PROXY），保证本地服务的 REST 请求也走代理。
        import os

        env = {**os.environ, "AMAP_MAPS_API_KEY": s.amap_maps_api_key}
        return {
            "amap": {
                "transport": "stdio",
                "command": "npx",
                "args": ["-y", "@amap/amap-maps-mcp-server"],
                "env": env,
            }
        }

    if transport == "streamable_http":
        # 高德较新的 Streamable HTTP 端点，并发下比老 SSE 更稳。
        return {
            "amap": {
                "transport": "streamable_http",
                "url": s.amap_mcp_http_url,
                "timeout": 30,
                "sse_read_timeout": 60,
            }
        }

    # 默认：远程 SSE 端点
    return {
        "amap": {
            "transport": "sse",
            "url": s.amap_mcp_sse_url,
            "timeout": 30,
            "sse_read_timeout": 60,
        }
    }


async def load_amap_tools() -> list:
    """拉取高德 MCP 工具：geo / regeocode / direction_* / text_search /
    around_search / search_detail / distance / weather / ip_location 等。

    初始的 list_tools 握手在弱网下也会偶发掉连接，这里同样加重试。
    """
    client = MultiServerMCPClient(_server_config())
    last_err = None
    for attempt in range(_MAX_RETRIES):
        try:
            tools = await client.get_tools()
            return [_with_retry(t) for t in tools]
        except Exception as err:  # noqa: BLE001 握手层异常
            last_err = err
            await asyncio.sleep(0.6 * (attempt + 1))
    raise RuntimeError(f"加载高德 MCP 工具失败（已重试 {_MAX_RETRIES} 次）：{last_err}")
