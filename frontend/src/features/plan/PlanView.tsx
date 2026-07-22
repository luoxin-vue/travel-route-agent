import { useState } from "react";
import { useAppStore } from "../../store/useAppStore";
import type { ItineraryNode } from "../../types";
import { isStopNode } from "../../types";
import { PlanSummary } from "./PlanSummary";
import { RouteTimeline } from "./RouteTimeline";
import { NodeEditModal } from "./NodeEditModal";
import { EmptyState } from "../../components/EmptyState";

export function PlanView() {
  const itinerary = useAppStore((s) => s.itinerary);
  const activeRouteId = useAppStore((s) => s.activeRouteId);
  const savedRoutes = useAppStore((s) => s.savedRoutes);
  const toggleNodeComplete = useAppStore((s) => s.toggleNodeComplete);
  const updateNode = useAppStore((s) => s.updateNode);
  const addNode = useAppStore((s) => s.addNode);
  const deleteNode = useAppStore((s) => s.deleteNode);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleOpenEdit = (index: number) => {
    setEditingIndex(index);
    setIsModalOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingIndex(null);
    setIsModalOpen(true);
  };

  const handleSaveNode = (node: ItineraryNode, index: number | null) => {
    if (index !== null) {
      updateNode(index, node);
    } else {
      addNode(node);
    }
  };

  const handleDeleteNode = (index: number) => {
    deleteNode(index);
  };

  const editingNode = editingIndex !== null ? itinerary.nodes[editingIndex] ?? null : null;

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
        onEditNode={handleOpenEdit}
        onAddNode={handleOpenAdd}
      />
      <NodeEditModal
        isOpen={isModalOpen}
        node={editingNode}
        nodeIndex={editingIndex}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveNode}
        onDelete={handleDeleteNode}
      />
    </div>
  );
}

