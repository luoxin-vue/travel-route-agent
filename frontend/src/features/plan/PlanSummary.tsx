import { useState } from "react";
import type { Itinerary } from "../../types";
import { proxiedImage } from "../../lib/img";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="font-mono text-label-sm uppercase text-on-surface-variant">{label}</span>
      <span className="font-mono text-code-md font-bold text-ink">{value}</span>
    </div>
  );
}

/** 行程概要头部：有封面图则用图 + 标题叠加，否则用紧凑文字标题；下方为关键指标。 */
export function PlanSummary({ itinerary }: { itinerary: Itinerary }) {
  const stops = itinerary.nodes.filter((n) => n.type !== "transport").length;
  const legs = itinerary.nodes.filter((n) => n.type === "transport").length;
  const [coverOk, setCoverOk] = useState(true);
  const hasCover = !!itinerary.cover_image && coverOk;

  return (
    <section className="mb-6">
      {hasCover ? (
        <div className="relative mb-4 h-44 overflow-hidden rounded-lg border border-outline-variant">
          <img
            src={proxiedImage(itinerary.cover_image)}
            alt={itinerary.title}
            referrerPolicy="no-referrer"
            onError={() => setCoverOk(false)}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/25 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4">
            <h1 className="text-2xl font-semibold leading-tight text-white drop-shadow-sm">
              {itinerary.title}
            </h1>
          </div>
        </div>
      ) : (
        <h1 className="mb-4 text-2xl font-semibold leading-snug text-ink">{itinerary.title}</h1>
      )}

      <div className="grid grid-cols-3 gap-4 border-b-4 border-primary pb-4">
        <Stat label="总天数" value={`${itinerary.days} 天`} />
        <Stat label="途经站点" value={`${stops}`} />
        <Stat label="交通路段" value={`${legs}`} />
      </div>
    </section>
  );
}
