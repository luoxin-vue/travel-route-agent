# 04 — Agent 提示词契约与编译自动化验证套件

**What to build:**
扩展 `backend/test_multi_agent.py` 自动化测试，增加 Agent 提示词黑名单断言与状态图编译校验，确保未来的改动不会引发“AI 味”复发或编译退化。

**Blocked by:** 03 — 前端界面 UI 文案与 Concierge 标签对齐

**Status:** completed

- [x] 在 `backend/test_multi_agent.py` 中增加对 `SYSTEM_PROMPT` 硬性黑名单词汇与 Concierge 约束的静态断言
- [x] 确保 StateGraph 编译与节点连通测试通过
- [x] 确保前端类型检查与打包 `tsc -b && vite build` 无报错

