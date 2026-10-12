# React 19 相对 React 18

## 面试回答

> React 18 已经把并发渲染交给了应用：`createRoot`、自动批处理、`useTransition` / `useDeferredValue`，以及流式 SSR。React 19 没有再换一套调度模型，主要是把 Transition 推进成 Actions，并拿掉一批旧入口。
>
> 我会先讲 Actions。`startTransition` 可以接收 async 函数，这次 transition 会等到 Promise 结束才结束，所以请求进行中 `isPending` 仍然为真。`useActionState` 把「上一次返回的 state、提交函数、isPending」收成一个 Hook，适合表单。`useOptimistic` 在 transition 里先显示预期结果，结束或失败后再回到真实 state。`useFormStatus` 让表单里面的子组件读取父级 form action 正在不在提交，不用把 loading 一层层传下去。`<form action={fn}>` 在 action 成功后，还会重置非受控字段。
>
> 第二块是渲染期 API 放松了，但规则没有消失。`use` 可以读 Promise 或 Context；读 Promise 会 suspend，而且它可以写在条件里，但不能写在 `try/catch` 里。这不代表 `useState`、`useEffect` 可以条件调用。函数组件的 `ref` 变成普通 prop，新代码不必再包 `forwardRef`。`<Context value={...}>` 可以直接当 Provider。组件里渲染的 `title`、`meta`、`link` 会被提升到文档头。
>
> 第三块是升级时绕不开的破坏性变更。必须使用新的 JSX 转换。`ReactDOM.render`、`hydrate`、`findDOMNode`、string ref、函数组件的 `defaultProps`，以及 `contextTypes` / `getChildContext` 都去掉了。`propTypes` 不再生效，是静默忽略，不是类型系统。客户端入口只留 `createRoot` 和 `hydrateRoot`。
>
> 边界我一定会补上：安装 React 19 不会自动变成 Server Components，RSC 仍然要框架和打包器配合，`react-server` 只是库可以声明的服务端入口。React Compiler 也不是 19 的运行时，它是单独的编译插件，用来减少手写 `memo`，升级版本不会自动记住所有组件。`<Activity>` 和 `useEffectEvent` 是 19.2 才有的，不要和 19.0 的 Actions 说成同一次发布。

**一句话总结：**

> 18 是并发和 transition 落地 → 19 把 async transition 做成 Action（表单、乐观更新、pending）→ `use` / `ref` prop / Context 写法变了 → 旧入口删掉 → RSC 和 Compiler 都不随 `npm install react@19` 自动出现。

---

## 核心原理

### 1. 为什么 19 不是「又一次 Fiber」

React 18 要解决的是：大更新占住主线程，以及一次交互里分不清紧急和不紧急。那套 Lane、Scheduler、`createRoot` 在 19 里还在。

19 面对的是另一个缺口：transition 已经能把更新降优先级，但真实提交往往是 `async` 请求。React 18 的 `startTransition` 回调按同步来用更稳，`await` 后面的更新不一定还挂在同一次 pending 上。于是业务里会再手写 `isPending`、错误 state、乐观列表，和 transition 各记各的。

Actions 把「这一次后台提交」收成 transition 的生命周期：开始时 pending，异步副作用算在同一次里，结束后一次 Commit 落到最终 state。乐观 UI 和表单状态有了固定挂钩，而不是每个项目再发明一套。

---

### 2. 整体对照

| | React 18 | React 19 |
| --- | --- | --- |
| 入口 | `createRoot` 才有并发；旧 `render` 仍能跑 | `ReactDOM.render` / `hydrate` 删除 |
| 优先级 | `useTransition`、`useDeferredValue` | 保留，并让 transition 能包住 async |
| 提交 | 自己管 loading、错误、乐观更新 | Actions：`useActionState`、`useOptimistic`、`useFormStatus`、`<form action>` |
| 条件读取 | 普通 Hook 不能条件调用 | `use` 可以条件读 Promise / Context，其他 Hook 仍不行 |
| ref | 函数组件要用 `forwardRef` | `ref` 是普通 prop；类组件仍然不是 |
| 文档头 | 自己用 effect 改 `document.title` | 渲染 `title` / `meta` / `link`，React 提升到 `head` |
| RSC | 框架实验或独立版本线 | 作为库的 `react-server` 出口稳定下来，应用仍要框架支持 |
| 19.2 | 无 | `<Activity>`、`useEffectEvent` |

