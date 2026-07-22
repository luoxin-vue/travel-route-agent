"""intl_tools 工具函数级别单元测试。Mock HTTP 调用，验证返回值格式与错误兜底。"""
import sys
import os
from unittest.mock import AsyncMock, patch

import pytest

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.agent.intl_tools import (
    intl_geo,
    intl_regeocode,
    intl_text_search,
    intl_search_detail,
    intl_direction,
    intl_distance,
    intl_weather,
    load_intl_tools,
)


def _mock_response(json_body: dict):
    mock = AsyncMock()
    mock.raise_for_status = lambda: None
    mock.json = lambda: json_body
    return mock


def _mock_get(*responses):
    """创建 side_effect，按顺序返回不同 mock 响应。"""
    calls = 0
    mocks = [_mock_response(r) for r in responses]
    async def side_effect(url, **kwargs):
        nonlocal calls
        if calls < len(mocks):
            resp = mocks[calls]
            calls += 1
            return resp
        return _mock_response({})
    return AsyncMock(side_effect=side_effect)


@pytest.mark.asyncio
async def test_intl_geo_returns_coordinates():
    with patch("app.agent.intl_tools._client") as mock_client:
        mock_client.return_value.get = AsyncMock(return_value=_mock_response([
            {"lat": "35.6762", "lon": "139.6503", "display_name": "东京, 日本"}
        ]))
        result = await intl_geo.ainvoke({"address": "Tokyo"})
        assert "35.6762" in result
        assert "东京" in result


@pytest.mark.asyncio
async def test_intl_geo_not_found():
    with patch("app.agent.intl_tools._nominatim_delay", new_callable=AsyncMock):
        with patch("app.agent.intl_tools._client") as mock_client:
            mock_client.return_value.get = AsyncMock(return_value=_mock_response([]))
            result = await intl_geo.ainvoke({"address": "Xyzzy"})
            assert "未找到" in result


@pytest.mark.asyncio
async def test_intl_regeocode_returns_address():
    with patch("app.agent.intl_tools._client") as mock_client:
        mock_client.return_value.get = AsyncMock(return_value=_mock_response({
            "display_name": "涩谷, 东京, 日本",
            "address": {"suburb": "涩谷", "city": "东京", "country": "日本"},
        }))
        result = await intl_regeocode.ainvoke({"lat": 35.66, "lng": 139.70})
        assert "涩谷" in result


@pytest.mark.asyncio
async def test_intl_text_search_returns_pois():
    with patch("app.agent.intl_tools._client") as mock_client:
        mock_client.return_value.post = AsyncMock(return_value=_mock_response({
            "elements": [
                {"id": 1, "lat": 35.658, "lon": 139.745, "tags": {"name": "Tokyo Tower", "name:zh": "东京塔", "tourism": "attraction"}},
                {"id": 2, "lat": 35.660, "lon": 139.729, "tags": {"name": "Roppongi", "amenity": "restaurant"}},
            ]
        }))
        result = await intl_text_search.ainvoke({"keyword": "Tokyo", "limit": 2})
        assert "东京塔" in result  # name:zh 优先
        assert "attraction" in result


@pytest.mark.asyncio
async def test_intl_text_search_no_results():
    with patch("app.agent.intl_tools._client") as mock_client:
        mock_client.return_value.post = AsyncMock(return_value=_mock_response({"elements": []}))
        result = await intl_text_search.ainvoke({"keyword": "Xyzzy", "limit": 2})
        assert "未找到" in result


@pytest.mark.asyncio
async def test_intl_search_detail_zh_first():
    """zh.wikipedia 有结果 → 返回中文描述，标记 [中文]"""
    with patch("app.agent.intl_tools._client") as mock_client:
        mock_client.return_value.get = _mock_get(
            {"query": {"search": [{"pageid": 123}]}},  # zh search
            {"query": {"pages": {"123": {
                "extract": "东京塔是位于日本东京的...",
                "thumbnail": {"source": "https://upload/to tower.jpg"},
            }}}},  # zh detail
        )
        result = await intl_search_detail.ainvoke({"name": "Tokyo Tower"})
        assert "[中文]" in result
        assert "东京塔" in result
        assert "tower.jpg" in result


