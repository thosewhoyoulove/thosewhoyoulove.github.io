# Agent 前端专题提纲

## 对话与状态

- 消息模型：user / assistant / tool / system；id 与 parentId（分支）
- 多会话 Tab、历史加载、未读与草稿
- 输入框：多模态附件、@ 引用、slash 命令
- 乐观 UI vs 以服务端 SSE 为准的冲突处理

## 流式渲染

- SSE vs fetch ReadableStream vs WebSocket 对比表
- 打字机效果：按 token 还是按 chunk；取消 AbortController
- 增量 Markdown：未完成代码块、表格的闪烁问题
- 断线重连与 last-event-id

## 工具调用（Tool / Function Calling）

- 展示态：running、success、error、cancelled
- 参数折叠、JSON 高亮、大结果分页或下载
- Human-in-the-loop：approve / reject / edit 再执行
- MCP 工具列表 UI（名称、描述、权限提示）— 概念级即可

## 上下文与成本体验

- Token 用量展示、上下文将满提示
- 附件解析失败、超长截断的用户提示
- 多文件 @ 的队列与进度

## 安全与合规（前端职责）

- 上传前脱敏、禁止粘贴密钥的 UX
- 企业版：数据驻留、模型切换的界面提示
- 引用溯源：citation 卡片、跳转到源

## 可观测与调试

- 开发者面板：原始 event、latency、model id
- 与「Debug 模式」类 IDE 产品的 UI 差异（可链面经）
- 前端埋点：首 token 时间、完整回复时间、工具失败率

## 面试速记（可选一篇）

`面试准备/技术/Agent 前端速记.md`：提纲 + 链到 `Agent/` 深文。