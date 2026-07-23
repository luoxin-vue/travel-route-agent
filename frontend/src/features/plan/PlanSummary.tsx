import { useState } from "react";
import type { Itinerary } from "../../types";
import { isStopNode } from "../../types";
import { proxiedImage } from "../../lib/img";

/** 行程概要头部：空气感卡片 + 关键指标排版。 */
export function PlanSummary({
  itinerary,
  completedCount,
  totalStops,
}: {
  itinerary: Itinerary;
  completedCount?: number;
  totalStops?: number;
}) {
  const stops = itinerary.nodes.filter(isStopNode).length;
  const legs = itinerary.nodes.length - stops;
  const [coverOk, setCoverOk] = useState(true);
  const hasCover = !!itinerary.cover_image && coverOk;
  const showProgress = completedCount != null && totalStops != null;

  return (
    <section className="airy-card mb-6 rounded-2xl p-5">
      {hasCover ? (
        <div className="relative mb-4 h-48 overflow-hidden rounded-xl">
          <img
            src={proxiedImage(itinerary.cover_image)}
            alt={itinerary.title}
            referrerPolicy="no-referrer"
            onError={() => setCoverOk(false)}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4">
            <h1 className="text-2xl font-semibold leading-tight text-on-surface drop-shadow-sm">
              {itinerary.title}
            </h1>
          </div>
        </div>
      ) : (
        <h1 className="mb-4 text-2xl font-semibold leading-snug text-ink">{itinerary.title}</h1>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col items-center justify-center rounded-xl bg-surface-container py-2.5 px-3">
          <span className="text-[12px] font-medium text-on-surface-variant/80">游玩天数</span>
          <span className="text-[17px] font-semibold text-primary tabular-nums">{itinerary.days} 天</span>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl bg-surface-container py-2.5 px-3">
          <span className="text-[12px] font-medium text-on-surface-variant/80">精选站点</span>
          <span className="text-[17px] font-semibold text-primary tabular-nums">{stops} 处</span>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl bg-surface-container py-2.5 px-3">
          <span className="text-[12px] font-medium text-on-surface-variant/80">行程路段</span>
          <span className="text-[17px] font-semibold text-primary tabular-nums">{legs} 段</span>
        </div>
      </div>

      {showProgress && (
        <div className="mt-4 flex items-center gap-3 text-[13px] text-on-surface-variant">
          <span className="font-medium text-secondary tabular-nums">已打卡 {completedCount}/{totalStops}</span>
          <div className="h-2 flex-1 rounded-full bg-surface-container-high overflow-hidden">
            <div
              className="h-2 rounded-full bg-secondary transition-all"
              style={{ width: `${totalStops > 0 ? ((completedCount ?? 0) / totalStops) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}
    </section>
  );
}

