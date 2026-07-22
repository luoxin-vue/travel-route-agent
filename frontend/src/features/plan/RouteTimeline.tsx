import {
  MapPin,
  Plus,
  Footprints,
  Car,
  TrainFront,
  Bus,
  Plane,
  Bike,
  BedDouble,
  Navigation,
  CalendarRange,
  Check,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Itinerary, ItineraryNode } from "../../types";
import { nodeKey } from "../../types";
import { SmartImage } from "../../components/SmartImage";

/** 行程节点的 protocol（方式）英文 → 中文，未命中回退原值。 */
const PROTOCOL_LABELS: Record<string, string> = {
  WALKING: "步行",
  DRIVING: "驾车",
  TRANSIT: "公交",
  METRO: "地铁",
  SUBWAY: "地铁",
  BUS: "公交",
  TRAIN: "火车",
  HIGH_SPEED_RAIL: "高铁",
  FLIGHT: "飞机",
  TAXI: "打车",
  BICYCLING: "骑行",
  HOTEL: "酒店",
  LODGING: "住宿",
};

function protocolLabel(protocol?: string | null): string {
  if (!protocol) return "";
  return PROTOCOL_LABELS[protocol.toUpperCase()] ?? protocol;
}

function protocolIcon(protocol?: string | null): LucideIcon {
  switch ((protocol ?? "").toUpperCase()) {
    case "WALKING":
      return Footprints;
    case "DRIVING":
    case "TAXI":
      return Car;
    case "METRO":
    case "SUBWAY":
    case "TRAIN":
    case "HIGH_SPEED_RAIL":
      return TrainFront;
    case "BUS":
    case "TRANSIT":
      return Bus;
    case "FLIGHT":
      return Plane;
    case "BICYCLING":
      return Bike;
    default:
      return Navigation;
  }
}

/** 交通衔接：精致轻柔连接块。 */
function TransportLink({ node }: { node: ItineraryNode }) {
  const Icon = protocolIcon(node.protocol);
  const label = protocolLabel(node.protocol);
  return (
    <div className="relative mb-5 pl-10">
      <div className="flex items-center gap-2.5 rounded-xl bg-surface-container-low/40 px-3.5 py-2 text-[13px] text-on-surface-variant">
        <Icon size={16} className="text-secondary shrink-0" />
        <span className="font-medium text-ink">{node.name}</span>
        {label ? <span className="rounded bg-surface-container px-1.5 py-0.5 text-[11px] text-on-surface-variant">{label}</span> : null}
        {node.start_time ? <span className="ml-auto text-[12px] tabular-nums text-on-surface-variant/70">{node.start_time}</span> : null}
      </div>
    </div>
  );
}

