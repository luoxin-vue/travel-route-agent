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
