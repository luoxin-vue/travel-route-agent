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
  savedAt: number; // epoch ms
  status: RouteStatus;
  favorite: boolean;
  itinerary: Itinerary;
  /** 已完成节点复合键（name|start_time|type），与 ItineraryNode 解耦。 */
  completedNodes: string[];
}

/** 节点复合键：name|start_time||day||type，用于打卡匹配。无 start_time 时用 day 替代。 */
export function nodeKey(n: ItineraryNode): string {
  const timeOrDay = n.start_time ?? (n.day != null ? `d${n.day}` : "");
  return `${n.name}|${timeOrDay}|${n.type}`;
}

/** 非交通节点（activity / lodging）。 */
export function isStopNode(n: ItineraryNode): boolean {
  return n.type !== "transport";
}
