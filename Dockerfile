# syntax=docker/dockerfile:1
# ROUTE_SYSTEM 单镜像部署：前端构建 → 后端同源托管（API + 前端 + 图片代理 + SSE）
# 与项目"后端 mount frontend/dist"的同源托管方案一致（见 backend/app/main.py）。

# ---------- 1) 构建前端 ----------
FROM node:20-alpine AS frontend
WORKDIR /fe
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
# 高德 JS key 是前端构建期变量（会打进 JS bundle，非机密）。
ARG VITE_AMAP_JS_KEY
ARG VITE_AMAP_JS_SECURITY_CODE
ENV VITE_AMAP_JS_KEY=$VITE_AMAP_JS_KEY \
    VITE_AMAP_JS_SECURITY_CODE=$VITE_AMAP_JS_SECURITY_CODE
RUN npm run build

# ---------- 2) 运行后端 ----------
FROM python:3.12-slim AS runtime
ENV PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1
WORKDIR /app/backend
COPY backend/requirements.txt ./
RUN pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
COPY backend/ ./
# main.py 用 parents[2]/frontend/dist 定位前端；WORKDIR=/app/backend 时即 /app/frontend/dist。
COPY --from=frontend /fe/dist /app/frontend/dist
EXPOSE 8000
# WORKDIR=/app/backend：使 config.py 的 env_file=".env" 命中 /app/backend/.env（由 compose 挂载）。
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
