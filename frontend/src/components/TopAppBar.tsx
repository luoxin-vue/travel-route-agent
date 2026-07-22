import { useState } from "react";
import { Compass, Settings } from "lucide-react";
import { SettingsModal } from "./SettingsModal";

/** 随心旅行管家顶栏：优雅指南针品牌 + 生活感温润顶栏。 */
export function TopAppBar() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <>
      <header className="flex items-center justify-between border-b border-card-border/60 bg-surface/90 backdrop-blur px-5 py-3.5 transition-colors">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-container/70 text-primary shadow-soft">
            <Compass size={18} />
          </div>
          <span className="text-[16px] font-semibold tracking-tight text-ink">Concierge · 随心行程</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="设置"
            title="设置"
          >
            <Settings size={17} />
          </button>
        </div>
      </header>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}



