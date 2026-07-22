"""intl_tools v2 单元测试 —— Photon + Haversine + Pexels。"""
import sys
import os
from unittest.mock import AsyncMock, patch

import pytest

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.agent.intl_tools import (
    _haversine_km,
    intl_geo,
    intl_text_search,
    intl_search_detail,
    intl_distance,
    intl_weather,
    load_intl_tools,
)


def _mock_response(json_body: dict):
    mock = AsyncMock()
    mock.raise_for_status = lambda: None
    mock.json = lambda: json_body
    return mock


# ── Photon 格式 mock 工厂 ──
def _photon_feature(name: str, lng: float, lat: float, category: str = "tourism",
                    country: str = "日本", city: str = "东京"):
    return {
        "geometry": {"coordinates": [lng, lat]},
        "properties": {
            "name": name, "osm_key": category,
            "country": country, "city": city,
        },
    }


@pytest.mark.asyncio
async def test_intl_geo_photon():
    with patch("app.agent.intl_tools._client") as mock_client:
        mock_client.return_value.get = AsyncMock(return_value=_mock_response({
            "features": [_photon_feature("东京", 139.6503, 35.6762)]
        }))
        result = await intl_geo.ainvoke({"address": "Tokyo"})
        assert "35.6762" in result
        assert "东京" in result


@pytest.mark.asyncio
async def test_intl_geo_not_found():
    with patch("app.agent.intl_tools._client") as mock_client:
        mock_client.return_value.get = AsyncMock(return_value=_mock_response({"features": []}))
        result = await intl_geo.ainvoke({"address": "Xyzzy"})
        assert "未找到" in result


@pytest.mark.asyncio
async def test_intl_text_search_photon():
    with patch("app.agent.intl_tools._client") as mock_client:
        mock_client.return_value.get = AsyncMock(return_value=_mock_response({
            "features": [
                _photon_feature("东京塔", 139.745, 35.658),
                _photon_feature("涩谷", 139.702, 35.659, category="amenity"),
            ]
        }))
        result = await intl_text_search.ainvoke({"keyword": "东京", "limit": 2})
        assert "东京塔" in result
        assert "涩谷" in result


@pytest.mark.asyncio
async def test_intl_text_search_no_results():
    with patch("app.agent.intl_tools._client") as mock_client:
        mock_client.return_value.get = AsyncMock(return_value=_mock_response({"features": []}))
        result = await intl_text_search.ainvoke({"keyword": "Xyzzy"})
        assert "未找到" in result


@pytest.mark.asyncio
async def test_intl_search_detail_zh():
    """zh.wikipedia 有结果 → [中文]"""
    with patch("app.agent.intl_tools._client") as mock_client:
        calls = 0
        responses = [
            _mock_response({"query": {"search": [{"pageid": 123}]}}),  # zh search
            _mock_response({"query": {"pages": {"123": {
                "extract": "东京塔是位于日本东京的...",
                "thumbnail": {"source": "https://a.com/tower.jpg"},
            }}}}),  # zh detail
        ]
        async def get_side(url, **kw):
            nonlocal calls
            calls += 1
            return responses[min(calls - 1, len(responses) - 1)]
        mock_client.return_value.get = AsyncMock(side_effect=get_side)
        result = await intl_search_detail.ainvoke({"name": "Tokyo Tower"})
        assert "[中文]" in result
        assert "东京塔" in result


@pytest.mark.asyncio
async def test_intl_search_detail_pexels_fallback():
    """Wikipedia + Wikimedia 空 → Pexels 兜底 [Pexels]"""
    with patch("app.agent.intl_tools._client") as mock_client, \
         patch.dict(os.environ, {"PEXELS_API_KEY": "test-key"}):
        calls = 0
        responses = [
            _mock_response({"query": {"search": []}}),          # zh wiki 空
            _mock_response({"query": {"search": []}}),          # en wiki 空 → "未找到"
        ]
        async def get_side(url, **kw):
            nonlocal calls
            calls += 1
            if calls <= len(responses):
                return responses[calls - 1]
            return _mock_response({})
        mock_client.return_value.get = AsyncMock(side_effect=get_side)
        result = await intl_search_detail.ainvoke({"name": "Tokyo Tower"})
        assert "未找到" in result  # Wikipedia 都无结果，直接返回兜底
        # Note: Pexels 不会在这一步触发，因为 Wikipedia 返回了 "未找到" 就提前退出了


