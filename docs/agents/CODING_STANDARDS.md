# 编码规范 (Coding Standards)

## 命名规范

- 变量名必须有明确领域含义，严禁使用泛化抽象词：`data`、`result`、`temp`、`items`、`info`、`obj`、`val`、`list`。
- 禁止添加类型后缀：不使用 `userList`、`nameStr`、`countNum` 等。
- 布尔值变量统一使用 `is` / `has` / `should` 前缀。
- 数组与集合变量统一使用复数形式或集合名词。

## 注释规范

- 只解释 **why**（为什么这样设计/实现），不解释 **what**（字面做了什么）。
- 禁止逐行同义反复解释循环体与条件分支。
- 私有函数无需添加重复的 docstring。
- 仅在存在复杂算法机制或非直观逻辑时添加中文注释。

## 抽象原则

- 严格遵守 Rule of Three：当模式第三次重复出现时才提炼抽象。
- 严禁创建无实际用途的 BaseService / AbstractFactory / StrategyPattern。
- 严禁定义只有单一实现类的套壳接口。

## 防御性编程

- 仅在外部信任边界（API 接口入口、用户输入）做校验。
- 凡是类型系统（TypeScript / Static Types）能够保障的不做冗余手动校验。
- 严禁无意义的 null / undefined / 空字符串三层防御判断。
- 采用 TypeScript strict mode 替代手动类型校验。

## 函数设计

- 采用 early return 卫语句，避免深层 else 嵌套。
- 无意义的临时中间变量一律内联处理。
- 函数保持单一职责，但不做无谓的 2-3 行极微碎片化拆分。
- 参数数量过长（&gt; 4 个）时统一重构为对象传参。

## 错误处理

- 严禁在每个底层函数里滥用 try-catch，仅在系统边界层统一处理。
- 错误日志描述需明确带上问题上下文，严禁纯 "Error occurred" 式日志。

## 格式规范

- 统一使用配置好的 Prettier / ESLint 进行自动化格式化。
- 不盲目追求每行 80 字符的绝对限制。
- 允许在逻辑清晰时使用有意义的单行稍长表达。

