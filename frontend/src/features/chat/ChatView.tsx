import { useRef, useState, useEffect } from "react";
import { Loader2, Send, ListTree, Map } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useAppStore } from "../../store/useAppStore";
import { streamChat } from "../../lib/api";
import { toolLabel } from "../../lib/labels";
import { ThinkingSteps } from "./ThinkingSteps";
import { ReasoningBlock } from "./ReasoningBlock";
import { LogDivider } from "./LogDivider";

/** 空状态的快捷指令（点击直接发送）。 */
const PRESETS = [
  { label: "上海周末2日游", prompt: "帮我规划上海周末2日游，2-3个核心景点" },
  { label: "成都美食2日", prompt: "帮我规划成都2日游，重点美食和熊猫基地" },
  { label: "杭州西湖一日", prompt: "帮我规划杭州西湖一日游" },
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
      ? `执行 ${toolLabel(telemetry.tool)}`
      : "合成中…"
    : "安全连接已激活";

  return (
    <div className="flex h-full flex-col">
      {/* 消息区 */}
      <div ref={scrollRef} className="terminal-scroll flex-1 space-y-8 overflow-y-auto px-4 pb-6 pt-6">
        {messages.length === 0 && (
          <div className="flex flex-col gap-2">
            <LogDivider label="系统初始化" side="left" />
            <div className="max-w-2xl rounded-lg border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
              <h2 className="mb-2 flex items-center gap-2 font-mono text-code-md text-primary-container">
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary-container" />
                旅行规划师 已就绪
              </h2>
              <p className="mb-4 font-mono text-code-md leading-relaxed text-on-surface">
                已建立与高德地图服务的连接
                <br />
                准备为你合成行程。想先去哪里？
              </p>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => send(p.prompt)}
                    className="border border-transparent bg-secondary-container px-4 py-2 font-mono text-label-sm text-on-secondary-container transition-all hover:border-secondary"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((m, i) => {
          const isLast = i === messages.length - 1;
          if (m.role === "user") {
            return (
              <div key={i} className="flex flex-col items-end gap-2">
                <LogDivider label="用户请求" side="right" />
                <div className="max-w-[80%] rounded-lg bg-primary p-4 text-body-md text-on-primary">
                  {m.content}
                </div>
              </div>
            );
          }
          return (
            <div key={i} className="flex flex-col gap-2">
              <LogDivider label={isLast && streaming ? "正在合成行程" : "旅行规划师"} side="left" />
              <div className="max-w-3xl rounded-lg border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
                <ReasoningBlock text={m.reasoning ?? ""} active={isLast && streaming && !m.content} />
                <ThinkingSteps steps={m.steps ?? []} />
                {isLast &&
                  streaming &&
                  !m.reasoning &&
                  !m.content &&
                  (m.steps?.length ?? 0) === 0 && (
                    <div className="flex items-center gap-2 font-mono text-label-sm text-on-surface-variant">
                      <Loader2 size={12} className="animate-spin text-primary-container" />
                      正在思考…
                    </div>
                  )}
                {m.content && (
                  <div className="text-body-md leading-relaxed [&_li]:ml-4 [&_li]:list-disc [&_p]:my-1 [&_ul]:my-1">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                )}
                {/* 建议操作：行程生成后给出导航入口（参考设计稿） */}
                {isLast && !streaming && itinerary && m.content && (
                  <div className="mt-4 flex items-center gap-2 border-t border-outline-variant pt-4">
                    <span className="font-mono text-label-sm text-on-surface-variant">建议操作:</span>
                    <button
                      onClick={() => setTab("plan")}
                      className="flex items-center gap-1 border border-ink px-3 py-1.5 font-mono text-label-sm text-ink transition-colors hover:bg-ink hover:text-surface"
                    >
                      <ListTree size={14} /> 查看计划
                    </button>
                    <button
                      onClick={() => setTab("map")}
                      className="flex items-center gap-1 border border-outline px-3 py-1.5 font-mono text-label-sm text-on-surface-variant transition-colors hover:bg-surface-container-high"
                    >
                      <Map size={14} /> 渲染地图
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 终端风输入区 + 遥测 */}
      <div className="border-t border-outline-variant bg-surface px-4 pb-3 pt-3">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center rounded border border-outline-variant bg-surface-container-lowest transition-colors focus-within:border-primary-container">
            <span className="animate-pulse px-4 font-mono font-bold text-primary-container">&gt;</span>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              disabled={streaming}
              placeholder="接下来去哪？"
              className="flex-1 border-none bg-transparent py-3 font-mono text-code-md text-ink outline-none placeholder:text-on-surface-variant/40"
            />
            <button
              onClick={() => send()}
              disabled={streaming || !input.trim()}
              className="p-3 text-on-surface-variant transition-colors hover:text-primary-container disabled:opacity-40"
              aria-label="发送"
            >
              <Send size={18} />
            </button>
          </div>
          <div className="mt-2 flex justify-between px-1 font-mono text-label-sm uppercase text-on-surface-variant/50">
            <span>deepseek-v4-flash</span>
            <span className="flex items-center gap-1.5">
              {streaming && (
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary-container" />
              )}
              {rightStatus}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
