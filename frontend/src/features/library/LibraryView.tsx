import { useState } from "react";
import { Plus, Search, Sparkles } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { EmptyState } from "../../components/EmptyState";
import { RouteCard } from "./RouteCard";

type Filter = "all" | "planned" | "completed" | "favorite";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "planned", label: "行程中" },
  { key: "completed", label: "已完成" },
  { key: "favorite", label: "我的收藏" },
];

/** 路线库：AI 生成的行程自动入库，支持搜索与列表卡片管理。 */
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
      className="group flex min-h-[16rem] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-card-border bg-surface-container-low/30 text-on-surface-variant transition-all hover:border-primary/60 hover:bg-surface-container-low hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-container text-primary transition-transform group-hover:scale-110">
        <Plus size={22} />
      </span>
      <span className="text-[14px] font-medium">开启新灵感旅程</span>
    </button>
  );

  return (
    <div className="airy-scroll h-full overflow-y-auto px-4 pb-8 pt-6">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles size={20} className="text-primary" />
        <h1 className="text-2xl font-semibold text-ink">我的行程库</h1>
      </div>
      <p className="text-[14px] text-on-surface-variant">
        随时回顾已保存的精选路线与打卡足迹。
      </p>

      {savedRoutes.length === 0 ? (
        <>
          <div className="h-52">
            <EmptyState
              title="路线库暂无内容"
              hint="在对话中让管家为您规划行程，生成的方案会自动呈现在这里。"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{newJourneyCard}</div>
        </>
      ) : (
        <>
          <div className="relative mt-4">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索路线名称或目的地…"
              aria-label="搜索已保存的旅行路线或景点地点"
              className="w-full rounded-full border border-card-border bg-surface-container-lowest py-2.5 pl-10 pr-4 text-[14px] text-ink outline-none transition-all placeholder:text-on-surface-variant focus:border-primary/70 focus:ring-2 focus:ring-primary/20 shadow-soft"
            />
          </div>

          <div className="no-scrollbar mt-3.5 flex gap-2 overflow-x-auto pb-1">
            {FILTERS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-[13px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  filter === key
                    ? "bg-primary text-on-primary shadow-soft"
                    : "border border-card-border bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low hover:text-ink"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {visible.length === 0 && (
            <p className="mt-6 text-center text-[13px] text-on-surface-variant/70">
              未找到匹配的路线
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

