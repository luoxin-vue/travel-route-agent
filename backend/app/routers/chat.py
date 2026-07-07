"""/api/chat —— SSE 流式端点。推送三类事件：token / tool / itinerary。"""
import json
import traceback

from fastapi import APIRouter
from langchain_core.messages import HumanMessage
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from app.agent.graph import get_agent

router = APIRouter(prefix="/api", tags=["chat"])


class ChatRequest(BaseModel):
    thread_id: str
    message: str


def _sse(event: str, data: dict) -> dict:
    return {"event": event, "data": json.dumps(data, ensure_ascii=False)}


def _summarize_input(data) -> str:
    """从工具入参里提取一句话摘要，用于前端「思考过程」展示。"""
    if not isinstance(data, dict):
        return ""
    for key in ("keywords", "keyword", "address", "location", "name", "city", "instruction"):
        val = data.get(key)
        if val:
            return str(val)[:40]
    origin, dest = data.get("origin"), data.get("destination")
    if origin and dest:
        return f"{origin} → {dest}"
    return ""


@router.post("/chat")
async def chat(req: ChatRequest):
    # recursion_limit 默认 25；推理模型工具调用更多，放宽到 50 留足余量。
    config = {"configurable": {"thread_id": req.thread_id}, "recursion_limit": 50}
    inputs = {"messages": [HumanMessage(content=req.message)]}

    async def event_gen():
        try:
            # 在流内构建 agent（含联网加载高德 MCP），失败也以 SSE error 返回，
            # 避免变成 500 text/plain 让前端报 content-type 错误。
            agent = await get_agent()
            async for ev in agent.astream_events(inputs, config=config, version="v2"):
                kind = ev["event"]

                # 1) 模型增量：先推理（thinking），后正文（token）
                if kind == "on_chat_model_stream":
                    chunk = ev["data"]["chunk"]
                    reasoning = (
                        getattr(chunk, "additional_kwargs", {}).get("reasoning_content")
                    )
                    if reasoning:
                        yield _sse("thinking", {"text": reasoning})
                    
                    # ponytail: filter out tool calls/arguments from being emitted as conversational text tokens.
                    # This prevents the frontend from printing raw tool calls/JSON on the screen when using OpenAI-compatible models.
                    if (
                        getattr(chunk, "tool_calls", None)
                        or getattr(chunk, "tool_call_chunks", None)
                        or (
                            isinstance(chunk.additional_kwargs, dict)
                            and chunk.additional_kwargs.get("tool_calls")
                        )
                    ):
                        continue

                    text = getattr(chunk, "content", "") or ""
                    if text:
                        yield _sse("token", {"text": text})

                # 2) 工具调用开始（驱动前端「思考过程」可视化）
                elif kind == "on_tool_start":
                    name = ev.get("name", "")
                    if name == "emit_itinerary":
                        # 3) 结构化行程：直接从工具调用参数取出
                        itinerary = ev["data"].get("input", {})
                        yield _sse("itinerary", itinerary)
                    else:
                        yield _sse(
                            "tool",
                            {
                                "id": str(ev.get("run_id", "")),
                                "name": name,
                                "status": "running",
                                "detail": _summarize_input(ev["data"].get("input")),
                            },
                        )

                elif kind == "on_tool_end":
                    name = ev.get("name", "")
                    if name != "emit_itinerary":
                        yield _sse(
                            "tool",
                            {"id": str(ev.get("run_id", "")), "name": name, "status": "done"},
                        )

            yield _sse("done", {})
        except Exception as exc:  # noqa: BLE001
            # TaskGroup 会聚合子异常，打印完整栈以便定位真实根因
            traceback.print_exc()
            detail = str(exc)
            if isinstance(exc, ExceptionGroup):  # type: ignore[name-defined]
                detail = "; ".join(str(e) for e in exc.exceptions)
            yield _sse("error", {"message": detail})

    return EventSourceResponse(event_gen())
