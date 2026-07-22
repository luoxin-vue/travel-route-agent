import { useAppStore } from "../../store/useAppStore";
import { toolLabel } from "../../lib/labels";

/** 系统遥测条：强化技术主题感（CPU 空闲 / 延迟 / 当前工具）。 */
export function TelemetryBar() {
  const telemetry = useAppStore((storeState) => storeState.telemetry);
  const streaming = useAppStore((storeState) => storeState.streaming);

  const status = streaming
    ? telemetry.tool
      ? `执行 ${toolLabel(telemetry.tool)}`
      : "生成中"
    : "空闲";

  return (
    <div className="flex items-center gap-4 border-b border-card-border bg-surface-container-low px-4 py-1.5 font-sans text-label-sm text-on-surface-variant">
      <span className="flex items-center gap-1.5">
        <span className={`h-1.5 w-1.5 rounded-full ${streaming ? "bg-primary animate-pulse" : "bg-secondary"}`} />
        {status}
      </span>
      <span>Concierge Agent v2.0</span>
      <span className="ml-auto">随心行程管家</span>
    </div>
  );
}

