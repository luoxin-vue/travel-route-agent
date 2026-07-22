---
name: Warm Linen & Terracotta Travel Logic
colors:
  surface: '#FAF9F6'
  surface-dim: '#F3F0EA'
  surface-bright: '#FAF9F6'
  surface-container-lowest: '#FFFFFF'
  surface-container-low: '#F5F3ED'
  surface-container: '#EAE7E1'
  surface-container-high: '#E2DDD4'
  surface-container-highest: '#D8D1C5'
  on-surface: '#2C3036'
  on-surface-variant: '#646E7B'
  inverse-surface: '#2C3036'
  inverse-on-surface: '#FAF9F6'
  outline: '#D6CFB9'
  outline-variant: '#EAE7E1'
  surface-tint: '#C86D51'
  primary: '#C86D51'
  on-primary: '#FFFFFF'
  primary-container: '#FCEBE6'
  on-primary-container: '#7C321C'
  secondary: '#5A9E97'
  on-secondary: '#FFFFFF'
  secondary-container: '#E6F3F1'
  on-secondary-container: '#24524D'
  background: '#FAF9F6'
  on-background: '#2C3036'
  ink: '#2C3036'
typography:
  headline-lg:
    fontFamily: Inter, sans-serif
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  headline-md:
    fontFamily: Inter, sans-serif
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-md:
    fontFamily: Inter, sans-serif
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: Inter, sans-serif
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.375rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
---

## Brand & Style

设计系统建立在 **"Warm Linen & Terracotta"（棉麻微暖与大地陶土）** 的生活空气感设计美学上：它融合了私人度假旅行管家的温润贴心与 Modern Minimalist 的干净无瑕。

视觉语言强调：大面积柔和留白、温暖棉麻白背景（#FAF9F6）、16px/24px 大圆角悬浮卡片、柔和微阴影、舒展的人文无衬线字体排版，彻底脱离了刻板、冷硬的 CLI/终端黑客界面感。

## Colors

- **Primary (#C86D51):** 温暖大气的陶土暖橘，用于关键行动按钮、选定路线节点与核心状态。
- **Secondary (#5A9E97):** 静谧自然的鼠尾草蓝绿，用于成功行程节点、连接线与次要交互。
- **Background (#FAF9F6):** 棉麻底色，给眼睛带来极为温馨舒适的呼吸感。
- **Surface (#FFFFFF):** 纯白悬浮卡片，配合 1px 轻柔描边（#EAE7E1）与柔和漫反射阴影。
- **Ink (#2C3036):** 深石板灰，用于所有主体文字，保证高易读性的同时避免纯黑的刺眼硬感。

## Typography

全面采用 **Inter** / 系统人文无衬线字体。弃用 JetBrains Mono 等硬核代码字体。
所有时间、价格、天数数字采用标准无衬线字体结合 `tabular-nums` 等距渲染，展现优雅工整的艺术感。

## Elevation & Depth

1. **Level 0 (Base):** #FAF9F6 棉麻白背景。
2. **Level 1 (Cards):** #FFFFFF 卡片，带 1px #EAE7E1 柔边框与 0 4px 20px -2px rgba(0, 0, 0, 0.03) 悬浮微阴影。
3. **Level 2 (Pills/Floating Controls):** 圆角胶囊组件（9999px）与底栏，赋予通透优雅层级。