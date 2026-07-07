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
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Itinerary, ItineraryNode } from "../../types";
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

/** CLI 风动作按钮（MVP 占位）。 */
function ActionBtn({ children }: { children: string }) {
  return (
    <button className="border border-outline px-2 py-1 font-mono text-label-sm text-on-surface-variant transition-colors hover:bg-surface-container-highest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">
      [{children}]
    </button>
  );
}

/** 交通衔接：渲染为两张卡片之间的斜体细行（参考设计稿）。 */
function TransportLink({ node }: { node: ItineraryNode }) {
  const Icon = protocolIcon(node.protocol);
  const label = protocolLabel(node.protocol);
  return (
    <div className="relative mb-6 pl-12">
      <div className="flex items-center gap-3 py-1 opacity-60">
        <Icon size={18} className="text-on-surface-variant" />
        <span className="font-mono text-label-sm italic text-on-surface-variant">
          {node.name}
          {label ? ` — ${label}` : ""}
          {node.start_time ? ` · ${node.start_time}` : ""}
        </span>
      </div>
    </div>
  );
}

/** 站点卡片（活动 / 住宿）。住宿=过夜：顶部 4px 主色条 + 实心带环节点。 */
function StopCard({ node }: { node: ItineraryNode }) {
  const overnight = node.type === "lodging";
  return (
    <div className="relative mb-6 pl-12">
      {/* 节点圆点：活动=空心，过夜=实心+主色环 */}
      <span
        className={`absolute left-0 top-2 z-10 h-2 w-2 rounded-full outline outline-4 outline-surface ${
          overnight
            ? "bg-ink shadow-[0_0_0_2px_#99462a]"
            : "border-2 border-ink bg-surface"
        }`}
      />
      <div
        className={`rounded-lg border border-outline-variant bg-surface-container-lowest p-5 terminal-shadow ${
          overnight ? "border-t-4 border-t-primary" : ""
        }`}
      >
        {/* 头部：时间与动作对齐 */}
        <div className="mb-2 flex items-center justify-between gap-2">
          {(node.start_time || node.end_time) ? (
            <span className="font-mono text-code-md font-bold text-primary">
              {node.start_time ?? ""}
              {node.end_time ? `–${node.end_time}` : ""}
            </span>
          ) : (
            <div />
          )}
          <div className="flex shrink-0 gap-2">
            <ActionBtn>编辑</ActionBtn>
            <ActionBtn>{overnight ? "入住" : "标记"}</ActionBtn>
          </div>
        </div>

        {/* 标题单独成行，允许横向铺满 */}
        <h3 className="mb-4 text-headline-md text-ink leading-snug">{node.name}</h3>

        {node.image && (
          <SmartImage
            src={node.image}
            alt={node.name}
            className="mb-4 h-32 w-full rounded border border-outline-variant object-cover"
          />
        )}

        {node.notes && <p className="mb-4 text-body-md text-on-surface-variant">{node.notes}</p>}

        {overnight && (
          <span className="mb-4 inline-block rounded bg-secondary-container px-2 py-1 font-mono text-label-sm font-bold uppercase text-ink">
            已确认
          </span>
        )}

        {/* 元数据行：坐标 / 方式 / 预约号 */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-outline-variant pt-4">
          {node.lng != null && node.lat != null && (
            <span className="flex items-center gap-1 font-mono text-label-sm text-on-surface-variant">
              <MapPin size={16} />
              {node.lat.toFixed(4)}° N, {node.lng.toFixed(4)}° E
            </span>
          )}
          {node.protocol && (
            <span className="flex items-center gap-1 font-mono text-label-sm text-on-surface-variant">
              <Navigation size={16} />
              {protocolLabel(node.protocol)}
            </span>
          )}
          {node.booking_id && (
            <span className="flex items-center gap-1 font-mono text-label-sm text-on-surface-variant">
              <BedDouble size={16} />
              预约号: {node.booking_id}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/** 路线时间轴（参考设计稿）：竖向虚线 + 站点卡片 + 交通衔接 + 添加节点入口。 */
export function RouteTimeline({ itinerary }: { itinerary: Itinerary }) {
  return (
    <section>
      <h2 className="mb-6 flex items-center gap-2 font-mono text-label-sm font-bold uppercase text-on-surface-variant">
        <span className="h-2 w-2 rounded-full bg-primary" />
        路线时间轴_
      </h2>

      <div className="relative">
        {/* 竖向虚线 */}
        <div className="timeline-dotted absolute bottom-0 left-[3.5px] top-0 w-px" />

        {itinerary.nodes.map((node, i) =>
          node.type === "transport" ? (
            <TransportLink key={i} node={node} />
          ) : (
            <StopCard key={i} node={node} />
          ),
        )}

        {/* 添加节点入口（MVP 占位） */}
        <div className="relative pl-12">
          <button className="group flex w-full items-center gap-3 rounded-lg border border-dashed border-outline bg-surface/50 p-4 transition-colors hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
            <Plus size={18} className="text-outline transition-colors group-hover:text-primary" />
            <span className="font-mono text-code-md text-outline transition-colors group-hover:text-primary">
              添加新节点_
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
