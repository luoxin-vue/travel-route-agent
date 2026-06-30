import type { Config } from "tailwindcss";

/** 颜色 / 字体 / 圆角 / 间距全部映射自 DESIGN.md（Anthesis Travel Logic）。 */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#fcf9f8",
        "surface-dim": "#dcd9d9",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f6f3f2",
        "surface-container": "#f0eded",
        "surface-container-high": "#eae7e7",
        "surface-container-highest": "#e4e2e1",
        "on-surface": "#1b1c1c",
        "on-surface-variant": "#55433d",
        outline: "#88726c",
        "outline-variant": "#dbc1b9",
        primary: "#99462a",
        "primary-container": "#d97757",
        "on-primary": "#ffffff",
        secondary: "#276868",
        "secondary-container": "#acebeb",
        error: "#ba1a1a",
        // DESIGN.md「Components」节用到的实用别名
        ink: "#2c2c2c",
        "card-border": "#e5e2d9",
        teal: "#4d8b8b",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      fontSize: {
        "headline-lg": ["32px", { lineHeight: "40px", letterSpacing: "-0.02em", fontWeight: "600" }],
        "headline-md": ["20px", { lineHeight: "28px", fontWeight: "500" }],
        "body-md": ["16px", { lineHeight: "24px" }],
        "code-md": ["14px", { lineHeight: "20px", fontWeight: "500" }],
        "label-sm": ["12px", { lineHeight: "16px", fontWeight: "600" }],
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        sm: "0.125rem",
        md: "0.375rem",
        lg: "0.5rem",
        xl: "0.75rem",
      },
      boxShadow: {
        float: "0px 4px 12px rgba(0,0,0,0.05)",
      },
    },
  },
  plugins: [],
} satisfies Config;
