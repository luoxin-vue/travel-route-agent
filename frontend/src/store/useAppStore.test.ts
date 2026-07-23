import { describe, it, expect, beforeEach } from "vitest";
import { useAppStore } from "./useAppStore";
import type { Itinerary, ItineraryNode } from "../types";

function stop(overrides: Partial<ItineraryNode> = {}): ItineraryNode {
  return { type: "activity", name: "测试点", ...overrides };
}

function transport(): ItineraryNode {
  return { type: "transport", name: "地铁", protocol: "METRO" };
}

function mockItinerary(nodes: ItineraryNode[]): Itinerary {
  return { title: "测试行程", days: 1, nodes };
}

beforeEach(() => {
  useAppStore.setState({
    itinerary: null,
    savedRoutes: [],
    activeRouteId: null,
  });
});

describe("updateNode", () => {
  it("更新指定索引节点的字段", () => {
    const itinerary = mockItinerary([stop({ name: "故宫" }), stop({ name: "天坛" })]);
    useAppStore.setState({ itinerary });

    useAppStore.getState().updateNode(0, { ...itinerary.nodes[0], name: "故宫（北门）" });
    const state = useAppStore.getState();
    expect(state.itinerary!.nodes[0].name).toBe("故宫（北门）");
    expect(state.itinerary!.nodes[1].name).toBe("天坛");
  });

  it("更新后 savedRoutes 同步刷新", () => {
    const itinerary = mockItinerary([stop({ name: "故宫", start_time: "09:00" }), stop({ name: "天坛" })]);
    useAppStore.setState({ itinerary });
    useAppStore.getState().saveRoute(itinerary);

    const routeId = useAppStore.getState().savedRoutes[0].id;
    useAppStore.setState({ activeRouteId: routeId });

    useAppStore.getState().updateNode(0, { ...itinerary.nodes[0], name: "故宫（北门）" });
    const updatedRoute = useAppStore.getState().savedRoutes[0];
    expect(updatedRoute.itinerary.nodes[0].name).toBe("故宫（北门）");
  });

  it("更新节点后 completedNodes 清洗已不存在的 key", () => {
    const itinerary = mockItinerary([
      stop({ name: "故宫", start_time: "09:00" }),
      stop({ name: "天坛", start_time: "10:00" }),
    ]);
    useAppStore.setState({ itinerary });
    useAppStore.getState().saveRoute(itinerary);
    const routeId = useAppStore.getState().savedRoutes[0].id;
    useAppStore.setState({ activeRouteId: routeId });

    // 模拟已打卡第一个节点
    useAppStore.getState().toggleNodeComplete(routeId, "故宫|09:00|activity");

    // 删除第一个节点（index 0）
    useAppStore.getState().deleteNode(0);

    const route = useAppStore.getState().savedRoutes[0];
    expect(route.completedNodes).not.toContain("故宫|09:00|activity");
  });
});

describe("addNode", () => {
  it("在末尾追加新节点", () => {
    const itinerary = mockItinerary([stop({ name: "故宫" })]);
    useAppStore.setState({ itinerary });

    useAppStore.getState().addNode(stop({ name: "天坛" }));
    const state = useAppStore.getState();
    expect(state.itinerary!.nodes.length).toBe(2);
    expect(state.itinerary!.nodes[1].name).toBe("天坛");
  });
});

describe("deleteNode", () => {
  it("删除指定索引节点且 itinerary 同步", () => {
    const itinerary = mockItinerary([stop({ name: "故宫" }), transport(), stop({ name: "天坛" })]);
    useAppStore.setState({ itinerary });

    useAppStore.getState().deleteNode(1); // 删除 transport
    const state = useAppStore.getState();
    expect(state.itinerary!.nodes.length).toBe(2);
    expect(state.itinerary!.nodes[0].name).toBe("故宫");
    expect(state.itinerary!.nodes[1].name).toBe("天坛");
  });

  it("删除节点后所有 stop 打卡完成 → status 变为 completed", () => {
    const itinerary = mockItinerary([stop({ name: "故宫", start_time: "09:00" })]);
    useAppStore.setState({ itinerary });
    useAppStore.getState().saveRoute(itinerary);
    const routeId = useAppStore.getState().savedRoutes[0].id;
    useAppStore.setState({ activeRouteId: routeId });

    useAppStore.getState().toggleNodeComplete(routeId, "故宫|09:00|activity");
    expect(useAppStore.getState().savedRoutes[0].status).toBe("completed");

    // 添加新节点使打卡不再覆盖全部
    useAppStore.getState().addNode(stop({ name: "天坛", start_time: "10:00" }));
    expect(useAppStore.getState().savedRoutes[0].status).toBe("planned");
  });
});

