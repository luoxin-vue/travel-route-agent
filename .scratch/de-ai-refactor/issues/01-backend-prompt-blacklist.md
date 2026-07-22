# 01 — Backend Prompt 黑名单与零客套输出协议

**What to build:**
更新 `backend/app/agent/prompts.py` 中的提示词契约。注入硬性黑名单词汇（禁用“作为AI”、“希望有所帮助”、“祝您旅途愉快”等），消除开头前言和结尾总结，强制开门见山返回直观点位数据。

**Blocked by:** None — can start immediately

**Status:** completed

- [x] SYSTEM_PROMPT 包含硬性黑名单禁令（严禁“作为AI”、“希望有所帮助”、“祝您旅途愉快”等套话）
- [x] 强制 Agent 开门见山输出数据与要点，禁止任何开场前言和结语
- [x] SUPERVISOR_PROMPT、TRANSIT_PROMPT、LODGING_PROMPT 的内部沟通文案去机械化

