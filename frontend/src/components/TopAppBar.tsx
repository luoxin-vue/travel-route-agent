import { useState } from "react";
import { Compass, Monitor, Moon, Settings, Sun } from "lucide-react";
import { SettingsModal } from "./SettingsModal";
import { ThemeMenu } from "./ThemeMenu";
import { useResolvedTheme } from "../lib/use-theme";

/** 随心旅行管家顶栏：优雅指南针品牌 + 生活感温润顶栏。 */
export function TopAppBar() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const resolvedTheme = useResolvedTheme();

  const ThemeIcon = resolvedTheme === "dark" ? Moon : resolvedTheme === "light" ? Sun : Monitor;

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
          <div className="relative">
            <button
              onClick={() => setIsThemeMenuOpen((open) => !open)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="切换主题外观"
              aria-haspopup="menu"
              aria-expanded={isThemeMenuOpen}
              title="主题外观"
            >
              <ThemeIcon size={17} />
            </button>
            <ThemeMenu isOpen={isThemeMenuOpen} onClose={() => setIsThemeMenuOpen(false)} />
          </div>
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
