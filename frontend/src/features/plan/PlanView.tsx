import { useAppStore } from "../../store/useAppStore";
import { PlanSummary } from "./PlanSummary";
import { RouteTimeline } from "./RouteTimeline";
import { EmptyState } from "../../components/EmptyState";

export function PlanView() {
  const itinerary = useAppStore((s) => s.itinerary);
  if (!itinerary) {
    return <EmptyState title="尚无行程" hint="在「会话」Tab 描述需求，Agent 将在此生成行程时间轴。" />;
  }
  return (
    <div className="h-full overflow-y-auto px-4 pb-8 pt-6">
      <PlanSummary itinerary={itinerary} />
      <RouteTimeline itinerary={itinerary} />
    </div>
  );
}
