# SSR 与 Hydration

## 面试回答

> CSR 是浏览器先拿几乎空的 HTML，再下 JS，在客户端把组件树渲成 DOM，首屏可见往往等 JS 跑完。SSR 是服务端先跑一遍组件树，返回带内容的 HTML，用户更快看见页面，爬虫也能直接读正文。React 里可以用 `renderToString` 同步序列化成 HTML，生产更常见流式 API；这段 HTML **不挂事件**。浏览器展示后还要下客户端 JS，用 `hydrateRoot` 做 hydration：复用已有 DOM，挂上事件和更新能力，而不是拆掉重画。
>
> 流式 SSR 会配合 Suspense 先发送可以完成的 shell 和 fallback，后续内容就绪后继续注入；客户端也可以按 Suspense 边界逐步 hydration，而不必等整棵树全部准备好。这样优化的是内容到达与可交互的顺序，但不能消除客户端 JavaScript、数据序列化和 hydration 成本。
>
> Hydration 最重要的约束是服务端 HTML 与客户端首次 Render 一致。`Date.now()`、`Math.random()`、只在一端读取 `window`、数据快照不同或非法 HTML 嵌套都可能产生 mismatch。不能把 `suppressHydrationWarning` 当通用修复，它只适合明确且不可避免的局部差异；生产还应通过服务端流的 `onError` 和客户端 `onRecoverableError` 做监控。
>
> React Server Components 和传统 SSR 不是一层能力：SSR 回答「HTML 在哪里生成」，RSC 回答「组件在哪里执行、哪些代码不进入客户端 bundle」。它们经常和 Streaming、Suspense 一起使用。选型时要同时看 SEO、TTFB/LCP、交互延迟、缓存命中率、服务器成本和 hydration 复杂度，而不是只看“首屏更快”。

**一句话总结：**

> 服务端以 string 或 stream 输出 HTML → 浏览器先展示 shell → 客户端按边界 hydration 并接上事件/Fiber → 保证两端首屏一致并监控可恢复错误；RSC 决定组件执行位置，不等同于 SSR。

---

## 核心原理

### 1. 为什么需要 SSR

CSR 把「看得见」绑在 JS 执行上；内容站、商品详情、分享卡片往往等不起，爬虫也不总是可靠执行整页 JS。SSR 把首屏内容提前放进 HTML，换的是服务器渲染成本与 hydration 一致性约束。

---

### 2. 整体链路

```text
请求 →（取数）→ 服务端 render（string / stream）
  → 返回带内容的 HTML
  → 浏览器绘制首屏（可看，交互未必完整）
  → 下载 client JS
  → hydrateRoot：复用 DOM、绑事件、接上 Fiber 更新
  → 之后更新走客户端 React
```

| | CSR | SSR |
| --- | --- | --- |
| 首屏 HTML | 多为壳 | 已有业务内容 |
| 看得见 | 等 JS | HTML 到达即可 |
| 可交互 | 随客户端 render | 等 hydration |
| 服务器 | 静态 + API | 要跑渲染（或边缘缓存） |

SSG / ISR 是同光谱变体：构建期或按需生成，用 CDN 降每次渲染成本。

---

### 3. `renderToString` 与流式

`renderToString`：服务端把 React 树同步序列化成 HTML 字符串。不创建浏览器 DOM，不绑 `onClick`，大树会堵 Node 事件循环。

| API | 特点 |
| --- | --- |
| `renderToString` | 同步整页，适合讲原理 |
| `renderToPipeableStream` | Node 流，可边算边推 |
| `renderToReadableStream` | Web Streams / Edge |

#### 流式 + Suspense 的执行方式

```text
服务端先完成 App Shell
  → onShellReady：开始 pipe HTML
  → 未完成的 Suspense 边界先输出 fallback
  → 数据就绪后继续发送该边界内容
  → onAllReady：所有边界完成
```

`onShellReady` 适合尽快给普通用户返回 shell；`onAllReady` 可以用于需要完整 HTML 后再输出的静态生成或特定爬虫路径。Shell 自身失败和边界内部失败要分别处理：前者通常返回整页兜底，后者可以先保留 Suspense fallback，再由客户端尝试恢复。

流式通常改善 TTFB 和内容渐进到达，但 LCP 是否改善仍取决于关键内容位于哪个边界、数据速度、CSS/字体/图片和客户端资源优先级，不能简单等同于“用了 stream，LCP 一定更好”。

---

### 4. Hydration

```js
hydrateRoot(document.getElementById('root'), <App />)
```

| | `createRoot().render` | `hydrateRoot` |
| --- | --- | --- |
| 初始 DOM | 客户端创建 | 复用服务端 HTML |
| 目标 | 从零构建 | 附着并激活 |

「看得见点不了」：HTML 已绘制，监听器要等 bundle + hydration。优化靠减包、流式、缩小 Client 边界。

**Mismatch 常见因：** `Date.now()` / `Math.random()`、只在一端有的数据、扩展改 DOM、非法 HTML 被浏览器改结构。处理：首屏只用两端一致的数据；浏览器独有逻辑进 `useEffect`；必须客户端-only 的明确划界。

#### Hydration 不是一次性全页开关

