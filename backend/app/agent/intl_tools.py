"""国际目的地工具集 —— Photon（OSM 搜索）+ Haversine（本地距离）+ Wikipedia/Pexels/Unsplash/Flickr（图片）。
全部零注册零费用（Pexels/Unsplash 可选，邮箱即可不绑卡；Flickr 可选）。"""
import asyncio
import math
import os
from typing import Optional, Callable, Awaitable

import httpx
from langchain_core.tools import BaseTool, tool
from pydantic import BaseModel, Field

# ── 共享 HTTP 客户端 ──
_shared_client: Optional[httpx.AsyncClient] = None
_user_agent = "RouteSystem/0.1 (travel planning)"


def _client() -> httpx.AsyncClient:
    global _shared_client
    if _shared_client is None:
        _shared_client = httpx.AsyncClient(
            headers={
                "User-Agent": _user_agent,
                "Accept-Language": "zh-CN,zh;q=0.9",
            },
            timeout=httpx.Timeout(15.0),
        )
    return _shared_client


async def _retry(tool_name: str, fn: Callable[[], Awaitable[str]]) -> str:
    """指数退避重试，2 次后兜底。"""
    last_err = ""
    for attempt in range(2):
        try:
            return await fn()
        except Exception as exc:
            last_err = str(exc)
            if attempt < 1:
                await asyncio.sleep(0.6)
    return f"[{tool_name} 暂时不可用: {last_err}] 请基于已有知识继续规划。"


# ── Haversine 球面距离（本地计算，零网络依赖） ──
def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lng = math.radians(lng2 - lng1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lng / 2) ** 2
    )
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# ── 输入 Schema ──
class GeoInput(BaseModel):
    address: str = Field(description="地点名称或完整地址，如 'Eiffel Tower, Paris'")


class TextSearchInput(BaseModel):
    keyword: str = Field(description="POI 关键字，优先用中文如 '博物馆'")
    lat: Optional[float] = Field(default=None, description="搜索中心纬度（WGS-84）")
    lng: Optional[float] = Field(default=None, description="搜索中心经度（WGS-84）")
    limit: int = Field(default=5, description="返回数量上限")


class SearchDetailInput(BaseModel):
    name: str = Field(description="景点名称，如 'Tokyo Tower'，查询简介与封面图")


class DistanceInput(BaseModel):
    origin_lat: float = Field(description="起点纬度（WGS-84）")
    origin_lng: float = Field(description="起点经度（WGS-84）")
    dest_lat: float = Field(description="终点纬度（WGS-84）")
    dest_lng: float = Field(description="终点经度（WGS-84）")


class WeatherInput(BaseModel):
    lat: float = Field(description="纬度（WGS-84）")
    lng: float = Field(description="经度（WGS-84）")


# ── Photon 公共 API 封装 ──
_PHOTON_URL = "https://photon.komoot.io/api"


async def _photon_search(
    query: str, lat: Optional[float] = None, lng: Optional[float] = None, limit: int = 5,
) -> list[dict]:
    """调用 Photon API 搜索，返回 [{name, lat, lng, category, country, city}]。"""
    params: dict = {"q": query, "limit": str(limit)}
    if lat is not None and lng is not None:
        params["lat"] = str(lat)
        params["lon"] = str(lng)
    resp = await _client().get(_PHOTON_URL, params=params)
    resp.raise_for_status()
    data = resp.json()
    results = []
    for feat in data.get("features", []):
        props = feat.get("properties", {})
        geo = feat.get("geometry", {})
        coords = geo.get("coordinates", [None, None])
        name = (
            props.get("name") or props.get("street") or props.get("city") or query
        )
        category = props.get("osm_key", "") or ""
        country = props.get("country", "")
        city = props.get("city", "")
        results.append({
            "name": name,
            "lat": coords[1],
            "lng": coords[0],
            "category": category,
            "country": country,
            "city": city,
        })
    return results


# ── 占位图 —— 所有渠道无结果时的兜底（复用 Pexels CURATED_IMAGES hero[0] 主题） ──
_PLACEHOLDER_IMAGE = (
    "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg"
    "?auto=compress&cs=tinysrgb&w=400"
)


