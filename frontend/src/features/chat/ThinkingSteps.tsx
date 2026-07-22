import { Check, Loader2, Compass } from "lucide-react";
import type { ThinkingStep } from "../../types";
import { toolLabel } from "../../lib/labels";

/** 思考/行动过程：把 Agent 的工具调用实时显示为高易读步骤。 */
export function ThinkingSteps({ steps }: { steps: ThinkingStep[] }) {
  if (steps.length === 0) return null;

  return (
    <div className="mb-3 rounded-xl border border-card-border/70 bg-surface-container-low/50 p-3">
      <div className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold text-on-surface-variant">
        <Compass size={13} className="text-secondary" />
        <span>路线规划执行步骤</span>
      </div>
      <ol className="space-y-1.5">
        {steps.map((stepItem) => (
          <li key={stepItem.id} className="flex items-center gap-2 text-[13px]">
            {stepItem.status === "done" ? (
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-secondary">
                <Check size={11} className="stroke-[2.5]" />
              </span>
            ) : (
              <Loader2 size={13} className="shrink-0 animate-spin text-primary" />
            )}
            <span className={stepItem.status === "done" ? "text-on-surface-variant" : "font-medium text-ink"}>
              {toolLabel(stepItem.tool)}
              {stepItem.detail ? <span className="text-on-surface-variant/80 font-normal"> · {stepItem.detail}</span> : null}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

