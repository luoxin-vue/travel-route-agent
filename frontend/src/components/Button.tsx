import type { ButtonHTMLAttributes, ReactNode } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  children: ReactNode;
}

/** DESIGN.md：Primary 深炭底/米字，Secondary 描边，圆角 4px。 */
export function Button({ variant = "primary", className = "", children, ...rest }: Props) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded px-4 py-2 text-code-md font-mono transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";
  const styles = {
    primary: "bg-ink text-surface hover:bg-ink/90",
    secondary: "border border-ink text-ink hover:bg-surface-container",
    ghost: "text-on-surface-variant hover:bg-surface-container",
  }[variant];
  return (
    <button className={`${base} ${styles} ${className}`} {...rest}>
      {children}
    </button>
  );
}

/** CLI 风格的小动作按钮：[编辑] [标记] [入住] */
export function CommandButton({ children, className = "", ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      className={`font-mono text-label-sm text-on-surface-variant hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-0.5 ${className}`}
      {...rest}
    >
      [{children}]
    </button>
  );
}
