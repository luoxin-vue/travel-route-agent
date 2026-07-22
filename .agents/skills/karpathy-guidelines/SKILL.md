---
name: karpathy-guidelines
description: Behavioral guidelines to reduce common LLM coding mistakes. Use when writing, reviewing, or refactoring code to avoid overcomplication, make surgical changes, surface assumptions, and define verifiable success criteria.
license: MIT
---

# Karpathy Guidelines

Behavioral guidelines to reduce common LLM coding mistakes，源自 [Andrej Karpathy 的观察](https://x.com/karpathy/status/2015883857489522876)。

**权衡：** 这些准则偏向谨慎而非速度。对于 trivial 任务，请自行判断。

## 1. 先思考再编码

**不要假设。不要隐藏困惑。暴露权衡。**

实现之前：
- 显式陈述你的假设。如果不确定，提问。
- 如果存在多种解释，全部列出——不要默默选一个。
- 如果存在更简单的方法，说出来。必要时提出反对。
- 如果有任何不明确的地方，停下来。说出困惑之处。提问。

## 2. 简洁优先

**解决问题的最小代码。不要投机代码。**

- 不做要求之外的功能。
- 不为一次性代码做抽象。
- 不做未要求的"灵活性"或"可配置性"。
- 不为不可能的场景做错误处理。
- 如果写了 200 行但 50 行就能搞定，重写。

问自己："资深工程师会说这过于复杂吗？" 如果是，简化。

## 3. 外科手术式修改

**只动必须动的。只清理自己造成的混乱。**

编辑既有代码时：
- 不要"改进"邻近的代码、注释或格式。
- 不要重构没坏的东西。
- 匹配既有风格，即使你会有不同做法。
- 如果发现无关的死代码，提一下——不要删除。

当你的修改造成孤儿代码时：
- 移除你的修改导致的未使用 import/变量/函数。
- 不要移除既有的死代码，除非被要求。

检验标准：每一行改动都应直接追溯到用户的要求。

## 4. 目标驱动执行

**定义成功标准。循环直到验证。**

将任务转化为可验证的目标：
- "加验证" → "为无效输入写测试，然后让它们通过"
- "修 bug" → "写一个复现它的测试，然后让测试通过"
- "重构 X" → "确保重构前后测试都通过"

多步骤任务，给出简要计划：
```
1. [步骤] → 验证: [检查项]
2. [步骤] → 验证: [检查项]
3. [步骤] → 验证: [检查项]
```

强成功标准让你能独立循环。弱标准（"让它工作"）需要不断澄清。
