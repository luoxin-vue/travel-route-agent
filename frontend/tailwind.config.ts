import type { Config } from "tailwindcss";

/** 颜色 / 字体 / 圆角 / 间距映射自 DESIGN.md（Warm Linen & Terracotta 暖感生活空气感）。 */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "var(--color-surface)",
        "surface-dim": "var(--color-surface-dim)",
        "surface-container-lowest": "var(--color-surface-container-lowest)",
        "surface-container-low": "var(--color-surface-container-low)",
        "surface-container": "var(--color-surface-container)",
        "surface-container-high": "var(--color-surface-container-high)",
        "surface-container-highest": "var(--color-surface-container-highest)",
        "on-surface": "var(--color-on-surface)",
        "on-surface-variant": "var(--color-on-surface-variant)",
        outline: "var(--color-outline)",
        "outline-variant": "var(--color-outline-variant)",
        primary: "var(--color-primary)",
        "primary-container": "var(--color-primary-container)",
        "on-primary": "var(--color-on-primary)",
        secondary: "var(--color-secondary)",
        "secondary-container": "var(--color-secondary-container)",
        error: "var(--color-error)",
        ink: "var(--color-ink)",
        "card-border": "var(--color-card-border)",
        teal: "var(--color-teal)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      fontSize: {
        "headline-lg": ["28px", { lineHeight: "36px", letterSpacing: "-0.01em", fontWeight: "600" }],
        "headline-md": ["20px", { lineHeight: "28px", fontWeight: "600" }],
        "body-md": ["15px", { lineHeight: "24px" }],
        "code-md": ["14px", { lineHeight: "20px", fontWeight: "500" }],
        "label-sm": ["12px", { lineHeight: "16px", fontWeight: "500" }],
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        sm: "0.375rem",
        md: "0.75rem",
        lg: "1rem",
        xl: "1.5rem",
        "2xl": "2rem",
      },
      boxShadow: {
        float: "0px 4px 20px -2px rgba(0,0,0,0.04), 0px 2px 6px -1px rgba(0,0,0,0.02)",
        soft: "0px 2px 10px rgba(0,0,0,0.03)",
        card: "0px 4px 16px rgba(0,0,0,0.03)",
      },
    },
  },
  plugins: [],
} satisfies Config;

