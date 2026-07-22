import { describe, it, expect } from "vitest";
import { estimateTravelMinutes, getRecommendedMode } from "./travel-speed";

describe("estimateTravelMinutes", () => {
  it("步行 4.5 km/h", () => {
    // 4.5 km ÷ 4.5 km/h = 60 分钟
    expect(estimateTravelMinutes(4.5, "WALKING")).toBe(60);
  });

  it("骑行 15 km/h", () => {
    // 15 km ÷ 15 km/h = 60 分钟
    expect(estimateTravelMinutes(15, "BICYCLING")).toBe(60);
  });

  it("驾车 30 km/h", () => {
    // 30 km ÷ 30 km/h = 60 分钟
    expect(estimateTravelMinutes(30, "DRIVING")).toBe(60);
  });

  it("打车与驾车同速", () => {
    expect(estimateTravelMinutes(30, "TAXI")).toBe(60);
  });

  it("公交 20 km/h", () => {
    // 20 km ÷ 20 km/h = 60 分钟
    expect(estimateTravelMinutes(20, "TRANSIT")).toBe(60);
  });

  it("BUS 与 TRANSIT 同速", () => {
    expect(estimateTravelMinutes(20, "BUS")).toBe(60);
  });

  it("地铁 35 km/h", () => {
    // 35 km ÷ 35 km/h = 60 分钟
    expect(estimateTravelMinutes(35, "METRO")).toBe(60);
  });

  it("SUBWAY 与 METRO 同速", () => {
    expect(estimateTravelMinutes(35, "SUBWAY")).toBe(60);
  });

  it("火车 80 km/h", () => {
    expect(estimateTravelMinutes(80, "TRAIN")).toBe(60);
  });

  it("高铁 250 km/h", () => {
    expect(estimateTravelMinutes(250, "HIGH_SPEED_RAIL")).toBe(60);
  });

  it("飞机返回 null", () => {
    expect(estimateTravelMinutes(500, "FLIGHT")).toBeNull();
  });

  it("短距离按实际计算且最小为 5 分钟", () => {
    expect(estimateTravelMinutes(0.1, "DRIVING")).toBe(5);
  });

  it("protocol 大小写不敏感", () => {
    expect(estimateTravelMinutes(4.5, "walking")).toBe(60);
  });

  it("未知 protocol 按驾车速度(30)兜底", () => {
    expect(estimateTravelMinutes(30, "UNKNOWN")).toBe(60);
  });
});

describe("getRecommendedMode", () => {
  it("< 1.5km 建议步行", () => {
    expect(getRecommendedMode(1.49)).toBe("walking");
  });

  it(">= 1.5km 建议驾车", () => {
    expect(getRecommendedMode(1.5)).toBe("driving");
  });

  it("0km 建议步行", () => {
    expect(getRecommendedMode(0)).toBe("walking");
  });

  it("大距离建议驾车", () => {
    expect(getRecommendedMode(10)).toBe("driving");
  });
});
