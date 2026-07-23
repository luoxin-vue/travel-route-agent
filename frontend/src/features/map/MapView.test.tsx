// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_TRAVEL_PREFERENCES, type Itinerary } from "../../types";
import { useAppStore } from "../../store/useAppStore";
import { MapView } from "./MapView";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const { loadMapSdk, createMap, createMarker, createPolyline } = vi.hoisted(() => ({
  loadMapSdk: vi.fn(),
  createMap: vi.fn(),
  createMarker: vi.fn(),
  createPolyline: vi.fn(),
}));

vi.mock("@amap/amap-jsapi-loader", () => ({
  default: { load: loadMapSdk },
}));

const ITINERARY: Itinerary = {
  title: "北京一日路线",
  days: 1,
  nodes: [
    { type: "activity", name: "故宫", lng: 116.397, lat: 39.918 },
    { type: "activity", name: "景山", lng: 116.397, lat: 39.926 },
  ],
};

type MapDouble = {
  destroy: ReturnType<typeof vi.fn>;
  setFitView: ReturnType<typeof vi.fn>;
  setMapStyle: ReturnType<typeof vi.fn>;
};

let root: Root;
let container: HTMLDivElement;
let maps: MapDouble[];

beforeEach(() => {
  vi.clearAllMocks();
  maps = [];
  createMap.mockImplementation(function createMapDouble(mapContainer: HTMLElement) {
    const map: MapDouble = {
      destroy: vi.fn(),
      setFitView: vi.fn(),
      setMapStyle: vi.fn(),
    };
    const mapLayer = document.createElement("div");
    mapLayer.className = "amap-mapdiv";
    mapContainer.appendChild(mapLayer);
    maps.push(map);
    return map;
  });
  loadMapSdk.mockResolvedValue({
    Map: createMap,
    Marker: createMarker,
    Polyline: createPolyline,
  });

  useAppStore.setState({
    itinerary: ITINERARY,
    travelPreferences: { ...DEFAULT_TRAVEL_PREFERENCES, theme: "light" },
  });

  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

describe("深色底图", () => {
  it("首次以深色模式打开时不覆盖高德原生底图渲染", async () => {
    useAppStore.getState().updatePreferences({ theme: "dark" });

    await act(async () => {
      root.render(<MapView />);
      await Promise.resolve();
    });

    expect(createMap).toHaveBeenCalledWith(
      expect.any(HTMLDivElement),
      expect.objectContaining({ mapStyle: "amap://styles/dark" }),
    );
    const mapLayer = container.querySelector(".amap-mapdiv");
    expect(mapLayer).not.toBeNull();
    expect(window.getComputedStyle(mapLayer!).filter).not.toContain("brightness");
  });

  it("首次深色底图初始化异常时回退到高德默认底图", async () => {
    useAppStore.getState().updatePreferences({ theme: "dark" });
    const createMapDouble = createMap.getMockImplementation()!;
    createMap
      .mockImplementationOnce(function rejectDarkStyle() {
        throw new Error("样式不可用");
      })
      .mockImplementationOnce(createMapDouble);

    await act(async () => {
      root.render(<MapView />);
      await Promise.resolve();
    });

    expect(createMap).toHaveBeenNthCalledWith(
      1,
      expect.any(HTMLDivElement),
      expect.objectContaining({ mapStyle: "amap://styles/dark" }),
    );
    expect(createMap).toHaveBeenNthCalledWith(
      2,
      expect.any(HTMLDivElement),
      expect.objectContaining({ mapStyle: "amap://styles/normal" }),
    );
    expect(maps).toHaveLength(1);
  });

  it("切换主题时复用地图实例并原地更新底图样式", async () => {
    await act(async () => {
      root.render(<MapView />);
      await Promise.resolve();
    });

    expect(loadMapSdk).toHaveBeenCalledTimes(1);
    expect(createMap).toHaveBeenCalledWith(
      expect.any(HTMLDivElement),
      expect.objectContaining({ mapStyle: "amap://styles/whitesmoke" }),
    );
    const initialMap = maps[0];

    await act(async () => {
      useAppStore.getState().updatePreferences({ theme: "dark" });
      await Promise.resolve();
    });

    expect(loadMapSdk).toHaveBeenCalledTimes(1);
    expect(initialMap.destroy).not.toHaveBeenCalled();
    expect(initialMap.setMapStyle).toHaveBeenLastCalledWith("amap://styles/dark");

    await act(async () => {
      useAppStore.getState().updatePreferences({ theme: "light" });
      await Promise.resolve();
    });

    expect(loadMapSdk).toHaveBeenCalledTimes(1);
    expect(initialMap.destroy).not.toHaveBeenCalled();
    expect(initialMap.setMapStyle).toHaveBeenLastCalledWith("amap://styles/whitesmoke");
    expect(createMarker).toHaveBeenCalledTimes(2);
    expect(createPolyline).toHaveBeenCalledTimes(1);
  });

  it("地图加载期间切换主题时使用最新底图样式", async () => {
    const mapSdk = {
      Map: createMap,
      Marker: createMarker,
      Polyline: createPolyline,
    };
    let resolveMapSdk!: (sdk: typeof mapSdk) => void;
    loadMapSdk.mockReturnValue(new Promise((resolve) => {
      resolveMapSdk = resolve;
    }));

    await act(async () => {
      root.render(<MapView />);
      await Promise.resolve();
    });
    await act(async () => {
      useAppStore.getState().updatePreferences({ theme: "dark" });
      await Promise.resolve();
    });

    expect(createMap).not.toHaveBeenCalled();

    await act(async () => {
      resolveMapSdk(mapSdk);
      await Promise.resolve();
    });

    expect(createMap).toHaveBeenCalledWith(
      expect.any(HTMLDivElement),
      expect.objectContaining({ mapStyle: "amap://styles/dark" }),
    );
  });

  it("深色样式设置异常时回退到高德默认底图", async () => {
    await act(async () => {
      root.render(<MapView />);
      await Promise.resolve();
    });

    const initialMap = maps[0];
    initialMap.setMapStyle.mockImplementation((style: string) => {
      if (style === "amap://styles/dark") throw new Error("样式不可用");
    });

    await act(async () => {
      useAppStore.getState().updatePreferences({ theme: "dark" });
      await Promise.resolve();
    });

    expect(initialMap.setMapStyle).toHaveBeenNthCalledWith(1, "amap://styles/dark");
    expect(initialMap.setMapStyle).toHaveBeenNthCalledWith(2, "amap://styles/normal");
    expect(initialMap.destroy).not.toHaveBeenCalled();
  });
});
