import { useRef, useState, useEffect } from "react";
import { Loader2, Send, CalendarRange, MapPin, Sparkles, Compass, UtensilsCrossed, Trees } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useAppStore } from "../../store/useAppStore";
import { streamChat } from "../../lib/api";
import { toolLabel } from "../../lib/labels";
import { ThinkingSteps } from "./ThinkingSteps";
import { ReasoningBlock } from "./ReasoningBlock";

/** 灵感预设标签（带 emoji 贴纸）。 */
const PRESETS = [
  { label: "上海漫步 ☕", icon: Compass, prompt: "帮我规划上海周末2日游，2-3个核心景点" },
  { label: "成都美食 🐼", icon: UtensilsCrossed, prompt: "帮我规划成都2日游，重点美食和熊猫基地" },
  { label: "西湖惬意 🚣", icon: Trees, prompt: "帮我规划杭州西湖一日游" },
];

export function ChatView() {
  const {
    messages,
    threadId,
    streaming,
    telemetry,
    itinerary,
    addMessage,
    appendToLastAssistant,
    appendReasoning,
    pushStep,
    resolveStep,
    setItinerary,
    saveRoute,
    setTelemetry,
    setStreaming,
    setTab,
  } = useAppStore();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function send(textArg?: string) {
    const text = (textArg ?? input).trim();
    if (!text || streaming) return;
    setInput("");
    addMessage({ role: "user", content: text });
    addMessage({ role: "assistant", content: "" });
    setStreaming(true);
    setTelemetry({ tool: null, status: "running" });

    try {
      await streamChat(threadId, text, {
        onToken: (t) => appendToLastAssistant(t),
        onThinking: (t) => appendReasoning(t),
        onTool: (evt) => {
          if (evt.status === "running") {
            pushStep({ id: evt.id, tool: evt.name, detail: evt.detail, status: "running" });
            setTelemetry({ tool: evt.name, status: "running" });
          } else {
            resolveStep(evt.id);
            setTelemetry({ tool: null, status: "running" });
          }
        },
        onItinerary: (it) => {
          saveRoute(it);
          setItinerary(it);
          setTab("plan");
        },
        onDone: () => {
          setStreaming(false);
          setTelemetry({ tool: null, status: "idle" });
        },
        onError: (msg) => {
          appendToLastAssistant(`\n\n⚠️ 错误：${msg}`);
          setStreaming(false);
          setTelemetry({ tool: null, status: "idle" });
        },
      });
    } catch {
      setStreaming(false);
    }
  }

  const rightStatus = streaming
    ? telemetry.tool
      ? `正在执行 ${toolLabel(telemetry.tool)}`
      : "行程数据合成中…"
    : "Concierge 路线管家已就绪";

  return (
    <div className="flex h-full flex-col bg-surface">
      {/* 消息区 */}
      <div ref={scrollRef} className="airy-scroll flex-1 space-y-6 overflow-y-auto px-4 pb-6 pt-4">
        {messages.length === 0 && (
          <div className="flex flex-col gap-3 pt-2">
            <div className="mx-auto max-w-xl rounded-2xl border border-card-border/80 bg-surface-container-lowest p-6 shadow-float">
              <div className="mb-3 flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-container text-primary">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h2 className="text-body-md font-semibold text-ink">Concierge 路线规划管家</h2>
                  <p className="text-[12px] text-on-surface-variant/80">提供事实结构化行程数据与地图点位联动</p>
                </div>
              </div>
              <p className="mb-4 text-body-md text-on-surface leading-relaxed">
                请输入目的地、出行天数或偏好（如美食、景点、交通）：
              </p>
              <div className="flex flex-wrap gap-2.5">
                {PRESETS.map((p) => {
                  const Icon = p.icon;
                  return (
                    <button
                      key={p.label}
                      onClick={() => send(p.prompt)}
                      className="flex items-center gap-1.5 rounded-full border border-card-border bg-surface-container-low/70 px-4 py-2 text-[13px] font-medium text-ink transition-all hover:border-primary/50 hover:bg-primary-container/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <Icon size={14} className="text-primary" />
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {messages.map((m, i) => {
          const isLast = i === messages.length - 1;
          if (m.role === "user") {
            return (
              <div key={i} className="flex flex-col items-end gap-1">
                <div className="text-[12px] font-medium text-on-surface-variant/60">用户指令</div>
                <div className="max-w-[82%] rounded-2xl rounded-tr-xs bg-primary px-4 py-3 text-body-md text-on-primary shadow-soft">
                  {m.content}
                </div>
              </div>
            );
          }
          return (
            <div key={i} className="flex flex-col gap-1">
              <div className="text-[12px] font-medium text-on-surface-variant/60">
                {isLast && streaming ? "行程生成中" : "Concierge"}
              </div>

              <div className="max-w-3xl rounded-2xl rounded-tl-xs border border-card-border bg-surface-container-lowest p-5 shadow-float">
                <ReasoningBlock text={m.reasoning ?? ""} active={isLast && streaming && !m.content} />
                <ThinkingSteps steps={m.steps ?? []} />
                {isLast &&
                  streaming &&
                  !m.reasoning &&
                  !m.content &&
                  (m.steps?.length ?? 0) === 0 && (
                    <div className="flex items-center gap-2 text-label-sm text-on-surface-variant">
                      <Loader2 size={14} className="animate-spin text-primary" />
                      行程数据合成中…
                    </div>
                  )}
                {m.content && (
                  <div className="text-body-md leading-relaxed text-ink [&_li]:ml-4 [&_li]:list-disc [&_p]:my-1.5 [&_ul]:my-1.5">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                )}
                {/* 生成后推荐操作入口 */}
                {isLast && !streaming && itinerary && m.content && (
                  <div className="mt-4 flex items-center gap-2 border-t border-card-border/80 pt-3.5">
                    <span className="text-[12px] font-medium text-on-surface-variant">生成结果：</span>
                    <button
                      onClick={() => setTab("plan")}
                      className="flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-[12px] font-medium text-on-primary shadow-soft transition-transform hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <CalendarRange size={14} /> 查看行程计划
                    </button>
                    <button
                      onClick={() => setTab("map")}
                      className="flex items-center gap-1.5 rounded-full border border-card-border bg-surface-container-low px-3.5 py-1.5 text-[12px] font-medium text-ink transition-colors hover:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <MapPin size={14} className="text-secondary" /> 查看路线地图
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 浮动空气感搜索输入岛 */}
      <div className="border-t border-card-border/60 bg-surface/80 px-4 pb-3 pt-2.5 backdrop-blur">
        <div className="mx-auto max-w-3xl">
          {/* 搜索岛上方的灵感 Preset 快捷标签 */}
          <div className="no-scrollbar mb-2 flex items-center gap-2 overflow-x-auto">
            <span className="shrink-0 text-[11px] font-medium text-on-surface-variant/70">快速指令:</span>
            {PRESETS.map((p) => {
              const Icon = p.icon;
              return (
                <button
                  key={p.label}
                  onClick={() => send(p.prompt)}
                  disabled={streaming}
                  className="flex shrink-0 items-center gap-1.5 rounded-full border border-card-border/80 bg-surface-container-lowest px-3 py-1 text-[12px] font-medium text-ink shadow-soft transition-all hover:border-primary/50 hover:bg-primary-container/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
                >
                  <Icon size={13} className="text-primary" />
                  {p.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center rounded-full border border-card-border bg-surface-container-lowest px-4 py-1.5 shadow-float transition-colors focus-within:border-primary/70 focus-within:ring-2 focus-within:ring-primary/20">
            <Compass size={18} className="mr-2.5 text-primary shrink-0" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              disabled={streaming}
              placeholder="输入目的地或出行偏好..."
              aria-label="输入旅行意图或下一站"
              className="flex-1 border-none bg-transparent py-2.5 text-[15px] text-ink outline-none placeholder:text-on-surface-variant/50"
            />
            <button
              onClick={() => send()}
              disabled={streaming || !input.trim()}
              className="ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary transition-all hover:opacity-90 active:scale-95 disabled:bg-surface-container-high disabled:text-on-surface-variant/40"
              aria-label="发送"
            >
              <Send size={16} />
            </button>
          </div>
          <div className="mt-2 flex justify-between px-3 text-[11px] font-medium text-on-surface-variant/60">
            <span>Concierge Route System</span>
            <span className="flex items-center gap-1.5">
              {streaming && (
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              )}
              {rightStatus}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}


