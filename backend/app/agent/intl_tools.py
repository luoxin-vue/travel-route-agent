"""国际目的地工具集 —— 基于 OSM / Nominatim / OSRM / Overpass / Wikipedia / Open-Meteo 免费开放 API。
全部无需 API key、无需注册、无需绑卡。"""
import asyncio
from typing import Optional

import httpx
from langchain_core.tools import BaseTool, tool
from pydantic import BaseModel, Field

# ── 共享 HTTP 客户端（连接复用） ──
_shared_client: Optional[httpx.AsyncClient] = None
_nominatim_lock = asyncio.Lock()
_user_agent = "RouteSystem/0.1 (travel planning; OSM data usage)"


def _client() -> httpx.AsyncClient:
    global _shared_client
    if _shared_client is None:
        _shared_client = httpx.AsyncClient(
            headers={"User-Agent": _user_agent},
            timeout=httpx.Timeout(15.0),
        )
    return _shared_client


async def _nominatim_delay():
    """Nominatim 使用策略要求 1 req/s，全局串行化。"""
    async with _nominatim_lock:
        await asyncio.sleep(1.1)


# ── 输入 Schema ──
class GeoInput(BaseModel):
    address: str = Field(description="地点名称或完整地址，如 'Eiffel Tower, Paris'")


class ReverseGeoInput(BaseModel):
    lat: float = Field(description="纬度（WGS-84）")
    lng: float = Field(description="经度（WGS-84）")


class TextSearchInput(BaseModel):
    keyword: str = Field(description="POI 关键字，如 'sushi restaurant' 或 'museum'")
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
    """正向地理编码：把地点名称/地址转为 WGS-84 经纬度与标准化地址。
    用于国际目的地坐标查询。返回 JSON：{lat, lng, display_name, importance}。"""
    await _nominatim_delay()
    try:
        resp = await _client().get(
            "https://nominatim.openstreetmap.org/search",
            params={"q": address, "format": "json", "limit": 1},
        )
        resp.raise_for_status()
        data = resp.json()
        if not data:
            return f"[intl_geo] 未找到 '{address}' 的坐标"
        r = data[0]
        return (
            f"lat: {r['lat']}, lng: {r['lon']}, "
            f"display_name: {r.get('display_name', address)}, "
            f"importance: {r.get('importance', 0)}"
        )
    except Exception as exc:
        return f"[intl_geo 暂时不可用: {exc}] 请基于已有知识继续规划。"


