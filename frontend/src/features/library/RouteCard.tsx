import { ArrowRight, Bookmark, Map as MapIcon, MapPin, Trash2 } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { Card } from "../../components/Card";
import { SmartImage } from "../../components/SmartImage";
import type { SavedRoute } from "../../types";

/** Itinerary 无出行日期字段，卡片日期用入库时间。 */
function formatSavedAt(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function RouteCard({ route }: { route: SavedRoute }) {
  const setItinerary = useAppStore((s) => s.setItinerary);
  const setTab = useAppStore((s) => s.setTab);
  const toggleRouteStatus = useAppStore((s) => s.toggleRouteStatus);
  const toggleRouteFavorite = useAppStore((s) => s.toggleRouteFavorite);
  const deleteRoute = useAppStore((s) => s.deleteRoute);

  const { itinerary } = route;
  const stops = itinerary.nodes.filter((n) => n.type !== "transport");
  const summary = (stops.length > 0 ? stops : itinerary.nodes).map((n) => n.name).join(" · ");
  const firstStop = stops[0]?.name ?? itinerary.nodes[0]?.name ?? "未定地点";
  const completed = route.status === "completed";

  return (
    <Card className="group flex flex-col overflow-hidden">
      {/* 封面：底层兜底块 + SmartImage 覆盖（失败自隐藏，布局不塌） */}
      <div className="relative h-40 overflow-hidden bg-surface-container">
        <div className="flex h-full items-center justify-center text-on-surface-variant/40">
          <MapIcon size={28} />
        </div>
        <SmartImage
          src={itinerary.cover_image}
          alt={itinerary.title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <span className="absolute right-2 top-2 rounded-full bg-surface/90 px-2 py-0.5 font-mono text-label-sm text-ink">
          {itinerary.days} 天 · {formatSavedAt(route.savedAt)} 保存
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start gap-2">
          <h3 className="min-w-0 flex-1 truncate text-headline-md text-ink">{itinerary.title}</h3>
          <button
            onClick={() => toggleRouteFavorite(route.id)}
            className="shrink-0 p-0.5 transition-colors"
            aria-label={route.favorite ? "取消收藏" : "收藏"}
          >
            <Bookmark
              size={18}
              className={
                route.favorite
                  ? "fill-primary-container text-primary-container"
                  : "text-on-surface-variant hover:text-ink"
              }
            />
          </button>
          <button
            onClick={() => {
              if (window.confirm(`删除「${itinerary.title}」？此操作不可撤销。`)) {
                deleteRoute(route.id);
              }
            }}
            className="shrink-0 p-0.5 text-on-surface-variant transition-colors hover:text-error"
            aria-label="删除路线"
          >
            <Trash2 size={16} />
          </button>
        </div>

        <button
          onClick={() => toggleRouteStatus(route.id)}
          className={`mt-2 self-start rounded-full px-2 py-0.5 font-mono text-label-sm uppercase transition-colors ${
            completed
              ? "bg-teal/10 text-teal"
              : "bg-primary-container/10 text-primary-container"
          }`}
        >
          {completed ? "已完成 ✓" : "已计划"}
        </button>

        {summary && (
          <p className="mb-3 mt-2 line-clamp-2 text-body-md text-on-surface-variant">{summary}</p>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-outline-variant pt-3">
          <span className="flex min-w-0 items-center gap-1 font-mono text-label-sm text-on-surface-variant">
            <MapPin size={14} className="shrink-0" />
            <span className="truncate">{firstStop}</span>
          </span>
          <button
            onClick={() => {
              setItinerary(itinerary);
              setTab("plan");
            }}
            className="flex shrink-0 items-center gap-1 border border-ink px-3 py-1.5 font-mono text-label-sm text-ink transition-colors hover:bg-ink hover:text-surface"
          >
            查看详情 <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </Card>
  );
}
