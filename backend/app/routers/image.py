"""图片代理：把高德图片(部分是 http)转成同源 https，解决生产环境混合内容与防盗链。

仅允许高德域名，避免成为开放代理 / SSRF。
"""
from urllib.parse import urlparse

import httpx
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response

router = APIRouter(prefix="/api", tags=["image"])

_ALLOWED_SUFFIXES = (".amap.com", ".autonavi.com")


def _allowed(url: str) -> bool:
    host = (urlparse(url).hostname or "").lower()
    return any(host == domain_suffix.lstrip(".") or host.endswith(domain_suffix) for domain_suffix in _ALLOWED_SUFFIXES)


@router.get("/img")
async def proxy_image(url: str = Query(..., description="高德图片 URL")):
    if not url.startswith(("http://", "https://")) or not _allowed(url):
        raise HTTPException(status_code=400, detail="url not allowed")
    try:
        # trust_env=True → 复用 main.py 注入的 HTTP(S)_PROXY
        async with httpx.AsyncClient(timeout=20, trust_env=True, follow_redirects=True) as client:
            response = await client.get(url)
    except Exception:  # noqa: BLE001
        raise HTTPException(status_code=502, detail="fetch failed")
    if response.status_code != 200:
        raise HTTPException(status_code=502, detail="upstream error")
    return Response(
        content=response.content,
        media_type=response.headers.get("content-type", "image/jpeg"),
        headers={"Cache-Control": "public, max-age=86400"},
    )
