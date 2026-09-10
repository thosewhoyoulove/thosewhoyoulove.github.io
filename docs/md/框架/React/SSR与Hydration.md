# SSR 与 Hydration

## 面试定位

SSR 是 React / Next.js 面试里的高频渲染策略题。面试官想听的不只是「服务端出 HTML」，而是：**CSR 和 SSR 的首屏链路差在哪、`renderToString` 到底产出什么、为什么利于 SEO、hydration 如何把静态 HTML 变成可交互应用，以及 RSC 和传统 SSR 的边界**。常见误区是把 SSR 当成「没有前端 JS」、把 hydration 当成「重新渲染一遍页面」、把 RSC 直接等同于 SSR。

## 面试回答

可以这样答：

> CSR 是浏览器先拿到几乎空的 HTML，再下载并执行 JS，客户端把组件树渲染成 DOM；首屏可见内容依赖 JS 执行完成。SSR 则是服务端先把组件树跑一遍，产出带内容的 HTML 返回给浏览器，用户更快看到页面，爬虫也能直接读到正文。React 里经典入口是 `renderToString`：它在服务端把 React 树同步序列化成 HTML 字符串，不挂事件、不跑浏览器副作用。浏览器展示这段 HTML 后，还要下载客户端 JS，用 `hydrateRoot` 做 hydration：复用已有 DOM，绑定事件和状态，而不是把页面拆掉重画。SEO 受益是因为首屏响应里已经有可读的文本和结构，搜索引擎不必完全依赖执行 JS。React Server Components 和传统 SSR 不同：传统 SSR 主要解决「首屏 HTML 从哪来」，之后组件仍会下发到客户端；RSC 是把一部分组件默认留在服务端执行，减少客户端 JS 体积，并和 Streaming / Suspense 更深结合。选型时要看 SEO、首屏指标、服务器成本和 hydration 复杂度，不是所有后台系统都值得上 SSR。

一句话总结：

> SSR = 服务端先出 HTML；Hydration = 客户端复用 DOM 挂上交互；RSC = 组件可永久留在服务端，不只是首屏出 HTML。

---

## 核心原理

渲染策略解决的是：**谁在什么时候把组件变成用户可见的 DOM，以及 JS 何时接管交互**。

主链路：

```text
请求到达 Node / Edge
  → 拉数据（可选）
  → 服务端执行 React 树（renderToString / renderToPipeableStream）
  → 返回带内容的 HTML（+ 序列化后的数据）
  → 浏览器解析并绘制首屏
  → 下载客户端 JS bundle
  → hydrateRoot：复用 DOM、绑定事件、恢复状态
  → 之后的更新走客户端 React 渲染（CSR 路径）
```

---

## 1. SSR 和传统 CSR 有什么区别？

| 维度 | CSR（Client-Side Rendering） | SSR（Server-Side Rendering） |
| --- | --- | --- |
| 首屏 HTML | 多为壳子 + 空根节点 | 已包含业务内容的完整/接近完整 HTML |
| 谁生成首屏 DOM | 浏览器执行 JS 后生成 | 服务端先生成 HTML，浏览器直接解析 |
| 首屏可见时机 | 依赖 JS 下载 + 解析 + 执行 | HTML 到达即可看到内容（交互仍等 hydration） |
| SEO / 分享卡片 | 依赖爬虫执行 JS，或另做预渲染 | 响应里直接有文本，更利于抓取 |
| 服务器职责 | 主要提供静态资源和 API | 每个请求（或边缘缓存未命中时）要跑渲染 |
| 典型场景 | 强交互后台、登录后系统 | 官网、内容站、电商详情、需要 SEO 的营销页 |

CSR 典型链路：

```text
HTML(壳) → JS → 请求数据 → React render → 用户看到内容
```

SSR 典型链路：

```text
服务端取数 + render → HTML(有内容) → 用户看到内容 → JS → hydration → 可交互
```

取舍：

- **CSR 更简单**：部署静态资源即可，服务器压力小；但 FCP/LCP 容易被大包 JS 拖慢。
- **SSR 改善「看得见」**：TTFB 可能变高（服务端算 HTML），但首屏内容更早出现；要运维 Node、处理缓存、错误降级和 hydration 一致性。
- **SSG / ISR** 是同一光谱上的变体：构建期或按需生成 HTML，用 CDN 缓存降低每次请求的渲染成本。

**要点**：SSR 不消灭客户端 React，它改变的是首屏 HTML 的来源和可见时机。

---

## 2. `renderToString` 做了什么？

`renderToString` 是 `react-dom/server` 的同步 API：在**服务端**把 React Element 树渲染成 **HTML 字符串**。

```js
import { renderToString } from 'react-dom/server'

const html = renderToString(<App url={req.url} />)
// 返回类似：'<div class="app"><h1>首页</h1>...</div>'
```

它做了什么：

1. 从根组件开始执行函数组件 / 类组件的 render（服务端环境）。
2. 把产出的 React Element 树递归序列化成 HTML 标记。
3. 返回字符串，由框架塞进完整文档（`<!DOCTYPE html>...`）再 `res.send`。

