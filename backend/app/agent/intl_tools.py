"""国际目的地工具集 —— 基于 OSM / Nominatim / OSRM / Overpass / Wikipedia / Open-Meteo 免费开放 API。
全部无需 API key、无需注册、无需绑卡。"""
import asyncio
from typing import Optional, Callable, Awaitable

import httpx
from langchain_core.tools import BaseTool, tool
from pydantic import BaseModel, Field

# ── 共享 HTTP 客户端（连接复用） ──
_shared_client: Optional[httpx.AsyncClient] = None
_nominatim_lock = asyncio.Lock()
_user_agent = "RouteSystem/0.1 (travel planning; OSM data usage)"
_RETRIES = 3


def _client() -> httpx.AsyncClient:
    global _shared_client
    if _shared_client is None:
        _shared_client = httpx.AsyncClient(
            headers={
                "User-Agent": _user_agent,
                "Accept-Language": "zh-CN,zh;q=0.9",
            },
            timeout=httpx.Timeout(30.0),
        )
    return _shared_client


async def _retry(tool_name: str, fn: Callable[[], Awaitable[str]]) -> str:
    """指数退避重试，3 次后兜底。"""
    last_err = ""
    for attempt in range(_RETRIES):
        try:
            return await fn()
        except Exception as exc:
            last_err = str(exc)
            if attempt < _RETRIES - 1:
                await asyncio.sleep(0.8 * (attempt + 1))
    return f"[{tool_name} 暂时不可用: {last_err}] 请基于已有知识继续规划。"


async def _nominatim_delay():
    """Nominatim 使用策略要求 1 req/s，全局串行化。"""
    async with _nominatim_lock:
        await asyncio.sleep(0.9)


# ── 输入 Schema ──
class GeoInput(BaseModel):
    address: str = Field(description="地点名称或完整地址，如 'Eiffel Tower, Paris'")


class ReverseGeoInput(BaseModel):
    lat: float = Field(description="纬度（WGS-84）")
    lng: float = Field(description="经度（WGS-84）")


class TextSearchInput(BaseModel):
    keyword: str = Field(description="POI 关键字，优先用中文如 '博物馆'，英文 fallback 如 'museum'")
    lat: Optional[float] = Field(default=None, description="搜索中心纬度（WGS-84），可缩小范围")
    lng: Optional[float] = Field(default=None, description="搜索中心经度（WGS-84），可缩小范围")
    limit: int = Field(default=5, description="返回数量上限")


class SearchDetailInput(BaseModel):
    name: str = Field(description="景点名称，如 'Tokyo Tower'，将查询 Wikipedia 简介与封面图")
    lat: Optional[float] = Field(default=None, description="该地点纬度，辅助精准匹配")
    lng: Optional[float] = Field(default=None, description="该地点经度，辅助精准匹配")


class DirectionInput(BaseModel):
    origin_lat: float = Field(description="起点纬度（WGS-84）")
    origin_lng: float = Field(description="起点经度（WGS-84）")
    dest_lat: float = Field(description="终点纬度（WGS-84）")
    dest_lng: float = Field(description="终点经度（WGS-84）")
    mode: str = Field(
        default="driving", description="出行方式：driving(驾车) / walking(步行) / cycling(骑行)"
    )


class DistanceInput(BaseModel):
    origin_lat: float = Field(description="起点纬度（WGS-84）")
    origin_lng: float = Field(description="起点经度（WGS-84）")
    dest_lat: float = Field(description="终点纬度（WGS-84）")
    dest_lng: float = Field(description="终点经度（WGS-84）")


class WeatherInput(BaseModel):
    lat: float = Field(description="纬度（WGS-84）")
    lng: float = Field(description="经度（WGS-84）")


# ── 工具实现 ──
@tool(args_schema=GeoInput)
async def intl_geo(address: str) -> str:
    """正向地理编码：把地点名称/地址转为 WGS-84 经纬度与中文地址。
    用于国际目的地坐标查询。返回 JSON：{lat, lng, display_name}。"""
    await _nominatim_delay()
    async def _call():
        resp = await _client().get(
            "https://nominatim.openstreetmap.org/search",
            params={"q": address, "format": "json", "limit": 1,
                    "accept-language": "zh"},
        )
        resp.raise_for_status()
        data = resp.json()
        if not data:
            return f"[intl_geo] 未找到 '{address}' 的坐标"
        r = data[0]
        return (
            f"lat: {r['lat']}, lng: {r['lon']}, "
            f"display_name: {r.get('display_name', address)}"
        )
    return await _retry("intl_geo", _call)