describe("toggleNodeComplete — 全部打卡完成状态持久化", () => {
  it("全部节点打卡后 savedRoutes 保留 completedNodes", () => {
    const itinerary = mockItinerary([
      stop({ name: "故宫", start_time: "09:00" }),
      stop({ name: "天坛", start_time: "14:00" }),
    ]);
    useAppStore.setState({ itinerary });
    useAppStore.getState().saveRoute(itinerary);
    const routeId = useAppStore.getState().savedRoutes[0].id;
    useAppStore.setState({ activeRouteId: routeId });

    useAppStore.getState().toggleNodeComplete(routeId, "故宫|09:00|activity");
    useAppStore.getState().toggleNodeComplete(routeId, "天坛|14:00|activity");

    const route = useAppStore.getState().savedRoutes[0];
    expect(route.status).toBe("completed");
    expect(route.completedNodes).toContain("故宫|09:00|activity");
    expect(route.completedNodes).toContain("天坛|14:00|activity");
  });

  it("activeRouteId 丢失后重新设置，completedNodes 仍在 savedRoutes 中", () => {
    const itinerary = mockItinerary([
      stop({ name: "故宫", start_time: "09:00" }),
      stop({ name: "天坛", start_time: "14:00" }),
    ]);
    useAppStore.setState({ itinerary });
    useAppStore.getState().saveRoute(itinerary);
    const routeId = useAppStore.getState().savedRoutes[0].id;
    useAppStore.setState({ activeRouteId: routeId });

    useAppStore.getState().toggleNodeComplete(routeId, "故宫|09:00|activity");
    useAppStore.getState().toggleNodeComplete(routeId, "天坛|14:00|activity");

    // 模拟 activeRouteId 丢失（如页面刷新不持久化）
    useAppStore.setState({ activeRouteId: null });

    // 重新设置 activeRouteId（如从路线库重新点击"查看计划"）
    useAppStore.setState({ activeRouteId: routeId });
    const activeRoute = useAppStore.getState().savedRoutes.find(
      (r) => r.id === routeId,
    );
    expect(activeRoute!.status).toBe("completed");
    // 模拟页面刷新：itinerary 丢失但 activeRouteId 与 savedRoutes 已持久化恢复
    useAppStore.setState({ itinerary: null });

    const restoredRoute = useAppStore.getState().savedRoutes.find(
      (route) => route.id === routeId,
    );
    expect(restoredRoute).toBeDefined();
    expect(useAppStore.getState().activeRouteId).toBe(routeId);
    expect(useAppStore.getState().itinerary).toBeNull();

    // PlanView useEffect 会在挂载时调用此恢复逻辑
    if (restoredRoute) {
      useAppStore.setState({ itinerary: restoredRoute.itinerary });
    }
    expect(useAppStore.getState().itinerary).toBeDefined();
    expect(useAppStore.getState().itinerary!.nodes.length).toBe(2);
  });
});

