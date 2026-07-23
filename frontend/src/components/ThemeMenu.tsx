import { useEffect, useRef } from "react";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import type { ThemePreference } from "../types";

interface ThemeMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const OPTIONS: { key: ThemePreference; label: string; Icon: typeof Sun }[] = [
  { key: "light", label: "浅色", Icon: Sun },
  { key: "dark", label: "深色", Icon: Moon },
  { key: "system", label: "跟随系统", Icon: Monitor },
];

/**
 * 顶栏主题快捷气泡：点击选项立即写回偏好并关闭；点击外部或按 Esc 也关闭。
 * 选中的勾号落在"用户偏好"上，不落在"实际生效"上 —— 用户选过 system 但 OS 此刻浅色时，
 * 仍认为他在 system 模式。
 */
export function ThemeMenu({ isOpen, onClose }: ThemeMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const preference = useAppStore((s) => s.travelPreferences.theme);
  const updatePreferences = useAppStore((s) => s.updatePreferences);

  useEffect(() => {
    if (!isOpen) return;
    const onClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={ref}
      role="menu"
      aria-label="主题外观"
      className="absolute right-0 top-full z-30 mt-2 w-44 overflow-hidden rounded-xl border border-card-border bg-surface-container-lowest shadow-float"
    >
      {OPTIONS.map((opt) => {
        const isActive = preference === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            role="menuitem"
            onClick={() => {
              updatePreferences({ theme: opt.key });
              onClose();
            }}
            className={`flex w-full items-center gap-2 px-3 py-2 text-[13px] font-medium transition-colors ${
              isActive
                ? "bg-primary-container/40 text-primary"
                : "text-on-surface-variant hover:bg-surface-container hover:text-ink"
            }`}
          >
            <opt.Icon size={15} className="shrink-0" />
            <span className="flex-1 text-left">{opt.label}</span>
            {isActive && <Check size={14} className="shrink-0 text-primary" />}
          </button>
        );
      })}
    </div>
  );
}
