import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import "./index.css";

// 新版本检测：定期主动探测 SW 是否有更新（绕开 HTTP 缓存），
// 有更新则自动激活并刷新页面（registerType: autoUpdate，见 vite.config.ts）。
// 不这样做的话，PWA 常驻后台/未整页刷新时可能长期停在旧版本，只能靠手动清缓存。
const UPDATE_CHECK_INTERVAL_MS = 30 * 60 * 1000;

const updateServiceWorker = registerSW({
  immediate: true,
  onRegisteredSW(swUrl, registration) {
    if (!registration) return;
    const checkForUpdate = async () => {
      if (registration.installing || !navigator.onLine) return;
      const resp = await fetch(swUrl, {
        cache: "no-store",
        headers: { "cache-control": "no-cache" },
      });
      if (resp.status === 200) await registration.update();
    };
    setInterval(checkForUpdate, UPDATE_CHECK_INTERVAL_MS);
    // 切回本标签页/窗口时（含从主屏重新打开 PWA）立即探测一次，避免久等定时器。
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") checkForUpdate();
    });
    window.addEventListener("focus", checkForUpdate);
  },
});
void updateServiceWorker;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
