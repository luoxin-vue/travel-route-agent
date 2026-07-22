import { describe, it, expect } from "vitest";
import { computeDistanceHint } from "./distance-hint";
import type { ItineraryNode } from "../types";

/** 构造简易 stop 节点。 */
function stop(overrides: Partial<ItineraryNode> = {}): ItineraryNode {
  return { type: "activity", name: "测试点", ...overrides };
}

/** 构造 transport 节点。 */
function transport(): ItineraryNode {
  return { type: "transport", name: "打车", protocol: "TAXI" };
}

describe("computeDistanceHint", () => {
  // --- 首站：下一站 ---

  it("首站 + 有 next_distance_km + 无 protocol → 按阈值自动判断（< 1.5km 步行）", () => {
    const nodes = [
      stop({ next_distance_km: 0.8 }),
      stop(),
    ];
    const hint = computeDistanceHint(nodes, 0);
    expect(hint).toContain("下一站 测试点");
    expect(hint).toContain("800m");
    expect(hint).toContain("步行");
  });

  it("首站 + 有 next_distance_km + 无 protocol → 按阈值自动判断（>= 1.5km 驾车）", () => {
    const nodes = [
      stop({ next_distance_km: 3.2 }),
      stop(),
    ];
    const hint = computeDistanceHint(nodes, 0);
    expect(hint).toContain("下一站 测试点");
    expect(hint).toContain("3.2 km");
    expect(hint).toContain("驾车");
  });

  it("首站 + protocol=WALKING 与建议一致（< 1.5km）→ 简洁展示", () => {
    const nodes = [
      stop({ next_distance_km: 0.8, protocol: "WALKING" }),
      stop(),
    ];
    const hint = computeDistanceHint(nodes, 0);
    expect(hint).toContain("下一站 测试点");
    expect(hint).toContain("步行");
    expect(hint).not.toContain("建议");
  });

  it("首站 + protocol=WALKING 与建议不一致（>= 1.5km）→ 双行对比", () => {
    const nodes = [
      stop({ next_distance_km: 5.0, protocol: "WALKING" }),
      stop(),
    ];
    const hint = computeDistanceHint(nodes, 0);
    expect(hint).toContain("下一站 测试点");
    expect(hint).toContain("建议驾车");
    expect(hint).toContain("步行");
  });

  // --- 中间站：下一站 ---

  it("中间站 + 自己有 next_distance_km → 展示下一站", () => {
    const nodes = [
      stop({ next_distance_km: 1.0 }),
      stop({ next_distance_km: 2.5 }),
      stop(),
    ];
    const hint = computeDistanceHint(nodes, 1);
    expect(hint).toContain("下一站 测试点");
    expect(hint).toContain("2.5 km");
  });

  it("中间站 + 自己有 protocol=WALKING → 用步行速度算时间", () => {
    const nodes = [
      stop({ next_distance_km: 1.0 }),
      stop({ next_distance_km: 0.9, protocol: "WALKING" }),
      stop(),
    ];
    const hint = computeDistanceHint(nodes, 1);
    expect(hint).toContain("下一站 测试点");
    expect(hint).toContain("步行");
    // 0.9 km ÷ 4.5 km/h × 60 = 12 分钟
    expect(hint).toContain("12");
  });

  it("三站全链路 — 首站下一站，末站返回 null", () => {
    const nodes = [
      stop({ next_distance_km: 1.0 }),
      stop({ next_distance_km: 3.0 }),
      stop(),
    ];
    const firstHint = computeDistanceHint(nodes, 0);
    expect(firstHint).toContain("下一站 测试点");
    expect(firstHint).toContain("1 km");

    const midHint = computeDistanceHint(nodes, 1);
    expect(midHint).toContain("下一站 测试点");
    expect(midHint).toContain("3 km");

    expect(computeDistanceHint(nodes, 2)).toBeNull();
  });

  // --- 末站 ---

  it("末站 → 返回 null", () => {
    const nodes = [
      stop({ next_distance_km: 2.5 }),
      stop(),
    ];
    expect(computeDistanceHint(nodes, 1)).toBeNull();
  });

  // --- 特殊情况 ---

  it("transport 节点 → 返回 null", () => {
    const nodes = [stop(), transport(), stop()];
    expect(computeDistanceHint(nodes, 1)).toBeNull();
  });

  it("只有一个 stop 节点 → 返回 null", () => {
    const nodes = [stop()];
    expect(computeDistanceHint(nodes, 0)).toBeNull();
  });

  it("FLIGHT → 只显示距离不显示分钟", () => {
    const nodes = [
      stop({ next_distance_km: 1200, protocol: "FLIGHT" }),
      stop(),
    ];
    const hint = computeDistanceHint(nodes, 0);
    expect(hint).toContain("下一站 测试点");
    expect(hint).toContain("1200");
    expect(hint).not.toContain("分钟");
  });

  // --- 降级：无 next_distance_km，有坐标 → Haversine ---

  it("无 next_distance_km + 有坐标 → 降级 Haversine", () => {
    const nodes = [
      stop({ lat: 39.9042, lng: 116.4074 }), // 天安门
      stop({ lat: 39.9163, lng: 116.3972 }), // 故宫北门 ~1.5km
    ];
    const hint = computeDistanceHint(nodes, 0);
    expect(hint).not.toBeNull();
    expect(hint).toContain("下一站 测试点");
  });

  it("FLIGHT 无距离数据时只显示方向不估计分钟", () => {
    const nodes = [
      stop({ protocol: "FLIGHT" }),
      stop(),
    ];
    const hint = computeDistanceHint(nodes, 0);
    expect(hint).toBe("下一站 测试点");
    expect(hint).not.toContain("分钟");
  });

  it("无 next_distance_km + 无坐标 → 尝试从中间 transport 节点推断方式", () => {
    const nodes = [
      stop(),
      { type: "transport", name: "地铁", protocol: "METRO" } as ItineraryNode,
      stop(),
    ];
    const hint0 = computeDistanceHint(nodes, 0);
    expect(hint0).toBe("下一站 测试点 · 地铁约 15 分钟");

    // 末站返回 null
    expect(computeDistanceHint(nodes, 2)).toBeNull();
  });

  // --- transport 节点夹在中间，应跳过 ---

  it("stop 之间夹 transport 节点，skip 后末站返回 null", () => {
    const nodes = [
      stop({ next_distance_km: 4.0 }),
      transport(),
      stop(),
    ];
    // 首站 (stopIdx=0)：下一站，读自己的 4.0km
    const hint = computeDistanceHint(nodes, 0);
    expect(hint).toContain("下一站 测试点");
    expect(hint).toContain("4 km");

    // 末站 (stopIdx=1)：返回 null
    expect(computeDistanceHint(nodes, 2)).toBeNull();
  });
});
