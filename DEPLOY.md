# 部署手册 —— 国内免费 ECS + Cloudflare Tunnel

把 ROUTE_SYSTEM 部署到 **`https://coderlx.dpdns.org`**。

## 架构与为什么这么选

```
用户浏览器 ──https──> Cloudflare 边缘 ──加密隧道──> ECS 内的 cloudflared ──> app:8000
                     (自动 TLS)                    (无公网入站端口)      (前端+API+SSE+图片代理)
```

- **为什么用 Cloudflare Tunnel**：`coderlx.dpdns.org` 是免费二级域名，**无法 ICP 备案**；国内机房会拦截未备案域名的 80/443 网站。Tunnel 让 ECS **不开放任何公网 Web 端口**（只出站连 Cloudflare），机房无从拦截，且 Cloudflare 免费提供 HTTPS。
- **代价**：Cloudflare 免费版对大陆访客走海外 POP，有一定延迟（MVP 可接受）。
- **直连**：ECS 在国内可直连 `api.deepseek.com` / `mcp.amap.com`，所以 `PROXY_URL` 留空。

---

## 第 0 步：准备

- 一台**国内免费试用 ECS**（阿里云/腾讯云，选 **Ubuntu 22.04**，1C2G 起）。
  - 安全组：**只需放行 22（SSH）**。**无需**开放 80/443（隧道是出站的）。
- 已有 Cloudflare 账号，且 `coderlx.dpdns.org`（或其父域 `dpdns.org`）已托管在 Cloudflare、DNS 可管理。
  - dpdns.org 若是第三方免费域名平台，请确认它把 DNS 交给了 Cloudflare（能在 Cloudflare 面板看到这个 zone）。若不能，见文末「备选」。
- 两个高德 key：**Web 服务 key**（后端）和 **JS API key + 安全密钥**（前端）。

## 第 1 步：高德控制台配置域名白名单

前端地图用的 JS key 需要绑定域名，否则线上地图不显示：
1. 高德开放平台 → 应用管理 → 找到你的 **JS API** 应用。
2. 在「安全域名 / 白名单」里加入：`coderlx.dpdns.org`
3. Web 服务 key 无需域名白名单（但建议在控制台配置好额度）。

## 第 2 步：装 Docker（在 ECS 上）

```bash
curl -fsSL https://get.docker.com | sh
sudo systemctl enable --now docker
# 验证
sudo docker version && sudo docker compose version
```

## 第 3 步：上传代码 + 填配置

```bash
# 把项目传到 ECS（git clone 你的仓库，或 scp 整个目录）。假设在 ~/map_project
cd ~/map_project

# (a) 后端机密：复制模板并填真实值，PROXY_URL 必须留空
cp backend/.env.production.example backend/.env
vi backend/.env      # 填 LLM_API_KEY / AMAP_MAPS_API_KEY

# (b) compose 变量：填高德 JS key，TUNNEL_TOKEN 下一步拿
cp .env.deploy.example .env
vi .env              # 填 VITE_AMAP_JS_KEY / VITE_AMAP_JS_SECURITY_CODE
```

> ⚠️ `backend/.env` 里 `PROXY_URL=` 一定留空。填了本机的 `127.0.0.1:7897` 会导致所有外部请求失败。

## 第 4 步：创建 Cloudflare Tunnel，拿 token

面板方式（最简单，无需在服务器上登录 cloudflared）：
1. Cloudflare 面板 → **Zero Trust** → **Networks → Tunnels** → **Create a tunnel**。
2. 类型选 **Cloudflared**，起个名字（如 `route-system`），创建。
3. 在「Install connector」页面，复制那串 **token**（`eyJ...` 一长串）。
   - 把它填进仓库根目录 `.env` 的 `TUNNEL_TOKEN=`。
4. 进入该 tunnel 的 **Public Hostname** 标签 → **Add a public hostname**：
   - **Subdomain**: `coderlx`　**Domain**: `dpdns.org`（即最终 `coderlx.dpdns.org`）
   - **Type**: `HTTP`　**URL**: `app:8000`
   - 保存。（`app` 是 compose 里的服务名，cloudflared 与 app 同网络可直接访问。）

> Cloudflare 会自动为该主机名建好 DNS 记录，无需手动加 A/CNAME。

## 第 5 步：起服务

