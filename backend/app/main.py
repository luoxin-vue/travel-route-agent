"""FastAPI 入口。"""
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