@tool(args_schema=ReverseGeoInput)
async def intl_regeocode(lat: float, lng: float) -> str:
    """反向地理编码：把 WGS-84 经纬度转为中文可读地址。
    用于从坐标反查位置名称。"""
    await _nominatim_delay()
    async def _call():
        resp = await _client().get(
            "https://nominatim.openstreetmap.org/reverse",
            params={"lat": lat, "lon": lng, "format": "json",
                    "accept-language": "zh"},
        )
        resp.raise_for_status()
        data = resp.json()
        name = data.get("display_name") or data.get("name") or f"({lat},{lng})"
        addr = data.get("address", {})
        parts = ", ".join(
            v for k, v in addr.items()
            if k not in ("country_code", "ISO3166-2-lvl4")
        )
        return f"display_name: {name}, address_parts: {parts}"
    return await _retry("intl_regeocode", _call)


@tool(args_schema=TextSearchInput)
async def intl_text_search(
    keyword: str,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    limit: int = 5,
) -> str:
    """国际 POI 搜索：基于 OpenStreetMap Overpass API 搜索景点/餐厅/酒店。
    优先使用中文关键字，OSM 的 name:zh 标签会返回中文名。"""
    async def _call():
        overpass_url = "https://overpass-api.de/api/interpreter"
        location_clause = ""
        if lat is not None and lng is not None:
            location_clause = f"(around:10000,{lat},{lng})"

        # 同时用 name 和 name:zh 搜索，提高中文命中率
        query = f"""[out:json][timeout:20];
(
  node["name"~"{keyword}",i]{location_clause};
  way["name"~"{keyword}",i]{location_clause};
  relation["name"~"{keyword}",i]{location_clause};
  node["name:zh"~"{keyword}",i]{location_clause};
);
out center {limit * 2};"""

        resp = await _client().post(overpass_url, content=query.encode())
        resp.raise_for_status()
        data = resp.json()
        elements = data.get("elements", [])
        seen = set()
        results = []
        for el in elements:
            tags = el.get("tags", {})
            raw_name = tags.get("name:zh") or tags.get("name") or keyword
            if raw_name in seen:
                continue
            seen.add(raw_name)
            entry_lat = el.get("lat") or (el.get("center", {}).get("lat"))
            entry_lng = el.get("lon") or (el.get("center", {}).get("lng"))
            category = tags.get("tourism") or tags.get("amenity") or tags.get("leisure") or ""
            street = tags.get("addr:street", "")
            city = tags.get("addr:city", "")
            entry_address = f"{street}, {city}".strip(", ")
            results.append({
                "name": raw_name,
                "lat": entry_lat,
                "lng": entry_lng,
                "category": category,
                "address": entry_address,
            })
            if len(results) >= limit:
                break

        if not results:
            return f"[intl_text_search] 未找到与 '{keyword}' 匹配的 POI"

        return "\n".join(
            f"{i+1}. {r['name']} ({r['category']}) coords=({r['lat']},{r['lng']}) addr={r['address']}"
            for i, r in enumerate(results)
        )
    return await _retry("intl_text_search", _call)


@tool(args_schema=SearchDetailInput)
async def intl_search_detail(
    name: str,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
) -> str:
    """查询国际景点的中文简介与封面照片 URL。
    优先用中文 Wikipedia（zh.wikipedia.org），无结果时回退英文 Wikipedia。
    返回：{description, image_url}。"""
    async def _call():
        client = _client()
        zh_ok = False

        # 1) 先搜中文 Wikipedia
        zh_resp = await client.get("https://zh.wikipedia.org/w/api.php", params={
            "action": "query", "list": "search", "srsearch": name,
            "srlimit": 1, "format": "json",
        })
        zh_resp.raise_for_status()
        zh_data = zh_resp.json()
        zh_pages = zh_data.get("query", {}).get("search", [])
        if zh_pages:
            page_id = zh_pages[0]["pageid"]
            wiki_api = "https://zh.wikipedia.org/w/api.php"
            zh_ok = True
        else:
            # 回退英文 Wikipedia
            en_resp = await client.get("https://en.wikipedia.org/w/api.php", params={
                "action": "query", "list": "search", "srsearch": name,
                "srlimit": 1, "format": "json",
            })
            en_resp.raise_for_status()
            en_data = en_resp.json()
            en_pages = en_data.get("query", {}).get("search", [])
            if not en_pages:
                return f"[intl_search_detail] Wikipedia 未找到 '{name}'"
            page_id = en_pages[0]["pageid"]
            wiki_api = "https://en.wikipedia.org/w/api.php"

        # 2) 取简介 + 封面图
        detail_resp = await client.get(wiki_api, params={
            "action": "query", "prop": "extracts|pageimages",
            "exintro": 1, "explaintext": 1,
            "pithumbsize": 400, "pageids": page_id, "format": "json",
        })
        detail_resp.raise_for_status()
        detail_data = detail_resp.json()
        page = detail_data.get("query", {}).get("pages", {}).get(str(page_id), {})
        description = page.get("extract", "")[:300]
        image_url = page.get("thumbnail", {}).get("source") or ""

        # 3) 无图回退 Wikimedia Commons
        if not image_url:
            commons_resp = await client.get(
                "https://commons.wikimedia.org/w/api.php", params={
                    "action": "query", "list": "search",
                    "srsearch": name, "srnamespace": 6,
                    "srlimit": 1, "format": "json",
                },
            )
            commons_resp.raise_for_status()
            commons_data = commons_resp.json()
            commons_pages = commons_data.get("query", {}).get("search", [])
            if commons_pages:
                commons_title = commons_pages[0]["title"]
                image_url = (
                    f"https://commons.wikimedia.org/wiki/Special:FilePath/"
                    f"{commons_title.replace(' ', '_')}?width=400"
                )

        lang_tag = "[中文]" if zh_ok else "[英文]"
        result = f"{lang_tag} description: {description}"
        if image_url:
            result += f"\nimage_url: {image_url}"
        return result
    return await _retry("intl_search_detail", _call)