调度细节仍看 [Fiber 架构](/md/框架/React/Fiber架构.md) 和 [渲染原理](/md/框架/React/React%20渲染原理.md)。`useTransition` 与 `useDeferredValue` 的差别看 [Hooks](/md/框架/React/Hooks.md)。

---

### 3. Actions：pending 跟着这次提交走

`startTransition(async () => { ... })` 里的函数就是一次 Action。transition 会等到这个 Promise 结束，而不是回调同步返回就结束。

`useActionState(action, initialState)` 返回三样东西：action 上次返回的 state、交给表单或事件的 dispatch、以及 `isPending`。可选的第三个参数是渐进增强用的 permalink，面试知道「可以给 form action 提供无 JS 时的地址」即可。

```jsx
async function saveName(prevError, formData) {
  const name = formData.get('name')
  const error = await updateName(name)
  return error ?? null
}

function NameForm() {
  const [error, submit, isPending] = useActionState(saveName, null)
  return (
    <form action={submit}>
      <input name="name" />
      <button disabled={isPending}>保存</button>
      {error ? <p>{error}</p> : null}
    </form>
  )
}
```

| 步骤 | 用户看到什么 | React 在做什么 |
| --- | --- | --- |
| 提交 | 按钮禁用 | 开始 transition，`isPending` 为真 |
| `await updateName` | 仍是提交前的 state | pending 保持，不因为 await 把这次 transition 提前结束 |
| Action 正常返回 | `isPending` 变回假，state 换成返回值 | Promise 没抛错就结束这次 transition |
| 非受控字段，且 Action 没抛错 | 输入被清空 | 返回错误字符串也算正常返回，表单仍会重置 |
| Action 抛错 | 非受控输入还在 | 不重置；错误不会自动变成 `useActionState` 的返回值 |

想在校验失败时留下用户刚输入的内容，用受控输入，或让失败路径抛错。不要假设「返回了 error 字符串，框里的字还会留着」。

`useFormStatus()` 从 `react-dom` 引入，读的是**父级** `<form>` 的 action 状态，返回 `pending`、`data`、`method`、`action`。调用它的组件必须渲染在 form 里面，和读 Context 一样，不能写在渲染这个 `<form>` 的同一个组件里。

`useOptimistic(state)` 返回乐观值和一个 setter。setter 要包在 transition 或 Action 里：它立刻把 UI 改成预期结果；transition 结束或失败后，显示回到 `state` 这份真实数据。请求失败而 `state` 没变，乐观值就会消失。所以它不是第二个独立数据源，真实 state 仍然要由 Action 的结果或另一次 `setState` 接住。

---

### 4. `use`、ref、Context：变的是入口，不是 Hook 链表

`use(promise)` 在渲染期间读资源，没完成就 suspend，由最近的 Suspense 显示 fallback。`use(context)` 和 `useContext` 读的是同一份 Context，但 `use` 可以出现在条件分支里。它仍然只能在渲染期间调用，并且不能放进 `try/catch`。

普通 Hook 的身份还是调用顺序。条件里写 `useState` 在 19 里一样会错位。详见 [Hooks](/md/框架/React/Hooks.md)。

函数组件可以直接写 `function Input({ ref })`。`ref` 在 props 里，新组件不必 `forwardRef`。`forwardRef` 还能用，官方的方向是以后弃用。类组件的 ref 仍然指向实例，不会变成 props。回调 ref 可以返回一个清理函数，卸载或 ref 变化时调用；不要再顺手把节点本身 `return` 出去，那会被当成清理函数。

