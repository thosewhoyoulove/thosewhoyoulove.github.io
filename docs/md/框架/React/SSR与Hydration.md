# SSR 与 Hydration

## 面试回答

> CSR 是浏览器先拿几乎空的 HTML，再下 JS，在客户端把组件树渲成 DOM，首屏可见往往等 JS 跑完。SSR 是服务端先跑一遍组件树，返回带内容的 HTML，用户更快看见页面，爬虫也能直接读正文。React 里可以用 `renderToString` 同步序列化成 HTML，生产更常见流式 API；这段 HTML **不挂事件**。浏览器展示后还要下客户端 JS，用 `hydrateRoot` 做 hydration：复用已有 DOM，挂上事件和更新能力，而不是拆掉重画。
>
> 流式 SSR 会配合 Suspense 先发送可以完成的 shell 和 fallback，后续内容就绪后继续注入；客户端也可以按 Suspense 边界逐步 hydration，而不必等整棵树全部准备好。这样优化的是内容到达与可交互的顺序，但不能消除客户端 JavaScript、数据序列化和 hydration 成本。
>
> Hydration 最重要的约束是服务端 HTML 与客户端首次 Render 一致。`Date.now()`、`Math.random()`、只在一端读取 `window`、数据快照不同或非法 HTML 嵌套都可能产生 mismatch。不能把 `suppressHydrationWarning` 当通用修复，它只适合明确且不可避免的局部差异；生产还应通过服务端流的 `onError` 和客户端 `onRecoverableError` 做监控。
>
> React Server Components 和传统 SSR 不是一层能力：SSR 回答「HTML 在哪里生成」，RSC 回答「组件在哪里执行、哪些代码不进入客户端 bundle」。它们经常和 Streaming、Suspense 一起使用。Server Component 没有留在浏览器里的实例，不能 `useState`、`useEffect`，也不能绑事件。`"use client"` 划的是打包边界：这个组件的代码要下发，并且仍然可以先在服务端输出 HTML，再 hydration。它不是「只在浏览器执行」。
>
> 同一条光谱上，SSG 在构建时生成 HTML，之后主要靠 CDN 复用；ISR 先返回缓存页，过期或按需再在后台重新生成。它们少的是每次请求都跑渲染，hydration 的规则没有变。
>
> 应用里的修改我会用 Server Action：客户端像调用函数，实际是一次 POST，函数在服务端执行，也可以顺带让缓存失效。webhook、移动端和需要公开 URL 的接口仍然用 REST 或 Route Handler。函数里面照样要做登录和权限，没有手写路径不代表它不是接口。选型时同时看 SEO、TTFB/LCP、交互延迟、缓存、服务器成本和 hydration，而不是只看「首屏更快」。

**一句话总结：**

> CSR 等 JS → SSR 每次请求出 HTML → SSG/ISR 复用生成结果 → hydration 复用 DOM 并要求两端一致 → RSC 决定代码留在哪 → `"use client"` 是打包边界 → Server Action 是应用内的 POST 变更，不是公开 REST。

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

| | 何时生成 HTML | 谁反复用它 | 个性化 | 主要成本 |
| --- | --- | --- | --- | --- |
| CSR | 浏览器执行 JS 之后 | 每个用户自己渲 | 容易，数据在客户端拿 | JS 体积和主线程 |
| SSR | 每次请求在服务端渲 | 通常不跨用户复用这一次的 HTML | 可以读 cookie、按用户取数 | 每次请求的渲染和数据 |
| SSG | 构建时生成 | CDN 上的同一份文件，直到下次构建 | 所有人同一份，不适合登录态 | 构建时间和存储 |
| ISR | 第一次生成后放进缓存，过期或按需再生成 | 过期前大家用缓存；重新生成多在后台 | 按页面或标签缓存，不按每个用户 | 缓存一致性和陈旧窗口 |

四者都不是另一套 hydration。只要浏览器还要接上事件，客户端第一次 render 就得和服务端 HTML 一致。差别只在 HTML 是现算、构建时算，还是从缓存拿。

