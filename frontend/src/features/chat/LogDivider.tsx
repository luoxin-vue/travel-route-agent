/** 随心旅行管家消息角色/时间指示标记。 */
export function LogDivider({
  label,
  side,
  time,
}: {
  label: string;
  side: "left" | "right";
  time?: string;
}) {
  return (
    <div className={`flex w-full items-center gap-2 px-1 text-[12px] font-medium text-on-surface-variant/60 ${side === "right" ? "justify-end" : "justify-start"}`}>
      <span>{label}</span>
      {time && <span>· {time}</span>}
    </div>
  );
}

