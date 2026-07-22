# 规格说明书 (Spec) —— ROUTE_SYSTEM “Warm Linen & Terracotta” 界面重构规范

## Problem Statement

当前 `ROUTE_SYSTEM` 路线规划应用在 UI 视觉上采用了 **Terminal-Luxe（黑客终端与 CLI 数据密集风格）**。然而，普通旅行用户在规划度假行程时，硬朗的黑色命令行引导符（`>`、`$`）、硬框边界、粗黑底线以及大量的 `JetBrains Mono` 代码等宽字体带来了强烈的“冷硬程序员工具感”，缺乏旅行产品应有的温馨、惬意与生活呼吸感（Airy & Breathing Space）。

具体表现为：
1. **视觉过硬且刺眼**：缺乏充沛的留白与柔和层级，终端式的深色粗边线与硬打字机感破坏了轻松惬意的旅行氛围。
2. **符号与字体代码化**：大量使用 `>` 命令行输入提示符、`[编辑]` / `[标记]` 方括号 CLI 按钮以及 `路线时间轴_` 终端下滑线。
3. **沉浸感不足**：缺少符合现代度假管家定位的软萌圆角卡片、浮动搜索岛与生活感灵感贴纸。

## Solution

将应用视觉风格升级为 **Warm Linen & Terracotta（棉麻暖白与陶土暖色生活空气感风格）**：
1. **色彩与材质升级**：采用棉麻微暖白（`#FAF9F6`）作为全局底色，配以陶土暖橘（`#C86D51`）作为主行动色与鼠尾草蓝绿（`#5A9E97`）作为打卡节点色，搭配 16px/24px 大圆角悬浮卡片与微漫反射阴影。
2. **排版去 Terminal 化**：全面替换 `JetBrains Mono` 代码字体为 `Inter` 人文无衬线字体，并为时间、坐标、价格等数据启用 `tabular-nums`（等距数字）确保美观工整。
3. **组件空气感重构**：
   - 顶栏替换为 **Concierge · 随心行程** 指南针品牌；
   - 底部导航重构为软悬浮胶囊切片；
   - 输入框变身为**浮动空气感搜索岛**，提供图文贴纸 preset 灵感标签；
   - 行程时间轴去除 CLI 括号，升级为优雅的圆角动作 Pill 与柔和打卡连线。

## User Stories

1. As a traveler using the app, I want a warm linen background (`#FAF9F6`) and comfortable rounded cards (`16px`), so that I can browse travel itineraries without visual eye fatigue from a harsh CLI interface.
2. As a traveler using the app, I want to see clean sans-serif typography (Inter) instead of monospaced code fonts, so that times, prices, and destination names feel human, readable, and elegant.
3. As a traveler using the app, I want tabular-num alignment for flight times, durations, and dates, so that numerical information remains organized while looking sleek.
4. As a traveler using the app, I want a floating rounded search input bar with an inspiration compass icon, so that initiating a travel request feels like searching on a premium concierge portal.
5. As a traveler using the app, I want quick-inspiration preset chips (e.g. Shanghai Walk ☕, Chengdu Food 🐼), so that I can launch 1-tap route planning without typing long prompts.
6. As a traveler using the app, I want assistant chat bubbles styled as floating warm white cards with subtle soft shadows, so that AI-generated itineraries feel structured and comfortable to read.
7. As a traveler using the app, I want deep reasoning and tool steps presented in collapsible warm-tinted micro-cards, so that I can inspect LLM planning logic without cluttering the chat view.
8. As a traveler using the app, I want the TopAppBar to display a "Concierge · 随心行程" compass brand identity instead of a terminal logo and version code, so that the app identity matches a personal travel assistant.
9. As a traveler using the app, I want the BottomNavBar to feature soft pill-shaped active indicators and lifestyle vector icons, so that switching tabs feels smooth and visually pleasant.
10. As a traveler using the app, I want the itinerary timeline in PlanView to display terracotta and sage-green node indicators instead of raw CLI circles, so that my trip progression is clear and visually rewarding.
11. As a traveler using the app, I want action buttons (Edit, Mark Complete) styled as rounded pills without brackets like `[编辑]`, so that interactions feel modern and tactile.
12. As a traveler using the app, I want saved route cards in LibraryView to display 16px rounded corners and smooth hover elevations, so that my route collection feels like a curated travel album.

## Implementation Decisions

- **Design Tokens & Tailwind Config**: Update `DESIGN.md` and `frontend/tailwind.config.ts` with `#FAF9F6` surface, `#C86D51` primary, `#5A9E97` secondary, `#2C3036` ink, Inter font family, and rounded `0.75rem`/`1rem` scales.
- **CSS Utility Classes**: Update `frontend/src/index.css` to add `.airy-card` (soft diffused drop-shadow `0px 4px 20px -2px rgba(44, 48, 54, 0.03)`), `.airy-scroll` (soft rounded scrollbar thumb), and clean radial-dotted line background.
- **App Shell Components**: Refactor `TopAppBar.tsx` to display `Compass` icon + "Concierge · 随心行程" title; refactor `BottomNavBar.tsx` with rounded active pill containers and `MessageCircle`, `CalendarRange`, `MapPin`, `Bookmark` icons.
- **Chat View Ergonomics**: Refactor `ChatView.tsx` with floating input island (`rounded-full shadow-float border border-card-border`), lifestyle presets with icons, and soft rounded assistant message cards.
- **Timeline & Card Ergonomics**: Refactor `PlanSummary.tsx`, `RouteTimeline.tsx`, `LibraryView.tsx`, and `RouteCard.tsx` to eliminate raw CLI brackets `[{children}]`, replacing them with rounded pill action buttons and terracotta/sage node pins.

## Testing Decisions

- **Testing Seam**: The primary test seam for the UI refactor is the TypeScript compiler and Vite production bundler (`tsc -b && vite build` via `npm run build`), ensuring 100% type safety and module resolution.
- **Test Criteria**:
  1. Component tree compiles with zero TypeScript errors or unused declarations.
  2. CSS utility classes resolve properly within Tailwind JIT scanner.
  3. Responsive layout adapts cleanly on 375px mobile and 1024px desktop viewports.

## Out of Scope

- Amap JS API map rendering tiles logic (MapView remains focused on geographic point rendering).
- Backend FastAPI route endpoints or LangGraph agent execution graph logic.
- User authentication and persistent database database engine changes.

## Further Notes

- All changes strictly adhere to `CONTEXT.md` (Ubiquitous Language) and `AGENTS.md` (Ponytail lazy senior dev rules: deletion over addition, concise diffs).
