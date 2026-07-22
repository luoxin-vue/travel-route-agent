# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

ROUTE_SYSTEM —— AI 原生、对话优先的旅游路线规划 PWA。前端 React + Vite + TypeScript；后端 FastAPI + LangGraph，通过**官方高德 MCP Server** 调用地理编码/POI/路径/天气，LLM 用国产模型（默认 DeepSeek，OpenAI 兼容）。

产品需求见 `route_system.md`，设计系统见 `DESIGN.md`。两者是设计权威来源。

## 改动前必读（重要约束）

> 用户明确要求：**不要随意重写已成型的布局、页面结构和逻辑代码**。

- **设计令牌只有一个来源**：`frontend/tailwind.config.ts` + `frontend/src/index.css`，全部映射自 `DESIGN.md`。改样式用这些 token（如 `primary-container`、`on-surface-variant`、`outline-variant`、`ink`），**不要硬编码颜色/字号**，不要新建平行的设计变量。
- **页面布局已按设计稿定稿**：会话页（`features/chat/`）和计划页（`features/plan/`）已严格还原用户提供的 HTML 设计稿（终端社论风 / Terminal-Luxe）。改这些页面时**保持现有结构与视觉**，只做增量调整，不要推倒重做。
- **复用现有组件**：`components/`（Button、Card、Chip、SmartImage、TopAppBar、BottomNavBar…）和 `lib/labels.ts`（工具名/方式中文映射）。新功能优先复用，不要重复造。
- **界面全中文**：所有面向用户的文案用中文；后端传来的英文（高德工具名、protocol）通过 `lib/labels.ts` 与 `RouteTimeline` 的映射表转中文。
- 改了后端 `schema.py`（行程结构）务必同步 `frontend/src/types.ts`。

## 常用命令

后端（`backend/`，**必须用项目自带 venv**，详见下方环境陷阱）：
```bash
# 启动：根目录的 dev.cmd 已封装（cd 进 backend 再用 venv 全路径 python 起 uvicorn，无 --reload）
./dev.cmd
# ⚠️ 不要从项目根直接 uvicorn --app-dir backend 启动：pydantic env_file=".env" 按 CWD 解析，
#    会读到根目录部署用 .env，高德 key 落空 → 「加载高德 MCP 工具失败（已重试 5 次）」
# 健康检查（应返回 deepseek-chat；返回 qwen-plus 说明读错了 .env）
curl http://localhost:8000/health
# 装依赖
backend/.venv/Scripts/python.exe -m pip install -r backend/requirements.txt
```

前端（`frontend/`）：
```bash
npm install
npm run dev      # http://localhost:5173，/api 已代理到 localhost:8000
npm run build    # tsc -b && vite build（提交前跑一遍，确保类型与构建通过）
```

无独立测试套件；验证靠 `npm run build`（类型）+ 对 `/api/chat` 发真实请求（端到端）。

## 架构（big picture）

```
前端 PWA ──POST /api/chat (SSE)──> FastAPI ──> LangGraph create_agent
  会话/计划/地图/账户                            ├─ LLM (ChatDeepSeek / ChatOpenAI)
                                                ├─ 高德 MCP 工具 (15 个)
                                                └─ emit_itinerary 结构化行程
```

**SSE 事件协议**（前后端契约，`routers/chat.py` ↔ `lib/api.ts`）：
- `token` 正文增量 · `thinking` 推理增量（仅 deepseek-reasoner 有）· `tool` 工具调用（带 `id`/`name`/`status`/`detail`）· `itinerary` 结构化行程 · `done` · `error`
- 前端把这些事件分发进 Zustand（`store/useAppStore.ts`）：`token→appendToLastAssistant`、`thinking→appendReasoning`、`tool→pushStep/resolveStep`、`itinerary→setItinerary + 跳转计划页`。

**后端关键链路**：
- `agent/graph.py`：`get_agent()` 惰性构建并缓存 Agent（首次异步加载 MCP 工具）。用 `langchain.agents.create_agent`（**不是**已弃用的 `create_react_agent`）。`emit_itinerary` 是带 Pydantic schema 的结构化工具，行程数据从它的工具调用参数里取出。
- `agent/llm.py`：base_url 含 `deepseek` → `ChatDeepSeek`（能透出 `reasoning_content` 思维链）；否则 `ChatOpenAI`。切模型只改 `.env` 三个 `LLM_*`。
- `agent/mcp_tools.py`：远程高德 MCP（streamable_http）**弱网下单次约 75% 成功**，已对「工具加载握手」和「每次调用」都加 `_MAX_RETRIES=5` 重试，失败转为可恢复返回值——**不要移除这层重试**。
- `routers/chat.py`：`get_agent()` 在 SSE 生成器**内部**调用，失败也以 `error` 事件返回（避免 500 text/plain 让前端报 content-type 错）。`recursion_limit=50`（推理模型工具调用多）。
- `routers/image.py`：`/api/img` 图片代理，把高德图片转同源 https（解决混合内容+防盗链），仅允许 `*.amap.com`/`*.autonavi.com`。前端图片统一走 `lib/img.ts` 的 `proxiedImage()`。

**真实行程数据流**：高德 `text_search` 每个 POI 自带真实 `photo` URL → 模型填进 `itinerary.cover_image` / `node.image`（提示词严禁编造 URL）→ 前端经图片代理渲染。坐标 `lng/lat` 用于地图页高德 JS SDK 打点连线。

## 环境陷阱（本机特有，务必注意）

1. **网络已是国内直连**（2026-07 起）：`backend/.env` 的 `PROXY_URL` **留空**即可直连高德/DeepSeek。（历史：此前本机靠 Clash `127.0.0.1:7897` 出网，若回到需代理的网络再设回。）详见 memory `route-system-env`。
1b. **.env 按 CWD 解析**：`config.py` 的 `env_file=".env"` 相对启动目录。根目录另有部署用 `.env`（TUNNEL_TOKEN/VITE key），从根启动会读错配置（症状：health 返回 qwen-plus、MCP 工具加载失败）。**用根目录 `./dev.cmd` 启动**（内部 cd 进 backend）。
2. **venv 是嵌套创建的**：`backend/.venv` 由 hermes-agent 的 python 创建（见 `pyvenv.cfg`）。**不要用 `--reload`**——其 Windows 子进程会回退到 hermes 环境导致 `No module named langchain_core`。务必用 `.venv/Scripts/python.exe` 全路径启动。
3. **改 .env 必须重启后端**才生效；启动前先杀掉占用 8000 的旧 uvicorn 进程。
4. 高德两类 key 不混用：后端 MCP 用 **Web 服务 key**（`AMAP_MAPS_API_KEY`）；前端地图用 **JS API key**（`VITE_AMAP_JS_KEY` + 安全密钥）。

## 后续迭代（未做）

账户/持久化（checkpointer 现为内存 `MemorySaver`，重启即清）、实时天气/物流卡片、中英 i18n、PWA 离线增强、行程节点真正可编辑。

## Agent skills

### Issue tracker

Issues 通过 GitHub Issues 管理，使用 `gh` CLI 操作。详见 `docs/agents/issue-tracker.md`。

### Domain docs

单上下文布局：`CONTEXT.md` + `docs/adr/`。详见 `docs/agents/domain.md`。
