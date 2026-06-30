/** 终端日志风格的消息分隔：`标签 ———— 时间` 或 `———— 标签`（参考设计稿）。 */
export function LogDivider({
  label,
  side,
  time,
}: {
  label: string;
  side: "left" | "right";
  time?: string;
}) {
  const line = <div className="h-px flex-1 bg-outline-variant" />;
  return (
    <div className="flex w-full items-center gap-2 opacity-50">
      {side === "right" && line}
      <span className="font-mono text-label-sm uppercase text-on-surface-variant">{label}</span>
      {side === "left" && line}
      {time && (
        <span className="font-mono text-label-sm uppercase text-on-surface-variant">{time}</span>
      )}
    </div>
  );
}
