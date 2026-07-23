import { useEffect, useLayoutEffect, useState } from "react";
import type { ThemePreference } from "../types";
import { useAppStore } from "../store/useAppStore";

/** 实际应用到 DOM 的主题：用户偏好与系统设置解析后的最终结果。 */
export type ResolvedTheme = "light" | "dark";

/**
 * 解析用户偏好为实际生效主题。
 * `light` / `dark` 是用户显式锁定，直接返回；`system` 则读系统偏好。
 */
export function resolveTheme(preference: ThemePreference, systemPrefersDark: boolean): ResolvedTheme {
  if (preference === "light") return "light";
  if (preference === "dark") return "dark";
  return systemPrefersDark ? "dark" : "light";
}

const DARK_QUERY = "(prefers-color-scheme: dark)";

/** 订阅系统深色模式变化的 hook。SSR / 无 matchMedia 时默认 false（浅色）。 */
export function useSystemPrefersDark(): boolean {
  const [prefersDark, setPrefersDark] = useState<boolean>(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia(DARK_QUERY).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia(DARK_QUERY);
    const onChange = (event: MediaQueryListEvent) => setPrefersDark(event.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return prefersDark;
}

/** 组合用户偏好与系统设置，返回实际生效主题。 */
export function useResolvedTheme(): ResolvedTheme {
  const preference = useAppStore((s) => s.travelPreferences.theme);
  const systemPrefersDark = useSystemPrefersDark();
  return resolveTheme(preference, systemPrefersDark);
}

/**
 * 订阅 resolved 主题，把 `.dark` 类挂到 `<html>` 上。
 * 用 `useLayoutEffect` 避免首屏 paint 后再切换 class 造成的视觉抖动。
 */
export function useThemeEffect() {
  const resolved = useResolvedTheme();

  useLayoutEffect(() => {
    document.documentElement.classList.toggle("dark", resolved === "dark");
  }, [resolved]);
}
