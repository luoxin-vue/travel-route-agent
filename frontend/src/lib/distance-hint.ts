import type { ItineraryNode } from "../types";
import { protocolLabel } from "./labels";
import { estimateTravelMinutes, getRecommendedMode } from "./travel-speed";

const RECOMMENDED_PROTOCOL: Record<string, string> = {
  walking: "WALKING",
  driving: "DRIVING",
};

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const squareHalfChord =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(squareHalfChord), Math.sqrt(1 - squareHalfChord));
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return km === Math.floor(km) ? `${km} km` : `${km.toFixed(1)} km`;
}

function buildHintText(
  distanceKm: number,
  direction: string,
  userProtocol?: string | null,
): string {
  const formattedDistance = formatDistance(distanceKm);

  if (userProtocol?.toUpperCase() === "FLIGHT") {
    return `${direction} ${formattedDistance}`;
  }

  const recommended = getRecommendedMode(distanceKm);
  const recProtocol = RECOMMENDED_PROTOCOL[recommended];
  const recLabel = protocolLabel(recProtocol);

  if (!userProtocol) {
    const mins = estimateTravelMinutes(distanceKm, recProtocol)!;
    return `${direction} ${formattedDistance} · ${recLabel}约 ${mins} 分钟`;
  }

  const userKey = userProtocol.toUpperCase();
  const userLabel = protocolLabel(userKey);
  const userMins = estimateTravelMinutes(distanceKm, userKey);

  const userMatchesRec =
    (recommended === "walking" && userKey === "WALKING") ||
    (recommended === "driving" && ["DRIVING", "TAXI"].includes(userKey));

  if (userMatchesRec) {
    return `${direction} ${formattedDistance} · ${userLabel}约 ${userMins} 分钟`;
  }

  const recMins = estimateTravelMinutes(distanceKm, recProtocol)!;
  return `${direction} ${formattedDistance} · 建议${recLabel}(约${recMins}分钟) · 当前${userLabel}约${userMins}分钟`;
}

export function computeDistanceHint(
  allNodes: ItineraryNode[],
  nodeIndex: number,
): string | null {
  const current = allNodes[nodeIndex];
  if (!current || current.type === "transport") return null;

  const stopNodes = allNodes.filter((n) => n.type !== "transport");
  const stopIdx = stopNodes.indexOf(current);
  if (stopNodes.length < 2) return null;

  const isFirst = stopIdx === 0;
  const direction = isFirst ? "距下站" : "距上站";
  const sourceStop = isFirst ? current : stopNodes[stopIdx - 1];
  const targetStop = isFirst ? stopNodes[1] : current;

  const distKm = resolveDistance(sourceStop, targetStop);

  if (distKm == null) {
    if (sourceStop.protocol?.toUpperCase() === "FLIGHT") {
      return direction;
    }
    const transportBetween = findTransportBetween(allNodes, sourceStop, targetStop);
    const mode = transportBetween?.protocol ? protocolLabel(transportBetween.protocol) : "";
    return `${direction}${mode}约 15 分钟`;
  }

  return buildHintText(distKm, direction, sourceStop.protocol);
}

function resolveDistance(from: ItineraryNode, to: ItineraryNode): number | null {
  if (from.next_distance_km != null) return from.next_distance_km;
  if (from.lat != null && from.lng != null && to.lat != null && to.lng != null) {
    return haversineKm(from.lat, from.lng, to.lat, to.lng);
  }
  return null;
}

function findTransportBetween(
  allNodes: ItineraryNode[],
  fromStop: ItineraryNode,
  toStop: ItineraryNode,
): ItineraryNode | undefined {
  const fromIndex = allNodes.indexOf(fromStop);
  const toIndex = allNodes.indexOf(toStop);
  if (fromIndex === -1 || toIndex === -1) return undefined;
  const start = Math.min(fromIndex, toIndex);
  const end = Math.max(fromIndex, toIndex);
  return allNodes.slice(start + 1, end).find((n) => n.type === "transport");
}
