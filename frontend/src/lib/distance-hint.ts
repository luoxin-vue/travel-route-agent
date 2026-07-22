import type { ItineraryNode } from "../types";
import { estimateTravelMinutes, getRecommendedMode } from "./travel-speed";

/** protocol 英文 → 中文标签。 */
const MODE_LABELS: Record<string, string> = {
  WALKING: "步行", DRIVING: "驾车", TAXI: "打车", BICYCLING: "骑行",
  BUS: "公交", TRANSIT: "公交", METRO: "地铁", SUBWAY: "地铁",
  TRAIN: "火车", HIGH_SPEED_RAIL: "高铁", FLIGHT: "飞机",
};

function modeLabel(protocol: string): string {
  return MODE_LABELS[protocol.toUpperCase()] ?? protocol;
}

/** 建议模式 → 对应 protocol key（用于估算时间）。 */
const RECOMMENDED_PROTOCOL: Record<string, string> = {
  walking: "WALKING",
  driving: "DRIVING",
};

/** 半正矢公式计算直线距离（km），作为 fallback。 */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** 格式化距离文本：< 1km 用米，>= 1km 用公里。 */
function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  // ponytail: 整数不带小数点
  return km === Math.floor(km) ? `${km} km` : `${km.toFixed(1)} km`;
}

/**
 * 构建距离提示文案。
 * @param distanceKm 路线距离（km）
 * @param direction "距下站" 或 "距上站"
 * @param userProtocol 用户在当前/上一站设置的 protocol（可选）
 */
function buildHintText(
  distanceKm: number,
  direction: string,
  userProtocol?: string | null,
): string {
  const distText = formatDistance(distanceKm);
  const recommended = getRecommendedMode(distanceKm);
  const recProtocol = RECOMMENDED_PROTOCOL[recommended];
  const recLabel = modeLabel(recProtocol);

  // FLIGHT：只显示距离，不估时间
  if (userProtocol?.toUpperCase() === "FLIGHT") {
    return `${direction} ${distText}`;
  }

  // 无用户 protocol → 按建议展示
  if (!userProtocol) {
    const mins = estimateTravelMinutes(distanceKm, recProtocol)!;
    return `${direction} ${distText} · ${recLabel}约 ${mins} 分钟`;
  }

  const userKey = userProtocol.toUpperCase();
  const userLabel = modeLabel(userKey);
  const userMins = estimateTravelMinutes(distanceKm, userKey);

  // 用户选择与建议一致
  const userMatchesRec =
    (recommended === "walking" && userKey === "WALKING") ||
    (recommended === "driving" && ["DRIVING", "TAXI"].includes(userKey));

  if (userMatchesRec) {
    return `${direction} ${distText} · ${userLabel}约 ${userMins} 分钟`;
  }

  // 用户选择与建议不一致 → 双行对比
  const recMins = estimateTravelMinutes(distanceKm, recProtocol)!;
  // ponytail: userMins 为 null 的情况只有 FLIGHT，已在上方处理
  return `${direction} ${distText} · 建议${recLabel}(约${recMins}分钟) · 当前${userLabel}约${userMins}分钟`;
}

/**
 * 动态计算节点距离提示。
 * 首站→距下站（读自己的 next_distance_km / protocol）；
 * 非首站→距上站（读上一个 stop 的 next_distance_km / protocol）。
 * 无 next_distance_km 时降级到 Haversine；无坐标时给默认文案。
 */
export function computeDistanceHint(
  allNodes: ItineraryNode[],
  nodeIndex: number,
): string | null {
  const current = allNodes[nodeIndex];
  if (!current || current.type === "transport") return null;

  // 筛选 stop 节点
  const stopNodes = allNodes.filter((n) => n.type !== "transport");
  const stopIdx = stopNodes.indexOf(current);
  const isFirst = stopIdx === 0;

  // 只有一个 stop → 无提示
  if (stopNodes.length < 2) return null;

  if (isFirst) {
    // 首站：距下站
    const nextStop = stopNodes[1];
    const distKm = resolveDistance(current, nextStop);
    if (distKm == null) return "距下站约 15 分钟";
    return buildHintText(distKm, "距下站", current.protocol);
  }

  // 非首站：距上站（读上一站的数据）
  const prevStop = stopNodes[stopIdx - 1];
  const distKm = resolveDistance(prevStop, current);
  if (distKm == null) return "距上站约 15 分钟";
  return buildHintText(distKm, "距上站", prevStop.protocol);
}

/**
 * 解析两个 stop 之间的距离（km）。
 * 优先用 from 节点的 next_distance_km，否则 Haversine 直线距离。
 */
function resolveDistance(
  from: ItineraryNode,
  to: ItineraryNode,
): number | null {
  if (from.next_distance_km != null) return from.next_distance_km;
  if (
    from.lat != null && from.lng != null &&
    to.lat != null && to.lng != null
  ) {
    return haversineKm(from.lat, from.lng, to.lat, to.lng);
  }
  return null;
}