```jsx
<input
  ref={(node) => {
    node?.focus()
    return () => {}
  }}
/>
```

Context 写成 `<ThemeContext value={theme}>`，等价于以前的 `<ThemeContext.Provider>`。`Provider` 仍可用，新代码不必再写这一层。

组件树里的 `<title>`、`<meta>`、`<link>` 会被提升到文档 `head`，不用为了改标题专门写 effect。样式表还会尽量在依赖它的 Suspense 内容显示之前插进 `head`。`preinit`、`preload`、`prefetchDNS`、`preconnect` 用来把字体、脚本这类资源的发现从 CSS 解析里提前出来。这些是加载时序，不是把 React 变成路由框架。

---

### 5. 升级时真正会炸的部分

先升到 18.3，看弃用警告，再上 19。面试里值得点名的删除：

| 删掉或忽略 | 改成 |
| --- | --- |
| `ReactDOM.render` / `hydrate` | `createRoot` / `hydrateRoot` |
| `unmountComponentAtNode` | `root.unmount()` |
| `findDOMNode`、string ref | 回调 ref 或 `ref` prop |
| 函数组件 `defaultProps` | 参数默认值 |
| `propTypes` | 静默忽略；改用 TypeScript |
| `contextTypes` / `getChildContext` | `createContext`。类组件的 `contextType` 还在 |
| 旧 JSX 转换 | `react/jsx-runtime` 的新转换，19 强制要求 |

渲染里没被 Error Boundary 接住的错误，不再向外重新抛出，而是报到 `window.reportError`；Boundary 接住的报到 `console.error`。`createRoot` 可以用 `onUncaughtError`、`onCaughtError` 接住这两类。Hydration 对不上时，19 会打出一份差异，而不是只说 mismatch。

`useDeferredValue` 在 19 可以传第二个参数当作首次渲染的初始值，然后再后台换成真实值。这是 18 那个 Hook 的增量，不是新的并发模型。

---

### 6. 不要算进「升到 19 就有」的两件事

**Server Components。** 19 把 directives、Server Components、Server Functions 标成稳定，库可以用 `react-server` 这个 export condition 声明服务端入口。浏览器里执行的组件不会因为版本号变成服务端组件。打包器那层 API 在 19 的小版本之间也不承诺兼容。传统 SSR、Hydration 和 RSC 的差别见 [SSR 与 Hydration](/md/框架/React/SSR与Hydration.md)。服务端另外提供了会等数据的 `prerender`，和不等数据的 `renderToString` 不是同一个 API。

**React Compiler。** 它是构建插件，在编译期自动做记忆化，目标是少写 `memo` / `useMemo` / `useCallback`。它不在 `react` 包的运行时里，也不只服务 19，更早的 React 17、18 也可以配合。升级 19 而没有打开编译器，组件该重渲染还是重渲染。

---

### 7. 19.2 再单独记两句

19.0 是 2024 年 12 月，19.2 是 2025 年 10 月。追问「19 有什么」时，先把 Actions 讲完，再补小版本：

- `<Activity mode="visible" | "hidden">`：隐藏子树时保留 state，Effects 按离开处理，更新可以推迟；再显示时不用当作首次挂载。它不是用 CSS 把节点 `display: none`，也不是 `{cond && <Page />}` 那种卸掉状态。
- `useEffectEvent(fn)`：把 Effect 里那种「发生时读最新 props」的回调抽出来。Effect 依赖里不写它。它只能和所属 Effect 写在同一个组件或 Hook 里，不能拿来把任意函数的 lint 消掉。

---

### 8. 设计取舍

| 选择 | 得到 | 代价 |
| --- | --- | --- |
| 让 transition 等待 async | pending、错误、乐观更新跟同一次提交 | 不是所有 `setState` 都该包成 Action |
| `ref` 作为 prop | 少一层 `forwardRef` | 类组件、旧的 `element.ref` 访问要改 |
| 删掉 `render` 和 string ref | 只留能并发的入口 | 老项目必须先过 18.3 的警告 |
| RSC、Compiler 留在框架和构建 | 运行时版本号不会偷偷改架构 | 面试不能把三者说成「装了 19 就全有」 |

