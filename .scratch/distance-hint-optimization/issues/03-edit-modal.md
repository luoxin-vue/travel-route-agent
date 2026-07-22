# 03 — 编辑弹窗字段替换

**What to build:** NodeEditModal 中"距相邻站描述"文本框替换为"到下站距离(km)"数值输入框。用户编辑保存后 `next_distance_km` 正确回写到节点数据。

**Blocked by:** 02 — Schema 扩展 + computeDistanceHint 重写

**Status:** ready-for-agent

- [ ] NodeEditModal 中 `prev_distance` 文本输入替换为 `next_distance_km` 数值输入
- [ ] 保存时 `next_distance_km` 正确写入节点
- [ ] 加载编辑时正确回显已有的 `next_distance_km` 值
