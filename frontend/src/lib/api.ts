import { fetchEventSource } from "@microsoft/fetch-event-source";
import type { Itinerary } from "../types";

export interface ToolEvent {
  id: string;
  name: string;
  status: "running" | "done";
  detail?: string;
}

export interface ChatHandlers {
  onToken: (text: string) => void;
  onThinking: (text: string) => void;
  onTool: (evt: ToolEvent) => void;
  onItinerary: (itinerary: Itinerary) => void;
  onDone: () => void;
  onError: (message: string) => void;
}

/** 向后端 /api/chat 发起 SSE 流式对话，把事件分发给回调。 */
export async function streamChat(
  threadId: string,
  message: string,
  handlers: ChatHandlers,
  signal?: AbortSignal,
): Promise<void> {
  await fetchEventSource("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ thread_id: threadId, message }),
    signal,
    openWhenHidden: true,
    onmessage(ev) {
      if (!ev.event) return;
      const eventPayload = ev.data ? JSON.parse(ev.data) : {};
      switch (ev.event) {
        case "token":
          handlers.onToken(eventPayload.text);
          break;
        case "thinking":
          handlers.onThinking(eventPayload.text);
          break;
        case "tool":
          handlers.onTool(eventPayload as ToolEvent);
          break;
        case "itinerary":
          handlers.onItinerary(eventPayload as Itinerary);
          break;
        case "done":
          handlers.onDone();
          break;
        case "error":
          handlers.onError(eventPayload.message);
          break;
      }
    },
    onerror(err) {
      handlers.onError(String(err));
      throw err; // 阻止自动重连
    },
  });
}
