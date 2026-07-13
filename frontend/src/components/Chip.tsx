import type { ReactNode } from "react";

type Tone = "teal" | "orange";

/** DESIGN.md：小号大写 mono 文本，10% 底色 + 100% 同色文字，pill 形。 */
export function Chip({ tone = "teal", children }: { tone?: Tone; children: ReactNode }) {
  const styles =
    tone === "teal"
      ? "bg-teal/10 text-secondary"
      : "bg-primary/10 text-primary";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-label-sm uppercase ${styles}`}>
      {children}
    </span>
  );
}
