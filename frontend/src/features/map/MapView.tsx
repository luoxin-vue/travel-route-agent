import { useEffect, useRef } from "react";
import AMapLoader from "@amap/amap-jsapi-loader";
import { useAppStore } from "../../store/useAppStore";
import { useResolvedTheme } from "../../lib/use-theme";
import { EmptyState } from "../../components/EmptyState";

const JS_KEY = import.meta.env.VITE_AMAP_JS_KEY;
const SECURITY_CODE = import.meta.env.VITE_AMAP_JS_SECURITY_CODE;

const AMAP_STYLE_ID = {
  light: "amap://styles/whitesmoke",
  dark: "amap://styles/dark",
} as const;

/** 高德地图深色底图上，默认白色 POI 地名标签不可见。
 * 通过 CSS filter + 覆盖注入样式表解决：
 * 1) 对 mapDiv 施加 filter: brightness(1.3) 使深色瓦片更亮、标签对比度更高
 * 2) 用独立 <style> 强制覆盖 .amap-pois 和 .amap-text 的文字颜色 */
const DARK_MAP_FIX_STYLES = `
  /* 深色地图瓦片提亮：让暗底不吞文字 */
  .amap-mapdiv { filter: brightness(1.3) contrast(0.95); }

  /* POI 地名标签：深陶棕，跨浅深两态都够对比 */
  .amap-text,.amap-pois .text,.amap-pois .text-inner {
    color: #E8D5C4 !important;
    -webkit-text-stroke: 0.3px #1A1714 !important;
    stroke: #1A1714 !important;
  }
  .amap-pois .text-content {
    color: #E8D5C4 !important;
    stroke: #1A1714 !important;
  }
`;

export function MapView() {
  const itinerary = useAppStore((s) => s.itinerary);
  const resolvedTheme = useResolvedTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  // 深色地图：注入 POI label 颜色覆盖 + 瓦片提亮，解决地名不可见和暗底吞文字
  useEffect(() => {
    if (resolvedTheme !== "dark") return;
    let styleEl: HTMLStyleElement | null = null;
    try {
      styleEl = document.createElement("style");
      styleEl.setAttribute("data-theme-map-fix", "true");
      styleEl.textContent = DARK_MAP_FIX_STYLES;
      document.head.appendChild(styleEl);
    } catch {}
    return () => {
      if (styleEl && styleEl.parentNode) styleEl.parentNode.removeChild(styleEl);
    };
  }, [resolvedTheme]);

  useEffect(() => {
    if (!itinerary) return;
    const points = itinerary.nodes
      .filter((n) => n.lng != null && n.lat != null)
      .map((n) => ({ name: n.name, pos: [n.lng as number, n.lat as number] as [number, number] }));
    if (points.length === 0) return;

    if (SECURITY_CODE) {
      (window as any)._AMapSecurityConfig = { securityJsCode: SECURITY_CODE };
    }

    let destroyed = false;
    AMapLoader.load({ key: JS_KEY, version: "2.0", plugins: ["AMap.Polyline"] }).then((AMap) => {
      if (destroyed || !containerRef.current) return;
      const map = new AMap.Map(containerRef.current, {
        zoom: 12,
        center: points[0].pos,
        mapStyle: AMAP_STYLE_ID[resolvedTheme],
      });
      mapRef.current = map;

      points.forEach((p, i) => {
        new AMap.Marker({ map, position: p.pos, label: { content: `${i + 1}. ${p.name}`, direction: "top" } });
      });
      if (points.length > 1) {
        new AMap.Polyline({
          map,
          path: points.map((p) => p.pos),
          strokeColor: "#99462a",
          strokeWeight: 4,
          strokeStyle: "dashed",
        });
      }
      map.setFitView();
    });

    return () => {
      destroyed = true;
      mapRef.current?.destroy?.();
      mapRef.current = null;
    };
  }, [itinerary, resolvedTheme]);

  // 主题单独变化时只切底图样式，不重建地图（保留 pan/zoom）。
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setMapStyle?.(AMAP_STYLE_ID[resolvedTheme]);
  }, [resolvedTheme]);

  if (!itinerary) {
    return <EmptyState title="尚无地图数据" hint="生成行程后，途经点与路线将在此显示。" />;
  }
  if (!JS_KEY) {
    return <EmptyState title="缺少高德 JS KEY" hint="请在 frontend/.env 配置 VITE_AMAP_JS_KEY 后重启。" />;
  }
  return <div ref={containerRef} aria-label="旅行线路地图，标记并连接各个途经点" className="h-full w-full" />;
}
