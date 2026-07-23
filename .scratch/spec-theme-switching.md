# PRD：外观主题切换（浅色 / 深色 / 跟随系统）

## Problem Statement

当前产品只提供浅色外观（Warm Linen & Terracotta 棉麻暖白），用户在以下场景会感到不适：

- 夜间/弱光环境下长时间使用：纯浅色界面刺眼，违背"夜间用深色"的现代 UI 习惯。
- OLED 设备：长时间显示大面积浅色像素更耗电，且加剧烧屏风险。
- 系统已是深色、应用却是浅色：撕裂感，"应用没在听 OS 的话"。

用户需要一个**与系统设置自然对齐的主题切换能力**：默认跟随 OS 即可获得一致体验；想锁定浅色或深色时也能明确切换；选择需要持久化以避免每次打开都要重设。

## Solution

为 `TravelPreferences` 引入"主题"字段（`light` / `dark` / `system` 三态），在 `外观` Tab 提供三选一切换器，在顶栏提供快捷气泡入口，配合 CSS 变量重构 token 实现浅/深两套色值。Amap 地图视图同步切换底图样式，保证夜间不出现"卡片黑、地图白"的撕裂感。新用户默认 `system`，不需任何操作就能在深色 OS 上获得深色体验。

实现路径选择**CSS 变量 + Tailwind 引用**，而不是 Tailwind `dark:` 变体——理由是后者需要给每个 `bg-surface` / `text-ink` 类逐一加 `dark:` 兄弟类，drift 风险高；前者让现有 `bg-surface` 类继续工作，只在 `:root.dark` 作用域内替换变量值。

## User Stories

1. As a 使用深色 OS 的新用户, I want 应用启动即在深色模式, so that 我不用找任何设置就能获得与系统一致的外观。
2. As a 使用浅色 OS 的新用户, I want 应用启动即在浅色模式, so that 我看到熟悉的外观、没有任何 setup 摩擦。
3. As a 浅色用户, I want 切换到深色模式, so that 我能在夜间使用、不刺眼。
4. As a 深色用户, I want 切回浅色模式, so that 我在明亮环境下能看清细节密集的行程卡片。
5. As a 用户, I want 选择"跟随系统", so that 应用能随我 OS 主题变化自动跟随、白天浅色夜里深色。
6. As a "跟随系统"模式的用户, I want 应用在我切换 OS 主题时立刻反应, so that 我不用每次手动重切。
7. As a 回访用户, I want 上次选择的主题被记住, so that 我不用每次打开都重设。
8. As a 用户, I want 不在菜单里翻找就能找到主题设置, so that 我能快速切换。
9. As a 重度用户, I want 顶栏有一个主题快捷按钮, so that 我不打开设置就能切换。
10. As a 用户, I want 顶栏按钮能一眼看出当前生效主题, so that 我不用点开就知道我在哪个模式。
11. As a 用户, I want 顶栏按钮点开是清晰的三选一菜单, so that 我能直接选我想要的状态、不用猜"再点一下会变啥"。
12. As a 用户, I want 点击菜单外部时关闭菜单, so that 我能流畅继续使用应用。
13. As a 用户, I want 用 Esc 键关闭菜单, so that 我能保持键盘操作习惯。
14. As a 用户, I want 嵌入的高德地图跟随应用主题, so that 不会出现"卡片黑、地图白"的撕裂感。
15. As a 用户, I want 刷新/重新打开应用时永远看不到错误主题的闪屏, so that 体验是连贯的。
16. As a 用户, I want 深色模式感觉是"同一个品牌关了灯", so that 暖感美学被保留、不是冷冰冰的灰黑。
17. As a 从旧版本升级的回访用户, I want 我之前的路线库和旅行偏好被保留, so that 新加的 theme 字段不会清空我的数据。
18. As a 在隐私/无痕模式下使用应用的用户, I want localStorage 不可用时应用仍能正常进入默认(system)模式, so that 主题特性不会让应用崩。
19. As a 阅读这份 spec 的开发者, I want 知道"用户偏好"在 schema 上的精确字段名与取值, so that 我不用猜。
20. As a 用户, I want 切换主题时地图的当前缩放/平移位置不丢失, so that 我不会因为顺手切了深色就丢了我的视图。
21. As a 用户, I want 设置模态里"主题"控件的视觉风格与现有的"出行方式偏好"、"行程节奏倾向"控件保持一致, so that 整个设置页是同一套设计语言、不会突兀。

## Implementation Decisions

### Schema & State

