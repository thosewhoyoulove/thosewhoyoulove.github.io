# React 高频考点精讲（工程向）

与 Vue 侧 [Vue 高频考点精讲](/md/框架/Vue/Vue%20高频考点精讲.md) 平行：写清**机制、边界、踩坑**。Hooks 细节、闭包陷阱见 [Hooks 与函数组件](/md/框架/React/Hooks.md)。

---

## 1. 渲染与提交：`render` 必须是纯的

**render / 组件函数**应可反复执行且**无副作用**（不写 ref 外全局、不订阅、不 `fetch`）。副作用进 **`useEffect` / 事件处理函数**。

同一 state 多次 render 应产出**可预测**的 UI；否则并发模式下可能被废弃的中间 render 会踩雷。

---

## 2. React 18 自动批处理（Automatic Batching）

同一 **tick** 里多个 `setState`（含 `flushSync` 以外）默认**合并一次**重渲染，含：

- 事件处理器内  
- `setTimeout` / `Promise` 内（18 起）  

**例外**：`flushSync(() => setState())` 强制同步刷 DOM，**慎用**（容易卡主线程、打破批处理）。

---

## 3. Fiber 与可中断渲染（面试口述）

**Fiber** = 每个组件对应一个 work unit，带 `return`/`child`/`sibling` 链表。更新时：

**render 阶段**（可中断）→ 算出子树变更；**commit 阶段**（不可中断）→ 刷 DOM、跑 `useLayoutEffect`、再 paint、再 `useEffect`。

**意义**：可拆分长任务、做优先级（如 `useTransition` 标记非紧急更新），避免长时间阻塞输入等高优交互。

---

## 4. 调度与优先级（够用版）

用户输入、hover 等往往**更高优先级**；`startTransition` 里包的更新可被视为**可中断、可延后**，减少打字卡顿。

不必背调度器源码；能说明 **「render 可能执行多遍、commit 一遍」** 即可排很多 concurrent 相关 bug。

---

## 5. `useEffect` vs `useLayoutEffect`

| | 时机 | 典型用途 |
| --- | --- | --- |
| `useEffect` | paint **之后**，异步 | 请求、订阅、日志 |
| `useLayoutEffect` | DOM **已写**、浏览器 **paint 之前**，同步 | 量 DOM、防闪动、同步读排版再写 |

`useLayoutEffect` **阻塞**浏览器绘制，里面写重逻辑会卡顿；能在 effect 解决的问题优先 **useEffect**。

---

## 6. Context：性能与拆包

**`value` 一变，消费该 Context 的组件默认全量重渲染**（即使只用了其中一个小字段）。

**改法**：

- **拆多个 Context**（「常变」与「不变」分离）；  
- **`useMemo` 稳定 `value` 引用**（对象/函数每次父 render 新建仍会触发下游）；  
- 大数据高频变：考虑 **外部 store**（Zustand / Jotai / Redux）+ `useSyncExternalStore`，或减少 Context 粒度。

```jsx
const ThemeCtx = createContext()
const UserCtx = createContext()
// 勿把每秒变的时钟和全局主题塞进同一个 Context value 对象
```

---

## 7. `React.memo` / `useMemo` / `useCallback`

- **`memo`**：props **浅比较**相等则跳过该子树 reconcile（仍可能因 context 变而更新）。  
- **`useCallback`/`useMemo`**：稳定引用，喂给 `memo` 子组件或 effect 依赖。

**反模式**：到处包一层反而增加比较成本；以 **Profiler** 为准。

**默认导出函数组件**匿名时 DevTools 难读，可对.display 命名。

---

## 8. 列表 `key`

**稳定唯一 id**；**不要用 index** 维护带本地状态/动画的列表（与 Vue 同类问题）。

**不要用随机 key** 迫使每次 mount（除非刻意重置整个子树）。

---

## 9. 受控 vs 非受控

- **受控**：value + onChange，单一数据源在 React。  
- **非受控**：`defaultValue` + `ref` 读 DOM；混用「半受控」易失联。

文件上传、富文本等有时必须非受控或混合，要能说清**谁拥有真相**。

---

## 10. `Suspense` / `React.lazy`

`lazy` 组件需在 **`Suspense` boundary** 内；`fallback` 只做占位，**错误**要 **Error Boundary**（Suspense 不捕组件内 throw 的业务错误，数据 fetch 的用法视具体库与 React 版本）。

**数据**用 Suspense + cache 的模式在生态里逐步推进（`use`、框架层封装），面试答到「边界 + 和 Error Boundary 分工」即可。

---

## 11. Error Boundary

仅类组件 **`componentDidCatch` / `getDerivedStateFromError`**（或现成库）。**不捕**：

- 事件处理器内同步错（要自己 try/catch）  
- 异步错（Promise）  
- SSR（另一套）

---

## 12. Ref 转发与组件封装

`forwardRef` + `useImperativeHandle`（少用）：把**命令式**子能力暴露给父（聚焦、滚动），避免父直接依赖子 DOM 结构。

---

## 13. 合成事件（SyntheticEvent）与池化

React 17+ 事件**委托在 root**。`e.persist()` 旧版才需思考；现代写法通常在回调内同步读完 `e` 即可。

---

## 14. Router（React Router 6 心智）

**声明式** `<Routes>` / `<Route>`；`useNavigate`、`useParams`、`useLocation`。

**数据 loader / action**（数据路由）视版本；导航**可能异步**，注意 **pending** UI 与取消。

**history 部署**：与 SPA 一样需服务端 **fallback 到 `index.html`**（见 [Vue 侧 Nginx 示例](/md/框架/Vue/Vue%20高频考点精讲.md)）。

---

## 15. SSR / hydration

服务端 `renderToString` / 流式 API；客户端 `hydrateRoot`。

**hydration mismatch** 常见因：**服务端与首屏 HTML 不一致**（随机 id、仅客户端 `Date`、`window`、错误中文编码）、**禁 JS** 调试。

缓解：`useId`、避免首屏随机、数据预取与客户端对齐。

---

## 16. React 19+ / Server Components（了解向）

**RSC**：组件可在服务端跑、传序列化结果给客户端；**不等同于**传统 SSR。边界：哪些能 `useState`、哪些不能，由框架（Next 等）约束。

面试答「听过 + 知道和传统 CSR/SSR 分工不同」通常足够，除非 JD 写死 Next App Router。

---

## 17. 性能排查顺序（可落地）

1. **React DevTools Profiler**：谁 render 多、耗时大。  
2. **为何 render**：props/context/state 哪变了（props 浅比较、Context value）。  
3. **列表/大提交**：虚拟列表、`startTransition`、拆小颗粒 state。  
4. **与 Web Vitals 对齐**：长任务、CLS（动画/layout）、是否该把重活挪 worker。

---

## 18. 与 Vue 3 的一句对比（跨栈面试）

- Vue：**模板编译 + 细粒度依赖追踪 + 异步队列更新 DOM**。  
- React：**函数 UI + Fiber 调度 + 通常 whole subtree reconcile**（靠 memo/结构优化减负）。

二者都在解决「**如何把数据变更高效映射到 DOM**」，表述方式不同。

---

更细的 **Hooks 清单与闭包陷阱** 见 [Hooks.md](/md/框架/React/Hooks.md)。
