# ROUTE_SYSTEM —— 旅游路线规划 Agent PWA

AI 原生、对话优先的旅游路线规划 PWA。前端 React + Vite + TypeScript，后端 FastAPI + LangGraph，通过**官方高德 MCP Server** 调用地理编码 / POI / 路径规划 / 天气，LLM 使用国产模型（通义千问 / DeepSeek / GLM，OpenAI 兼容）。

设计风格遵循 `DESIGN.md`（Terminal-Luxe / 终端社论风）。产品需求见 `route_system.md`。

## 架构

```
前端 PWA ──HTTP/SSE──> FastAPI ──> LangGraph Agent
  会话/计划/地图/账户            ├─ LLM(国产, OpenAI 兼容)
                                ├─ 高德 MCP 工具
                                └─ emit_itinerary 结构化行程
```

核心闭环：会话输入 → Agent 调高德工具 → 流式对话 + 结构化行程 JSON → 自动填充「计划」时间轴与「地图」可视化。行程封面与节点配图取自高德 POI 的真实照片（非 AI 生成）。

## 目录

```
backend/    FastAPI + LangGraph + 高德 MCP
frontend/   React + Vite + TS PWA
DESIGN.md   设计系统  ·  route_system.md  产品简报
```

## 环境准备

需要：Node ≥ 18、Python ≥ 3.11。

### 后端

```bash
cd backend
python -m venv .venv
.venv/Scripts/activate        # Windows;  Linux/Mac: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # 填入真实 key
```

`.env` 关键项：

| 变量 | 说明 |
|------|------|
| `LLM_API_KEY` / `LLM_BASE_URL` / `LLM_MODEL` | 国产模型（默认 DeepSeek `deepseek-reasoner` 推理模型，会在对话里展示「深度思考」思维链；想更快可换 `deepseek-chat`） |
| `AMAP_MAPS_API_KEY` | 高德 **Web 服务** key（供 MCP 用） |
| `AMAP_MCP_TRANSPORT` | `streamable_http`（远程，推荐）/ `sse`（旧）/ `stdio`（本地 npx） |
| `PROXY_URL` | 出口代理。本机需经代理访问外网时填（如 Clash `http://127.0.0.1:7897`），直连留空 |

> **代理说明**：本机若所有外网流量都走本地代理（Clash/V2Ray 等），务必填 `PROXY_URL`，否则后端连不上高德/LLM。设置后会自动注入 `HTTP(S)_PROXY`，LLM 与高德 MCP 请求都会走它（`localhost` 自动直连）。
>
> **弱网加固**：远程高德 MCP 端点在并发下偶发掉连接，代码已对工具加载与每次调用加了重试（见 `app/agent/mcp_tools.py`），个别失败会自动重试而不会中断整次规划。

启动：

```bash
uvicorn app.main:app --reload --port 8000
# 健康检查: curl http://localhost:8000/health
```

### 前端

```bash
cd frontend
npm install
cp .env.example .env          # 填入高德 JS key
npm run dev                   # http://localhost:5173
```

`frontend/.env`：

| 变量 | 说明 |
|------|------|
| `VITE_AMAP_JS_KEY` | 高德 **JS API** key（与后端 Web 服务 key **不同**） |
| `VITE_AMAP_JS_SECURITY_CODE` | 高德 JS 安全密钥 |

> 开发期 `vite.config.ts` 已把 `/api` 代理到 `localhost:8000`，无需处理 CORS。

## 切换 LLM 提供方

只改 `backend/.env` 三项即可，无需改代码：

```ini
# DeepSeek
LLM_BASE_URL=https://api.deepseek.com/v1
LLM_MODEL=deepseek-chat
# 智谱 GLM
LLM_BASE_URL=https://open.bigmodel.cn/api/paas/v4
LLM_MODEL=glm-4-flash
```

> 所选型号必须支持 function/tool calling。
>
> **深度思考（思维链）**：DeepSeek 经 `langchain-deepseek` 的 `ChatDeepSeek` 接入，`deepseek-reasoner` 的推理内容会以 `thinking` 事件流式推送，前端在对话气泡里折叠展示为「深度思考」。`ChatOpenAI` 基类不透出 reasoning，故仅 DeepSeek 自动启用；换 `deepseek-chat` 则无思维链但更快。推理模型工具调用较多，后端已把 LangGraph `recursion_limit` 放宽到 50。

## 真实风景图 & 图片代理（开发 + 生产都能显示）

行程封面图（`cover_image`）和节点配图（`node.image`）来自高德 `text_search` 返回的真实 POI 照片 URL，**不是 AI 生成**（提示词严禁模型编造图片链接）。

高德图片有两个问题：部分是 `http://`（生产 https 页面会被混合内容拦截）、且有防盗链。为此后端提供同源图片代理，前端所有图片统一走它（`frontend/src/lib/img.ts` 的 `proxiedImage()`）：

```
GET /api/img?url=<高德图片URL>   # 仅放行 *.amap.com / *.autonavi.com，防 SSRF
```

只要 `/api` 能路由到后端，**开发和生产都能正常显示图片**：
- **开发**：`vite.config.ts` 已把 `/api` 代理到 `localhost:8000`，开箱即用。
- **生产**：见下方「生产部署」，关键是让前端的 `/api/*` 反代到后端，使图片代理与 `/api/chat` 同源可达。

## 生产部署

前端是纯静态产物，后端是 FastAPI。**核心是让二者同源**（这样 `/api/chat`、`/api/img` 都可达，图片与 SSE 都正常）：

```bash
# 1) 构建前端静态资源
cd frontend && npm run build      # 产物在 frontend/dist

# 2) 后端常驻（生产用 --workers，不要 --reload）
cd backend && .venv/Scripts/python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

用 Nginx 把静态资源与 `/api` 反代到一起（示例）：

```nginx
server {
  listen 80;
  root /path/to/frontend/dist;
  location / { try_files $uri /index.html; }      # SPA 回退
  location /api/ {
    proxy_pass http://127.0.0.1:8000;             # 转发到 uvicorn
    proxy_http_version 1.1;
    proxy_set_header Connection '';               # SSE 需要：禁用连接复用缓冲
    proxy_buffering off;                          # SSE 需要：关闭缓冲，保证流式
  }
}
```

> 若后端所在服务器能直连高德/LLM（如国内服务器），把 `backend/.env` 的 `PROXY_URL` 留空即可；需要代理才填。

## 端到端验证

1. 启动后端与前端。
2. 「会话」Tab 输入「帮我规划上海周末 2 日游」。
3. 观察：对话流式输出、遥测条显示当前工具（如 `maps_text_search`）。
4. 行程生成后自动跳「计划」Tab → 时间轴节点（坐标/时间/预约 ID）。
5. 「地图」Tab → 高德地图上的标记与路线连线。
6. 同一会话追问「第二天加一个博物馆」→ Agent 基于已有行程增量修改（线程级记忆）。

## 已知边界（MVP）

- 会话记忆为进程内（`MemorySaver`），重启即清空。
- 账户、实时天气/物流卡片、中英双语、离线增强为后续迭代项（见 `DESIGN.md` 计划文档）。
- 高德 JS 安全密钥目前在前端注入，**生产环境**应改为服务端代理签名。

## 安全提示

- 高德两类 key 不可混用：服务端用 Web 服务 key，前端用 JS API key + 安全密钥。
- `.env` 已被 `.gitignore` 忽略，切勿提交真实凭据。
