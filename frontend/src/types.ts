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
}
