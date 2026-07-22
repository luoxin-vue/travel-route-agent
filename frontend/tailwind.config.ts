import type { Config } from "tailwindcss";

/** 颜色 / 字体 / 圆角 / 间距映射自 DESIGN.md（Warm Linen & Terracotta 暖感生活空气感）。 */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#FAF9F6",
        "surface-dim": "#F3F0EA",
        "surface-container-lowest": "#FFFFFF",
        "surface-container-low": "#F5F3ED",
        "surface-container": "#EAE7E1",
        "surface-container-high": "#E2DDD4",
        "surface-container-highest": "#D8D1C5",
        "on-surface": "#2C3036",
        "on-surface-variant": "#646E7B",
        outline: "#D6CFB9",
        "outline-variant": "#EAE7E1",
        primary: "#C86D51",
        "primary-container": "#FCEBE6",
        "on-primary": "#FFFFFF",
        secondary: "#5A9E97",
        "secondary-container": "#E6F3F1",
        error: "#DC2626",
        ink: "#2C3036",
        "card-border": "#EAE7E1",
        teal: "#5A9E97",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["Inter", "system-ui", "sans-serif"], // 全面弃用 JetBrains Mono，统一保持高易读无衬线
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

