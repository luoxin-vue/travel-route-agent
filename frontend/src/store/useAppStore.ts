import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatMessage, Itinerary, SavedRoute, Tab, ThinkingStep } from "../types";

interface Telemetry {
  tool: string | null; // 当前/最近运行的工具名
  status: "idle" | "running" | "done";
}

interface AppState {
  tab: Tab;
  threadId: string;
  messages: ChatMessage[];
  itinerary: Itinerary | null;
  savedRoutes: SavedRoute[];
  telemetry: Telemetry;
  streaming: boolean;

  setTab: (t: Tab) => void;
  addMessage: (m: ChatMessage) => void;
  appendToLastAssistant: (text: string) => void;
  appendReasoning: (text: string) => void;
  pushStep: (step: ThinkingStep) => void;
  resolveStep: (id: string) => void;
  setItinerary: (i: Itinerary) => void;
  saveRoute: (i: Itinerary) => void;
  toggleRouteStatus: (id: string) => void;
  toggleRouteFavorite: (id: string) => void;
  deleteRoute: (id: string) => void;
  setTelemetry: (t: Telemetry) => void;
  setStreaming: (b: boolean) => void;
}

/** 对最后一条 assistant 消息做不可变更新的辅助函数。 */
function updateLastAssistant(
  messages: ChatMessage[],
  fn: (m: ChatMessage) => ChatMessage,
): ChatMessage[] {
  const msgs = [...messages];
  const last = msgs[msgs.length - 1];
  if (last && last.role === "assistant") {
    msgs[msgs.length - 1] = fn(last);
  }
  return msgs;
}

/** Itinerary 无唯一键，用「标题|天数」做去重签名。 */
function routeSignature(i: Itinerary): string {
  return `${i.title}|${i.days}`;
}

function newRouteId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `r-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      tab: "chat" as Tab,
      threadId: `t-${Date.now()}`,
      messages: [],
      itinerary: null,
      savedRoutes: [],
      telemetry: { tool: null, status: "idle" as const },
      streaming: false,

      setTab: (tab) => set({ tab }),
      addMessage: (m) => set((s) => ({ messages: [...s.messages, m] })),
      appendToLastAssistant: (text) =>
        set((s) => ({
          messages: updateLastAssistant(s.messages, (m) => ({ ...m, content: m.content + text })),
        })),
      appendReasoning: (text) =>
        set((s) => ({
          messages: updateLastAssistant(s.messages, (m) => ({
            ...m,
            reasoning: (m.reasoning ?? "") + text,
          })),
        })),
      pushStep: (step) =>
        set((s) => ({
          messages: updateLastAssistant(s.messages, (m) => ({
            ...m,
            steps: [...(m.steps ?? []), step],
          })),
        })),
      resolveStep: (id) =>
        set((s) => ({
          messages: updateLastAssistant(s.messages, (m) => ({
            ...m,
            steps: (m.steps ?? []).map((st) =>
              st.id === id ? { ...st, status: "done" as const } : st,
            ),
          })),
        })),
      setItinerary: (itinerary) => set({ itinerary }),
      // 自动入库：同签名（标题|天数）已存在则更新行程内容并保留用户的状态/收藏标记。
      saveRoute: (itinerary) =>
        set((s) => {
          const sig = routeSignature(itinerary);
          const existing = s.savedRoutes.find((r) => routeSignature(r.itinerary) === sig);
          if (existing) {
            return {
              savedRoutes: s.savedRoutes.map((r) =>
                r.id === existing.id ? { ...r, itinerary, savedAt: Date.now() } : r,
              ),
            };
          }
          return {
            savedRoutes: [
              {
                id: newRouteId(),
                savedAt: Date.now(),
                status: "planned" as const,
                favorite: false,
                itinerary,
              },
              ...s.savedRoutes,
            ],
          };
        }),
      toggleRouteStatus: (id) =>
        set((s) => ({
          savedRoutes: s.savedRoutes.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status: r.status === "planned" ? ("completed" as const) : ("planned" as const),
                }
              : r,
          ),
        })),
      toggleRouteFavorite: (id) =>
        set((s) => ({
          savedRoutes: s.savedRoutes.map((r) =>
            r.id === id ? { ...r, favorite: !r.favorite } : r,
          ),
        })),
      deleteRoute: (id) =>
        set((s) => ({ savedRoutes: s.savedRoutes.filter((r) => r.id !== id) })),
      setTelemetry: (telemetry) => set({ telemetry }),
      setStreaming: (streaming) => set({ streaming }),
    }),
    {
      // 只持久化路线库；会话/流式等易变状态不落 localStorage。
      name: "travel-route-library",
      version: 1,
      partialize: (s) => ({ savedRoutes: s.savedRoutes }),
    },
  ),
);
