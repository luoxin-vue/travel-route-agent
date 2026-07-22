# 05 — 后端 prompt 引导 Agent 填入 next_distance_km

**What to build:** 新对话生成行程时，Agent 在调用 `emit_itinerary` 前使用高德 `distance` 工具计算每对相邻 stop 节点的路线距离并填入 `next_distance_km`。

**Blocked by:** 02 — Schema 扩展 + computeDistanceHint 重写

**Status:** ready-for-agent

- [ ] 后端 schema `next_distance_km` 字段有 description 引导 Agent 填写
- [ ] prompts.py 新增指引：生成行程前用高德 `distance` 工具计算相邻 stop 节点路线距离
- [ ] prompt 文本包含 `next_distance_km` 和 `distance` 关键词
