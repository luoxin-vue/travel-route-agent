# 规格说明书 (Spec) —— ROUTE_SYSTEM “去 AI 味”重构与代码精简规范

## Problem Statement

当前 `ROUTE_SYSTEM` 路线规划应用虽然具备流畅的交互与结构化行程输出，但在 LLM 对话语气、代码注释及 UI 细节上存在较重的人工智能痕迹（即“AI 味”）。
具体表现为：
1. **对话硬板与客套**：Agent 会输出典型的 AI 客服套话（如“作为 AI 助手”、“希望对您的出行有所帮助！祝您旅途愉快！”），破坏高端、冷静的行程规划管家体验。
2. **代码注释陈述化**：前后端代码中包含大量由 AI 生成的同义反复废话注释（如 `// 定义状态`、`# 获取配置`），降低代码可读性，增加维护成本。
3. **前端 UI 抽象过度与称谓不符**：包含少量单层套壳微型 UI 组件（如 `Card.tsx`、`Chip.tsx`），且界面残存 `旅行规划师 已就绪` 等软性问答提示，与 `CONTEXT.md` 确立的领域词汇规范（Ubiquitous Language）不符。

## Solution

全面执行“去 AI 味”洗练与代码极化重构：
1. **Prompt 绝对禁令**：在系统 System Prompt 中加入硬性黑名单，禁止所有 AI 客服套话、自我介绍、前言与结语，强制要求开门见山、直接输出点位/路线状态和要点。
2. **代码与注释清洗**：彻底清理前后端同义反复的 AI 废话注释，仅保留高德坐标系 GCJ-02、代理重试机制等关键业务中文注释；内联单层 UI 包装组件，遵循 Ponytail 极简模式。
3. **UI 称谓统一**：界面统一使用 `Concierge` / `行程规划` 称谓，并将空状态提示升级为硬朗直观的终端指令引导。

## User Stories

1. As a traveler using the app, I want the Concierge agent to immediately report itinerary points and status without filler greetings or sign-offs, so that I can consume information with zero distraction.
2. As a traveler using the app, I want the system prompt to enforce direct concise responses, so that LLM token generation latency is minimized.
3. As a developer reading the codebase, I want all tautological AI comments removed, so that I can focus strictly on essential domain business logic.
4. As a developer reading the codebase, I want single-wrapper UI components inlined into component files, so that file sprawl and unnecessary abstractions are reduced.
5. As a UI user, I want top app bar labels and empty state greetings to consistently reflect the "Concierge" ubiquitous language defined in CONTEXT.md, so that the user interface feels like a professional terminal system.
6. As a QA developer, I want an automated test checking agent prompts and state compilation, so that regressions in AI tone and prompt contracts can be instantly caught.

## Implementation Decisions

- **LLM Prompt Strategy**: Update `SYSTEM_PROMPT`, `SUPERVISOR_PROMPT`, `TRANSIT_PROMPT`, `LODGING_PROMPT` in `backend/app/agent/prompts.py` to enforce strict negative constraints forbidding polite boilerplate ("作为AI助手", "希望有所帮助", "祝您旅途愉快"), prohibiting introductions and wrap-up summaries.
- **Comment Refactoring**: Scan and clean redundant literal comments across `backend/app/` and `frontend/src/`. Retain only essential Chinese domain comments (such as GCJ-02 coordinate handling, image proxy fallback, SSE streaming controls).
- **Component Inlining**: Inline single-line wrapper components (`Card.tsx`, `Chip.tsx`) into their respective usage sites to streamline file structure in accordance with the Ponytail rule set in `AGENTS.md`.
- **UI Label Alignment**: Refactor `ChatView.tsx`, `TopAppBar.tsx`, and empty state elements to replace soft AI questions with direct CLI-style action hints and use `Concierge` as the primary agent moniker.

## Testing Decisions

- **Testing Seam**: The primary test seam is `backend/test_multi_agent.py` and unit checks executing `get_agent()`.
- **Test Criteria**: Tests verify compiled StateGraph integrity, tool availability, and prompt contract compliance (ensuring no blacklisted conversational templates are present in prompt variables).
- **Prior Art**: Extends `backend/test_multi_agent.py` using `unittest.mock` for offline isolation.

## Out of Scope

- Core map rendering logic using Amap JS API.
- LangGraph graph node execution topology changes (the single-agent architecture with tools remains unchanged).
- Database migrations or authentication schema alterations.

## Further Notes

- All changes adhere strictly to `AGENTS.md` (Ponytail lazy senior dev mode) and `CONTEXT.md` (Ubiquitous Language).
