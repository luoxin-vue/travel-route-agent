import { MessageCircle, CalendarRange, MapPin, Bookmark } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import type { Tab } from "../types";

const items: { tab: Tab; label: string; icon: typeof MapPin }[] = [
  { tab: "chat", label: "灵感对话", icon: MessageCircle },
  { tab: "plan", label: "行程计划", icon: CalendarRange },
  { tab: "map", label: "路线地图", icon: MapPin },
  { tab: "library", label: "收藏路线", icon: Bookmark },
];

/** 底部导航：空气感微浮调导航栏。 */
export function BottomNavBar() {
  const tab = useAppStore((s) => s.tab);
  const setTab = useAppStore((s) => s.setTab);
  return (
    <nav className="flex items-center justify-around border-t border-card-border/80 bg-surface/95 px-3 py-2 backdrop-blur">
      {items.map(({ tab: t, label, icon: Icon }) => {
        const active = tab === t;
        return (
          <button
            key={t}
            onClick={() => setTab(t)}
            aria-current={active ? "page" : undefined}
            className={`flex flex-col items-center gap-1 px-4 py-1.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full ${
              active
                ? "bg-primary-container/60 text-primary font-medium shadow-soft"
                : "text-on-surface-variant hover:text-ink hover:bg-surface-container-low"
            }`}
          >
            <Icon size={19} className={active ? "stroke-[2.25px]" : "stroke-[1.75px]"} />
            <span className="text-[12px] tracking-tight">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

