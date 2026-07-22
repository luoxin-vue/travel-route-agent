import { isStopNode, nodeKey } from "../types";
import type { ItineraryNode } from "../types";

// ponytail: 自检断言函数，验证 Itinerary 节点逻辑与打卡清洗逻辑
function runStoreLogicTests() {
  const initialNodes: ItineraryNode[] = [
    { type: "activity", name: "故宫", start_time: "09:00", day: 1 },
    { type: "lodging", name: "宝格丽酒店", start_time: "18:00", day: 1 },
  ];

  if (initialNodes.length !== 2) throw new Error("初始节点数量应为 2");

  // 1. 测试 nodeKey 唯一标志生成
  const key1 = nodeKey(initialNodes[0]);
  if (key1 !== "故宫|09:00|activity") throw new Error("nodeKey 生成不符合预期");

  // 2. 测试非交通节点过滤
  const stopNodes = initialNodes.filter(isStopNode);
  if (stopNodes.length !== 2) throw new Error("止步节点过滤逻辑有误");

  // 3. 测试打卡清洗
  const completedKeys = [key1, "已删除景点|10:00|activity"];
  const validKeys = new Set(initialNodes.map(nodeKey));
  const cleanedCompleted = completedKeys.filter((key) => validKeys.has(key));
  if (cleanedCompleted.length !== 1 || cleanedCompleted[0] !== key1) {
    throw new Error("已打卡状态清洗失败");
  }

  console.log("✓ Store 节点业务逻辑自检断言通过！");
}

runStoreLogicTests();
