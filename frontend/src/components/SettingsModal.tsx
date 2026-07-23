import { useState } from "react";
import { X, Sliders, HardDrive, Cpu, Check, Download, Trash2, ShieldCheck, Compass, Sun, Moon, Monitor } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import type { ThemePreference } from "../types";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = "preferences" | "appearance" | "data" | "system";

/** 全局偏好与设置模态窗口（Warm Linen 暖白精致气泡风格）。 */
export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<SettingsTab>("preferences");

  const travelPreferences = useAppStore((state) => state.travelPreferences);
  const updatePreferences = useAppStore((state) => state.updatePreferences);
  const clearMessages = useAppStore((state) => state.clearMessages);
  const resetSavedRoutes = useAppStore((state) => state.resetSavedRoutes);
  const savedRoutes = useAppStore((state) => state.savedRoutes);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isConfirmingResetRoutes, setIsConfirmingResetRoutes] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleExportJSON = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(savedRoutes, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `travel_routes_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast("路线库 JSON 导出成功");
    } catch {
      showToast("导出失败");
    }
  };

  const handleClearChat = () => {
    clearMessages();
    showToast("当前对话记录已清空");
  };

  const handleResetRoutes = () => {
    resetSavedRoutes();
    setIsConfirmingResetRoutes(false);
    showToast("路线库已重置清空");
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm transition-opacity">
      <div className="relative flex h-[520px] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-card-border bg-surface shadow-2xl">
        {/* 顶部 Header */}
        <div className="flex items-center justify-between border-b border-card-border/60 px-6 py-4">
          <div className="flex items-center gap-2">
            <Compass size={20} className="text-primary" />
            <h3 className="text-headline-md font-semibold text-ink">随心管家 · 系统设置</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-on-surface-variant hover:bg-surface-container hover:text-ink transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* 提示消息 Toast */}
        {toastMsg && (
          <div className="absolute top-16 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-ink px-4 py-1.5 text-[12px] font-medium text-white shadow-soft animate-fade-in">
            <Check size={14} className="text-secondary" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* 主体：小屏顶部 Horizontal Tabs，大屏左侧 Vertical Sidebar */}
        <div className="flex flex-1 flex-col sm:flex-row overflow-hidden">
          {/* 导航栏：小屏顶部横排，大屏左侧竖排 */}
          <div className="flex shrink-0 border-b sm:border-b-0 sm:border-r border-card-border/60 bg-surface-container-low/60 p-2 sm:p-3 sm:w-44 sm:flex-col space-x-1 sm:space-x-0 sm:space-y-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab("preferences")}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-medium whitespace-nowrap transition-all ${
                activeTab === "preferences"
                  ? "bg-primary-container/70 text-primary shadow-soft"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-ink"
              }`}
            >
              <Sliders size={16} className="shrink-0" />
              <span>旅行偏好</span>
            </button>
            <button
              onClick={() => setActiveTab("appearance")}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-medium whitespace-nowrap transition-all ${
                activeTab === "appearance"
                  ? "bg-primary-container/70 text-primary shadow-soft"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-ink"
              }`}
            >
              <Sun size={16} className="shrink-0" />
              <span>外观</span>
            </button>
            <button
              onClick={() => setActiveTab("data")}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-medium whitespace-nowrap transition-all ${
                activeTab === "data"
                  ? "bg-primary-container/70 text-primary shadow-soft"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-ink"
              }`}
            >
              <HardDrive size={16} className="shrink-0" />
              <span>数据与存储</span>
            </button>
            <button
              onClick={() => setActiveTab("system")}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-medium whitespace-nowrap transition-all ${
                activeTab === "system"
                  ? "bg-primary-container/70 text-primary shadow-soft"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-ink"
              }`}
            >
              <Cpu size={16} className="shrink-0" />
              <span>系统与地图</span>
            </button>
          </div>

          {/* 内容区域：占用全部可用宽度 */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {activeTab === "preferences" && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-[14px] font-semibold text-ink">出行方式偏好</h4>
                  <p className="mt-0.5 text-[12px] text-on-surface-variant">
                    生成行程方案时默认优先考量的交通出行方式。
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2.5">
                    {[
                      { key: "TRANSIT", label: "公共交通" },
                      { key: "DRIVING", label: "驾车自驾" },
                      { key: "WALKING", label: "步行随心" },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => updatePreferences({ defaultProtocol: opt.key })}
                        className={`flex-1 min-w-[100px] whitespace-nowrap rounded-xl border px-3 py-2.5 text-[13px] font-medium text-center transition-all ${
                          travelPreferences.defaultProtocol === opt.key
                            ? "border-primary bg-primary-container/40 text-primary shadow-soft"
                            : "border-card-border bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-card-border/60 pt-5">
                  <h4 className="text-[14px] font-semibold text-ink">行程节奏倾向</h4>
                  <p className="mt-0.5 text-[12px] text-on-surface-variant">
                    控制每日打卡节点的密度与游玩时长安排。
                  </p>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { key: "relaxed", label: "轻松休闲", desc: "每天 2~3 个精选景点，充足休息" },
                      { key: "compact", label: "充实紧凑", desc: "高效打卡高分景点，行程饱满" },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => updatePreferences({ pace: opt.key as "relaxed" | "compact" })}
                        className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                          travelPreferences.pace === opt.key
                            ? "border-primary bg-primary-container/40 text-primary shadow-soft"
                            : "border-card-border bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                        }`}
                      >
                        <span className="text-[13px] font-semibold whitespace-nowrap">{opt.label}</span>
                        <span className="mt-1 text-[11px] text-on-surface-variant/80">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "appearance" && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-[14px] font-semibold text-ink">主题外观</h4>
                  <p className="mt-0.5 text-[12px] text-on-surface-variant">
                    选择浅色、深色或跟随系统；新用户默认跟随系统。
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2.5">
                    {([
                      { key: "light", label: "浅色", Icon: Sun },
                      { key: "dark", label: "深色", Icon: Moon },
                      { key: "system", label: "跟随系统", Icon: Monitor },
                    ] as { key: ThemePreference; label: string; Icon: typeof Sun }[]).map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => updatePreferences({ theme: opt.key })}
                        className={`flex flex-1 min-w-[100px] items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border px-3 py-2.5 text-[13px] font-medium transition-all ${
                          travelPreferences.theme === opt.key
                            ? "border-primary bg-primary-container/40 text-primary shadow-soft"
                            : "border-card-border bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                        }`}
                      >
                        <opt.Icon size={15} className="shrink-0" />
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "data" && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-[14px] font-semibold text-ink">会话记录管理</h4>
                  <p className="mt-0.5 text-[12px] text-on-surface-variant">
                    清空当前的对话消息记录，路线库不受影响。
                  </p>
                  <button
                    onClick={handleClearChat}
                    className="mt-3 inline-flex items-center justify-center whitespace-nowrap rounded-xl border border-card-border bg-surface-container-low px-4 py-2 text-[13px] font-medium text-ink hover:bg-surface-container transition-colors"
                  >
                    清空聊天会话记录
                  </button>
                </div>

                <div className="border-t border-card-border/60 pt-5">
                  <h4 className="text-[14px] font-semibold text-ink">路线库导出与重置</h4>
                  <p className="mt-0.5 text-[12px] text-on-surface-variant">
                    将本地收藏与规划的路线导出为 JSON 数据备份，或清理本地路线数据。
                  </p>
                  <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-3">
                    <button
                      onClick={handleExportJSON}
                      className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-primary/40 bg-primary-container/30 px-4 py-2 text-[13px] font-medium text-primary hover:bg-primary-container/60 transition-colors"
                    >
                      <Download size={15} className="shrink-0" />
                      <span>导出路线库 (JSON)</span>
                    </button>

                    {isConfirmingResetRoutes ? (
                      <div className="flex flex-wrap items-center gap-2 pt-1 sm:pt-0">
                        <span className="text-[12px] font-medium text-error whitespace-nowrap">确定重置所有路线？</span>
                        <button
                          onClick={handleResetRoutes}
                          className="whitespace-nowrap rounded-lg bg-error px-3 py-1.5 text-[12px] font-medium text-white hover:bg-error/90"
                        >
                          确定
                        </button>
                        <button
                          onClick={() => setIsConfirmingResetRoutes(false)}
                          className="whitespace-nowrap rounded-lg border border-card-border px-3 py-1.5 text-[12px] text-on-surface-variant"
                        >
                          取消
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsConfirmingResetRoutes(true)}
                        className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-error/30 bg-error/10 px-4 py-2 text-[13px] font-medium text-error hover:bg-error/20 transition-colors"
                      >
                        <Trash2 size={15} className="shrink-0" />
                        <span>重置路线库</span>
                      </button>
                    )}

                  </div>
                </div>
              </div>
            )}

            {activeTab === "system" && (
              <div className="space-y-5">
                <div>
                  <h4 className="text-[14px] font-semibold text-ink">高德地图 API 状态</h4>
                  <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border border-card-border bg-surface-container-low p-3.5">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck size={18} className="text-secondary shrink-0" />
                      <div>
                        <span className="block text-[13px] font-medium text-ink">Amap Web JS API</span>
                        <span className="text-[11px] text-on-surface-variant">包含 JavaScript Key & 安全密钥配置</span>
                      </div>
                    </div>
                    <span className="self-start sm:self-auto shrink-0 whitespace-nowrap rounded-full bg-secondary/20 px-2.5 py-0.5 text-[12px] font-semibold text-secondary">
                      在网正常
                    </span>
                  </div>
                </div>

                <div className="border-t border-card-border/60 pt-5">
                  <h4 className="text-[14px] font-semibold text-ink">系统说明与架构</h4>
                  <div className="mt-3 rounded-xl border border-card-border/60 bg-surface-container-low/40 p-4 text-[12px] leading-relaxed text-on-surface-variant space-y-1">
                    <p><strong className="text-ink">应用版本：</strong>v0.1.0 (Concierge Daemon)</p>
                    <p><strong className="text-ink">视觉风格：</strong>Warm Linen & Terracotta 棉麻暖感风格</p>
                    <p><strong className="text-ink">驱动技术：</strong>FastAPI + LangChain + React + Zustand + Amap</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
