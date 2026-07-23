// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
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
  destroy: Mock<() => void>;
  getCenter: Mock<() => [number, number]>;
  getZoom: Mock<() => number>;
  setCenter: Mock<(center: [number, number]) => void>;
  setFitView: Mock<() => void>;
  setMapStyle: Mock<(style: string) => void>;
  setZoom: Mock<(zoom: number) => void>;
};

let root: Root;
let container: HTMLDivElement;
let maps: MapDouble[];

beforeEach(() => {
  vi.clearAllMocks();
  maps = [];
  createMap.mockImplementation(function createMapDouble(
    mapContainer: HTMLElement,
    options: { center: [number, number]; zoom: number },
  ) {
    let center = options.center;
    let zoom = options.zoom;
    const map: MapDouble = {
      destroy: vi.fn(),
      getCenter: vi.fn(() => center),
      getZoom: vi.fn(() => zoom),
      setCenter: vi.fn((nextCenter: [number, number]) => {
        center = nextCenter;
      }),
      setFitView: vi.fn(),
      setMapStyle: vi.fn(),
      setZoom: vi.fn((nextZoom: number) => {
        zoom = nextZoom;
      }),
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

describe("默认底图", () => {
  it("深色界面下仍使用高德默认底图", async () => {
    useAppStore.getState().updatePreferences({ theme: "dark" });

    await act(async () => {
      root.render(<MapView />);
      await Promise.resolve();
    });

    expect(createMap).toHaveBeenCalledWith(
      expect.any(HTMLDivElement),
      expect.objectContaining({ mapStyle: "amap://styles/normal" }),
    );
    const mapLayer = container.querySelector(".amap-mapdiv");
    expect(mapLayer).not.toBeNull();
    expect(window.getComputedStyle(mapLayer!).filter).not.toContain("brightness");
  });

  it("切换界面主题时保持地图实例、视口和覆盖物", async () => {
    await act(async () => {
      root.render(<MapView />);
      await Promise.resolve();
    });

    expect(createMap).toHaveBeenCalledWith(
      expect.any(HTMLDivElement),
      expect.objectContaining({ mapStyle: "amap://styles/normal" }),
    );
    const initialMap = maps[0];
    initialMap.setCenter([121.4737, 31.2304]);
    initialMap.setZoom(15);
    const centerBeforeThemeChange = initialMap.getCenter();
    const zoomBeforeThemeChange = initialMap.getZoom();

    await act(async () => {
      useAppStore.getState().updatePreferences({ theme: "dark" });
      await Promise.resolve();
    });
    await act(async () => {
      useAppStore.getState().updatePreferences({ theme: "light" });
      await Promise.resolve();
    });

    expect(loadMapSdk).toHaveBeenCalledTimes(1);
    expect(initialMap.destroy).not.toHaveBeenCalled();
    expect(initialMap.setMapStyle).not.toHaveBeenCalled();
    expect(initialMap.getCenter()).toEqual(centerBeforeThemeChange);
    expect(initialMap.getZoom()).toBe(zoomBeforeThemeChange);
    expect(createMarker).toHaveBeenCalledTimes(2);
    expect(createPolyline).toHaveBeenCalledTimes(1);
  });
});
