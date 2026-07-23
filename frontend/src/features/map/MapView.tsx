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
const AMAP_DEFAULT_STYLE_ID = "amap://styles/normal";

export function MapView() {
  const itinerary = useAppStore((s) => s.itinerary);
  const resolvedTheme = useResolvedTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const resolvedThemeRef = useRef(resolvedTheme);
  resolvedThemeRef.current = resolvedTheme;

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
      const mapOptions = {
        zoom: 12,
        center: points[0].pos,
        mapStyle: AMAP_STYLE_ID[resolvedThemeRef.current],
      };
      let map;
      try {
        map = new AMap.Map(containerRef.current, mapOptions);
      } catch {
        if (resolvedThemeRef.current !== "dark") return;
        try {
          map = new AMap.Map(containerRef.current, { ...mapOptions, mapStyle: AMAP_DEFAULT_STYLE_ID });
        } catch {
          return;
        }
      }
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
  }, [itinerary]);

  // 主题单独变化时只切底图样式，不重建地图（保留中心位置和缩放级别）。
  useEffect(() => {
    if (!mapRef.current) return;
    try {
      mapRef.current.setMapStyle?.(AMAP_STYLE_ID[resolvedTheme]);
    } catch {
      if (resolvedTheme === "dark") {
        try {
          mapRef.current.setMapStyle?.(AMAP_DEFAULT_STYLE_ID);
        } catch {}
      }
    }
  }, [resolvedTheme]);

  if (!itinerary) {
    return <EmptyState title="尚无地图数据" hint="生成行程后，途经点与路线将在此显示。" />;
  }
  if (!JS_KEY) {
    return <EmptyState title="缺少高德 JS KEY" hint="请在 frontend/.env 配置 VITE_AMAP_JS_KEY 后重启。" />;
  }
  return <div ref={containerRef} aria-label="旅行线路地图，标记并连接各个途经点" className="h-full w-full" />;
}
