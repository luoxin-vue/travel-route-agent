import { MessageCircle, CalendarRange, MapPin, Bookmark } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import type { Tab } from "../types";

const items: { tab: Tab; label: string; icon: typeof MapPin }[] = [
  { tab: "chat", label: "灵感对话", icon: MessageCircle },
  { tab: "plan", label: "行程计划", icon: CalendarRange },
  { tab: "map", label: "路线地图", icon: MapPin },
  { tab: "library", label: "收藏路线", icon: Bookmark },
];

/** 底部导航：空气感外挂软悬浮胶囊切片。 */
export function BottomNavBar() {
  const tab = useAppStore((s) => s.tab);
  const setTab = useAppStore((s) => s.setTab);
  return (
    <div className="bg-surface px-4 pb-3 pt-1">
      <nav className="mx-auto flex max-w-lg items-center justify-around rounded-full border border-card-border/80 bg-surface-container-lowest/90 px-3 py-1.5 shadow-float backdrop-blur">
        {items.map(({ tab: t, label, icon: Icon }) => {
          const active = tab === t;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center gap-0.5 px-3.5 py-1 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full ${
                active
                  ? "bg-primary-container/70 text-primary font-medium shadow-soft"
                  : "text-on-surface-variant hover:text-ink hover:bg-surface-container-low"
              }`}
            >
              <Icon size={18} className={active ? "stroke-[2.25px]" : "stroke-[1.75px]"} />
              <span className="text-[11px] tracking-tight">{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}


