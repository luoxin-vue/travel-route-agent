import { Terminal, Settings } from "lucide-react";

/** 极简顶栏：左侧品牌 + 系统标识，右侧设置图标。 */
export function TopAppBar() {
  return (
    <header className="flex items-center justify-between border-b border-card-border bg-surface px-4 py-3">
      <div className="flex items-center gap-2">
        <Terminal size={18} className="text-primary-container" />
        <span className="font-mono text-code-md font-semibold tracking-tight text-ink">路线规划系统</span>
        <span className="mono text-label-sm text-on-surface-variant">v0.1</span>
      </div>
      <button className="flex h-8 w-8 items-center justify-center rounded hover:bg-surface-container" aria-label="设置" title="设置">
        <Settings size={16} className="text-on-surface-variant" />
      </button>
    </header>
  );
}
