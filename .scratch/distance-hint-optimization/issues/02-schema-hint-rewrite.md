# 02 — Schema 扩展 + computeDistanceHint 重写

**What to build:** 行程卡片上的距离提示从旧逻辑切换为新逻辑。后端/前端 schema 新增 `next_distance_km`（保留 `prev_distance` 兼容）。`computeDistanceHint` 重写：首站→读自己的 `next_distance_km` 展示"距下站"，非首站→读上一站的 `next_distance_km` 展示"距上站"，根据 protocol 用 01 的工具函数算时间，用户选择与建议不一致时双行对比展示，无 `next_distance_km` 时降级到 Haversine。

**Blocked by:** 01 — 速度估算纯函数 + 测试基础设施

**Status:** ready-for-agent

- [ ] 后端 schema `ItineraryNode` 新增 `next_distance_km: Optional[float]`
- [ ] 前端 types `ItineraryNode` 新增 `next_distance_km?: number | null`
- [ ] `computeDistanceHint` 重写：首站→距下站，非首站→距上站
- [ ] protocol 匹配建议时简洁展示，不匹配时双行对比
- [ ] 无 `next_distance_km` 时降级 Haversine
- [ ] FLIGHT 只显示距离不显示时间
- [ ] transport 节点返回 null
- [ ] 测试覆盖上述全部场景
