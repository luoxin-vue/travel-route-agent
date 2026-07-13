import { useAppStore } from "../../store/useAppStore";
import { isStopNode } from "../../types";
import { PlanSummary } from "./PlanSummary";
import { RouteTimeline } from "./RouteTimeline";
import { EmptyState } from "../../components/EmptyState";

export function PlanView() {
  const itinerary = useAppStore((s) => s.itinerary);
  const activeRouteId = useAppStore((s) => s.activeRouteId);
  const savedRoutes = useAppStore((s) => s.savedRoutes);
  const toggleNodeComplete = useAppStore((s) => s.toggleNodeComplete);

  if (!itinerary) {
    return <EmptyState title="尚无行程" hint="请在 会话 里描述需求，Agent 将在此生成行程时间轴。" />;
  }

  const activeRoute = activeRouteId
    ? savedRoutes.find((r) => r.id === activeRouteId)
    : undefined;
  const completedNodes = activeRoute?.completedNodes ?? [];
  const totalStops = activeRoute
    ? activeRoute.itinerary.nodes.filter(isStopNode).length
    : undefined;
  const completedCount = activeRoute ? completedNodes.length : undefined;
  const onToggleNode = activeRouteId
    ? (key: string) => toggleNodeComplete(activeRouteId, key)
    : undefined;

  return (
    <div className="h-full overflow-y-auto px-4 pb-8 pt-6">
      <PlanSummary
        itinerary={itinerary}
        completedCount={completedCount}
        totalStops={totalStops}
      />
      <RouteTimeline
        itinerary={itinerary}
        completedNodes={completedNodes}
        onToggleNode={onToggleNode}
      />
    </div>
  );
}
