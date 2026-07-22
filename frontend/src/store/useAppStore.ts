import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatMessage, Itinerary, ItineraryNode, SavedRoute, Tab, ThinkingStep, TravelPreferences } from "../types";
import { DEFAULT_TRAVEL_PREFERENCES, isStopNode, nodeKey } from "../types";

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
  activeRouteId: string | null;
  telemetry: Telemetry;
  streaming: boolean;
  travelPreferences: TravelPreferences;

  setTab: (t: Tab) => void;
  addMessage: (m: ChatMessage) => void;
  appendToLastAssistant: (text: string) => void;
  appendReasoning: (text: string) => void;
  pushStep: (step: ThinkingStep) => void;
  resolveStep: (id: string) => void;
  setItinerary: (targetItinerary: Itinerary) => void;
  saveRoute: (targetItinerary: Itinerary) => void;
  toggleRouteStatus: (id: string) => void;
  toggleRouteFavorite: (id: string) => void;
  deleteRoute: (id: string) => void;
  setActiveRouteId: (id: string | null) => void;
  toggleNodeComplete: (routeId: string, key: string) => void;
  setTelemetry: (t: Telemetry) => void;
  setStreaming: (b: boolean) => void;

  // 新增：节点编辑、新增与删除
  updateNode: (index: number, node: ItineraryNode) => void;
  addNode: (node: ItineraryNode) => void;
  deleteNode: (index: number) => void;

  // 新增：偏好设置与会话/路线库重置
  updatePreferences: (prefs: Partial<TravelPreferences>) => void;
  clearMessages: () => void;
  resetSavedRoutes: () => void;
}

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

function routeSignature(targetItinerary: Itinerary): string {
  return `${targetItinerary.title}|${targetItinerary.days}`;
}

