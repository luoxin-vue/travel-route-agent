import { Check, Loader2 } from "lucide-react";
import type { ThinkingStep } from "../../types";
import { toolLabel } from "../../lib/labels";

/** 思考/行动过程：把 Agent 的工具调用实时显示为步骤，缓解等待时的「卡住感」。 */
export function ThinkingSteps({ steps }: { steps: ThinkingStep[] }) {
  if (steps.length === 0) return null;

  return (
    <div className="mb-2 rounded-md border border-card-border bg-surface-container-low p-2">
      <p className="mb-1.5 font-mono text-label-sm text-on-surface-variant">思考过程</p>
      <ol className="space-y-1">
        {steps.map((s) => (
          <li key={s.id} className="flex items-center gap-2 font-mono text-label-sm">
            {s.status === "done" ? (
              <Check size={12} className="shrink-0 text-secondary" />
            ) : (
              <Loader2 size={12} className="shrink-0 animate-spin text-primary" />
            )}
            <span className={s.status === "done" ? "text-on-surface-variant" : "text-ink"}>
              {toolLabel(s.tool)}
              {s.detail ? <span className="text-on-surface-variant">：{s.detail}</span> : null}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
