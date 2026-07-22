export type NodeType = "transport" | "lodging" | "activity";

export interface ItineraryNode {
  type: NodeType;
  name: string;
  day?: number;
  lng?: number | null;
  lat?: number | null;
  start_time?: string | null;
  end_time?: string | null;
  booking_id?: string | null;
  protocol?: string | null;
  notes?: string | null;
  image?: string | null;
  location_summary?: string | null; // 区域位置描述（如 "北京 · 东城区"）
  duration?: string | null; // 建议游玩/入住时长（如 "建议游玩 2.5 小时"）
  next_distance_km?: number | null; // 到下一个 stop 节点的路线距离（km），高德 distance 工具获取
}



export interface Itinerary {
  title: string;
  days: number;
  cover_image?: string | null;
  nodes: ItineraryNode[];
}

export interface ThinkingStep {
  id: string;
  tool: string;
  detail?: string;
  status: "running" | "done";
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  reasoning?: string;
  steps?: ThinkingStep[];
}

export type Tab = "chat" | "plan" | "map" | "library";

export type RouteStatus = "planned" | "completed";

/** 路线库条目：包一层元数据（Itinerary 本身无 id/日期/状态字段）。 */
export interface SavedRoute {
  id: string;
  savedAt: number; // 毫秒时间戳
  status: RouteStatus;
  favorite: boolean;
  itinerary: Itinerary;
  /** 已完成节点复合键（name|start_time|type），与 ItineraryNode 解耦。 */
  completedNodes: string[];
}

/** 节点复合键：name|start_time||day||type，用于打卡匹配。无 start_time 时用 day 替代。 */
export function nodeKey(node: ItineraryNode): string {
  const timeOrDay = node.start_time ?? (node.day != null ? `d${node.day}` : "");
  return `${node.name}|${timeOrDay}|${node.type}`;
}

/** 非交通节点（activity / lodging）。 */
export function isStopNode(node: ItineraryNode): boolean {
  return node.type !== "transport";
}


/** 用户出行偏好配置。 */
export interface TravelPreferences {
  defaultProtocol: string;
  pace: "relaxed" | "compact";
}

export const DEFAULT_TRAVEL_PREFERENCES: TravelPreferences = {
  defaultProtocol: "TRANSIT",
  pace: "relaxed",
};

