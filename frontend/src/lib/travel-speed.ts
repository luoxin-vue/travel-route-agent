/** 各出行方式的估算速度（km/h）。 */
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

/** 默认兜底速度（未知 protocol 按驾车估算）。 */
const DEFAULT_SPEED = 30;

/**
 * 根据路线距离和出行方式估算耗时（分钟）。
 * FLIGHT 返回 null（直线距离对飞机无参考意义）。
 * 最小返回 5 分钟。
 */
export function estimateTravelMinutes(
  distanceKm: number,
  protocol: string,
): number | null {
  const key = protocol.toUpperCase();
  if (key === "FLIGHT") return null;
  const speed = SPEED_KMH[key] ?? DEFAULT_SPEED;
  return Math.max(5, Math.round((distanceKm / speed) * 60));
}

/**
 * 按距离阈值返回系统建议的出行方式。
 * < 1.5km → 步行；>= 1.5km → 驾车。
 */
export function getRecommendedMode(
  distanceKm: number,
): "walking" | "driving" {
  return distanceKm < 1.5 ? "walking" : "driving";
}
