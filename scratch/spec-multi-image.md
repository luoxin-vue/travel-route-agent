
## Problem Statement

国际行程中，Agent 生成的 POI 节点（如"卢浮宫"、"圣家族大教堂"）依赖 `intl_search_detail` 工具获取配图。当前三级兜底链（Wikipedia → Wikimedia → Pexels）在以下场景覆盖不足：

- 中文资料贫瘠的小众景点（非一线城市的博物馆、餐厅、街巷）
- Pexels 对旅游 POI 的搜索召回率不如 Unsplash 和 Flickr
- 全部三级搜空时，节点完全无图，SmartImage 静默隐藏，用户感受空白

用户需要更丰富的国际行程配图，减少"无图节点"。

## Solution

扩展现有 `intl_search_detail` 工具内部的图片搜索兜底链，从三级增至五级：

1. Wikipedia（zh → en，获得 pageimage thumbnail）
2. Wikimedia Commons（搜索 File 命名空间，取 Special:FilePath）
3. Pexels API（已有 `PEXELS_API_KEY`，搜索照片取 medium 尺寸）
4. **Unsplash API（新增）** — 搜索照片取 small 尺寸，需 `UNSPLASH_ACCESS_KEY`
5. **Flickr API（新增）** — 搜索 CC 许可照片，需 `FLICKR_API_KEY`

全部五级均无结果时，返回一个通用旅行主题占位图 URL（复用现有 Pexels CURATED_IMAGES 中的一张，不新增静态资源）。

前端 `SmartImage` 组件和 `proxiedImage` 代理逻辑 **不需要任何改动** —— 获得的 URL 无论来自哪个渠道，均是 HTTPS 外链，走 raw 直连模式。

## User Stories

1. 作为一名旅行规划用户，我希望 Agent 为我规划的"巴黎三日游"行程中，每到一个非一线景点（如"莎士比亚书店"）也能看到配图，而不是卡片空白
2. 作为一名旅行规划用户，我希望最终的行程卡片视觉丰富、不出现"空图位"
3. 作为一名海外用户，我希望 Flickr 上的真实游客照片能被纳入配图候选，让图片更有"真实旅行感"
4. 作为一名开发者，我希望新增的 Unsplash/Flickr 搜索不改变现有 Agent 工具调用流程，仅内部扩展搜索源
5. 作为一名运维者，我希望 Unsplash/Flickr 的 API Key 为可选配置——未配置时优雅跳过，不影响已配置的 Wikipedia/Wikimedia/Pexels 链条

## Implementation Decisions

**模块范围**：仅修改 `intl_search_detail` 工具（`backend/app/agent/intl_tools.py`），不新增模块、不新建文件。

**兜底链顺序**：Wikipedia → Wikimedia → Pexels → Unsplash → Flickr → 占位图。

- Wikipedia/Wikimedia 优先：百科图片权威、准确、无版权歧义
- Pexels/Unsplash 居中：免费图库，API 稳定，质量高
- Flickr 末尾：真实 UGC 照片，但 API 响应较慢且需 CC 筛选
- 占位图兜底：确保永远不返回空 image_url

**新增配置项**（`Settings` 类 + `.env`）：

- `unsplash_access_key: str = ""` — Unsplash API Access Key，不填跳过
- `flickr_api_key: str = ""` — Flickr API Key，不填跳过

两者均为可选——不配置时对应搜索源静默跳过，不受影响。

**Unsplash API 调用**：
- 端点：`GET https://api.unsplash.com/search/photos?query={name}&per_page=1`
- 认证：`Authorization: Client-ID {UNSPLASH_ACCESS_KEY}`
- 取图尺寸：`result.response.results[0].urls.small`
- 错误处理：网络/限流异常静默跳过

**Flickr API 调用**：
- 端点：`GET https://www.flickr.com/services/rest/?method=flickr.photos.search&api_key={key}&text={name}&per_page=1&license=1,2,4,5,7,8,9,10&format=json&nojsoncallback=1`
- license 参数筛选 CC 许可照片（排除 All Rights Reserved）
- 图片 URL 构造：`https://farm{farm}.staticflickr.com/{server}/{id}_{secret}_z.jpg`
- 错误处理：网络/限流异常静默跳过

**占位图**：复用 `CURATED_IMAGES['hero'][0]`（Pexels 免版权图），硬编码在工具中作为兜底值。

**Agent Schema 不变**：`ItineraryNode.image` 字段描述更新为提及多渠道兜底——"图片取自 Wikipedia/Wikimedia/Pexels/Unsplash/Flickr 多渠道搜索；全部未命中时返回通用占位图。不要编造 URL。"

## Testing Decisions

**什么才算好测试**：只测外部可观察行为——工具输入关键词，有图返回 image_url，无图返回占位 URL，网络异常返回可读错误文本。不测具体 URL 格式，不测 API Key 是否有效。

**测试模块**：`backend/test_intl_tools.py`（已有 `test_intl_tools_graceful_on_http_error` 可复用模式）。

**需要新增的测试**：

1. **兜底链降级测试**：patch 前三源（Wikipedia/Wikimedia/Pexels）均返回空或无图，验证 Unsplash → Flickr → 占位图的逐级生效
2. **可选 API Key 跳过测试**：patch 环境变量中 Unsplash/Flickr key 为空，验证链条跳过对应源不报错
3. **网络异常清理吞掉**：patch `_client()` 在对应源抛出异常，验证不中断链条，继续下一级
4. **全部不可用最终返回占位图**：patch 所有源均异常，验证返回包含占位图 URL 的结果

**已有测试模式参考**：`test_intl_tools_graceful_on_http_error`（`backend/test_intl_tools.py:227`）——对每个 `intl_*` 工具统一用 `patch("app.agent.intl_tools._client")` 注入 Mock，调用 `tool_fn.ainvoke(input_kwargs)` 验证兜底文本。

## Out of Scope

- 前端 `SmartImage` 或 `proxiedImage` 的修改（天然兼容新 URL）
- 后端 `/api/img` 代理白名单扩展（新图片为 HTTPS 外链直连，不走代理）
- 用户手动选图/替换图片的交互（仅 Agent 自动配图）
- 图片质量 AI 排序/去重（各源取 Top1，不做跨源智能选择）
- 百度图片、小红书等其他未提供公开 API 的渠道
- 国内行程配图逻辑（高德 POI 图片链路不变）

## Further Notes

- Unsplash 免费额度为 50 req/h（Demo 级），生产环境需申请 Production 额度提升到 5000 req/h
- Flickr API 不支持 OAuth-less 的纯免费 Key 申请已暂停（2024 年起），但仍可通过已有 Key 继续使用
- 如果 Unsplash 或 Flickr Key 长期未配置，实际兜底链退化为当前的三级体系（Wikipedia → Wikimedia → Pexels → 占位图），行为与本 Spec 实施前基本一致
- `intl_search_detail` 的描述文本过长可能影响 Agent 的 tool choice 准确度——建议在新旧源之间用精简的列表式描述，不用完整叙述
