# 领域文档规范 (Domain Docs)

工程 Skill 在探索代码库时如何读取与使用本仓库的领域文档。

## 在探索前阅读以下文件

- 根目录下的 **`CONTEXT.md`**；或
- 根目录下的 **`CONTEXT-MAP.md`**（如果存在）—— 它指向各个上下文专属的 `CONTEXT.md`，请阅读与当前主题相关的每一个上下文文件。
- **`docs/adr/`** —— 阅读与你即将开展工作的领域相关的 ADR 决策记录。在多上下文仓库中，还需要检查 `src/<context>/docs/adr/` 下的上下文局部决策。

如果上述任何文件不存在，**请静默继续**。无需提示其缺失，也不要预先建议创建它们。生产 Skill（如 `/grill-with-docs`）会在术语或决策真正得到厘清时延迟创建它们。

## 文件结构

单上下文仓库（绝大多数仓库）：

```
/
├── CONTEXT.md
├── docs/adr/
│   ├── 0001-event-sourced-orders.md
│   └── 0002-postgres-for-write-model.md
└── src/
```

多上下文仓库（根目录存在 `CONTEXT-MAP.md`）：

```
/
├── CONTEXT-MAP.md
├── docs/adr/                          ← 系统级全局决策
└── src/
    ├── ordering/
    │   ├── CONTEXT.md
    │   └── docs/adr/                  ← 上下文局部决策
    └── billing/
        ├── CONTEXT.md
        └── docs/adr/
```

## 使用词汇表中的术语

当你的输出命名某个领域概念（在 Issue 标题、重构建议、假设、测试名称中）时，请使用 `CONTEXT.md` 中定义的术语。不要偏离为词汇表明确避免使用的同义词。

如果你需要的概念尚未包含在词汇表中，这是一个信号 —— 意味着你要么在使用项目未定义的非标准语言（请重新审视），要么存在真实的文档缺失（请记下以便后续使用 `/grill-with-docs` 补全）。

## 标注与 ADR 的冲突

如果你的输出与已有的 ADR 冲突，请明确指出该冲突，而不是静默覆盖：

> _与 ADR-0007 (event-sourced orders) 存在冲突 —— 但值得重新讨论，因为……_
