import { useAppStore } from "../../store/useAppStore";
import { toolLabel } from "../../lib/labels";

/** 系统遥测条：强化技术主题感（CPU 空闲 / 延迟 / 当前工具）。 */
export function TelemetryBar() {
  const telemetry = useAppStore((s) => s.telemetry);
  const streaming = useAppStore((s) => s.streaming);

  const status = streaming
    ? telemetry.tool
      ? `执行 ${toolLabel(telemetry.tool)}`
      : "生成中"
    : "空闲";

  return (
    <div className="flex items-center gap-4 border-b border-card-border bg-surface-container-low px-4 py-1.5 font-mono text-label-sm text-on-surface-variant">
      <span className="flex items-center gap-1.5">
        <span className={`h-1.5 w-1.5 rounded-full ${streaming ? "bg-primary-container animate-pulse" : "bg-teal"}`} />
        {status}
      </span>
      <span>deepseek-v4-flash</span>
      <span className="ml-auto">旅行规划师</span>
    </div>
  );
}
