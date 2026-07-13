import { Brain } from "lucide-react";

/** 深度思考：展示推理模型（deepseek-reasoner）的思维链，浅灰等宽、可折叠。 */
export function ReasoningBlock({ text, active }: { text: string; active: boolean }) {
  if (!text) return null;
  return (
    <details open={active} className="group mb-2 rounded-md border border-card-border bg-surface-container-low">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 px-2 py-1 font-mono text-label-sm text-on-surface-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 rounded">
        <Brain size={12} className="text-primary" />
        深度思考{active ? "（进行中…）" : ""}
        <span className="ml-auto text-outline group-open:hidden">展开</span>
        <span className="ml-auto hidden text-outline group-open:inline">收起</span>
      </summary>
      <div className="max-h-48 overflow-y-auto whitespace-pre-wrap px-3 pb-2 font-mono text-label-sm leading-relaxed text-on-surface-variant">
        {text}
      </div>
    </details>
  );
}