describe("toggleRouteStatus — 状态切换联动打卡", () => {
  it("路线标记为 completed 时自动填充全部 stop 节点到 completedNodes", () => {
    const itinerary = mockItinerary([
      stop({ name: "故宫", start_time: "09:00" }),
      stop({ name: "天坛", start_time: "14:00" }),
    ]);
    useAppStore.setState({ itinerary });
    useAppStore.getState().saveRoute(itinerary);
    const routeId = useAppStore.getState().savedRoutes[0].id;

    // 路线当前为 planned，completedNodes 为空
    expect(useAppStore.getState().savedRoutes[0].status).toBe("planned");
    expect(useAppStore.getState().savedRoutes[0].completedNodes.length).toBe(0);

    // 在路线库中标记为 completed → 应自动填充全部 stop 节点 key
    useAppStore.getState().toggleRouteStatus(routeId);
    const route = useAppStore.getState().savedRoutes[0];
    expect(route.status).toBe("completed");
    expect(route.completedNodes).toContain("故宫|09:00|activity");
    expect(route.completedNodes).toContain("天坛|14:00|activity");
  });

  it("路线从 completed 切回 planned 时清空 completedNodes", () => {
    const itinerary = mockItinerary([
      stop({ name: "故宫", start_time: "09:00" }),
    ]);
    useAppStore.setState({ itinerary });
    useAppStore.getState().saveRoute(itinerary);
    const routeId = useAppStore.getState().savedRoutes[0].id;

    useAppStore.getState().toggleRouteStatus(routeId); // planned → completed
    expect(useAppStore.getState().savedRoutes[0].status).toBe("completed");
    expect(useAppStore.getState().savedRoutes[0].completedNodes.length).toBe(1);

    useAppStore.getState().toggleRouteStatus(routeId); // completed → planned
    expect(useAppStore.getState().savedRoutes[0].status).toBe("planned");
    expect(useAppStore.getState().savedRoutes[0].completedNodes.length).toBe(0);
  });

  it("部分手动打卡后再点'全部完成'，已打卡节点不丢失", () => {
    const itinerary = mockItinerary([
      stop({ name: "故宫", start_time: "09:00" }),
      stop({ name: "天坛", start_time: "14:00" }),
      stop({ name: "长城", start_time: "08:00" }),
    ]);
    useAppStore.setState({ itinerary });
    useAppStore.getState().saveRoute(itinerary);
    const routeId = useAppStore.getState().savedRoutes[0].id;
    useAppStore.setState({ activeRouteId: routeId });

    // 手动打卡第一个节点
    useAppStore.getState().toggleNodeComplete(routeId, "故宫|09:00|activity");

    // 在路线库中标记为 completed — 应合并而非覆盖
    useAppStore.getState().toggleRouteStatus(routeId);
    const route = useAppStore.getState().savedRoutes[0];
    expect(route.status).toBe("completed");
    expect(route.completedNodes).toContain("故宫|09:00|activity");
    expect(route.completedNodes).toContain("天坛|14:00|activity");
    expect(route.completedNodes).toContain("长城|08:00|activity");
    expect(route.completedNodes.length).toBe(3);
  });
});

describe("saveRoute — 新计划生成时已完成节点不污染", () => {
  it("生成新计划后 activeRouteId 指向新路线，completedNodes 为空", () => {
    // 模拟旧路线有已打卡节点
    const oldItinerary = mockItinerary([
      stop({ name: "故宫", start_time: "09:00" }),
      stop({ name: "天坛", start_time: "14:00" }),
      stop({ name: "长城", start_time: "08:00" }),
    ]);
    useAppStore.getState().saveRoute(oldItinerary);
    const oldRouteId = useAppStore.getState().savedRoutes[0].id;
    useAppStore.setState({ activeRouteId: oldRouteId });

    // 手动打卡全部节点
    useAppStore.getState().toggleNodeComplete(oldRouteId, "故宫|09:00|activity");
    useAppStore.getState().toggleNodeComplete(oldRouteId, "天坛|14:00|activity");
    useAppStore.getState().toggleNodeComplete(oldRouteId, "长城|08:00|activity");
    expect(useAppStore.getState().savedRoutes[0].completedNodes.length).toBe(3);

    // 模拟 onItinerary: 生成全新计划（不同标题/天数）
    const newItinerary = mockItinerary([
      stop({ name: "西湖", start_time: "09:00" }),
    ]);
    newItinerary.title = "杭州一日游";
    useAppStore.setState({ itinerary: null });
    useAppStore.getState().saveRoute(newItinerary);
    useAppStore.setState({ itinerary: newItinerary });

    // activeRouteId 应指向新路线
    const newRouteId = useAppStore.getState().activeRouteId;
    expect(newRouteId).not.toBe(oldRouteId);
    expect(newRouteId).toBeTruthy();

    // 新路线的 completedNodes 应为空
    const newRoute = useAppStore.getState().savedRoutes.find((route) => route.id === newRouteId);
    expect(newRoute).toBeDefined();
    expect(newRoute!.completedNodes.length).toBe(0);
  });

  it("同标题新计划生成后 completedNodes 应重置为空（不应保留旧计划的打卡数据）", () => {
    // 先保存一个行程并打卡
    const itinerary = mockItinerary([
      stop({ name: "故宫", start_time: "09:00" }),
      stop({ name: "天坛", start_time: "14:00" }),
    ]);
    itinerary.title = "上海周末2日游";
    itinerary.days = 2;
    useAppStore.getState().saveRoute(itinerary);
    const routeId = useAppStore.getState().savedRoutes[0].id;
    useAppStore.setState({ activeRouteId: routeId });

    // 打卡两个节点
    useAppStore.getState().toggleNodeComplete(routeId, "故宫|09:00|activity");
    useAppStore.getState().toggleNodeComplete(routeId, "天坛|14:00|activity");
    expect(useAppStore.getState().savedRoutes[0].completedNodes.length).toBe(2);

    // 模拟重新生成同标题行程（节点内容可能变化）
    const regeneratedItinerary = mockItinerary([
      stop({ name: "外滩", start_time: "10:00" }),
      stop({ name: "迪士尼", start_time: "13:00" }),
    ]);
    regeneratedItinerary.title = "上海周末2日游";
    regeneratedItinerary.days = 2;
    useAppStore.getState().saveRoute(regeneratedItinerary);

    // 同签名路线应更新内容但重置已完成节点
    const updatedRoute = useAppStore.getState().savedRoutes.find(
      (route) => route.id === routeId,
    );
    expect(updatedRoute).toBeDefined();
    expect(updatedRoute!.completedNodes.length).toBe(0);
    expect(updatedRoute!.status).toBe("planned");
    // activeRouteId 应指向此路线
    expect(useAppStore.getState().activeRouteId).toBe(routeId);
  });
});