Next.js App Router 通常不写一个叫 `getServerSideProps` 的开关。页面如果读了 `cookies()`、`headers()`，或者数据明确不能缓存，就会走到按请求渲染，接近 SSR。构建时就能确定、又没有这些动态来源的页面，可以被静态优化，接近 SSG。`revalidate`、`revalidatePath`、`revalidateTag` 表达的是「缓存一份，之后再生成」，接近 ISR。`fetch` 默认缓存与否随版本变过，面试说「显式声明再验证」，不要背某一版的默认值。

#### Trace：同一篇商品详情

| 策略 | 用户 A 打开 | 一分钟后用户 B 打开 | 价格刚被后台改了 |
| --- | --- | --- | --- |
| CSR | 空壳 + JS，再请求价格 | 同样等 JS 和接口 | 接口返回新价格 |
| SSR | 服务器按当前价格写出 HTML | 再跑一次渲染 | 这次请求就是新价格 |
| SSG | 拿到构建时写进 CDN 的 HTML | 还是那一份 | 要等下一次构建 |
| ISR | 没有缓存就生成并缓存 | 未过期就直接拿缓存 | 过期后的访问触发重新生成；`revalidatePath` / `revalidateTag` 让下一轮重新生成 |

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

#### 为什么会 mismatch

Hydration 不是把 HTML 再解析成组件。浏览器已经根据服务端 HTML 建好 DOM，客户端再按同一套组件做一次 render，拿这次的结果去对已有节点：文本、属性和层级要能对上，然后把事件和 Fiber 接到这些节点上。对不上，就是 mismatch。

它一定涉及两次执行：服务端那一次，和浏览器里 hydration 用的第一次 render。任何一次执行结果不同，DOM 就会岔开。

| 原因 | 两次执行为什么不同 |
| --- | --- |
| `Date.now()`、`Math.random()` | 两次调用本来就不是同一个值 |
| `window`、`localStorage` 写在 render 里 | 服务端没有这些对象，分支和浏览器不一样 |
| 两端数据快照不同 | 服务端用的 locale、时区、用户数据和客户端再取的不一致 |
| 非法 HTML，比如 `<p>` 里嵌 `<div>` | 浏览器解析 HTML 时会先改结构，React 还没 hydration，DOM 就已经不是服务端那棵树 |
| 扩展或第三方脚本改了 DOM | 插入的节点不在 React 的输出里 |

`useEffect` 和 `useLayoutEffect` 都不参与这次对照：它们不在服务端执行，写在里面的 `window` 不会让两次 render 输出不同。差别是 `useLayoutEffect` 会挡在浏览器绘制前，服务端 HTML 可能先闪一下，React 也会警告它在服务端没有效果。需要绘制前测量时，把它留在客户端组件里。写在 render 里读浏览器 API，才会直接 mismatch。

对不上时，React 可能丢掉那一块服务端 HTML，改成客户端重新渲染。页面能恢复，但首屏白做的那部分 HTML 废了，属性、文本和事件也可能短暂错位。React 19 还会打出期望结果和实际 DOM 的差异。所以 mismatch 不是可以长期忽略的 warning。`suppressHydrationWarning` 只压住明确节点上的一层差异，例如时间戳这种你知道两端不可能相同的文本；它不修复数据，也不该套在整棵树上。

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

### 5. RSC、Client 边界和 Server Actions

| | 传统 SSR | RSC |
| --- | --- | --- |
| 问题 | 首屏 HTML 从哪来 | 哪些组件代码必须下发 |
| 组件去向 | 同构组件常仍进 client bundle，再 hydrate | Server Component 的实现留在服务端；Client Component 才进入 bundle 并 hydration |
| 数据 | 页面级取数再传 props | 服务端组件可直接 async 取数 |
| 和对方的关系 | 不决定包里有没有组件源码 | 不代替 HTML。第一次打开页面时，框架仍常把这棵树渲成 HTML |

一次带 RSC 的首屏可以看成两段输出，不要合成「服务端组件不产生 HTML」：

