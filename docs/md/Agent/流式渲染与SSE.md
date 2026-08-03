# 流式渲染与 SSE

## 面试定位

流式是 Agent 前端必考题。要讲清：**传输选型、事件解析、取消、增量 Markdown、断线恢复**，并能对比 SSE / fetch ReadableStream / WebSocket。

## 面试回答

可以这样答：

> 对客聊天我优先用 HTTP 流：SSE 或 fetch + ReadableStream。它们天然适合服务端单向推送 token，鉴权可复用常规 HTTP Header，中间层也好做。WebSocket 更适合强双向、频繁交互的场景，但运维和重连语义更重。前端用 AbortController 取消生成；按事件类型更新消息，而不是把整个 body 当纯文本。渲染上要对未闭合的 Markdown 代码块做容错，并用 rAF 或分片合并减少每个 token 都 setState 的抖动。断线时可带 last-event-id 或 runId 续传，续不上就提示重试并保留已生成内容。验证看首 token 时间、完整回复时间、取消后服务端是否真停、弱网是否会重复追加。

一句话总结：

> 流式渲染 = 合适的推送通道 + 可取消解析 + 对增量 UI 友好的批处理。

---

## 核心原理

```text
用户发送
  → fetch/SSE 建立流
  → 解析 event: text_delta / tool_call / error / done
  → 合并到消息 buffer
  → 节流后触发 React 更新
  → Markdown 增量渲染
  → done / abort / error 收尾
```

---

## 1. 传输选型

| 维度 | SSE | fetch ReadableStream | WebSocket |
| --- | --- | --- | --- |
| 方向 | 服务端→客户端为主 | 同左（响应体流） | 全双工 |
| 鉴权 | Cookie / Header 自然 | 同左 | 常要额外协议 |
| 浏览器 API | EventSource（自定义头受限）或 fetch 模拟 | fetch | WebSocket |
| 适合 | Token 流、通知 | 同 SSE，控制更细 | 协同编辑、双向指令密集 |
| 代价 | 部分代理缓冲要调 | 要自己解析帧 | 连接治理更复杂 |

实践中很多产品用 **fetch 读 stream** 来发 POST + Header，同时享受流式响应。

**要点**：选型看“是否需要浏览器主动高频上行”，而不是谁更新潮。

---

## 2. 取消、背压与批处理

```js
const controller = new AbortController()

const res = await fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify(payload),
  signal: controller.signal,
  headers: { Accept: 'text/event-stream' },
})

// 用户点击停止
controller.abort()
```

注意：

- 取消后 UI 标 `cancelled`，并最好通知 BFF 停止继续生成（仅 abort 客户端不够时要有服务端取消接口）。
- 每个 token 都 `setState` 会卡；可按字符块或 16～32ms 合并。
- 长列表用虚拟滚动，贴底策略见对话架构文。

---

## 3. 增量 Markdown 与重连

增量 Markdown 常见坑：

- 代码围栏未闭合时高亮闪烁
- 表格行不完整导致布局跳动
- 自定义组件（图表）不要在半截 JSON 上初始化

策略：流式中用宽松解析；`done` 后再做一次完整规范化。

断线恢复：

```text
记录 runId / lastEventId
  → 重连请求续传
  → 按序号去重追加
  → 无法续传则提示“网络中断，可重试”
```

**场景（示例）**：官网文档助手用 BFF 聚合模型流，前端 fetch 解析 SSE；用户点停止后同时 abort 与调用 `POST /runs/:id/cancel`。

**验证**：Chrome Network 看流是否 chunked；打点 TTFB/首 token；取消后服务端日志无继续计费事件。

---

## 高频追问

### EventSource 为什么有时不够用？

原生 EventSource 基本是 GET，自定义 Header（如 Authorization）支持差。需要 POST 或复杂鉴权时，常用 fetch 读流自己解析 SSE。

### 和 WebSocket 聊天有什么本质区别？

聊天室常要双向广播；LLM token 流主要是单次请求的下行。用 WS 也能做，但要自己处理鉴权、心跳、多路复用，收益不一定更大。

### 代理或 CDN 会坑流式吗？

会。部分中间层缓冲导致“一下子吐整段”。需要禁用缓冲或走支持流式的网关配置，联调时重点验证。

---

## 延伸阅读

- [对话界面架构](/md/Agent/对话界面架构.md)
- [WebSocket](/md/网络/WebSocket.md)
- [可观测性与 Debug 体验](/md/Agent/可观测性与Debug体验.md)
- [Node.js 与全栈](/md/面试准备/技术/NodeJs%20&%20全栈开发.md)
