# SSR 与 Hydration

## 面试回答

> CSR 是浏览器先拿几乎空的 HTML，再下 JS，在客户端把组件树渲成 DOM，首屏可见往往等 JS 跑完。SSR 是服务端先跑一遍组件树，返回带内容的 HTML，用户更快看见页面，爬虫也能直接读正文。React 里可以用 `renderToString` 同步序列化成 HTML，生产更常见流式 API；这段 HTML **不挂事件**。浏览器展示后还要下客户端 JS，用 `hydrateRoot` 做 hydration：复用已有 DOM，挂上事件和更新能力，而不是拆掉重画。
>
> SEO 受益是因为响应里已经有可读结构和文案，而不是 SSR「自带排名」。要注意 hydration mismatch：服务端和客户端第一次渲染结果必须一致，`Date.now()`、乱读 `window`、数据两边不一致都会炸。React Server Components 和传统 SSR 不是一层事：SSR 回答「首屏 HTML 谁生成」；RSC 回答「哪些组件代码可以留在服务端、少下发 JS」。选型看 SEO、首屏指标、服务器成本和 hydration 复杂度——纯内部后台不必为 SEO 硬上 SSR。

**一句话总结：**

> SSR 服务端出 HTML → Hydration 复用 DOM 挂交互 → 防 mismatch → RSC 管组件执行位置 ≠ 传统 SSR。

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

流式 + Suspense：先推骨架与就绪块，改善 TTFB / LCP。

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

| 选 SSR/SSG | 继续 CSR |
| --- | --- |
| SEO、分享卡片、内容首屏 | 强交互后台、登录后系统 |
| 能接受 Node/缓存/错配成本 | 要简单部署与更小服务器责任 |

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

### 「看得见点不了」怎么解释？

HTML 先到，事件要等 hydration；优化减客户端工作量。

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
