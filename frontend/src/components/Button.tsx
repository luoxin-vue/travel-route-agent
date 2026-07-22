import type { ButtonHTMLAttributes, ReactNode } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  children: ReactNode;
}

/** Warm Linen & Terracotta 美学：Primary 陶土暖橘，Secondary 轻柔描边，圆角 9999px。 */
export function Button({ variant = "primary", className = "", children, ...rest }: Props) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 text-[14px] font-medium transition-all shadow-soft disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
  const styles = {
    primary: "bg-primary text-on-primary hover:opacity-95 active:scale-98",
    secondary: "border border-card-border bg-surface-container-lowest text-ink hover:bg-surface-container-low",
    ghost: "text-on-surface-variant hover:bg-surface-container-low hover:text-ink",
  }[variant];
  return (
    <button className={`${base} ${styles} ${className}`} {...rest}>
      {children}
    </button>
  );
}

/** 生活感轻柔动作 Pill 按钮。 */
export function CommandButton({ children, className = "", ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      className={`rounded-full border border-card-border bg-surface-container-low/70 px-3 py-1 text-[12px] font-medium text-on-surface-variant hover:border-primary/50 hover:bg-primary-container/40 hover:text-primary transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

