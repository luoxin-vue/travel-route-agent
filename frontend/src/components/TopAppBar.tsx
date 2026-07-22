import { Compass, Settings } from "lucide-react";

/** 随心旅行管家顶栏：优雅指南针品牌 + 生活感温润顶栏。 */
export function TopAppBar() {
  return (
    <header className="flex items-center justify-between border-b border-card-border/60 bg-surface/90 backdrop-blur px-5 py-3.5 transition-colors">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-container/70 text-primary shadow-soft">
          <Compass size={18} />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-body-md font-semibold tracking-tight text-ink">Concierge</span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">随心行程</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="设置"
          title="设置"
        >
          <Settings size={17} />
        </button>
      </div>
    </header>
  );
}