@tool(args_schema=ReverseGeoInput)
async def intl_regeocode(lat: float, lng: float) -> str:
    """反向地理编码：把 WGS-84 经纬度转为可读地址。
    用于从坐标反查位置名称。返回 JSON：{display_name, address}。"""
    await _nominatim_delay()
    try:
        resp = await _client().get(
            "https://nominatim.openstreetmap.org/reverse",
            params={"lat": lat, "lon": lng, "format": "json"},
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
    except Exception as exc:
        return f"[intl_regeocode 暂时不可用: {exc}] 请基于已有知识继续规划。"


@tool(args_schema=TextSearchInput)
async def intl_text_search(
    keyword: str,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    limit: int = 5,
) -> str:
    """国际 POI 搜索：基于 OpenStreetMap Overpass API 搜索景点/餐厅/酒店。
    返回 JSON 数组 [{name, lat, lng, category, address}]。"""
    overpass_url = "https://overpass-api.de/api/interpreter"

    # 构造 Overpass QL 查询
    location_clause = ""
    radius = 10000  # 10km 默认半径
    if lat is not None and lng is not None:
        location_clause = f"(around:{radius},{lat},{lng})"

    query = f"""[out:json][timeout:10];
(
  node["name"~"{keyword}",i]{location_clause};
  way["name"~"{keyword}",i]{location_clause};
  relation["name"~"{keyword}",i]{location_clause};
);
out center {limit};"""

    try:
        resp = await _client().post(overpass_url, content=query.encode())
        resp.raise_for_status()
        data = resp.json()
        elements = data.get("elements", [])

        results = []
        for el in elements[:limit]:
            tags = el.get("tags", {})
            entry_lat = el.get("lat") or (el.get("center", {}).get("lat"))
            entry_lng = el.get("lon") or (el.get("center", {}).get("lng"))
            category = tags.get("tourism") or tags.get("amenity") or tags.get("leisure") or ""
            street = tags.get("addr:street", "")
            city = tags.get("addr:city", "")
            entry_address = f"{street}, {city}".strip(", ")
            results.append({
                "name": tags.get("name", keyword),
                "lat": entry_lat,
                "lng": entry_lng,
                "category": category,
                "address": entry_address,
            })

        if not results:
            return f"[intl_text_search] 未找到与 '{keyword}' 匹配的 POI"

        return "\n".join(
            f"{i+1}. {r['name']} ({r['category']}) coords=({r['lat']},{r['lng']}) addr={r['address']}"
            for i, r in enumerate(results)
        )
    except Exception as exc:
        return f"[intl_text_search 暂时不可用: {exc}] 请基于已有知识继续规划。"


@tool(args_schema=SearchDetailInput)
async def intl_search_detail(
    name: str,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
) -> str:
    """查询国际景点的 Wikipedia 简介与封面照片 URL。
    用于获取景点的介绍文字和真实图片 URL。返回：{description, image_url}。"""
    wiki_api = "https://en.wikipedia.org/w/api.php"
    try:
        # 1) 搜索匹配的 Wikipedia 页面
        search_resp = await _client().get(wiki_api, params={
            "action": "query", "list": "search", "srsearch": name,
            "srlimit": 1, "format": "json",
        })
        search_resp.raise_for_status()
        search_data = search_resp.json()
        pages = search_data.get("query", {}).get("search", [])
        if not pages:
            return f"[intl_search_detail] Wikipedia 未找到 '{name}'"

        page_id = pages[0]["pageid"]

        # 2) 获取简介 + 封面图（一次请求两个 prop）
        detail_resp = await _client().get(wiki_api, params={
            "action": "query", "prop": "extracts|pageimages",
            "exintro": 1, "explaintext": 1,
            "pithumbsize": 400, "pageids": page_id, "format": "json",
        })
        detail_resp.raise_for_status()
        detail_data = detail_resp.json()
        page = detail_data.get("query", {}).get("pages", {}).get(str(page_id), {})
        description = page.get("extract", "")[:300]
        image_url = page.get("thumbnail", {}).get("source") or ""

        # 3) Wikipedia 无图时回退 Wikimedia Commons
        if not image_url:
            commons_resp = await _client().get(
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

        result = f"description: {description}"
        if image_url:
            result += f"\nimage_url: {image_url}"
        return result
    except Exception as exc:
        return f"[intl_search_detail 暂时不可用: {exc}] 请基于已有知识继续规划。"


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
    返回 JSON：{distance_km, duration_min, mode}。"""
    mode_key = _MODE_PARAM.get(mode, "driving")
    try:
        resp = await _client().get(
            f"{_OSRM_BASE}/route/v1/{mode_key}/"
            f"{origin_lng},{origin_lat};{dest_lng},{dest_lat}",
            params={"overview": "false"},
        )
        resp.raise_for_status()
        data = resp.json()
        routes = data.get("routes", [])
        if not routes:
            return f"[intl_direction] 无法规划 ({origin_lat},{origin_lng}) -> ({dest_lat},{dest_lng}) 的路线"
        route = routes[0]
        distance_km = round(route["distance"] / 1000, 2)
        duration_min = round(route["duration"] / 60, 1)
        return (
            f"distance_km: {distance_km}, duration_min: {duration_min}, mode: {mode_key}"
        )
    except Exception as exc:
        return f"[intl_direction 暂时不可用: {exc}] 请基于已有知识继续规划。"


@tool(args_schema=DistanceInput)
async def intl_distance(
    origin_lat: float,
    origin_lng: float,
    dest_lat: float,
    dest_lng: float,
) -> str:
    """国际两点间路线距离（公里）。基于 OSRM 驾车路线距离。
    返回 JSON：{distance_km}。"""
    try:
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
    except Exception as exc:
        return f"[intl_distance 暂时不可用: {exc}] 请基于已有知识继续规划。"


@tool(args_schema=WeatherInput)
async def intl_weather(lat: float, lng: float) -> str:
    """查询国际目的地当前天气（Open-Meteo，免费无需 key）。
    返回 JSON：{temperature, weather_code, wind_speed, description}。"""
    weather_codes: dict[int, str] = {
        0: "晴天", 1: "大部晴朗", 2: "多云", 3: "阴天",
        45: "雾", 48: "冻雾", 51: "小毛毛雨", 53: "中毛毛雨",
        55: "大毛毛雨", 61: "小雨", 63: "中雨", 65: "大雨",
        71: "小雪", 73: "中雪", 75: "大雪", 80: "阵雨",
        95: "雷暴",
    }
    try:
        resp = await _client().get(
            "https://api.open-meteo.com/v1/forecast",
            params={
                "latitude": lat, "longitude": lng,
                "current_weather": "true",
            },
        )
        resp.raise_for_status()
        data = resp.json()
        cw = data.get("current_weather", {})
        temperature = cw.get("temperature")
        code = cw.get("weathercode", 0)
        wind = cw.get("windspeed")
        desc = weather_codes.get(code, f"未知(code={code})")
        return (
            f"temperature: {temperature}°C, weather: {desc}, "
            f"wind_speed: {wind} km/h"
        )
    except Exception as exc:
        return f"[intl_weather 暂时不可用: {exc}] 请基于已有知识继续规划。"


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
