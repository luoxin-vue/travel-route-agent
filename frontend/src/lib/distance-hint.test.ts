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
  // --- 首站：距下站 ---

  it("首站 + 有 next_distance_km + 无 protocol → 按阈值自动判断（< 1.5km 步行）", () => {
    const nodes = [
      stop({ next_distance_km: 0.8 }),
      stop(),
    ];
    const hint = computeDistanceHint(nodes, 0);
    expect(hint).toContain("距下站");
    expect(hint).toContain("800m");
    expect(hint).toContain("步行");
  });

  it("首站 + 有 next_distance_km + 无 protocol → 按阈值自动判断（>= 1.5km 驾车）", () => {
    const nodes = [
      stop({ next_distance_km: 3.2 }),
      stop(),
    ];
    const hint = computeDistanceHint(nodes, 0);
    expect(hint).toContain("距下站");
    expect(hint).toContain("3.2 km");
    expect(hint).toContain("驾车");
  });

  it("首站 + protocol=WALKING 与建议一致（< 1.5km）→ 简洁展示", () => {
    const nodes = [
      stop({ next_distance_km: 0.8, protocol: "WALKING" }),
      stop(),
    ];
    const hint = computeDistanceHint(nodes, 0);
    expect(hint).toContain("距下站");
    expect(hint).toContain("步行");
    expect(hint).not.toContain("建议");
  });

  it("首站 + protocol=WALKING 与建议不一致（>= 1.5km）→ 双行对比", () => {
    const nodes = [
      stop({ next_distance_km: 5.0, protocol: "WALKING" }),
      stop(),
    ];
    const hint = computeDistanceHint(nodes, 0);
    expect(hint).toContain("距下站");
    expect(hint).toContain("建议驾车");
    expect(hint).toContain("步行");
  });

  // --- 非首站：距上站 ---

  it("非首站 + 上一站有 next_distance_km → 展示距上站", () => {
    const nodes = [
      stop({ next_distance_km: 2.5 }),
      stop(),
    ];
    const hint = computeDistanceHint(nodes, 1);
    expect(hint).toContain("距上站");
    expect(hint).toContain("2.5 km");
  });

  it("非首站 + 上一站 protocol=WALKING → 用步行速度算时间", () => {
    const nodes = [
      stop({ next_distance_km: 0.9, protocol: "WALKING" }),
      stop(),
    ];
    const hint = computeDistanceHint(nodes, 1);
    expect(hint).toContain("距上站");
    expect(hint).toContain("步行");
    // 0.9 km ÷ 4.5 km/h × 60 = 12 分钟
    expect(hint).toContain("12");
  });

  it("末站与中间站同一逻辑 → 距上站", () => {
    const nodes = [
      stop({ next_distance_km: 1.0 }),
      stop({ next_distance_km: 3.0 }),
      stop(),
    ];
    const hint = computeDistanceHint(nodes, 2);
    expect(hint).toContain("距上站");
    expect(hint).toContain("3 km");
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
    expect(hint).toContain("距下站");
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
    expect(hint).toContain("距下站");
  });

  it("FLIGHT 无距离数据时只显示方向不估计分钟", () => {
    const nodes = [
      stop({ protocol: "FLIGHT" }),
      stop(),
    ];
    const hint = computeDistanceHint(nodes, 0);
    expect(hint).toBe("距下站");
    expect(hint).not.toContain("分钟");
  });

  it("无 next_distance_km + 无坐标 → 尝试从中间 transport 节点推断方式", () => {
    const nodes = [
      stop(),
      { type: "transport", name: "地铁", protocol: "METRO" } as ItineraryNode,
      stop(),
    ];
    const hint0 = computeDistanceHint(nodes, 0);
    expect(hint0).toBe("距下站地铁约 15 分钟");

    const hint2 = computeDistanceHint(nodes, 2);
    expect(hint2).toBe("距上站地铁约 15 分钟");
  });

  // --- transport 节点夹在中间，应跳过 ---

  it("stop 之间夹 transport 节点 → 正确识别相邻 stop", () => {
    const nodes = [
      stop({ next_distance_km: 4.0 }),
      transport(),
      stop(),
    ];
    // 第三个节点（index=2）是第二个 stop，应读第一个 stop 的 next_distance_km
    const hint = computeDistanceHint(nodes, 2);
    expect(hint).toContain("距上站");
    expect(hint).toContain("4 km");
  });
});
