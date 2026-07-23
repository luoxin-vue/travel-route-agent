import { useState } from "react";
import { Check, Loader2, Compass, ChevronDown, ChevronRight } from "lucide-react";
import type { ThinkingStep } from "../../types";
import { toolLabel } from "../../lib/labels";

interface StepGroup {
  type: "single" | "pair";
  steps: ThinkingStep[];
}

function groupSteps(steps: ThinkingStep[]): StepGroup[] {
  const groups: StepGroup[] = [];
  let i = 0;
  while (i < steps.length) {
    const current = steps[i];
    const next = steps[i + 1];
    if (
      current.tool === "maps_text_search" &&
      next?.tool === "maps_search_detail"
    ) {
      groups.push({ type: "pair", steps: [current, next] });
      i += 2;
    } else {
      groups.push({ type: "single", steps: [current] });
      i += 1;
    }
  }
  return groups;
}

export function ThinkingSteps({ steps }: { steps: ThinkingStep[] }) {
  const [isExpanded, setExpanded] = useState(false);
  if (steps.length === 0) return null;

  const runningSteps = steps.filter((s) => s.status === "running");
  const doneSteps = steps.filter((s) => s.status === "done");

  return (
    <div className="mb-3 rounded-xl border border-card-border bg-surface-container-low/50 p-3 overflow-hidden">
      <div className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold text-on-surface-variant">
        <Compass size={13} className="text-secondary" />
        <span>路线规划执行步骤</span>
      </div>
      <ol className="space-y-1.5">
        {runningSteps.map((step) => (
          <li key={step.id} className="flex items-start gap-2 text-[13px] min-w-0">
            <Loader2 size={13} className="shrink-0 animate-spin text-primary mt-0.5" />
            <span className="font-medium text-ink break-words min-w-0">
              {toolLabel(step.tool)}
              {step.detail ? <span className="text-on-surface-variant/80 font-normal"> · {step.detail}</span> : null}
            </span>
          </li>
        ))}
      </ol>
      {doneSteps.length > 0 && (
        <>
          <button
            onClick={() => setExpanded(!isExpanded)}
            className="mt-1.5 flex items-center gap-1.5 text-[12px] text-on-surface-variant/70 hover:text-ink transition-colors"
          >
            {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            已完成 {doneSteps.length} 步
          </button>
          {isExpanded && (
            <ol className="mt-1.5 space-y-1.5">
              {groupSteps(doneSteps).map((group) =>
                group.type === "pair" ? (
                  <li key={group.steps[0].id} className="flex items-start gap-2 text-[13px] min-w-0">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-secondary mt-0.5">
                      <Check size={11} className="stroke-[2.5]" />
                    </span>
                    <span className="text-on-surface-variant break-words min-w-0">
                      {toolLabel(group.steps[0].tool)} + {toolLabel(group.steps[1].tool)}
                      {group.steps[0].detail ? <span className="text-on-surface-variant/80 font-normal"> · {group.steps[0].detail}</span> : null}
                    </span>
                  </li>
                ) : (
                  <li key={group.steps[0].id} className="flex items-start gap-2 text-[13px] min-w-0">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-secondary mt-0.5">
                      <Check size={11} className="stroke-[2.5]" />
                    </span>
                    <span className="text-on-surface-variant break-words min-w-0">
                      {toolLabel(group.steps[0].tool)}
                      {group.steps[0].detail ? <span className="text-on-surface-variant/80 font-normal"> · {group.steps[0].detail}</span> : null}
                    </span>
                  </li>
                ),
              )}
            </ol>
          )}
        </>
      )}
    </div>
  );
}
