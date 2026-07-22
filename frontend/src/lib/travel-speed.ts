const SPEED_KMH: Record<string, number> = {
  WALKING: 4.5,
  BICYCLING: 15,
  DRIVING: 30,
  TAXI: 30,
  BUS: 20,
  TRANSIT: 20,
  METRO: 35,
  SUBWAY: 35,
  TRAIN: 80,
  HIGH_SPEED_RAIL: 250,
};

const DEFAULT_SPEED = 30;

export function estimateTravelMinutes(
  distanceKm: number,
  protocol: string,
): number | null {
  const key = protocol.toUpperCase();
  if (key === "FLIGHT") return null;
  const speed = SPEED_KMH[key] ?? DEFAULT_SPEED;
  return Math.max(5, Math.round((distanceKm / speed) * 60));
}

export function getRecommendedMode(
  distanceKm: number,
): "walking" | "driving" {
  return distanceKm < 1.5 ? "walking" : "driving";
}
