import { Sparkles, ChevronDown } from "lucide-react";

/** 深度思考：展示推理模型的思维链，以暖风微卡片形式呈现。 */
export function ReasoningBlock({ text, active }: { text: string; active: boolean }) {
  if (!text) return null;
  return (
    <details open={active} className="group mb-3 rounded-xl border border-card-border bg-surface-container-low/60 transition-colors">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3.5 py-2.5 text-[13px] font-medium text-on-surface-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl">
        <Sparkles size={14} className="text-primary" />
        <span>管家深度分析{active ? "（分析中…）" : ""}</span>
        <ChevronDown size={14} className="ml-auto text-on-surface-variant/60 transition-transform group-open:rotate-180" />
      </summary>
      <div className="max-h-52 overflow-y-auto whitespace-pre-wrap px-4 pb-3 pt-1 text-[13px] leading-relaxed text-on-surface-variant airy-scroll">
        {text}
      </div>
    </details>
  );
}

