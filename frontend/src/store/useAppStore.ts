import { create } from "zustand";
import type { ChatMessage, Itinerary, Tab, ThinkingStep } from "../types";

interface Telemetry {
  tool: string | null; // 当前/最近运行的工具名
  status: "idle" | "running" | "done";
}

interface AppState {
  tab: Tab;
  threadId: string;
  messages: ChatMessage[];
  itinerary: Itinerary | null;
  telemetry: Telemetry;
  streaming: boolean;

  setTab: (t: Tab) => void;
  addMessage: (m: ChatMessage) => void;
  appendToLastAssistant: (text: string) => void;
  appendReasoning: (text: string) => void;
  pushStep: (step: ThinkingStep) => void;
  resolveStep: (id: string) => void;
  setItinerary: (i: Itinerary) => void;
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

export const useAppStore = create<AppState>((set) => ({
  tab: "chat",
  threadId: `t-${Date.now()}`,
  messages: [],
  itinerary: null,
  telemetry: { tool: null, status: "idle" },
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
  setTelemetry: (telemetry) => set({ telemetry }),
  setStreaming: (streaming) => set({ streaming }),
}));