/** 站点卡片（活动 / 住宿）。过夜住宿顶部带陶土暖色小标签。 */
function StopCard({
  node,
  completed,
  onToggle,
}: {
  node: ItineraryNode;
  completed?: boolean;
  onToggle?: () => void;
}) {
  const overnight = node.type === "lodging";

  return (
    <div className="relative mb-6 pl-10">
      {/* 节点圆点：完成=鼠尾草绿勾，过夜=陶土暖色，普通=轻柔环，精确对齐 left-2 轴心 */ }
      <span
        className={`absolute left-2 top-3.5 z-10 flex h-4 w-4 -translate-x-1/2 items-center justify-center rounded-full transition-all ${
          completed
            ? "bg-secondary text-white ring-4 ring-surface"
            : overnight
            ? "bg-primary text-white ring-4 ring-surface"
            : "border-2 border-primary/70 bg-surface ring-4 ring-surface"
        }`}
      >
        {completed && <Check size={10} className="stroke-[3]" />}
      </span>

      <div
        className={`airy-card rounded-2xl p-5 ${
          overnight ? "border-t-4 border-t-primary" : ""
        }`}
      >
        {/* 头部：时间与动作对齐 */}
        <div className="mb-2 flex items-center justify-between gap-2">
          {(node.start_time || node.end_time) ? (
            <span className="text-[14px] font-semibold tabular-nums text-primary">
              {node.start_time ?? ""}
              {node.end_time ? ` – ${node.end_time}` : ""}
            </span>
          ) : (
            <div />
          )}
          <div className="flex shrink-0 gap-1.5">
            <button className="rounded-full border border-card-border bg-surface-container-low/70 px-3 py-1 text-[12px] font-medium text-on-surface-variant hover:bg-surface-container hover:text-ink transition-all">
              编辑
            </button>
            {onToggle ? (
              <button
                onClick={onToggle}
                className={`rounded-full border px-3 py-1 text-[12px] font-medium transition-all ${
                  completed
                    ? "border-secondary bg-secondary/15 text-secondary shadow-soft"
                    : "border-card-border bg-surface-container-low/70 text-on-surface-variant hover:bg-surface-container hover:text-ink"
                }`}
              >
                {completed ? "已打卡" : "标记完成"}
              </button>
            ) : null}
          </div>
        </div>

        {/* 标题 */}
        <h3 className="mb-2 text-headline-md text-ink leading-snug">
          {completed ? <span className="mr-1.5 text-secondary">✓</span> : null}
          {node.name}
        </h3>

        {node.image && (
          <SmartImage
            src={node.image}
            alt={node.name}
            className="mb-3.5 h-36 w-full rounded-xl border border-card-border/60 object-cover shadow-soft"
          />
        )}

        {node.notes && <p className="mb-3 text-[14px] leading-relaxed text-on-surface-variant">{node.notes}</p>}

        {overnight && (
          <span className="mb-3 inline-block rounded-full bg-primary-container/70 px-3 py-0.5 text-[12px] font-medium text-primary">
            住宿预订
          </span>
        )}

        {/* 元数据行：坐标 / 方式 / 预约号 */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-card-border/60 pt-3 text-[12px] text-on-surface-variant">
          {node.lng != null && node.lat != null && (
            <span className="flex items-center gap-1 tabular-nums">
              <MapPin size={14} className="text-primary/70" />
              {node.lat.toFixed(4)}° N, {node.lng.toFixed(4)}° E
            </span>
          )}
          {node.protocol && (
            <span className="flex items-center gap-1">
              <Navigation size={14} className="text-secondary" />
              {protocolLabel(node.protocol)}
            </span>
          )}
          {node.booking_id && (
            <span className="flex items-center gap-1 tabular-nums">
              <BedDouble size={14} className="text-on-surface-variant" />
              预约号: {node.booking_id}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/** 路线时间轴：空气感垂直时间线 + 站点卡片 + 交通衔接。 */
export function RouteTimeline({
  itinerary,
  completedNodes,
  onToggleNode,
}: {
  itinerary: Itinerary;
  completedNodes?: string[];
  onToggleNode?: (key: string) => void;
}) {
  const completedSet = new Set(completedNodes ?? []);

  return (
    <section>
      <h2 className="mb-5 flex items-center gap-2 text-[14px] font-semibold text-ink">
        <CalendarRange size={16} className="text-primary" />
        <span>行程打卡时间轴</span>
      </h2>

      <div className="relative">
        {/* 竖向虚线：精确对齐 left-2 轴心 */}
        <div className="timeline-dotted absolute bottom-0 left-2 top-0 w-px" />

        {itinerary.nodes.map((node, i) =>
          node.type === "transport" ? (
            <TransportLink key={i} node={node} />
          ) : (
            <StopCard
              key={i}
              node={node}
              completed={completedSet.has(nodeKey(node))}
              onToggle={onToggleNode ? () => onToggleNode(nodeKey(node)) : undefined}
            />
          ),
        )}

        {/* 添加节点入口 */}
        <div className="relative pl-10">
          <button className="group flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-card-border bg-surface-container-low/40 p-4 transition-all hover:border-primary/50 hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <Plus size={18} className="text-on-surface-variant transition-colors group-hover:text-primary" />
            <span className="text-[14px] font-medium text-on-surface-variant transition-colors group-hover:text-primary">
              添加新游玩节点
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}

