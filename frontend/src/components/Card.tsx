import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  active?: boolean;
  className?: string;
}

/** DESIGN.md：白底 1px 米色边、无默认阴影；active 时顶部 4px 主色条。 */
export function Card({ children, active = false, className = "" }: Props) {
  return (
    <div
      className={`rounded-lg border border-card-border bg-surface-container-lowest ${
        active ? "border-t-4 border-t-primary-container" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
