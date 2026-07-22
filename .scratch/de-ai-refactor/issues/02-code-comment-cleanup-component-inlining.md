# 02 — 前后端代码废话注释清洗与套壳组件极简内联

**What to build:**
扫描清洗 `backend/app/` 与 `frontend/src/` 中同义反复的 AI 废话注释，仅保留必要中文机制注释；将 `Card.tsx`、`Chip.tsx` 等单层套壳小组件内联至业务组件中，实现组件架构精简（Ponytail 原则）。

**Blocked by:** 01 — Backend Prompt 黑名单与零客套输出协议

**Status:** completed

- [x] 清理后端 Python 代码中同义反复的 AI 注释与高达 120 行的注释死代码
- [x] 清理前端 TypeScript/React 代码中同义反复的 AI 注释
- [x] 内联/剔除单层 UI 套壳小组件（Card/Chip），简化组件层次