```bash
cd ~/map_project
sudo docker compose up -d --build
# 看日志确认 app 起来了 + 隧道已连接
sudo docker compose logs -f
```

看到 app 打印 `Uvicorn running on http://0.0.0.0:8000`、cloudflared 打印 `Registered tunnel connection` 即成功。

## 第 6 步：验证

```bash
# 服务器本地自测（容器内 app 是否健康）
sudo docker compose exec app python -c "import urllib.request as u;print(u.urlopen('http://localhost:8000/health').read())"
```

浏览器打开：
- `https://coderlx.dpdns.org/health` → 返回 `{"status":"ok",...}`
- `https://coderlx.dpdns.org/` → 前端页面
- 发一条对话，确认 SSE 流式输出、地图打点、行程卡片图片正常。

---

## 日常运维

```bash
sudo docker compose logs -f app          # 看后端日志
sudo docker compose restart app          # 改了 backend/.env 后重启（.env 是挂载的，重启即生效）
git pull && sudo docker compose up -d --build   # 更新代码后重新构建
sudo docker compose down                 # 停
```

- **改了前端高德 JS key**（`.env` 里的 VITE_*）：必须 `--build` 重新构建镜像才生效（构建期变量）。
- **免费试用到期**：换新 ECS 重跑第 2~5 步即可；Tunnel token 不变，域名无需改。

---

## 常见问题

- **打开域名 502 / 起不来**：`docker compose logs app` 看后端；`logs cloudflared` 看隧道是否连上、Public Hostname 的 URL 是否写成 `app:8000`。
- **对话报错 / 无响应**：多半是 `backend/.env` 的 key 错或 `PROXY_URL` 没留空。`docker compose exec app env | grep PROXY` 应为空。
- **地图不显示 / 报「缺少高德 JS KEY」**：`.env` 的 VITE_AMAP_JS_KEY 没填、或没 `--build`、或高德控制台没加 `coderlx.dpdns.org` 安全域名。
- **高德 MCP 偶发失败**：后端已内置重试（见 CLAUDE.md），偶发弱网重试即可。
- **CI 构建 `npm ci` 报 `Missing: esbuild@0.28.1 from lock file`**：`package.json` 改了但 `package-lock.json` 没同步（通常是本地 `npm install` 后没提交 lock 文件，或依赖版本升级后 lock 文件过期）。修复：`cd frontend && rm -rf node_modules package-lock.json && npm install && git add package-lock.json`
- **CI 构建 `pip install` 报 `Read timed out` / `ReadTimeoutError`**：国内 ECS 访问 `files.pythonhosted.org`（PyPI 官方源）网络不稳定。已切换清华镜像源 `-i https://pypi.tuna.tsinghua.edu.cn/simple`。若镜像也超时，可换阿里云镜像 `-i https://mirrors.aliyun.com/pypi/simple/`

---

## 备选：不用 Docker（裸机 systemd）

若 ECS 资源紧或不想装 Docker：

```bash
# 装 Python 3.12 + Node 20，然后：
cd ~/map_project/frontend && npm ci && \
  VITE_AMAP_JS_KEY=xxx VITE_AMAP_JS_SECURITY_CODE=yyy npm run build
cd ~/map_project/backend && python3 -m venv .venv && \
  .venv/bin/pip install -r requirements.txt
cp backend/.env.production.example backend/.env   # 填值，PROXY_URL 留空
# 从仓库根目录启动（使 frontend/dist 与 backend/.env 都能被定位）：
cd ~/map_project/backend && .venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

再单独装 cloudflared：`cloudflared service install <TUNNEL_TOKEN>`，Public Hostname 的 URL 填 `http://localhost:8000`。建议把 uvicorn 写成 systemd unit 常驻。

## 备选：域名不在 Cloudflare 托管

如果 `dpdns.org` 的 DNS 不归你在 Cloudflare 管理（Tunnel 需要它自动建 DNS 记录），有两条路：
1. 把该域名接入 Cloudflare（在 dpdns 平台把 NS 指向 Cloudflare，若平台允许）。
2. 改用 **PaaS（Render/Zeabur）** 一键部署，在 dpdns 平台把 `coderlx` 记录 **CNAME** 到 PaaS 给的域名（海外、无需备案，但同样有延迟）。需要的话我再给这套手册。
