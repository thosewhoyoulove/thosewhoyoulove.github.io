# React 核心原理面试题

## 面试定位

这篇用于 React 核心原理复习，覆盖渲染流程、Fiber、批处理、effect、diff、Context、性能优化、SSR/Hydration 等高频点。

## 核心原理

React 的核心主线是：状态变化触发更新，React 基于 Fiber 树进行可中断的 render 计算，生成变更，再在 commit 阶段一次性提交到真实 DOM。render 阶段必须保持纯净，副作用放到事件处理或 effect 中。

---

## 问题：React 的渲染流程是什么？render 阶段和 commit 阶段有什么区别？

React 的更新分两个阶段：

**Render 阶段（可中断）：**
- 从触发更新的组件开始，递归调用组件函数（或类组件的 render 方法）
- 生成新的虚拟 DOM 树（Fiber 树）
- 通过 diff 算法（reconciliation）找出需要变更的节点
- 这个阶段**不操作真实 DOM**，所以可以被中断、重启

**Commit 阶段（不可中断）：**
- 把 render 阶段算出的变更一次性刷到真实 DOM
- 执行 `useLayoutEffect`（同步，在 paint 之前）
- 浏览器 paint
- 执行 `useEffect`（异步，在 paint 之后）

**面试关键点**：render 阶段可能执行多遍（并发模式下可能被打断重来），所以组件函数必须是纯的，不能有副作用。副作用只能放在 effect 或事件处理函数里。

---

## 问题：什么是 Fiber？解决了什么问题？

**问题背景**：React 15 的 reconciliation 是递归的、同步的，一旦开始就不能中断。如果组件树很大，一次更新可能占用主线程几十毫秒，导致用户输入、动画卡顿。

**Fiber 是什么**：Fiber 是 React 16 引入的新架构，每个组件对应一个 Fiber 节点，节点之间通过 `child`、`sibling`、`return` 指针形成链表结构（而不是树的递归）。

**解决了什么**：
1. **可中断**：链表结构可以随时暂停、恢复遍历，不像递归调用栈那样必须一口气跑完
2. **优先级调度**：不同更新可以标记不同优先级，高优先级（用户输入）可以打断低优先级（数据预加载）
3. **并发特性的基础**：`useTransition`、`Suspense` 等都依赖 Fiber 的可中断能力

**面试怎么说**：
> "Fiber 本质是把递归的 diff 过程改成了可中断的链表遍历，这样 React 就能把长任务拆成小片段，每片段之间让出主线程给浏览器处理用户交互，避免卡顿。"

---

## 问题：React 18 的自动批处理是什么？和之前有什么区别？

**React 17 及之前**：只有在 React 事件处理函数里的多个 setState 会被合并成一次渲染。setTimeout、Promise、原生事件里的 setState 每次都会触发一次渲染。

**React 18**：所有场景下的多个 setState 都会自动合并（Automatic Batching），包括：
- 事件处理函数
- setTimeout / setInterval
- Promise.then
- 原生事件监听器

```jsx
// React 18：这三个 setState 只触发一次渲染
setTimeout(() => {
  setCount(1)
  setFlag(true)
  setName('test')
  // 只 render 一次
}, 0)
```

**如果确实需要同步刷新**：用 `flushSync`，但要慎用，因为它会打破批处理、阻塞主线程。

---

## 问题：useEffect 和 useLayoutEffect 有什么区别？什么时候用哪个？

| | useEffect | useLayoutEffect |
| --- | --- | --- |
| 执行时机 | 浏览器 paint **之后**，异步 | DOM 更新后、浏览器 paint **之前**，同步 |
| 是否阻塞渲染 | 不阻塞 | 阻塞 |
| 典型场景 | 数据请求、订阅、日志上报 | DOM 测量、防止闪烁、同步读写布局 |

**什么时候用 useLayoutEffect**：

当你需要在用户看到画面之前做一些 DOM 操作时。比如：
- 测量一个元素的宽高，然后根据结果调整另一个元素的位置
- 如果用 useEffect，用户会先看到"错误的位置"再跳到"正确的位置"（闪烁）

**原则**：能用 useEffect 就用 useEffect，只有出现视觉闪烁时才换 useLayoutEffect。

---

## 问题：React 的 diff 算法是怎么工作的？时间复杂度是多少？

完整的树 diff 是 O(n³)，React 通过三个假设把它降到了 **O(n)**：

### 假设一：不同类型的元素产生不同的树

如果根节点类型变了（比如 `<div>` 变成 `<span>`），React 直接销毁旧树、创建新树，不做深度比较。

### 假设二：同层比较

React 只比较同一层级的节点，不会跨层级移动。如果一个节点从第一层移到了第三层，React 会销毁旧的、创建新的。

