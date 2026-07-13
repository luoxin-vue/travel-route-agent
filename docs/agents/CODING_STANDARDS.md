# Coding Standards

## 禁止
- 不要过度抽象，先写 concrete 再 extract
- 不要写没必要的 interface（除非真有多态需求）
- 不要无脑加 try-catch，让错误自然冒泡
- 不要用 any，类型推到哪写到哪
- 不要写 JSDoc 废话，doc 只在出乎意料时加

## 偏好
- 函数不超过 30 行
- 优先 named export，避免 default export
- 变量声明靠近使用处
- commit message 用中文，格式: `动词: 干了什么`