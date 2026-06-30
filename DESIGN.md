---
name: Anthesis Travel Logic
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e4e2e1'
  on-surface: '#1b1c1c'
  on-surface-variant: '#55433d'
  inverse-surface: '#303030'
  inverse-on-surface: '#f3f0f0'
  outline: '#88726c'
  outline-variant: '#dbc1b9'
  surface-tint: '#99462a'
  primary: '#99462a'
  on-primary: '#ffffff'
  primary-container: '#d97757'
  on-primary-container: '#541400'
  inverse-primary: '#ffb59e'
  secondary: '#276868'
  on-secondary: '#ffffff'
  secondary-container: '#acebeb'
  on-secondary-container: '#2c6c6c'
  tertiary: '#5f5f58'
  on-tertiary: '#ffffff'
  tertiary-container: '#94928a'
  on-tertiary-container: '#2b2b26'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbd0'
  primary-fixed-dim: '#ffb59e'
  on-primary-fixed: '#390b00'
  on-primary-fixed-variant: '#7a2f15'
  secondary-fixed: '#afeeed'
  secondary-fixed-dim: '#93d2d1'
  on-secondary-fixed: '#002020'
  on-secondary-fixed-variant: '#004f50'
  tertiary-fixed: '#e5e2da'
  tertiary-fixed-dim: '#c9c6be'
  on-tertiary-fixed: '#1c1c17'
  on-tertiary-fixed-variant: '#474741'
  background: '#fcf9f8'
  on-background: '#1b1c1c'
  surface-variant: '#e4e2e1'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  unit-1: 4px
  unit-2: 8px
  unit-4: 16px
  unit-6: 24px
  unit-8: 32px
  unit-12: 48px
  container-max: 1280px
  gutter: 16px
---

## Brand & Style

The design system is built on a "Terminal-Luxe" aesthetic: it combines the utility and precision of a developer tool with the warmth and comfort of a high-end travel concierge. The target audience is the "technical traveler"—users who value data density, logical flow, and efficiency without sacrificing the tactile pleasure of a well-designed interface.

The visual style is a hybrid of **Minimalism** and **Modern Corporate**, utilizing heavy whitespace to reduce cognitive load during complex trip planning. It borrows the utilitarian clarity of a CLI (Command Line Interface) through monospaced accents and structured data, while grounding the experience in a sophisticated, paper-like physical presence. The emotional response is one of calm authority and intellectual precision.

## Colors

The palette is centered around a warm, parchment-inspired background to reduce eye strain during long planning sessions. 

- **Primary (#D97757):** A muted orange used sparingly for critical actions, destination highlights, and warnings.
- **Secondary (#4D8B8B):** A soft teal used for logistical success states, route paths, and secondary interactive elements.
- **Background (#F5F2E9):** The "Claude-beige" core, providing a soft, high-legibility canvas.
- **Surface (#FFFFFF):** Pure white is reserved for high-level cards and active input fields to create a subtle layered effect.
- **Ink (#2C2C2C):** A deep charcoal for all primary text, ensuring maximum contrast without the harshness of pure black.

## Typography

This design system employs a functional pairing: **Inter** handles the structural UI and narrative content for its exceptional legibility, while **JetBrains Mono** is used for "Data Objects"—coordinates, times, flight numbers, and terminal-style inputs.

- **Headlines:** Use Inter with tighter letter-spacing to feel modern and authoritative.
- **Data/Metadata:** Use JetBrains Mono for anything that represents a "variable" in the user's travel itinerary.
- **Weights:** Keep weights medium to semi-bold. Avoid "Black" or "Extra Bold" weights to maintain the minimalist, lightweight feel.

## Layout & Spacing

The layout follows a **Fluid Grid** logic with strict mathematical gutters. 

- **Desktop:** A 12-column grid with wide 24px gutters. Content is typically grouped into cards that span 4 columns (for sidebars/details) or 8 columns (for maps/timelines).
- **Mobile:** A single-column flow with 16px side margins. Horizontal scrolling "ribbons" are used for quick-access categorical data (e.g., daily stops).
- **Rhythm:** All margins and paddings must be multiples of the 4px base unit. Internal card padding is consistently 24px (unit-6) to emphasize the minimalist space.

## Elevation & Depth

Depth in the design system is achieved through **Tonal Layers** and **Low-Contrast Outlines** rather than heavy shadows. 

1. **Level 0 (Base):** The #F5F2E9 background.
2. **Level 1 (Cards/Panels):** White (#FFFFFF) surfaces with a 1px solid border in a slightly darker beige (#E5E2D9).
3. **Level 2 (Interactive/Floating):** Use a very soft, diffused shadow (0px 4px 12px rgba(0,0,0,0.05)) to indicate elements that can be dragged or popped over the UI, such as a route detail modal.

Avoid gradients. Depth should feel like stacked sheets of premium paper.

## Shapes

The shape language is "Architectural." We use a **Soft (0.25rem)** base roundedness to take the edge off the brutalist structure without appearing "bubbly" or overly consumer-focused. 

- **Standard Elements:** 4px radius (inputs, buttons).
- **Large Containers:** 8px radius (trip cards, map overlays).
- **Status Pills:** Fully rounded (pill-shaped) for high-contrast visibility against the otherwise rectangular grid.

## Components

### Buttons
- **Primary:** Background #2C2C2C, Text #F5F2E9. High contrast, no border.
- **Secondary:** Transparent background, 1px border #2C2C2C.
- **Icon Buttons:** Square 40x40px with a subtle hover state (background #EDEAE2).

### Input Fields
- **Terminal Style:** Background #FFFFFF, 1px border #E5E2D9. On focus, the border changes to #4D8B8B. Use JetBrains Mono for the input text.
- **Labels:** Always use `label-sm` (JetBrains Mono) placed strictly above the field.

### Cards
- White background, 1px border, no shadow by default. 
- Use a 4px primary-colored top-border to indicate "Active" or "Currently Viewing" trips.

### Route Timeline
- A vertical dotted line using #2C2C2C.
- Nodes are represented by 8px circles. Empty circles for stops, filled for overnight stays.

### Chips/Badges
- Small, uppercase JetBrains Mono text.
- Muted teal or orange backgrounds at 10% opacity with 100% opacity text of the same color.