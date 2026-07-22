/** 高德 MCP 工具英文名 → 中文显示。未命中则回退原名。 */
const TOOL_LABELS: Record<string, string> = {
  maps_text_search: "检索地点",
  maps_around_search: "周边检索",
  maps_search_detail: "查询详情",
  maps_geo: "地理编码",
  maps_regeocode: "逆地理编码",
  maps_distance: "测算距离",
  maps_weather: "查询天气",
  maps_ip_location: "定位",
  maps_direction_driving: "规划驾车路线",
  maps_direction_walking: "规划步行路线",
  maps_direction_transit_integrated: "规划公交路线",
  maps_direction_bicycling: "规划骑行路线",
  emit_itinerary: "整理行程",
};

export function toolLabel(name: string): string {
  return TOOL_LABELS[name] ?? name;
}

/** 行程节点协议/方式英文 → 中文。未命中回退原值。 */
export const PROTOCOL_LABELS: Record<string, string> = {
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

export function protocolLabel(protocol?: string | null): string {
  if (!protocol) return "";
  return PROTOCOL_LABELS[protocol.toUpperCase()] ?? protocol;
}