它**不会**做的事：

- 不创建真实浏览器 DOM，也没有 `window` / `document`（除非你自己 polyfill，通常不该依赖）。
- 不绑定 `onClick` 等事件监听器；事件要等客户端 hydration。
- 不适合长时间阻塞：大树同步渲染会卡住 Node 事件循环。

React 18 更常见的是流式 API：

| API | 特点 | 适用 |
| --- | --- | --- |
| `renderToString` | 同步、一次性整页字符串 | 理解原理、简单页、兼容旧代码 |
| `renderToPipeableStream` | Node Stream，可边算边推 | 生产 SSR、Suspense 流式 |
| `renderToReadableStream` | Web Streams | Edge / Workers 环境 |

流式 SSR 的价值：不必等整棵树和全部数据就绪才吐第一个字节，配合 Suspense 先推骨架和已就绪区块，降低 TTFB、改善 LCP。

最小服务端拼装示意：

```js
import { renderToString } from 'react-dom/server'

app.get('*', (req, res) => {
  const appHtml = renderToString(<App />)
  res.send(`<!DOCTYPE html>
<html>
  <body>
    <div id="root">${appHtml}</div>
    <script src="/client.js"></script>
  </body>
</html>`)
})
```

**要点**：`renderToString` = 服务端同步「组件树 → HTML 字符串」；生产环境更优先流式渲染 API。

---

## 3. SSR 为什么有利于 SEO？

搜索引擎和社交爬虫的理想输入是：**HTTP 响应里就能读到标题、正文、结构化标记**。

CSR 问题：

- 首屏 HTML 往往只有 `<div id="root"></div>`。
- 正文依赖 JS 执行后才出现。
- 部分爬虫对 JS 执行能力有限或延迟抓取，分享卡片（Open Graph）也可能抓不到正确描述。

SSR 收益：

1. **首屏 HTML 自带内容**：标题、段落、商品名、价格等直接出现在响应体。
2. **元信息可服务端注入**：`<title>`、`description`、`og:image` 按路由生成。
3. **与性能指标正相关**：用户和爬虫都更快看到主要内容；LCP 元素更早进入文档。

边界（面试要主动说）：

- 现代 Googlebot 能执行 JS，但 SSR 仍更稳、更快、对非 Google 爬虫和预览更友好。
- SEO 不只靠 SSR：还要语义化标签、站点地图、可达链接、核心内容不要全靠客户端才插入。
- 纯登录后的 B 端系统通常**不需要**为 SEO 上 SSR。

**要点**：SSR 利于 SEO，本质是「爬虫第一次拿到的文档里已经有可读内容」，而不是「SSR 自带排名算法加成」。

---

## 4. SSR hydration 是什么？

Hydration（注水）指：浏览器已经有了服务端下发的 HTML DOM，客户端 React **复用这些节点**，挂上事件监听、Fiber 状态和更新能力，而不是清空后重画一遍。

```js
import { hydrateRoot } from 'react-dom/client'

hydrateRoot(document.getElementById('root'), <App />)
```

和 CSR 的 `createRoot(...).render(...)` 对比：

| | `createRoot().render` | `hydrateRoot` |
| --- | --- | --- |
| 根节点初始状态 | 通常为空或由客户端创建 | 已有服务端 HTML |
| 目标 | 创建 DOM | 附着到已有 DOM |
| 错配时 | — | 开发环境告警；严重时可能客户端重渲染修正 |

完整时序：

```text
服务端 HTML 到达并绘制（可看、不可点或交互不完整）
  → 下载 / 解析 client bundle
  → hydrate：遍历组件树，校验与现有 DOM 是否一致
  → 绑定事件、恢复状态
  → 页面可交互（TTI / hydration 完成相关）
```

常见坑：**Hydration Mismatch（注水不一致）**

服务端和客户端第一次渲染结果必须一致。否则 React 会对不上 DOM。典型雷区：

- 用 `Date.now()`、`Math.random()`、`window` 宽度直接参与首屏渲染。
- 服务端有数据、客户端首屏没有（或反过来）。
- 浏览器扩展改写了 DOM。
- 非法 HTML 嵌套被浏览器自动纠正，导致结构和 React 预期不一致。

处理思路：

- 首屏只依赖「服务端和客户端都能拿到的同一份数据」。
- 浏览器独有逻辑放到 `useEffect`（只在客户端跑）。
- 必须差异显示时用明确的客户端-only 边界（框架里常见 `dynamic(..., { ssr: false })` 一类方案）。

**要点**：Hydration = 给已有 HTML「注入」React 运行时；目标是复用 DOM，不是重做一遍 CSR 首屏。

---

## 5. React Server Components 和传统 SSR 有什么区别？

二者常一起出现在 Next.js App Router 里，但解决的问题不同。