### 假设三：key 标识同一节点

通过 `key` 告诉 React 哪些节点是"同一个"，这样列表重排时可以复用节点而不是销毁重建。

**为什么不能用 index 做 key**：如果列表头部插入一条数据，所有 index 都变了，React 会认为每个节点都变了，全部重新渲染。而且带本地状态的组件（比如输入框）会错位。

---

## 问题：Context 的性能问题是什么？怎么优化？

**问题**：Context 的 `value` 一变，所有消费该 Context 的组件**全部重渲染**，即使它只用了 value 里的某一个字段。

```jsx
// 反模式：把所有东西塞一个 Context
const AppContext = createContext()
<AppContext.Provider value={{ user, theme, locale, notifications }}>
```

`notifications` 每秒变一次，`theme` 几乎不变，但它们在同一个 value 对象里，theme 的消费者也会被连带重渲染。

**优化方案：**

**1. 拆分 Context**

```jsx
<ThemeContext.Provider value={theme}>
  <UserContext.Provider value={user}>
    <NotificationContext.Provider value={notifications}>
```

变化频率不同的数据放不同的 Context，互不影响。

**2. useMemo 稳定 value 引用**

```jsx
const value = useMemo(() => ({ user, login, logout }), [user])
<AuthContext.Provider value={value}>
```

避免父组件每次 render 都创建新对象导致下游无意义更新。

**3. 高频变化的数据用外部 store**

Zustand、Jotai 这类库用 `useSyncExternalStore` 实现细粒度订阅，只有真正用到的字段变了才重渲染。

---

## 问题：React.memo、useMemo、useCallback 分别是什么？什么时候用？

**React.memo**：包裹组件，props 浅比较相等时跳过重渲染

```jsx
const Child = React.memo(({ data, onClick }) => {
  // 只有 data 或 onClick 引用变了才重渲染
})
```

**useMemo**：缓存计算结果，依赖不变就不重新计算

```jsx
const sorted = useMemo(() => heavySort(list), [list])
```

**useCallback**：缓存函数引用，依赖不变就不创建新函数

```jsx
const handleClick = useCallback(() => {
  doSomething(id)
}, [id])
```

**什么时候用**：
- 子组件被 `React.memo` 包裹了，父组件传给它的 props 需要用 useMemo/useCallback 稳定引用，否则 memo 白包
- 有昂贵的计算需要缓存
- effect 的依赖里有对象/函数，需要稳定引用避免无限循环

**什么时候不用**：
- 简单组件、渲染成本低的，加 memo 反而多了比较开销
- 不确定是否有性能问题时，先用 Profiler 测量再决定

---

## 问题：受控组件和非受控组件有什么区别？

**受控组件**：表单的值由 React state 控制，每次输入都通过 onChange 更新 state

```jsx
const [value, setValue] = useState('')
<input value={value} onChange={e => setValue(e.target.value)} />
```

**非受控组件**：表单的值由 DOM 自己管理，React 通过 ref 在需要时读取

```jsx
const inputRef = useRef()
<input defaultValue="" ref={inputRef} />
// 提交时：inputRef.current.value
```

**怎么选**：
- 大部分场景用受控，因为 React 掌握数据源，方便做校验、联动、禁用等
- 文件上传（`<input type="file">`）只能非受控
- 集成第三方 DOM 库（富文本编辑器）时通常非受控

**面试陷阱**：不要混用——给了 `value` 又不给 `onChange`，输入框会变成只读；给了 `defaultValue` 又给 `value`，行为不可预测。

---

## 问题：Error Boundary 是什么？能捕获哪些错误？

Error Boundary 是一个类组件，通过 `componentDidCatch` 和 `getDerivedStateFromError` 捕获子树的渲染错误，显示降级 UI 而不是白屏。

**能捕获**：
- 子组件 render 阶段的错误
- 生命周期方法里的错误
- 构造函数里的错误

**不能捕获**：
- 事件处理函数里的错误（要自己 try-catch）
- 异步代码（setTimeout、Promise）
- SSR
- Error Boundary 自身的错误

```jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false }
  
  static getDerivedStateFromError(error) {
    return { hasError: true }
  }
  
  componentDidCatch(error, info) {
    logErrorToService(error, info.componentStack)
  }
  
  render() {
    if (this.state.hasError) return <FallbackUI />
    return this.props.children
  }
}
```

**实际使用**：通常在路由级别包一层，每个页面独立降级，一个页面崩了不影响其他页面。

---

## 问题：React 的合成事件是什么？和原生事件有什么区别？

React 不是把事件直接绑在每个 DOM 元素上，而是在**根节点**（React 17+ 是 root container）做事件委托，所有事件冒泡到根节点后由 React 统一处理。

