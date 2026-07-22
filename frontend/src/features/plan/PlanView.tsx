import { useState, useEffect } from "react";
import { useAppStore } from "../../store/useAppStore";
import type { ItineraryNode } from "../../types";
import { isStopNode } from "../../types";
import { PlanSummary } from "./PlanSummary";
import { RouteTimeline } from "./RouteTimeline";
import { NodeEditModal } from "./NodeEditModal";
import { EmptyState } from "../../components/EmptyState";

export function PlanView() {
  const itinerary = useAppStore((state) => state.itinerary);
  const activeRouteId = useAppStore((state) => state.activeRouteId);
  const savedRoutes = useAppStore((state) => state.savedRoutes);
  const toggleNodeComplete = useAppStore((state) => state.toggleNodeComplete);
  const updateNode = useAppStore((state) => state.updateNode);
  const addNode = useAppStore((state) => state.addNode);
  const deleteNode = useAppStore((state) => state.deleteNode);

  // 页面刷新后 itinerary 为 null 但 activeRouteId 已持久化，自动从路线库恢复
  useEffect(() => {
    if (!itinerary && activeRouteId) {
      const restored = savedRoutes.find((route) => route.id === activeRouteId);
      if (restored) {
        useAppStore.setState({ itinerary: restored.itinerary });
      } else {
        useAppStore.setState({ activeRouteId: null });
      }
    }
    // 运行时清理：活动路线被删除后清除已失效的 activeRouteId
    if (activeRouteId && itinerary && !savedRoutes.some((route) => route.id === activeRouteId)) {
      useAppStore.setState({ activeRouteId: null });
    }
  }, [itinerary, activeRouteId, savedRoutes]);

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