| 维度 | 传统 SSR（含 SSG 首屏） | React Server Components（RSC） |
| --- | --- | --- |
| 核心目标 | 首屏先出 HTML，利于 SEO / 首屏体验 | 减少发到浏览器的组件 JS，服务端可直接碰数据源 |
| 组件最终在哪跑 | 服务端渲染一次后，同构组件通常仍打进客户端 bundle，再 hydration | Server Component **默认不进客户端 bundle**；只有 Client Component 需要 hydration |
| 交互 | 整页（或大块）依赖客户端 JS hydration | 交互孤岛：`'use client'` 边界以内才有状态和事件 |
| 数据获取 | 常见于页面级 `getServerSideProps` / loader，再传 props | 可在服务端组件里直接 `async` 取数，少一层「专门为前端准备的 API」 |
| 和 HTML 的关系 | 强相关：就是为了产出 HTML | 可以配合 SSR/流式出 HTML，但模型重点是「组件在哪执行、JS 下发多少」 |

可以记成：

```text
传统 SSR：同一套组件，服务端先画 HTML，客户端再 hydrate 整棵（或大部分）树
RSC：组件按边界拆分，服务端组件的代码和依赖可以留在服务器，客户端只收结果描述 + 少量 Client Component
```

示意：

```jsx
// Server Component（默认）：可直接查库 / fetch，代码不下发浏览器
async function ProductPage({ id }) {
  const product = await db.product.find(id)
  return (
    <div>
      <h1>{product.title}</h1>
      {/* 只有真正需要交互的部分才是 Client Component */}
      <AddToCartButton productId={id} />
    </div>
  )
}
```

```jsx
'use client'

export function AddToCartButton({ productId }) {
  // 可以使用 useState、onClick 等浏览器能力
}
```

边界与成本：

- RSC 不能在服务端组件里用 `useState` / `useEffect` / 浏览器 API。
- 序列化约束：传给 Client Component 的 props 必须可序列化。
- 心智负担更高：要清晰划分 server / client 边界，调试链路更长。
- 传统 SSR 仍然重要：RSC 并不自动等于「有 SEO」；HTML 如何输出仍取决于框架是否做 SSR/流式。

**要点**：SSR 回答「首屏 HTML 谁生成」；RSC 回答「哪些组件代码必须下发到浏览器」。

---

## 6. 项目里怎么讲取舍（示例）

- **场景**：内容型官网、商品详情、需要微信 / 搜索引擎卡片预览的落地页。
- **做法**：Next.js / Nuxt 做 SSR 或 SSG；关键路由优先流式；把强交互模块收成 Client Component，降低 hydration 成本。
- **验证**：看 TTFB、FCP、LCP、hydration 耗时、搜索收录与分享卡片；用「禁用 JS」粗测首屏是否仍有核心文案。
- **风险**：服务器成本、缓存策略、错配、第三方脚本拖慢 hydration；纯内部后台可继续 CSR。

---

## 高频追问

### SSR 之后是不是就不需要 JS 了？

不是。SSR 解决的是首屏 HTML。交互、路由切换后的更新、事件处理仍依赖客户端 JS 和 hydration。没有 JS 时，用户往往只能看到静态首屏。

### `renderToString` 和 `hydrateRoot` 分别在哪一端？

`renderToString`（或流式 API）在服务端生成 HTML；`hydrateRoot` 在浏览器复用这段 DOM 并挂上 React。两者渲染结果必须一致。

### 为什么 hydration 会卡住交互？

HTML 先到，用户已看见按钮，但监听器要等 JS 下载和 hydration 完成才生效。这就是「看得见点不了」。优化方向包括减小客户端包、流式 SSR、推迟非关键 hydration、把重交互拆成更小的 Client Component。

### SSR、SSG、ISR 怎么选？

SSR 适合强个性化、数据实时；SSG 适合变更少、可构建期生成；ISR / 按需再生成适合「大多可缓存、偶尔更新」。面试里按数据新鲜度、流量、成本三者取舍即可。

### RSC 会取代 SSR 吗？

不会简单取代。RSC 改变组件执行位置和包体积；SSR/流式仍负责把 UI 变成 HTML 送给浏览器。现代框架往往是 **RSC + SSR/Streaming** 组合，而不是二选一。

### Vue 里对应概念是什么？

Nuxt 同样有 SSR / SSG / hydration。机制对称：服务端出 HTML，客户端激活；Vue 3 还有 Teleport、Suspense 等与 SSR 配合的细节。答 React 岗时点到「同构思路一致」即可，细节见 Vue / Nuxt 文档。

---

## 延伸阅读

- [React 渲染原理](/md/框架/React/React%20渲染原理.md)
- [React 高频考点](/md/框架/React/React%20高频考点精讲.md)
- [首屏加载优化](/md/浏览器/加快首屏加载速度.md)
- [前端性能优化（速记）](/md/面试准备/技术/前端性能优化.md)
- [Node.js 与全栈](/md/面试准备/技术/NodeJs%20&%20全栈开发.md)
- [React & Vue 速记](/md/面试准备/技术/React%20&%20Vue.md)
- [流式渲染与 SSE](/md/Agent/流式渲染与SSE.md)