1. **新增字段**：`TravelPreferences` 增加 `theme: ThemePreference` 字段。Type shape（来自原型期决策，比散文更精确）：

   ```ts
   type ThemePreference = "light" | "dark" | "system";
   ```

   `DEFAULT_TRAVEL_PREFERENCES.theme` 默认为 `"system"`。

2. **存储迁移**：`persist` 中间件当前 `version: 1`。为兼容旧数据，bump 到 `version: 2`，新增 `migrate` 函数：当旧 state 缺少 `theme` 字段时补默认值 `"system"`，其它字段（`defaultProtocol`、`pace`）原样保留。路线库数据 (`savedRoutes`) 不在迁移路径上。

3. **不另起 `AppearancePreferences` 接口**：当前只有一个显示类字段（`theme`），起一个 interface 是空壳抽象。**YAGNI**：将来真加字号/密度/主色覆盖时再拆不晚。

### 派生与副作用

4. **解析纯函数**：新增 `resolveTheme(preference, systemPrefersDark): "light" | "dark"`（置于 `lib/`），封装"system → 实际生效"的映射。该函数是**纯函数**，方便单测；React 层只负责"读 store + 听 matchMedia + 把结果喂给 DOM"。

5. **DOM 应用**：新增 hook `useThemeEffect()`，挂载在顶层（`App.tsx`）。行为：
   - 读 `travelPreferences.theme`（订阅 store）
   - 用 `matchMedia("(prefers-color-scheme: dark)").addEventListener("change", ...)` 订阅系统变化
   - 用 `useLayoutEffect` 在浏览器绘制前切换 `<html>` 上的 `.dark` class（避免 paint flicker）
   - 该 hook 是"preference + system state → DOM class"的**唯一出口**

6. **首屏防闪 inline 脚本**：`index.html` `<head>` 内联一段 ~6 行脚本，在任何 React 代码运行前：
   - 读 `localStorage` 里的 `travel-route-library`
   - 解析出 `theme` 字段
   - 用内联的同款 `resolveTheme` 规则计算实际浅/深
   - 给 `<html>` 挂上 `.dark` class

   解决深色用户在页面加载时看到 100~300ms 浅色闪屏的问题。该脚本**不引入新依赖**，纯 vanilla JS。

### Token 与样式

7. **CSS 变量重构**：`index.css` 中：
   - `:root` 块定义浅色 token（值与当前一致）
   - 新增 `:root.dark` 块定义暖感深色 token
   - `:root` 的 `color-scheme: light` 改为跟随主题：`:root { color-scheme: light; } :root.dark { color-scheme: dark; }`（影响浏览器原生控件与滚动条）
   - **不重命名为新 token 名**——同名变量在浅/深作用域内赋不同值，使用侧（`bg-surface` 等）零改动

8. **tailwind.config.ts** 19 个颜色从字面 hex 改为 `var(--token-name)` 引用。Token 列表与变量名一对一映射（`surface` → `--color-surface`，`primary` → `--color-primary`，依此类推）。`boxShadow.float` 等含 rgba 的 shadow 暂不在本次范围（见 Out of Scope）。

9. **暖感深色具体取值原则**（这是 Q6 决策落地点）：
   - 底色：深褐/炭咖（不是纯黑 #000），如 `surface: #1A1714`、`surface-container-low: #221E1A`
   - 文字：暖白（不是冷白），如 `on-surface: #F5F3ED`
   - 主色微提亮：terracotta `#C86D51` 在深底上偏闷，深色版提至 `#E08866` 量级（提亮一档，恢复对比度）
   - 副色：sage teal `#5A9E97` 提至 `#7AB8B0` 量级
   - 容器层级（`surface-container-*`）按暖色阶梯递浅
   - **具体数值在落地时校准对比度**（WCAG AA），但骨架是上面这套

10. **Map follow-through**：`MapView.tsx` 的 useEffect 依赖从 `[itinerary]` 扩为 `[itinerary, resolvedTheme]`。依赖变化时对**现有** map 实例调用 `setMapStyle()`（不销毁、不重建——保留用户的 pan/zoom）。映射表：
    - 浅色 → `amap://styles/whitesmoke`（与现状一致）
    - 深色 → `amap://styles/dark`

    **Marker 与 polyline 不改色**（Q5 决策）：polyline 已是 `#99462a`（深陶土棕）跨浅深都够对比；marker 用 Amap 默认样式，`dark` 地图样式已为默认 marker 调过对比度。改色反而引入"两套 marker 图片"复杂度。

### UI

11. **设置"外观" Tab**：`SettingsModal` 新增第四个 Tab（顺序：`旅行偏好` / `外观` / `数据与存储` / `系统与地图`）。Tab 内**单控件**：三选一 Segmented Control，绑 `travelPreferences.theme`，通过现有 `updatePreferences({ theme: "..." })` 写回。无新 store action。