@pytest.mark.asyncio
async def test_intl_search_detail_fallback_en():
    """zh.wikipedia 无结果 → 回退 en，标记 [英文]"""
    with patch("app.agent.intl_tools._client") as mock_client:
        mock_client.return_value.get = _mock_get(
            {"query": {"search": []}},  # zh search 空
            {"query": {"search": [{"pageid": 456}]}},  # en search
            {"query": {"pages": {"456": {
                "extract": "The Eiffel Tower is a tower.",
                "thumbnail": {"source": "https://upload/eiffel.jpg"},
            }}}},  # en detail
        )
        result = await intl_search_detail.ainvoke({"name": "Eiffel Tower"})
        assert "[英文]" in result
        assert "Eiffel Tower" in result


@pytest.mark.asyncio
async def test_intl_direction_driving():
    with patch("app.agent.intl_tools._client") as mock_client:
        mock_client.return_value.get = AsyncMock(return_value=_mock_response({
            "routes": [{"distance": 5200, "duration": 780}]
        }))
        result = await intl_direction.ainvoke({
            "origin_lat": 35.658, "origin_lng": 139.745,
            "dest_lat": 35.660, "dest_lng": 139.729,
            "mode": "driving",
        })
        assert "distance_km: 5.2" in result
        assert "duration_min: 13.0" in result


@pytest.mark.asyncio
async def test_intl_direction_no_route():
    with patch("app.agent.intl_tools._client") as mock_client:
        mock_client.return_value.get = AsyncMock(return_value=_mock_response({"routes": []}))
        result = await intl_direction.ainvoke({
            "origin_lat": 0, "origin_lng": 0,
            "dest_lat": 0, "dest_lng": 0,
        })
        assert "无法规划" in result


@pytest.mark.asyncio
async def test_intl_distance_returns_km():
    with patch("app.agent.intl_tools._client") as mock_client:
        mock_client.return_value.get = AsyncMock(return_value=_mock_response({
            "routes": [{"distance": 3500, "duration": 420}]
        }))
        result = await intl_distance.ainvoke({
            "origin_lat": 35.658, "origin_lng": 139.745,
            "dest_lat": 35.660, "dest_lng": 139.729,
        })
        assert "distance_km: 3.5" in result


@pytest.mark.asyncio
async def test_intl_weather_returns_temperature():
    with patch("app.agent.intl_tools._client") as mock_client:
        mock_client.return_value.get = AsyncMock(return_value=_mock_response({
            "current_weather": {"temperature": 22.5, "weathercode": 2, "windspeed": 10.3}
        }))
        result = await intl_weather.ainvoke({"lat": 35.676, "lng": 139.650})
        assert "22.5" in result
        assert "多云" in result


def test_load_intl_tools_returns_seven():
    tools = load_intl_tools()
    tool_names = {t.name for t in tools}
    assert len(tools) == 7
    assert "intl_geo" in tool_names
    assert "intl_direction" in tool_names


@pytest.mark.asyncio
async def test_intl_tools_graceful_on_http_error():
    """HTTP 错误时经 _retry 3 次后返回兜底文本，不抛异常。"""
    for tool_fn in [intl_geo, intl_regeocode, intl_text_search, intl_search_detail,
                    intl_direction, intl_distance, intl_weather]:
        with patch("app.agent.intl_tools._client") as mock_client:
            exc = Exception("Network error")
            mock_client.return_value.get = AsyncMock(side_effect=exc)
            mock_client.return_value.post = AsyncMock(side_effect=exc)

            input_kwargs = {}
            if hasattr(tool_fn, "args_schema"):
                for field_name in tool_fn.args_schema.model_fields:
                    field = tool_fn.args_schema.model_fields[field_name]
                    if field.annotation is str:
                        input_kwargs[field_name] = "test"
                    elif field.annotation is float or field.annotation == float | None:
                        input_kwargs[field_name] = 35.0

            if "mode" in tool_fn.args_schema.model_fields:
                input_kwargs["mode"] = "driving"

            result = await tool_fn.ainvoke(input_kwargs)
            assert "暂时不可用" in result or "未找到" in result, (
                f"{tool_fn.name} 应在异常时返回兜底文本，实际: {result}"
            )