**区别**：
1. **事件委托**：原生事件绑在具体元素，React 事件委托在根节点
2. **事件对象**：React 包了一层 SyntheticEvent，抹平浏览器差异
3. **执行顺序**：原生事件先触发，React 合成事件后触发（因为要等冒泡到根节点）
4. **阻止冒泡**：`e.stopPropagation()` 只能阻止 React 事件体系内的冒泡，阻止不了原生事件

**面试常问**：如果在一个元素上同时绑了原生事件和 React 事件，谁先执行？
> 原生事件先执行。因为原生事件在目标元素上直接触发，React 事件要等冒泡到根节点才处理。

---

## 问题：React Router 的实现原理是什么？

核心是**监听 URL 变化，匹配路由规则，渲染对应组件**。

**两种模式**：

**Hash 模式**：监听 `hashchange` 事件，URL 带 `#`（如 `example.com/#/about`）
- 优点：不需要服务端配置
- 缺点：URL 不美观，SEO 不友好

**History 模式**：用 `history.pushState` / `popstate` 事件，URL 正常（如 `example.com/about`）
- 优点：URL 美观
- 缺点：需要服务端配置 fallback（所有路由都返回 index.html），否则刷新 404

**React Router 6 的核心 API**：
- `<Routes>` / `<Route>`：声明式路由配置
- `useNavigate()`：编程式导航
- `useParams()`：获取路由参数
- `useLocation()`：获取当前路径信息
- `<Outlet>`：嵌套路由的渲染出口

---

## 问题：SSR 和 CSR 有什么区别？hydration 是什么？

**CSR（客户端渲染）**：浏览器下载空 HTML + JS bundle → JS 执行后渲染页面。首屏白屏时间长，SEO 差。

**SSR（服务端渲染）**：服务端执行 React 组件，生成完整 HTML 发给浏览器 → 用户立刻看到内容 → JS 加载后"激活"交互。

**Hydration（注水）**：客户端 JS 加载后，React 不重新创建 DOM，而是"接管"服务端已经渲染好的 DOM，给它绑上事件监听器和状态。

**Hydration Mismatch**：如果服务端渲染的 HTML 和客户端首次渲染的结果不一致，React 会报警告甚至出 bug。常见原因：
- 用了 `Date.now()`、`Math.random()` 这种每次结果不同的
- 用了 `window`、`localStorage` 等只有客户端才有的 API
- 时区差异导致日期格式不同

**解决**：用 `useId` 生成稳定 id，客户端专属逻辑用 `useEffect` 延迟执行。

---

## 问题：React 性能优化的思路是什么？

按排查优先级：

### 1. 减少不必要的重渲染

- `React.memo` 包裹纯展示组件
- `useMemo` / `useCallback` 稳定 props 引用
- 拆分 Context，避免无关组件被连带更新
- 状态下沉：把 state 放到真正需要它的组件里，而不是提升到顶层

### 2. 减少渲染成本

- 虚拟列表（react-window / react-virtuoso）处理长列表
- `React.lazy` + `Suspense` 做代码分割
- 重计算用 `useMemo` 缓存

### 3. 减少提交成本

- `startTransition` 标记非紧急更新，避免阻塞用户输入
- 批量 DOM 操作（React 18 自动批处理已经帮你做了）

### 4. 工具

- React DevTools Profiler：看哪个组件 render 次数多、耗时长
- Chrome Performance：看长任务、布局抖动
- why-did-you-render：自动检测不必要的重渲染

## 面试回答

可以这样答：

> React 的更新可以分成 render 和 commit 两个阶段。render 阶段基于 Fiber 树计算新旧结果差异，这个阶段不操作真实 DOM，可以被中断和重启；commit 阶段把变更提交到真实 DOM，并执行 layout effect 和 passive effect。Fiber 本质上把递归树遍历改成了链表式可中断工作单元，为优先级调度、并发特性、Suspense、Transition 打基础。React 性能优化一般从减少不必要渲染、降低渲染成本和控制提交成本入手，比如 React.memo、useMemo、useCallback、拆 Context、虚拟列表、代码分割和 startTransition。面试里还要强调组件 render 应该是纯函数，副作用不能写在 render 阶段。

## 高频追问

### React render 阶段为什么可能执行多次？

并发模式下 render 阶段可以被高优先级更新打断并重启，因此组件函数可能执行多次。不能在 render 中写副作用。

### React.memo 一定能提升性能吗？

不一定。它有 props 浅比较成本。如果组件很轻或 props 每次都是新引用，memo 可能没有收益，甚至增加开销。

### useEffect 和 useLayoutEffect 怎么选？

大多数副作用用 `useEffect`。只有需要在浏览器绘制前同步测量或修改 DOM，避免闪烁时，才用 `useLayoutEffect`。