12. **顶栏快捷按钮**：`TopAppBar` 右上角设置按钮**左边**新增一个图标按钮（Q1-B1 决策）。按钮本体图标显示**当前生效**主题（解析 system 后的结果），点击展开 `ThemeMenu` 弹层。

13. **ThemeMenu 弹层**：新组件 ~50 行：
    - 浮在按钮下方，三行可选项：`浅色`（Sun 图标）/` 深色`（Moon 图标）/`跟随系统`（Monitor 图标）
    - 当前**用户偏好**（不是生效主题）打勾：用户在深色 OS 选了 `system` 但 OS 当前浅色，菜单里 `system` 仍打勾
    - 关闭触发：选中一项后自动关 / 点外部关 / Esc 关
    - 不做循环切换（3 态循环顺序无意义，违反"少即是多"）

14. **图标库**：直接用 `lucide-react` 现成的 `Sun` / `Moon` / `Monitor` 三个图标。**零新依赖**。

## Testing Decisions

**什么算好测试**：只测外部行为——store action 写入什么、持久化什么、纯函数 `resolveTheme` 给定输入返回什么。**不**测：CSS 类名是否正确添加、`<html>` 元素上是否有 `.dark`、DOM 文本节点、Amap 实际地图渲染。UI 组件不写单测，靠 store 测试覆盖状态对不对、手动/截图覆盖"按钮长啥样"。

### 测试 seam

1. **`useAppStore` 主题行为**：在 `useAppStore.test.ts` 新增 `describe("theme preference")` 块，沿用现有姿态——`useAppStore.setState(...)` 改初值，`getState()` 读结果，断言 `updatePreferences` 行为与持久化形态。
2. **`resolveTheme` 纯函数**：新文件 `lib/use-theme.test.ts`（或同目录相邻），覆盖 6 行真值表（3 preference × 2 system 状态）。
3. **不**扩展 `store.selfcheck.ts`（它只针对 ItineraryNode 业务逻辑，与主题无关）。
4. **不**给 `SettingsModal` / `TopAppBar` / `ThemeMenu` 写单测——它们是展示型组件，状态行为已由 store 覆盖。

### Prior art

- `useAppStore.test.ts`：现有 `describe("updateNode")` / `describe("addNode")` 等块就是这套姿势（setState → action → 断言 getState）。
- `lib/distance-hint.test.ts` / `lib/travel-speed.test.ts`：纯函数 + Vitest 真值表的现成范式。

## Out of Scope

- **自定义主色/Accent 覆盖**（"让我换个陶土橙"）：留给未来 `AppearancePreferences` 时代。
- **密度切换**（紧凑 / 舒适）：同上。
- **字号缩放**（无障碍）：同上。
- **高对比度/纯黑模式**：与品牌调性冲突，且目前没有用户提出。
- **按路线记忆主题**（"规划时浅色、出行时深色"）：单用户单偏好的简单模型优先。
- **快捷键**（`Ctrl+Shift+L` 循环切）：顶栏按钮 + 设置入口已足够；快捷键作为后续锦上添花。
- **主题切换的淡入淡出动画**：当前是 class 切换瞬时生效。动画是 nice-to-have；可未来加 `transition: background-color 200ms` 在所有 surface 上，但本次不做。
- **`boxShadow` / `boxShadow.float` 等含 rgba 的 shadow 同步深色化**：这些 token 当前是单色值；如果深色模式下阴影颜色不需要变（甚至更不显眼），本 PR 不动。如要适配，留给后续 polish PR。
- **PWA `manifest.theme_color`** 同步深色：当前 manifest 没声明 theme_color，本次不动。
- **iOS safe-area / status bar 颜色**：与主题解耦，独立小任务。

## Further Notes

- **Q6 决策（暖感深色 vs 中性深色）需要一份 ADR**——它影响 19+ 个 token，是真正难反转的选型。`docs/adr/0001-warm-dark-theme.md` 会在 spec 发布后单独起草。
- **YAGNI 注脚**：不抽 `AppearancePreferences` 是显式选择；待显示偏好扩到 ≥2 个字段时再拆。`TravelPreferences` 内部加 `theme` 是当前最简的修。
- **`prefers-color-scheme: dark` 的内联脚本是项目首个 vanilla JS inline 脚本**，引入了"`<head>` 内联代码读 localStorage"的模式。如果未来还需要做类似的"早绑定"优化（比如 `manifest.theme_color` 动态化），可以复用这个模板。
