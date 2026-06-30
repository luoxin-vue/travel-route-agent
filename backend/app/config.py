"""集中读取环境变量。改 LLM 提供方只需改 .env 中的三个 LLM_* 项。"""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    # LLM（OpenAI 兼容）
    llm_api_key: str = "sk-placeholder"
    llm_base_url: str = "https://dashscope.aliyuncs.com/compatible-mode/v1"
    llm_model: str = "qwen-plus"

    # 高德
    amap_maps_api_key: str = ""
    amap_mcp_transport: str = "sse"  # sse | stdio

    # 服务
    cors_origins: str = "http://localhost:5173"

    # 出口代理（本机若需经代理访问外网，如 Clash 的 http://127.0.0.1:7897）。
    # 留空表示直连。设置后会注入 HTTP(S)_PROXY，LLM 与高德 MCP 请求均走它。
    proxy_url: str = ""

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def amap_mcp_sse_url(self) -> str:
        return f"https://mcp.amap.com/sse?key={self.amap_maps_api_key}"

    @property
    def amap_mcp_http_url(self) -> str:
        return f"https://mcp.amap.com/mcp?key={self.amap_maps_api_key}"


@lru_cache
def get_settings() -> Settings:
    return Settings()