function newRouteId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `r-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** 辅助函数：判断行程的所有非交通节点是否已被打卡完成。 */
function checkAllStopsCompleted(nodes: ItineraryNode[], completedKeys: string[]): boolean {
  const completedKeySet = new Set(completedKeys);
  const stopKeys = nodes.filter(isStopNode).map(nodeKey);
  return stopKeys.length > 0 && stopKeys.every((key) => completedKeySet.has(key));
}

/** 辅助函数：同步更新当前 Itinerary 节点并重新清洗关联路线库状态。 */
function syncItineraryNodes(
  state: AppState,
  nodesUpdater: (nodes: ItineraryNode[]) => ItineraryNode[],
): Partial<AppState> {
  if (!state.itinerary) return {};
  const newNodes = nodesUpdater(state.itinerary.nodes);
  const newItinerary: Itinerary = { ...state.itinerary, nodes: newNodes };
  const newKeys = new Set(newNodes.map(nodeKey));

  const newSavedRoutes = state.savedRoutes.map((route) => {
    const isTarget = route.id === state.activeRouteId || routeSignature(route.itinerary) === routeSignature(newItinerary);
    if (!isTarget) return route;

    const cleanedCompleted = route.completedNodes.filter((key) => newKeys.has(key));
    const allDone = checkAllStopsCompleted(newNodes, cleanedCompleted);

    return {
      ...route,
      itinerary: newItinerary,
      completedNodes: cleanedCompleted,
      status: allDone ? ("completed" as const) : ("planned" as const),
    };
  });

  return { itinerary: newItinerary, savedRoutes: newSavedRoutes };
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      tab: "chat" as Tab,
      threadId: `t-${Date.now()}`,
      messages: [],
      itinerary: null,
      savedRoutes: [],
      activeRouteId: null,
      telemetry: { tool: null, status: "idle" as const },
      streaming: false,
      travelPreferences: DEFAULT_TRAVEL_PREFERENCES,

      setTab: (tab) => set({ tab }),
      addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
      appendToLastAssistant: (text) =>
        set((state) => ({
          messages: updateLastAssistant(state.messages, (msg) => ({ ...msg, content: msg.content + text })),
        })),
      appendReasoning: (text) =>
        set((state) => ({
          messages: updateLastAssistant(state.messages, (msg) => ({
            ...msg,
            reasoning: (msg.reasoning ?? "") + text,
          })),
        })),
      pushStep: (step) =>
        set((state) => ({
          messages: updateLastAssistant(state.messages, (msg) => ({
            ...msg,
            steps: [...(msg.steps ?? []), step],
          })),
        })),
      resolveStep: (stepId) =>
        set((state) => ({
          messages: updateLastAssistant(state.messages, (msg) => ({
            ...msg,
            steps: (msg.steps ?? []).map((step) =>
              step.id === stepId ? { ...step, status: "done" as const } : step,
            ),
          })),
        })),
      setItinerary: (itinerary) => set({ itinerary }),
      // 自动入库：同签名（标题|天数）已存在则更新行程内容并保留用户的状态/收藏标记，
      // 同时清洗 completedNodes，只保留新 nodes 中仍能匹配到的键。
      saveRoute: (itinerary) =>
        set((state) => {
          const sig = routeSignature(itinerary);
          const existing = state.savedRoutes.find((route) => routeSignature(route.itinerary) === sig);
          if (existing) {
            const newKeys = new Set(itinerary.nodes.map(nodeKey));
            const cleaned = existing.completedNodes.filter((key) => newKeys.has(key));
            return {
              savedRoutes: state.savedRoutes.map((route) =>
                route.id === existing.id ? { ...route, itinerary, savedAt: Date.now(), completedNodes: cleaned } : route,
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
                completedNodes: [],
              },
              ...state.savedRoutes,
            ],
          };
        }),
      toggleRouteStatus: (routeId) =>
        set((state) => ({
          savedRoutes: state.savedRoutes.map((route) =>
            route.id === routeId
              ? {
                  ...route,
                  status: route.status === "planned" ? ("completed" as const) : ("planned" as const),
                }
              : route,
          ),
        })),
      toggleRouteFavorite: (routeId) =>
        set((state) => ({
          savedRoutes: state.savedRoutes.map((route) =>
            route.id === routeId ? { ...route, favorite: !route.favorite } : route,
          ),
        })),
      deleteRoute: (routeId) =>
        set((state) => ({ savedRoutes: state.savedRoutes.filter((route) => route.id !== routeId) })),
      setActiveRouteId: (activeRouteId) => set({ activeRouteId }),
      toggleNodeComplete: (routeId, nodeMatchKey) =>
        set((state) => ({
          savedRoutes: state.savedRoutes.map((route) => {
            if (route.id !== routeId) return route;
            const completedSet = new Set(route.completedNodes);
            if (completedSet.has(nodeMatchKey)) completedSet.delete(nodeMatchKey);
            else completedSet.add(nodeMatchKey);

            const allDone = checkAllStopsCompleted(route.itinerary.nodes, [...completedSet]);
            return {
              ...route,
              completedNodes: [...completedSet],
              status: allDone ? ("completed" as const) : ("planned" as const),
            };
          }),
        })),
      setTelemetry: (telemetry) => set({ telemetry }),
      setStreaming: (streaming) => set({ streaming }),

      updateNode: (index, updatedNode) =>
        set((state) => syncItineraryNodes(state, (nodes) => nodes.map((item, idx) => (idx === index ? updatedNode : item)))),
      addNode: (node) =>
        set((state) => syncItineraryNodes(state, (nodes) => [...nodes, node])),
      deleteNode: (index) =>
        set((state) => syncItineraryNodes(state, (nodes) => nodes.filter((_, idx) => idx !== index))),

      updatePreferences: (prefs) =>
        set((state) => ({ travelPreferences: { ...state.travelPreferences, ...prefs } })),
      clearMessages: () => set({ messages: [] }),
      resetSavedRoutes: () => set({ savedRoutes: [], activeRouteId: null }),
    }),
    {
      // 持久化路线库与旅行偏好设置。
      name: "travel-route-library",
      version: 1,
      partialize: (state) => ({ savedRoutes: state.savedRoutes, travelPreferences: state.travelPreferences }),
    },
  ),
);


