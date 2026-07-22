# 01 — 速度估算纯函数 + 测试基础设施

**What to build:** 可独立运行的速度估算工具函数 + 项目首个可跑通的测试。`estimateTravelMinutes(distanceKm, protocol)` 返回预估分钟数（FLIGHT 返回 null）；`getRecommendedMode(distanceKm)` 返回系统建议（步行/驾车）。安装 vitest，配好 `npm test` 脚本，测试覆盖全部 protocol 速度、阈值边界（1.49km vs 1.5km）、FLIGHT 特殊处理。

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] vitest 已安装，`npm test` 可运行
- [ ] `estimateTravelMinutes(distanceKm, protocol)` 纯函数：按速度常量表返回分钟数，FLIGHT 返回 null，最小 5 分钟
- [ ] `getRecommendedMode(distanceKm)` 纯函数：< 1.5km 返回 walking，>= 1.5km 返回 driving
- [ ] 测试覆盖：全部 protocol 速度、FLIGHT null、阈值边界 1.49 vs 1.5