```text
请求
  → 服务端执行 Server Components，可以直接 await 数据
  → 得到 RSC payload：树的描述，以及 Client Component 留下的槽位
  → 同一轮再把这棵树渲成 HTML，浏览器先画出来
  → 浏览器只下载 Client Component 的 JS
  → hydration 接上这些客户端槽位
  → 之后的站内导航可以再要一份 RSC payload，不必整页刷新
```

Server Component 不会在浏览器里再执行一遍，所以没有 hydration。Client Component 的函数在两端都可能跑：服务端先输出它的 HTML，浏览器再 hydration。`"use client"` 的意思是「从这里开始，模块图进入客户端包」，不是「跳过服务端渲染」。

#### 为什么 Server Component 不能 `useState`

`useState` 要有一个跨渲染还在的组件实例：setter 触发更新，下一次 render 读到新的 state。Server Component 是一次请求里的函数执行，输出写进 payload 和 HTML 之后，这次调用就结束了，没有留在浏览器里的实例，也没有后续更新可调度。

所以服务端组件里不能写 `useState`、`useEffect`、`onClick`。在 Next.js 里这是打包失败，不是上线后才爆。读数据用 `async` 组件里的 `await`，或者 React 的 `use` 去读 Promise；那是这一次渲染取到值，不是把状态留在组件上。

事件和状态放到 Client Component。传给它的 props 必须能被 React 序列化：可以是普通数据和 React 能识别的少数内建对象，不能是数据库连接、类实例或随便一个闭包。普通函数传不过去；Server Action 是例外，客户端拿到的是一个引用，不是函数体。

#### Next.js 里边界放哪

App Router 默认是 Server Component。只把真正需要状态、事件、`useEffect` 或 `window` 的叶子标成客户端，不要为了一个输入框给整页 `layout` 加上 `"use client"`。那个指令作用在模块图上：客户端文件 import 的模块也会进包，包括你本来想留在服务端的组件。

方向只有一个：Server Component 可以渲染 Client Component。Client Component 不能 import Server Component。服务端渲染好的子树要穿过客户端外壳时，用 `children` 从外面传进来。

```tsx
// app/page.tsx，没有 "use client"
import { Composer } from "./composer";
import { Thread } from "./thread";

export default async function Page() {
  const messages = await getMessages();
  return (
    <Composer>
      <Thread messages={messages} />
    </Composer>
  );
}
```

```tsx
// composer.tsx
"use client";

import { useState, type ReactNode } from "react";
import { sendMessage } from "./actions";

export function Composer({ children }: { children: ReactNode }) {
  const [text, setText] = useState("");
  return (
    <form action={sendMessage}>
      <input value={text} onChange={(event) => setText(event.target.value)} />
      {children}
    </form>
  );
}
```

`Page` 在服务端把 `Thread` 渲染完，再把结果当作 `children` 交给 `Composer`。`Composer` 没有 import `Thread`，所以消息列表的实现不会被打进客户端包。如果在 `composer.tsx` 里直接 import `Thread`，`Thread` 就跟着进入客户端模块图。

这个输入框在客户端组件里，提交要等 hydration。表单如果由 Server Component 直接渲染，`<form action={publishPost}>` 在 JS 到达前也能按普通 HTML 表单提交。

密钥和只该在服务端用的模块不要被客户端文件碰到。可以让这些模块依赖 `server-only`，一旦被客户端 import，构建直接失败。查询放在 Server Component 或单独的服务端模块；客户端只收到已经取好的数据。第三方组件如果内部用了 `useState`，包一层客户端组件，不要把 `"use client"` 抬到页面顶。

#### Server Actions 和 REST

Server Action 是标了 `"use server"` 的异步函数。客户端可以像调用函数一样用它，也可以把它交给 `<form action>`。构建之后，浏览器拿到的是标识，不是函数源码；调用时框架发 POST，在服务端执行，参数按 React 的序列化规则传过去。

```tsx
"use server";

export async function publishPost(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("未登录");
  }
  await db.post.create({
    title: String(formData.get("title") ?? ""),
    authorId: user.id,
  });
  revalidatePath("/posts");
}
```

