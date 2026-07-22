# 04 — 清除 prev_distance + 旧数据降级

**What to build:** `prev_distance` 从前端 types 和后端 schema 中彻底删除。已保存路线库中含旧字段的数据不报错，距离提示降级到 Haversine 估算。

**Blocked by:** 02, 03

**Status:** ready-for-agent

- [ ] 前端 `types.ts` 中 `prev_distance` 字段删除
- [ ] 后端 schema 无 `prev_distance`（确认当前就没有）
- [ ] 旧 SavedRoute 数据加载不报错
- [ ] 无 `next_distance_km` 且无坐标时返回默认 fallback 文案
