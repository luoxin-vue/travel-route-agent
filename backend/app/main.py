"""FastAPI 入口。"""
import os
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.routers import chat, image

settings = get_settings()

# 若配置了出口代理，注入环境变量，使 httpx（LLM + 高德 MCP）自动走代理。
if settings.proxy_url:
    os.environ.setdefault("HTTP_PROXY", settings.proxy_url)
    os.environ.setdefault("HTTPS_PROXY", settings.proxy_url)
    os.environ.setdefault("NO_PROXY", "localhost,127.0.0.1")

app = FastAPI(title="ROUTE_SYSTEM API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router)
app.include_router(image.router)


@app.get("/health")
def health():
    return {"status": "ok", "model": settings.llm_model}


# 若前端已构建（frontend/dist 存在），由后端同源托管：
# 部署最省事——单端口 = API + 前端 + 图片代理 + SSE，天然满足 PWA 同源/HTTPS。
# 必须放在所有 /api 路由之后挂载，避免 "/" 抢占接口路由。
_DIST = Path(__file__).resolve().parents[2] / "frontend" / "dist"
if _DIST.is_dir():
    # index.html/sw.js/manifest 不走强缓存，确保新版本能被 SW 更新检测及时发现；
    # Vite 构建产物文件名带 hash，可放心长期强缓存。
    @app.middleware("http")
    async def add_static_cache_headers(request: Request, call_next):
        response = await call_next(request)
        path = request.url.path
        if path.startswith("/assets/"):
            response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
        elif not path.startswith("/api"):
            response.headers["Cache-Control"] = "no-cache"
        return response

    app.mount("/", StaticFiles(directory=str(_DIST), html=True), name="frontend")
