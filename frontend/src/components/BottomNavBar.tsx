import { MessageSquare, ListTree, Map, Route } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import type { Tab } from "../types";

const items: { tab: Tab; label: string; icon: typeof Map }[] = [
  { tab: "chat", label: "会话", icon: MessageSquare },
  { tab: "plan", label: "计划", icon: ListTree },
  { tab: "map", label: "地图", icon: Map },
  { tab: "library", label: "路线库", icon: Route },
];

/** 底部导航：会话 / 计划 / 地图 / 路线库。 */
export function BottomNavBar() {
  const tab = useAppStore((s) => s.tab);
  const setTab = useAppStore((s) => s.setTab);
  return (
    <nav className="flex items-stretch border-t border-card-border bg-surface">
      {items.map(({ tab: t, label, icon: Icon }) => {
        const active = tab === t;
        return (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex flex-1 flex-col items-center gap-1 py-2 transition-colors ${
              active ? "text-primary-container" : "text-on-surface-variant hover:text-ink"
            }`}
          >
            <Icon size={20} />
            <span className="font-mono text-label-sm">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