# OSRM 公共实例，无需 key
_OSRM_BASE = "https://router.project-osrm.org"

_MODE_PARAM: dict[str, str] = {
    "driving": "driving",
    "walking": "walking",
    "cycling": "cycling",
}


@tool(args_schema=DirectionInput)
async def intl_direction(
    origin_lat: float,
    origin_lng: float,
    dest_lat: float,
    dest_lng: float,
    mode: str = "driving",
) -> str:
    """国际路线规划（驾车/步行/骑行）。不支持公交/地铁。
    返回：{distance_km, duration_min, mode}。"""
    mode_key = _MODE_PARAM.get(mode, "driving")
    async def _call():
        resp = await _client().get(
            f"{_OSRM_BASE}/route/v1/{mode_key}/"
            f"{origin_lng},{origin_lat};{dest_lng},{dest_lat}",
            params={"overview": "false"},
        )
        resp.raise_for_status()
        data = resp.json()
        routes = data.get("routes", [])
        if not routes:
            return f"[intl_direction] 无法规划路线"
        route = routes[0]
        distance_km = round(route["distance"] / 1000, 2)
        duration_min = round(route["duration"] / 60, 1)
        return (
            f"distance_km: {distance_km}, duration_min: {duration_min}, mode: {mode_key}"
        )
    return await _retry("intl_direction", _call)


@tool(args_schema=DistanceInput)
async def intl_distance(
    origin_lat: float,
    origin_lng: float,
    dest_lat: float,
    dest_lng: float,
) -> str:
    """国际两点间路线距离（公里）。基于 OSRM 驾车路线距离。
    返回：{distance_km}。"""
    async def _call():
        resp = await _client().get(
            f"{_OSRM_BASE}/route/v1/driving/"
            f"{origin_lng},{origin_lat};{dest_lng},{dest_lat}",
            params={"overview": "false"},
        )
        resp.raise_for_status()
        data = resp.json()
        routes = data.get("routes", [])
        if not routes:
            return f"[intl_distance] 无法计算距离"
        distance_km = round(routes[0]["distance"] / 1000, 2)
        return f"distance_km: {distance_km}"
    return await _retry("intl_distance", _call)


@tool(args_schema=WeatherInput)
async def intl_weather(lat: float, lng: float) -> str:
    """查询国际目的地当前天气（Open-Meteo，免费无需 key）。
    返回：{temperature, weather, wind_speed}。"""
    weather_codes: dict[int, str] = {
        0: "晴天", 1: "大部晴朗", 2: "多云", 3: "阴天",
        45: "雾", 48: "冻雾", 51: "小毛毛雨", 53: "中毛毛雨",
        55: "大毛毛雨", 61: "小雨", 63: "中雨", 65: "大雨",
        71: "小雪", 73: "中雪", 75: "大雪", 80: "阵雨",
        95: "雷暴",
    }
    async def _call():
        resp = await _client().get(
            "https://api.open-meteo.com/v1/forecast",
            params={"latitude": lat, "longitude": lng, "current_weather": "true"},
        )
        resp.raise_for_status()
        data = resp.json()
        cw = data.get("current_weather", {})
        temperature = cw.get("temperature")
        code = cw.get("weathercode", 0)
        wind = cw.get("windspeed")
        desc = weather_codes.get(code, f"未知(code={code})")
        return f"temperature: {temperature}°C, weather: {desc}, wind_speed: {wind} km/h"
    return await _retry("intl_weather", _call)


# ── 统一加载入口 ──
_INTL_TOOLS: list[BaseTool] = [
    intl_geo,
    intl_regeocode,
    intl_text_search,
    intl_search_detail,
    intl_direction,
    intl_distance,
    intl_weather,
]


def load_intl_tools() -> list[BaseTool]:
    """返回国际工具集（同步，无需异步加载）。"""
    return list(_INTL_TOOLS)