在 Next.js 里，这个 POST 打到当前页面的 URL，用 action 标识和参数区分，不是你在 `app/api` 里声明的一条路由。Server Component 里可以内联写 `"use server"` 函数，再当 prop 传给客户端组件。Client Component 不能在函数体里写这个指令，只能 import 文件顶部就是 `"use server"` 的模块。表单在 Server Component 里即使 JS 还没加载也能提交；在 Client Component 里会先排队，等 hydration。Action 完成后，框架可以在同一次响应里带上重新渲染的 RSC payload，页面不必再手写一次 `fetch` 把列表拉回来。

这和 React 19 的 `useActionState` 不是同一层。那个 Hook 包的是一次提交的 pending 和结果，函数可以跑在客户端，也可以是这里的 Server Action。Hook 的用法见 [React 19 相对 18](/md/框架/React/React%2019%20变化.md)。

| | Server Action | REST / Route Handler |
| --- | --- | --- |
| 谁来调 | 这个 Next.js 应用里的组件或表单 | 任何持有 URL 的客户端：App、webhook、第三方 |
| 形态 | 函数调用，底层是 POST | 你设计 method、路径、状态码和 JSON |
| 读数据 | 不适合。客户端连续发起的 action 在 Next.js 里会串行，也不能当可缓存的 GET | GET 可以缓存，多个请求可以并行 |
| 写完如何更新 UI | 可以 `revalidatePath` / `revalidateTag`，响应里带上新的服务端树 | 客户端自己再请求，或自己改本地状态 |
| 类型 | 调用方直接用函数的 TypeScript 类型 | 要另写客户端请求类型，或从 OpenAPI 生成 |

权限不能省。没有公开路径，不代表请求伪造不了。函数里要自己取当前用户，检查能不能改这条数据；表单里的 id 可以被改。Next.js 只接受 POST，并会看来源，这能挡掉一部分跨站表单，不代替登录校验。

对外接口、webhook、移动端、要缓存的客户端读取，用 Route Handler 或独立 REST。应用内部的表单和按钮提交，用 Server Action。不要用 action 做首屏查询，查询放在 Server Component 里。

---

### 6. 设计取舍

| 维度 | SSR / Streaming | CSR |
| --- | --- | --- |
| 内容到达 | HTML 可直接携带内容 | 通常等 JS 和客户端数据 |
| 交互 | 仍需 hydration，可能出现交互空窗 | 初始化完成后直接交互 |
| SEO / 分享 | 更容易稳定输出正文与 meta | 依赖爬虫执行能力或额外预渲染 |
| 基础设施 | 服务端渲染、缓存、流式错误治理 | 静态托管简单 |
| 一致性 | 两端首屏必须确定性一致 | 没有 hydration mismatch |

| 选择 | 得到 | 代价 |
| --- | --- | --- |
| 默认 Server Component，交互叶子再 `"use client"` | 查询和密钥留在服务端，客户端包更小 | Client 不能反向 import Server；共享状态要做成客户端外壳 + `children` |
| 应用内写入用 Server Action | 少一层手写 `fetch`；Server Component 里的表单可以在 JS 到达前提交 | 不是公开 API；不适合 GET。客户端连续调用会串行 |
| 实时个性化用按请求渲染 | 每次 HTML 对应当前用户 | 服务器要扛渲染，缓存命中差 |
| 少变更用静态生成，可陈旧用 ISR | CDN 复用 HTML | 登录态和刚改完的数据不能放进跨用户缓存 |

实时个性化内容按请求渲染；更新少且可提前生成的内容优先静态页面；大量页面可缓存、允许一定陈旧度时用 ISR 或按需失效。登录后的强交互后台通常不必只为「技术先进」引入 SSR。

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

### ❌ `"use client"` 表示这个组件只在浏览器执行

### ✅ 更准确的说法

它把模块图放进客户端包。首次 HTML 仍可以由服务端渲染出来，然后 hydration。Server Component 才是不会在浏览器里再执行的那一层。

