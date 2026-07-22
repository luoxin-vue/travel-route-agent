"""国产模型封装（通义千问 / DeepSeek / GLM 均兼容 OpenAI 接口）。

集中在此，切换提供方只需改 .env 的 LLM_BASE_URL / LLM_MODEL / LLM_API_KEY。
要求所选型号支持 function/tool calling（qwen-plus、deepseek-chat/reasoner、glm-4 均支持）。

DeepSeek 走官方 ChatDeepSeek：它会把推理模型（deepseek-reasoner）的思维链
透出到 additional_kwargs["reasoning_content"]，供前端「深度思考」展示。
ChatOpenAI 基类不提取 reasoning_content，故其它兼容厂商用 ChatOpenAI。
"""
from langchain_core.language_models import BaseChatModel
from langchain_deepseek import ChatDeepSeek
from langchain_openai import ChatOpenAI

from app.config import get_settings


def build_llm() -> BaseChatModel:
    settings = get_settings()
    if "deepseek" in settings.llm_base_url.lower():
        return ChatDeepSeek(
            model=settings.llm_model,
            api_key=settings.llm_api_key,
            api_base=settings.llm_base_url,
            streaming=True,
        )
    return ChatOpenAI(
        model=settings.llm_model,
        api_key=settings.llm_api_key,
        base_url=settings.llm_base_url,
        temperature=0.3,
        streaming=True,
    )