React 可以结合 Suspense 边界逐步 hydration。用户与尚未完成 hydration 的区域交互时，React 会尝试优先处理相关边界，并在边界可用后接上交互。它解决的是“先激活哪一块”，不等于完全不需要下载和执行对应客户端代码。

#### mismatch 怎么治理

| 层级 | 做法 |
| --- | --- |
| 根因 | 两端使用相同数据快照、locale、时区和确定性输出 |
| 浏览器专属逻辑 | 首次输出保持一致，提交后再读取浏览器能力 |
| 不可避免的小范围差异 | 谨慎使用 `suppressHydrationWarning`，只作用于明确节点 |
| 监控 | `hydrateRoot` 配置 `onRecoverableError`，上报组件栈与页面信息 |
| 服务端错误 | 流式 API 使用 `onError` / `onShellError`，区分边界恢复和 shell 崩溃 |

Hydration mismatch 不是普通 warning 可以长期忽略：它可能让 React 放弃部分服务端结果并转为客户端渲染，也可能造成属性、文本或事件对应关系异常。

---

### 5. RSC vs 传统 SSR

| | 传统 SSR | RSC |
| --- | --- | --- |
| 问题 | 首屏 HTML 从哪来 | 哪些组件代码必须下发 |
| 组件去向 | 同构组件常仍进 client bundle，再 hydrate | Server Component 默认不下发；Client 才 hydration |
| 数据 | 页面级取数再传 props | 服务端组件可直接 async 取数 |

RSC 不能在服务端组件用 `useState` / `useEffect`；传给 Client 的 props 须可序列化。现代框架常是 **RSC + SSR/Streaming**，不是二选一。

---

### 6. 设计取舍

| 维度 | SSR / Streaming | CSR |
| --- | --- | --- |
| 内容到达 | HTML 可直接携带内容 | 通常等 JS 和客户端数据 |
| 交互 | 仍需 hydration，可能出现交互空窗 | 初始化完成后直接交互 |
| SEO / 分享 | 更容易稳定输出正文与 meta | 依赖爬虫执行能力或额外预渲染 |
| 基础设施 | 服务端渲染、缓存、流式错误治理 | 静态托管简单 |
| 一致性 | 两端首屏必须确定性一致 | 没有 hydration mismatch |

实时个性化内容可以 SSR；更新少且可提前生成的内容优先 SSG；大量页面可缓存、允许一定陈旧度时考虑 ISR。登录后的强交互后台通常不必只为“技术先进”引入 SSR。

---

## 常见误区

### ❌ SSR 之后就不需要前端 JS

### ✅ 更准确的说法

SSR 解决首屏 HTML；交互与后续更新仍靠客户端 JS + hydration。

### 为什么？

否则无法解释 TTI 与「看得见点不了」。

---

### ❌ Hydration 就是客户端重新 render 一遍页面

### ✅ 更准确的说法

目标是复用已有 DOM 并挂上运行时；错配严重时才可能走修正重渲。

### 为什么？

「重画」说法会漏掉复用与 mismatch 约束。

---

### ❌ RSC 等于 SSR / 有了 RSC 就自动有 SEO

### ✅ 更准确的说法

RSC 管执行位置与包体；HTML 是否服务端输出仍看框架是否做 SSR/流式。

### 为什么？

两层问题搅在一起是 Next 题高频翻车点。

---

### ❌ 所有项目都该上 SSR

### ✅ 更准确的说法

按 SEO、首屏、成本、hydration 复杂度选型；纯 B 端常 CSR 更合适。

### 为什么？

面试要听判断力。

---

## 高频追问

### SSR 和 CSR 核心差别？

首屏 HTML 是否已有内容，以及「看得见」是否绑定 JS 执行。

### `renderToString` 和 `hydrateRoot` 各在哪一端？

前者服务端出 HTML；后者浏览器复用 DOM 激活。两边首屏结果须一致。

### 为什么会 hydration mismatch？

两端第一次渲染树不一致，或浏览器改写了 HTML 结构。

### Streaming SSR 和传统 `renderToString` 有什么区别？

`renderToString` 同步等待整棵树形成字符串；Streaming 可以先发 shell 和 Suspense fallback，后续边界就绪后继续输出，并允许客户端按边界逐步 hydration。

### 「看得见点不了」怎么解释？

HTML 先到，事件要等 hydration；优化减客户端工作量。

### `suppressHydrationWarning` 能解决 mismatch 吗？

它只压制明确节点的一层警告，不会修复错误的数据流，也不应递归当逃生舱。应先保证两端数据与结构一致，并通过 `onRecoverableError` 监控剩余问题。

### SSR / SSG / ISR 怎么选？

实时个性化 → SSR；少变更 → SSG；大多可缓存偶尔更新 → ISR/按需。

### RSC 会取代 SSR 吗？

不会简单取代；常组合使用，分别解决包体/执行位置与 HTML 输出。

---

## 延伸阅读

- [React 渲染原理](/md/框架/React/React%20渲染原理.md)
- [React Fiber 架构](/md/框架/React/Fiber架构.md)
- [首屏加载优化](/md/浏览器/加快首屏加载速度.md)
- [前端性能优化（速记）](/md/面试准备/技术/前端性能优化.md)
- [Node.js 与全栈](/md/面试准备/技术/NodeJs%20&%20全栈开发.md)
- [React & Vue 速记](/md/面试准备/技术/React%20&%20Vue.md)