### 为什么？

说成「客户端组件不参与 SSR」，就解释不了它们为什么也会 hydration mismatch，以及为什么首屏不是等 JS 才出现这段 UI。

---

### ❌ Server Action 替代了 REST，而且因为没有 URL 所以更安全

### ✅ 更准确的说法

它是应用内部的变更函数，底层仍是 POST。公开接口、webhook 和可缓存的读取用 REST 或 Route Handler。函数内部仍然要做身份和权限检查。

### 为什么？

调用方能发出这个 POST。表单字段可以被改，不能只靠「前端没把路径写出来」。

---

### ❌ 所有项目都该上 SSR

### ✅ 更准确的说法

按 SEO、首屏、成本、hydration 复杂度选型；纯 B 端常 CSR 更合适。

### 为什么？

面试要听判断力。

---

## 高频追问

### CSR、SSR、SSG、ISR 有什么区别？

CSR 的 HTML 是壳，内容等浏览器执行 JS。SSR 每次请求在服务端写出带内容的 HTML。SSG 在构建时生成，CDN 复用到下一次构建。ISR 先用缓存，过期或按需再生成。四者只要还要交互，都要 hydration；变的是 HTML 的产生时间和能不能跨请求复用。

### SSR 到 hydration 的完整流程是什么？

服务端取数并渲染，用字符串或流返回 HTML，浏览器先画出来，此时往往还点不了。客户端 JS 下载后，`hydrateRoot` 用同一次组件输出对照已有 DOM，接上事件和更新。流式可以先发 shell，Suspense 边界之后再补。带 RSC 时，服务端同时还产出 payload，浏览器只 hydration 客户端槽位。

### Hydration mismatch 为什么会产生？

对照的是服务端那次输出和浏览器里的第一次 render。时间、随机数、`window`、两端数据不同，结果就会岔开。非法嵌套还会被浏览器在 hydration 之前改掉结构。`useEffect` 在这次对照之后才跑。

### RSC 和 SSR 有什么区别？Server Component 能用 `useState` 吗？

SSR 决定 HTML 在哪生成。RSC 决定组件函数留在服务端还是进入客户端包。两者通常一起用：Server Component 的输出进 HTML，但不会在浏览器再执行，所以没有实例，不能 `useState`。Client Component 的代码要下发，首次 HTML 仍可以来自服务端。

### `"use client"` 应该加在哪？

加在需要状态、事件或浏览器 API 的叶子上。客户端文件 import 到的模块都会进包。服务端子树要穿过客户端外壳时，由 Server Component 渲染好，通过 `children` 传进去，而不是在客户端文件里 import。

### Server Actions 和 REST 有什么区别？

Server Action 给这个应用内部做变更：像函数调用，实际是 POST，写完可以让缓存失效并带回新的服务端树。REST 或 Route Handler 给外部调用方、webhook 和可缓存的 GET。Action 里仍然要检查登录和权限。

### `suppressHydrationWarning` 能解决 mismatch 吗？

它只压制明确节点的一层警告，不会修复错误的数据流，也不应套在整棵树上。先让两端的数据和结构一致，再用 `onRecoverableError` 看剩下的问题。

### Streaming SSR 和 `renderToString` 有什么区别？

`renderToString` 同步等整棵树变成字符串。Streaming 可以先发 shell 和 Suspense fallback，边界就绪后再继续输出，客户端也可以按边界逐步 hydration。

---

## 延伸阅读

- [React 19 相对 18](/md/框架/React/React%2019%20变化.md)
- [React 渲染原理](/md/框架/React/React%20渲染原理.md)
- [React Fiber 架构](/md/框架/React/Fiber架构.md)
- [首屏加载优化](/md/浏览器/加快首屏加载速度.md)
- [前端性能优化（速记）](/md/面试准备/技术/前端性能优化.md)
- [Node.js 与全栈](/md/面试准备/技术/NodeJs%20&%20全栈开发.md)
- [React & Vue 速记](/md/面试准备/技术/React%20&%20Vue.md)
