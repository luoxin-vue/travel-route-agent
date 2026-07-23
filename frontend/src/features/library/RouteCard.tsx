import { ArrowRight, Bookmark, Map as MapIcon, MapPin, Trash2 } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { SmartImage } from "../../components/SmartImage";
import type { SavedRoute } from "../../types";

export function RouteCard({ route }: { route: SavedRoute }) {
  const setItinerary = useAppStore((storeState) => storeState.setItinerary);
  const setTab = useAppStore((storeState) => storeState.setTab);
  const setActiveRouteId = useAppStore((storeState) => storeState.setActiveRouteId);
  const toggleRouteStatus = useAppStore((storeState) => storeState.toggleRouteStatus);
  const toggleRouteFavorite = useAppStore((storeState) => storeState.toggleRouteFavorite);
  const deleteRoute = useAppStore((storeState) => storeState.deleteRoute);

  const { itinerary } = route;
  const stops = itinerary.nodes.filter((node) => node.type !== "transport");
  const summary = (stops.length > 0 ? stops : itinerary.nodes).map((node) => node.name).join(" · ");
  const firstStop = stops[0]?.name ?? itinerary.nodes[0]?.name ?? "未知地点";
  const completed = route.status === "completed";

  return (
    <div className="airy-card group flex flex-col overflow-hidden rounded-2xl">

      {/* 封面图 */}
      <div className="relative h-40 overflow-hidden bg-surface-container-low">
        <div className="flex h-full items-center justify-center text-on-surface-variant/30">
          <MapIcon size={32} />
        </div>
        <SmartImage
          src={itinerary.cover_image}
          alt={itinerary.title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute right-3 top-3 rounded-full border border-card-border bg-surface-container-lowest/90 px-3 py-1 text-[11px] font-medium text-ink shadow-soft backdrop-blur tabular-nums">
          {itinerary.days} 天 · {new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit" }).format(route.savedAt)} 保存
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start gap-2">
          <h3 className="min-w-0 flex-1 truncate text-[17px] font-semibold text-ink leading-snug">{itinerary.title}</h3>
          <button
            onClick={() => toggleRouteFavorite(route.id)}
            className="shrink-0 p-1 text-on-surface-variant transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full"
            aria-label={route.favorite ? "取消收藏" : "收藏"}
          >
            <Bookmark
              size={18}
              className={
                route.favorite
                  ? "fill-primary text-primary"
                  : "text-on-surface-variant/70 hover:text-ink"
              }
            />
          </button>
          <button
            onClick={() => {
              if (window.confirm(`删除「${itinerary.title}」？此操作不可撤销。`)) {
                deleteRoute(route.id);
              }
            }}
            className="shrink-0 p-1 text-on-surface-variant/60 transition-colors hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error rounded-full"
            aria-label="删除路线"
          >
            <Trash2 size={16} />
          </button>
        </div>

        <button
          onClick={() => toggleRouteStatus(route.id)}
          className={`mt-2 self-start rounded-full px-3 py-0.5 text-[12px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            completed
              ? "bg-secondary/15 text-secondary"
              : "bg-primary-container/80 text-primary"
          }`}
          aria-label={completed ? "标记为行程中" : "标记为已完成"}
        >
          {completed ? "已打卡完成 ✓" : "行程计划中"}
        </button>

        {summary && (
          <p className="mb-3 mt-2 line-clamp-2 text-[13px] leading-relaxed text-on-surface-variant">{summary}</p>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-card-border pt-3 text-[12px]">
          <span className="flex min-w-0 items-center gap-1 text-on-surface-variant">
            <MapPin size={14} className="shrink-0 text-primary/70" />
            <span className="truncate">{firstStop}</span>
          </span>
          <button
            onClick={() => {
              setItinerary(itinerary);
              setActiveRouteId(route.id);
              setTab("plan");
            }}
            className="flex shrink-0 items-center gap-1 rounded-full bg-primary px-3 py-1.5 font-medium text-on-primary shadow-soft transition-transform hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            查看计划 <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}