---

## 常见误区

### ❌ React 19 用多线程重写了渲染，18 的 Fiber 过时了

### ✅ 更准确的说法

调度仍是主线程上的 Fiber、Lane 和 Scheduler。19 的主线是 Actions 和 API 清理，不是另一套 reconciler。

### 为什么？

把版本新特性说成架构替换，18 的并发题和 19 的表单题会答串。

---

### ❌ 升到 React 19 就自动有 Server Components 和 React Compiler

### ✅ 更准确的说法

RSC 要支持它的框架和打包器。Compiler 是单独的编译插件，不开就不会自动 `memo`。`npm install react@19` 得到的是运行时 API。

### 为什么？

这三件事的发布节奏和生效条件都不同，合成一句「19 全自动优化」会被追问落地方式问倒。

---

### ❌ `use` 出来之后，Hook 可以写在条件里了

### ✅ 更准确的说法

只有 `use` 可以条件调用，用来读 Promise 或 Context，并且不能放在 `try/catch`。`useState`、`useEffect` 仍然靠调用顺序对齐。

### 为什么？

Hook 链表没有改成按名字注册。条件调用普通 Hook，错位方式和 18 一样。

---

### ❌ `useOptimistic` 会在请求失败后保留用户刚看到的值

### ✅ 更准确的说法

它只在 transition 进行时盖住真实 state。结束或失败后回到那份 state；失败时如果真实 state 没变，乐观值会消失。

### 为什么？

乐观 UI 是预测，不是提交结果。结果要由 Action 的返回值或后续 state 决定。

---

## 高频追问

### React 18 已经有什么，19 还要讲什么？

18：`createRoot`、自动批处理、transition、`useDeferredValue`、流式 SSR。19：async Action、`useActionState` / `useOptimistic` / `useFormStatus`、`use`、`ref` 作为 prop，以及删除 `ReactDOM.render` 等旧 API。

### `useTransition` 在 18 和 19 有什么差别？

18 的回调按同步更新来用更稳。19 允许 async 函数，同一次 transition 会等到 Promise 结束，pending 才能盖住整个请求。

### `useOptimistic` 失败了怎么办？

乐观值只活在这次 transition 里。请求失败且真实 state 没有改成预期值，UI 回到原来的 state。成功则要让真实 state 变成那份新数据，不能只调用乐观 setter。

### 为什么 `useFormStatus` 不能写在渲染 `<form>` 的组件里？

它读的是父级 form action 的状态，调用点必须在 form 子树内。和 Context 的消费者要写在 Provider 下面是同一类约束。

### `forwardRef` 还要不要？

新的函数组件直接收 `ref` prop。`forwardRef` 仍能运行，但是迁移方向，不是新代码的默认写法。类组件的 ref 还是实例。

### React 19 等于 RSC 吗？Compiler 呢？

都不是。RSC 是服务端组件模型，要框架实现。Compiler 是编译期记忆化插件。19 的运行时变化是 Actions 和上面那些 API。

### 19.2 的 `<Activity>`、`useEffectEvent` 解决什么？

`Activity` 隐藏子树但保留 state。`useEffectEvent` 让 Effect 里的事件回调读到最新值，同时不必放进依赖数组；不能当成通用的 lint 开关。

---

## 延伸阅读

- [React Hooks](/md/框架/React/Hooks.md)
- [React Fiber 架构](/md/框架/React/Fiber架构.md)
- [React 渲染原理](/md/框架/React/React%20渲染原理.md)
- [SSR 与 Hydration](/md/框架/React/SSR与Hydration.md)
- [React 考点索引](/md/框架/React/React%20高频考点精讲.md)
- [面试速记：React & Vue](/md/面试准备/技术/React%20&%20Vue.md)
- [高频追问清单](/md/面试准备/高频追问清单.md)
