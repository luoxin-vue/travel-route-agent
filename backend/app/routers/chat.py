"""/api/chat —— SSE 流式端点。推送三类事件：token / tool / itinerary。"""
import json
import traceback
from typing import Optional

from fastapi import APIRouter
from langchain_core.messages import HumanMessage
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from app.agent.graph import get_agent

router = APIRouter(prefix="/api", tags=["chat"])


class TravelPreferences(BaseModel):
    defaultProtocol: str = "TRANSIT"
    pace: str = "relaxed"


class ChatRequest(BaseModel):
    thread_id: str
    message: str
    travel_preferences: Optional[TravelPreferences] = None


def _sse(event: str, payload: dict) -> dict:
    return {"event": event, "data": json.dumps(payload, ensure_ascii=False)}


def _summarize_input(tool_input) -> str:
    if not isinstance(tool_input, dict):
        return ""
    for key in ("keywords", "keyword", "address", "location", "name", "city", "instruction"):
        param_value = tool_input.get(key)
        if param_value:
            return str(param_value)[:40]
    origin, dest = tool_input.get("origin"), tool_input.get("destination")
    if origin and dest:
        return f"{origin} → {dest}"
    return ""



_PROTOCOL_LABELS = {"TRANSIT": "公共交通", "DRIVING": "驾车自驾", "WALKING": "步行"}
_PACE_LABELS = {"relaxed": "轻松休闲（每天 2~3 个精选景点）", "compact": "充实紧凑（高效打卡）"}


def _preference_context(prefs: TravelPreferences | None) -> str:
    if not prefs:
        return ""
    protocol = _PROTOCOL_LABELS.get(prefs.defaultProtocol, prefs.defaultProtocol)
    pace = _PACE_LABELS.get(prefs.pace, prefs.pace)
    return (
        f"\n\n【用户偏好】\n"
        f"- 默认出行方式：{protocol}\n"
        f"- 行程节奏：{pace}\n"
        f"规划行程时请优先考虑以上偏好。"
    )


@router.post("/chat")
async def chat(req: ChatRequest):
    # recursion_limit 默认 25；推理模型工具调用更多，放宽到 50 留足余量。
    config = {"configurable": {"thread_id": req.thread_id}, "recursion_limit": 50}
    pref_context = _preference_context(req.travel_preferences)
    inputs = {"messages": [HumanMessage(content=req.message + pref_context)]}

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
                    
                    # ponytail: 过滤掉工具调用/参数，避免其被当作对话文本 token 推送给前端。
                    # 这样可以防止在使用 OpenAI 兼容接口的模型时，前端直接把工具调用的 JSON 源码打印在屏幕上。
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