async def _image_search(env_key: str, make_request):
    """搜索单个图片渠道。Key 未配置 / 网络异常 / 无结果均返回 None。
    make_request(key) → httpx.get() 关键字参数。"""
    key = os.getenv(env_key, "").strip()
    if not key:
        return None
    try:
        resp = await _client().get(**make_request(key))
        resp.raise_for_status()
        return resp.json()
    except Exception:
        return None


# ── 工具实现 ──
@tool(args_schema=GeoInput)
async def intl_geo(address: str) -> str:
    """正向地理编码：把地点名称/地址转为 WGS-84 经纬度与中文地址。
    基于 Photon API（OSM 数据，不限流）。"""
    async def _call():
        results = await _photon_search(address, limit=1)
        if not results:
            return f"[intl_geo] 未找到 '{address}' 的坐标"
        r = results[0]
        loc = f"{r['country']} {r['city']}".strip()
        return (
            f"lat: {r['lat']}, lng: {r['lng']}, "
            f"display_name: {r['name']}, location: {loc}"
        )
    return await _retry("intl_geo", _call)


@tool(args_schema=TextSearchInput)
async def intl_text_search(
    keyword: str,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    limit: int = 5,
) -> str:
    """国际 POI 搜索：基于 Photon API 搜索景点/餐厅/酒店（OSM 数据，不限流，返回中文名）。"""
    async def _call():
        results = await _photon_search(keyword, lat, lng, limit)
        if not results:
            return f"[intl_text_search] 未找到与 '{keyword}' 匹配的 POI"
        return "\n".join(
            f"{i+1}. {r['name']} ({r['category']}) "
            f"coords=({r['lat']},{r['lng']}) country={r['country']} city={r['city']}"
            for i, r in enumerate(results)
        )
    return await _retry("intl_text_search", _call)


@tool(args_schema=SearchDetailInput)
async def intl_search_detail(name: str) -> str:
    """查询国际景点的中文简介与封面照片。
    Wikipedia（zh→en）→ Wikimedia Commons → Pexels → Unsplash → Flickr 五级兜底，全空返回占位图。"""
    async def _call():
        client = _client()
        zh_ok = False
        pexels_ok = False
        unsplash_ok = False
        flickr_ok = False
        description = ""
        image_url = ""

        # 1) Wikipedia 搜索 —— zh 优先
        page_id = None
        wiki_api = None
        zh_resp = await client.get("https://zh.wikipedia.org/w/api.php", params={
            "action": "query", "list": "search", "srsearch": name,
            "srlimit": 1, "format": "json",
        })
        zh_resp.raise_for_status()
        zh_data = zh_resp.json()
        zh_pages = zh_data.get("query", {}).get("search", [])
        if zh_pages:
            page_id, wiki_api = zh_pages[0]["pageid"], "https://zh.wikipedia.org/w/api.php"
            zh_ok = True
        else:
            en_resp = await client.get("https://en.wikipedia.org/w/api.php", params={
                "action": "query", "list": "search", "srsearch": name,
                "srlimit": 1, "format": "json",
            })
            en_resp.raise_for_status()
            en_data = en_resp.json()
            en_pages = en_data.get("query", {}).get("search", [])
            if en_pages:
                page_id, wiki_api = en_pages[0]["pageid"], "https://en.wikipedia.org/w/api.php"

        # 2) Wikipedia 详情（有页面时才查）
        if page_id:
            detail_resp = await client.get(wiki_api, params={
                "action": "query", "prop": "extracts|pageimages",
                "exintro": 1, "explaintext": 1,
                "pithumbsize": 400, "pageids": page_id, "format": "json",
            })
            detail_resp.raise_for_status()
            detail_data = detail_resp.json()
            page = detail_data.get("query", {}).get("pages", {}).get(str(page_id), {})
            description = page.get("extract", "")[:300]
            thumbnail = page.get("thumbnail") or {}
            image_url = thumbnail.get("source") or ""

            # 3) Wikimedia Commons 兜底
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
                    title = commons_pages[0]["title"]
                    clean_title = title[5:] if title.startswith("File:") else title
                    image_url = (
                        "https://commons.wikimedia.org/wiki/Special:FilePath/"
                        f"{clean_title.replace(' ', '_')}?width=400"
                    )
        else:
            description = f"Wikipedia 未收录 '{name}'"

        # 4) Pexels 兜底（需 PEXELS_API_KEY 环境变量，不填跳过）
        if not image_url:
            data = await _image_search("PEXELS_API_KEY", lambda k: {
                "url": "https://api.pexels.com/v1/search",
                "params": {"query": name, "per_page": 1},
                "headers": {"Authorization": k},
            })
            if data:
                photos = data.get("photos", [])
                if photos:
                    image_url = photos[0]["src"]["medium"]
                    pexels_ok = True

        # 5) Unsplash 兜底（需 UNSPLASH_ACCESS_KEY 环境变量，不填跳过）
        if not image_url:
            data = await _image_search("UNSPLASH_ACCESS_KEY", lambda k: {
                "url": "https://api.unsplash.com/search/photos",
                "params": {"query": name, "per_page": 1},
                "headers": {"Authorization": f"Client-ID {k}"},
            })
            if data:
                results = data.get("results", [])
                if results:
                    image_url = results[0]["urls"]["small"]
                    unsplash_ok = True

        # 6) Flickr 兜底（需 FLICKR_API_KEY 环境变量，不填跳过）
        if not image_url:
            data = await _image_search("FLICKR_API_KEY", lambda k: {
                "url": "https://www.flickr.com/services/rest/",
                "params": {
                    "method": "flickr.photos.search",
                    "api_key": k,
                    "text": name,
                    "per_page": 1,
                    "license": "1,2,4,5,7,8,9,10",
                    "format": "json",
                    "nojsoncallback": 1,
                },
            })
            if data:
                photo_list = data.get("photos", {}).get("photo", [])
                if photo_list:
                    p = photo_list[0]
                    image_url = (
                        f"https://farm{p['farm']}.staticflickr.com/"
                        f"{p['server']}/{p['id']}_{p['secret']}_z.jpg"
                    )
                    flickr_ok = True

        # 7) 所有渠道无结果 → 通用占位图
        if not image_url:
            image_url = _PLACEHOLDER_IMAGE

        source_tag = "[英文]"
        if zh_ok: source_tag = "[中文]"
        if pexels_ok: source_tag = "[Pexels]"
        if unsplash_ok: source_tag = "[Unsplash]"
        if flickr_ok: source_tag = "[Flickr]"
        result = f"{source_tag} description: {description}"
        if image_url:
            result += f"\nimage_url: {image_url}"
        return result
    return await _retry("intl_search_detail", _call)


