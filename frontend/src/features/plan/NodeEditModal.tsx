import { useState } from "react";
import { X, Trash2, MapPin, Calendar, Clock, Navigation, FileText, Image as ImageIcon, Route } from "lucide-react";
import type { ItineraryNode, NodeType } from "../../types";

interface NodeEditModalProps {
  isOpen: boolean;
  node: ItineraryNode | null;
  nodeIndex: number | null; // null 表示新增节点
  onClose: () => void;
  onSave: (node: ItineraryNode, index: number | null) => void;
  onDelete?: (index: number) => void;
}

const PROTOCOL_OPTIONS = [
  { value: "WALKING", label: "步行" },
  { value: "DRIVING", label: "驾车" },
  { value: "TRANSIT", label: "公共交通" },
  { value: "METRO", label: "地铁" },
  { value: "BUS", label: "公交" },
  { value: "HIGH_SPEED_RAIL", label: "高铁" },
  { value: "TRAIN", label: "火车" },
  { value: "FLIGHT", label: "飞机" },
  { value: "TAXI", label: "打车" },
  { value: "BICYCLING", label: "骑行" },
];

export function NodeEditModal({
  isOpen,
  node,
  nodeIndex,
  onClose,
  onSave,
  onDelete,
}: NodeEditModalProps) {
  if (!isOpen) return null;

  const isEditing = nodeIndex !== null && node !== null;

  const [type, setType] = useState<NodeType>(node?.type ?? "activity");
  const [name, setName] = useState(node?.name ?? "");
  const [day, setDay] = useState<number>(node?.day ?? 1);
  const [startTime, setStartTime] = useState(node?.start_time ?? "");
  const [endTime, setEndTime] = useState(node?.end_time ?? "");
  const [protocol, setProtocol] = useState(node?.protocol ?? "WALKING");
  const [locationSummary, setLocationSummary] = useState(node?.location_summary ?? "");
  const [duration, setDuration] = useState(node?.duration ?? "");
  const [nextDistanceKm, setNextDistanceKm] = useState<string>(node?.next_distance_km != null ? String(node.next_distance_km) : "");
  const [notes, setNotes] = useState(node?.notes ?? "");
  const [image, setImage] = useState(node?.image ?? "");

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const updatedNode: ItineraryNode = {
      lng: node?.lng ?? null,
      lat: node?.lat ?? null,
      booking_id: node?.booking_id ?? null,
      ...node,
      type,
      name: name.trim(),
      day: Number(day) || 1,
      start_time: startTime.trim() || null,
      end_time: endTime.trim() || null,
      protocol: protocol || null,
      location_summary: locationSummary.trim() || null,
      duration: duration.trim() || null,
      next_distance_km: nextDistanceKm.trim() ? Number(nextDistanceKm) : null,
      notes: notes.trim() || null,
      image: image.trim() || null,
    };

    onSave(updatedNode, nodeIndex);
    onClose();
  };




  const handleDelete = () => {
    if (isEditing && onDelete && nodeIndex !== null) {
      onDelete(nodeIndex);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-lg rounded-2xl border border-card-border bg-surface p-6 shadow-xl">
        {/* 顶部标题与关闭按钮 */}
        <div className="mb-5 flex items-center justify-between border-b border-card-border pb-3">
          <h3 className="text-headline-md font-semibold text-ink">
            {isEditing ? "编辑行程节点" : "添加新游玩节点"}
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-on-surface-variant hover:bg-surface-container hover:text-ink transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 节点类型选择 */}
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-ink">节点类型</label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { key: "activity", label: "景点活动" },
                  { key: "lodging", label: "过夜住宿" },
                  { key: "transport", label: "交通衔接" },
                ] as const
              ).map((nodeTypeOption) => (
                <button
                  key={nodeTypeOption.key}
                  type="button"
                  onClick={() => setType(nodeTypeOption.key)}
                  className={`whitespace-nowrap rounded-xl border px-3 py-2 text-[13px] font-medium transition-all ${
                    type === nodeTypeOption.key
                      ? "border-primary bg-primary-container/40 text-primary shadow-soft"
                      : "border-card-border bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  {nodeTypeOption.label}
                </button>
              ))}
            </div>
          </div>


          {/* 节点名称 */}
          <div>
            <label className="mb-1 block text-[13px] font-medium text-ink">节点名称 *</label>
            <div className="relative flex items-center">
              <MapPin size={16} className="absolute left-3 text-on-surface-variant" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：故宫博物院 / 宝格丽酒店"
                className="w-full rounded-xl border border-card-border bg-surface-container-low pl-9 pr-3 py-2 text-[14px] text-ink focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* 城市区域 & 建议游玩时长 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[12px] font-medium text-on-surface-variant">
                城市/区域描述
              </label>
              <div className="relative flex items-center">
                <MapPin size={15} className="absolute left-2.5 text-on-surface-variant" />
                <input
                  type="text"
                  value={locationSummary}
                  onChange={(e) => setLocationSummary(e.target.value)}
                  placeholder="例如：北京 · 东城区"
                  className="w-full rounded-xl border border-card-border bg-surface-container-low pl-8 pr-2 py-1.5 text-[13px] text-ink focus:border-primary focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-medium text-on-surface-variant">
                建议游玩/停留时长
              </label>
              <div className="relative flex items-center">
                <Clock size={15} className="absolute left-2.5 text-on-surface-variant" />
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="例如：建议游玩 2.5 小时"
                  className="w-full rounded-xl border border-card-border bg-surface-container-low pl-8 pr-2 py-1.5 text-[13px] text-ink focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          </div>


          {/* 天数与时间 */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-[12px] font-medium text-on-surface-variant">
                第几天 (Day)
              </label>
              <div className="relative flex items-center">
                <Calendar size={15} className="absolute left-2.5 text-on-surface-variant" />
                <input
                  type="number"
                  min={1}
                  value={day}
                  onChange={(e) => setDay(Number(e.target.value))}
                  className="w-full rounded-xl border border-card-border bg-surface-container-low pl-8 pr-2 py-1.5 text-[13px] text-ink focus:border-primary focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-medium text-on-surface-variant">
                开始时间
              </label>
              <div className="relative flex items-center">
                <Clock size={15} className="absolute left-2.5 text-on-surface-variant" />
                <input
                  type="text"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  placeholder="09:00"
                  className="w-full rounded-xl border border-card-border bg-surface-container-low pl-8 pr-2 py-1.5 text-[13px] text-ink focus:border-primary focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-medium text-on-surface-variant">
                结束时间
              </label>
              <div className="relative flex items-center">
                <Clock size={15} className="absolute left-2.5 text-on-surface-variant" />
                <input
                  type="text"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  placeholder="11:30"
                  className="w-full rounded-xl border border-card-border bg-surface-container-low pl-8 pr-2 py-1.5 text-[13px] text-ink focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 出行方式/协议与距下站距离 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[13px] font-medium text-ink">交通/出行方式</label>
              <div className="relative flex items-center">
                <Navigation size={16} className="absolute left-3 text-on-surface-variant" />
                <select
                  value={protocol}
                  onChange={(e) => setProtocol(e.target.value)}
                  className="w-full rounded-xl border border-card-border bg-surface-container-low pl-9 pr-3 py-2 text-[13px] text-ink focus:border-primary focus:outline-none"
                >
                  {PROTOCOL_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[13px] font-medium text-ink">到下站距离(km)</label>
              <div className="relative flex items-center">
                <Route size={15} className="absolute left-2.5 text-on-surface-variant" />
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={nextDistanceKm}
                  onChange={(e) => setNextDistanceKm(e.target.value)}
                  placeholder="如：3.2"
                  className="w-full rounded-xl border border-card-border bg-surface-container-low pl-8 pr-2 py-2 text-[13px] text-ink focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          </div>


          {/* 备注说明 */}
          <div>
            <label className="mb-1 block text-[13px] font-medium text-ink">备注与游玩建议</label>
            <div className="relative flex items-start">
              <FileText size={16} className="absolute left-3 top-3 text-on-surface-variant" />
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="填写注意事项或推荐门票/餐饮..."
                className="w-full rounded-xl border border-card-border bg-surface-container-low pl-9 pr-3 py-2 text-[14px] text-ink focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* 图片 URL */}
          <div>
            <label className="mb-1 block text-[13px] font-medium text-ink">封面图片链接</label>
            <div className="relative flex items-center">
              <ImageIcon size={16} className="absolute left-3 text-on-surface-variant" />
              <input
                type="url"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-xl border border-card-border bg-surface-container-low pl-9 pr-3 py-2 text-[13px] text-ink focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* 底部操作控制线 */}
          <div className="mt-6 flex items-center justify-between border-t border-card-border pt-4">
            {isEditing && onDelete ? (
              isConfirmingDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-medium text-error">确定删除？</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="rounded-lg bg-error px-2.5 py-1 text-[12px] font-medium text-white hover:bg-error/90 transition-colors"
                  >
                    确认
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(false)}
                    className="rounded-lg border border-card-border px-2.5 py-1 text-[12px] text-on-surface-variant hover:bg-surface-container"
                  >
                    取消
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(true)}
                  className="flex items-center gap-1 text-[13px] font-medium text-error/80 hover:text-error transition-colors"
                >
                  <Trash2 size={15} />
                  <span>删除节点</span>
                </button>
              )
            ) : (
              <div />
            )}


            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-card-border px-4 py-2 text-[13px] font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                className="rounded-xl bg-primary px-5 py-2 text-[13px] font-medium text-white shadow-soft hover:bg-primary/90 transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
