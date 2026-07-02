import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { EmptyState } from "../../components/EmptyState";
import { RouteCard } from "./RouteCard";

type Filter = "all" | "planned" | "completed" | "favorite";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "planned", label: "已计划" },
  { key: "completed", label: "已完成" },
  { key: "favorite", label: "收藏" },
];

/** 路线库：AI 生成的行程自动入库（localStorage 持久），支持搜索/筛选/收藏/删除。 */
export function LibraryView() {
  const savedRoutes = useAppStore((s) => s.savedRoutes);
  const setTab = useAppStore((s) => s.setTab);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const visible = savedRoutes.filter((r) => {
    if (filter === "planned" && r.status !== "planned") return false;
    if (filter === "completed" && r.status !== "completed") return false;
    if (filter === "favorite" && !r.favorite) return false;
    if (!q) return true;
    return (
      r.itinerary.title.toLowerCase().includes(q) ||
      r.itinerary.nodes.some((n) => n.name.toLowerCase().includes(q))
    );
  });

  const newJourneyCard = (
    <button
      onClick={() => setTab("chat")}
      className="group flex min-h-[16rem] flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-outline-variant text-on-surface-variant transition-colors hover:border-primary-container hover:text-primary-container"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full border border-outline-variant transition-colors group-hover:border-primary-container">
        <Plus size={20} />
      </span>
      <span className="font-mono text-label-sm">开启新旅程</span>
    </button>
  );

  return (
    <div className="terminal-scroll h-full overflow-y-auto px-4 pb-8 pt-6">
      <h1 className="text-headline-lg text-ink">我的路线库</h1>
      <p className="mt-1 text-body-md text-on-surface-variant">
        回顾您的足迹，策划下一次探险。
      </p>

      {savedRoutes.length === 0 ? (
        <>
          <div className="h-56">
            <EmptyState
              title="路线库为空"
              hint="在会话中让 Agent 生成行程，将自动保存到这里。"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{newJourneyCard}</div>
        </>
      ) : (
        <>
          <div className="relative mt-4">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索路线或地点…"
              className="w-full rounded-full border border-outline-variant bg-surface-container-lowest py-2 pl-9 pr-4 text-body-md text-ink outline-none transition-colors placeholder:text-on-surface-variant/40 focus:border-primary-container"
            />
          </div>

          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
            {FILTERS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`shrink-0 rounded-full px-3 py-1.5 font-mono text-label-sm transition-colors ${
                  filter === key
                    ? "bg-primary-container text-on-primary"
                    : "border border-outline-variant text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {visible.length === 0 && (
            <p className="mt-4 font-mono text-label-sm text-on-surface-variant">
              没有匹配的路线
            </p>
          )}

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {visible.map((r) => (
              <RouteCard key={r.id} route={r} />
            ))}
            {newJourneyCard}
          </div>
        </>
      )}
    </div>
  );
}