@tool(args_schema=DistanceInput)
async def intl_distance(
    origin_lat: float, origin_lng: float, dest_lat: float, dest_lng: float,
) -> str:
    """国际两点间路线距离（公里）+ 估算驾车/步行时间。
    基于 Haversine 球面距离 × 道路系数（驾车 ×1.3，步行 ×1.4），零网络调用瞬间返回。"""
    straight_km = _haversine_km(origin_lat, origin_lng, dest_lat, dest_lng)
    driving_km = round(straight_km * 1.3, 2)
    driving_min = round(driving_km / 0.5, 1)  # 30km/h 平均车速
    walking_min = round(straight_km / 0.075, 1)  # 4.5km/h 步行
    mode_hint = "步行可达" if straight_km < 1.5 else "建议驾车"
    return (
        f"distance_km: {driving_km}, driving_min: {driving_min}, "
        f"walking_min: {walking_min}, hint: {mode_hint}"
    )


@tool(args_schema=WeatherInput)
async def intl_weather(lat: float, lng: float) -> str:
    """查询国际目的地当前天气（Open-Meteo，免费无需 key）。"""
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
        temp = cw.get("temperature")
        code = cw.get("weathercode", 0)
        wind = cw.get("windspeed")
        desc = weather_codes.get(code, f"未知(code={code})")
        return f"temperature: {temp}°C, weather: {desc}, wind_speed: {wind} km/h"
    return await _retry("intl_weather", _call)


# ── 统一加载入口 ──
_INTL_TOOLS: list[BaseTool] = [
    intl_geo,
    intl_text_search,
    intl_search_detail,
    intl_distance,
    intl_weather,
]


def load_intl_tools() -> list[BaseTool]:
    """返回国际工具集（同步，无需异步加载）。"""
    return list(_INTL_TOOLS)