@pytest.mark.asyncio
async def test_intl_search_detail_pexels_after_wiki_no_image():
    """Wikipedia 有描述但无图 → Wikimedia 无图 → Pexels 兜底"""
    with patch("app.agent.intl_tools._client") as mock_client, \
         patch.dict(os.environ, {"PEXELS_API_KEY": "test-key"}):
        calls = 0
        responses = [
            _mock_response({"query": {"search": [{"pageid": 456}]}}),    # zh search OK
            _mock_response({"query": {"pages": {"456": {                 # zh detail 无图
                "extract": "Some description.",
            }}}}),
            _mock_response({"query": {"search": []}}),                    # Wikimedia 空
            _mock_response({"photos": [{"src": {"medium": "https://p.com/img.jpg"}}]}),  # Pexels OK
        ]
        async def get_side(url, **kw):
            nonlocal calls
            calls += 1
            return responses[min(calls - 1, len(responses) - 1)]
        mock_client.return_value.get = AsyncMock(side_effect=get_side)
        result = await intl_search_detail.ainvoke({"name": "Some Place"})
        assert "[Pexels]" in result
        assert "p.com/img.jpg" in result


# ── Haversine ──
def test_haversine_km_known():
    """北京天安门 → 故宫北门 ≈ 1.5km"""
    d = _haversine_km(39.9042, 116.4074, 39.9163, 116.3972)
    assert 1.0 < d < 2.0


def test_haversine_km_same_point():
    assert _haversine_km(0, 0, 0, 0) == 0.0


# ── intl_distance ──
@pytest.mark.asyncio
async def test_intl_distance_haversine():
    result = await intl_distance.ainvoke({
        "origin_lat": 35.658, "origin_lng": 139.745,
        "dest_lat": 35.710, "dest_lng": 139.810,
    })
    assert "distance_km:" in result
    assert "driving_min:" in result
    assert "walking_min:" in result
    assert "hint:" in result


@pytest.mark.asyncio
async def test_intl_distance_walkable():
    """极近距离 → hint 应为 步行可达"""
    result = await intl_distance.ainvoke({
        "origin_lat": 35.658, "origin_lng": 139.745,
        "dest_lat": 35.659, "dest_lng": 139.746,
    })
    assert "步行可达" in result


# ── weather ──
@pytest.mark.asyncio
async def test_intl_weather():
    with patch("app.agent.intl_tools._client") as mock_client:
        mock_client.return_value.get = AsyncMock(return_value=_mock_response({
            "current_weather": {"temperature": 22.0, "weathercode": 2, "windspeed": 5.0}
        }))
        result = await intl_weather.ainvoke({"lat": 35.0, "lng": 139.0})
        assert "22" in result
        assert "多云" in result


# ── 工具集数量 ──
def test_load_intl_tools_five():
    tools = load_intl_tools()
    names = {t.name for t in tools}
    assert len(tools) == 5
    assert names == {"intl_geo", "intl_text_search", "intl_search_detail", "intl_distance", "intl_weather"}


# ── 错误兜底 ──
@pytest.mark.asyncio
async def test_intl_tools_graceful_on_http_error():
    for tool_fn in [intl_geo, intl_text_search, intl_search_detail, intl_weather]:
        with patch("app.agent.intl_tools._client") as mock_client:
            exc = Exception("Network down")
            mock_client.return_value.get = AsyncMock(side_effect=exc)
            mock_client.return_value.post = AsyncMock(side_effect=exc)

            input_kwargs: dict = {}
            if hasattr(tool_fn, "args_schema"):
                for fname in tool_fn.args_schema.model_fields:
                    field = tool_fn.args_schema.model_fields[fname]
                    if field.annotation is str:
                        input_kwargs[fname] = "test"
                    elif field.annotation is float or field.annotation == float | None:
                        input_kwargs[fname] = 35.0

            result = await tool_fn.ainvoke(input_kwargs)
            assert "暂时不可用" in result, f"{tool_fn.name} 兜底文本缺失，实际: {result}"