describe("theme preference", () => {
  it("新用户默认主题为 'system'（跟随系统）", () => {
    const theme = useAppStore.getState().travelPreferences.theme;
    expect(theme).toBe("system");
  });

  it("updatePreferences({ theme: 'dark' }) 写入 store", () => {
    useAppStore.getState().updatePreferences({ theme: "dark" });
    expect(useAppStore.getState().travelPreferences.theme).toBe("dark");
  });

  it("updatePreferences({ theme: 'light' }) 不会清空其它偏好字段", () => {
    useAppStore.getState().updatePreferences({ defaultProtocol: "DRIVING", pace: "compact" });
    useAppStore.getState().updatePreferences({ theme: "light" });
    const prefs = useAppStore.getState().travelPreferences;
    expect(prefs.theme).toBe("light");
    expect(prefs.defaultProtocol).toBe("DRIVING");
    expect(prefs.pace).toBe("compact");
  });

  it("updatePreferences({ theme: 'system' }) 显式切回跟随系统", () => {
    useAppStore.getState().updatePreferences({ theme: "dark" });
    useAppStore.getState().updatePreferences({ theme: "system" });
    expect(useAppStore.getState().travelPreferences.theme).toBe("system");
  });
});

describe("deleteRoute — 删除活动路线时同步清除 activeRouteId", () => {
  it("删除当前活动路线后 activeRouteId 置为 null", () => {
    const itinerary = mockItinerary([stop({ name: "故宫", start_time: "09:00" })]);
    useAppStore.getState().saveRoute(itinerary);
    const routeId = useAppStore.getState().savedRoutes[0].id;
    useAppStore.setState({ activeRouteId: routeId });

    useAppStore.getState().deleteRoute(routeId);

    expect(useAppStore.getState().activeRouteId).toBeNull();
  });

  it("删除非活动路线时不影响 activeRouteId", () => {
    const itinerary1 = mockItinerary([stop({ name: "故宫" })]);
    itinerary1.title = "北京";
    const itinerary2 = mockItinerary([stop({ name: "西湖" })]);
    itinerary2.title = "杭州";

    useAppStore.getState().saveRoute(itinerary1);
    const route1Id = useAppStore.getState().savedRoutes[0].id;
    useAppStore.getState().saveRoute(itinerary2);
    const route2Id = useAppStore.getState().savedRoutes[0].id;

    useAppStore.setState({ activeRouteId: route1Id });
    useAppStore.getState().deleteRoute(route2Id);

    expect(useAppStore.getState().activeRouteId).toBe(route1Id);
  });
});
