# React Hooks 面试题

---

## 问题：为什么 Hook 不能写在 if 里面？

React 内部用一个**链表**按顺序存储每个 Hook 的状态。每次组件 render 时，React 按调用顺序依次从链表里取对应的状态。

如果你把 Hook 写在条件分支里，某次 render 少调了一个 Hook，后面所有 Hook 的顺序就错位了——第二个 useState 拿到了第三个的状态，整个组件就乱了。

```jsx
// ❌ 错误：条件调用
if (isLoggedIn) {
  const [user, setUser] = useState(null)  // 有时调有时不调，链表错位
}

// ✅ 正确：Hook 放最顶层，条件逻辑放里面
const [user, setUser] = useState(null)
if (isLoggedIn) {
  // 用 user 做事情
}
```

**面试怎么说**：
> "React 靠调用顺序来匹配 Hook 和它的状态，条件分支会打乱顺序导致状态错位。所以 Hook 必须在组件顶层调用，条件逻辑放在 Hook 内部或者拆到子组件里。"

---

## 问题：useState 的更新是同步还是异步的？

**结论**：setState 本身是同步调用的，但**状态的更新和重渲染是异步批处理的**。

```jsx
const [count, setCount] = useState(0)

function handleClick() {
  setCount(1)
  console.log(count)  // 还是 0，不是 1
  // 因为 count 是这次 render 闭包里的值，要等下次 render 才是 1
}
```

**React 18 的自动批处理**：同一个事件循环里的多个 setState 会合并成一次渲染：

```jsx
function handleClick() {
  setCount(c => c + 1)
  setFlag(true)
  setName('test')
  // 三个 setState 只触发一次 render
}
```

**函数式更新**：当新状态依赖旧状态时，必须用函数式写法：

```jsx
// ❌ 闭包陷阱：三次都基于同一个 count(0)，结果是 1 不是 3
setCount(count + 1)
setCount(count + 1)
setCount(count + 1)

// ✅ 函数式：每次基于最新值累加，结果是 3
setCount(c => c + 1)
setCount(c => c + 1)
setCount(c => c + 1)
```

---

## 问题：什么是闭包陷阱（Stale Closure）？怎么解决？

**问题**：useEffect 的回调函数会"闭住"创建时的 state 值。如果依赖数组写了 `[]`，回调里的 state 永远是初始值。

```jsx
function Counter() {
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    const timer = setInterval(() => {
      console.log(count)  // 永远是 0！因为闭包闭住了第一次 render 的 count
    }, 1000)
    return () => clearInterval(timer)
  }, [])  // 空依赖，effect 只跑一次，闭包里的 count 永远是 0
}
```

**解决方案：**

**方案一：函数式 setState（最常用）**

```jsx
useEffect(() => {
  const timer = setInterval(() => {
    setCount(c => c + 1)  // 不依赖外部的 count，用函数式拿最新值
  }, 1000)
  return () => clearInterval(timer)
}, [])
```

**方案二：useRef 存最新值**

```jsx
const countRef = useRef(count)
countRef.current = count  // 每次 render 都更新 ref

useEffect(() => {
  const timer = setInterval(() => {
    console.log(countRef.current)  // 永远是最新的
  }, 1000)
  return () => clearInterval(timer)
}, [])
```

**方案三：把依赖加上（但要注意清理）**

```jsx
useEffect(() => {
  const timer = setInterval(() => {
    console.log(count)  // 现在能拿到最新的 count
  }, 1000)
  return () => clearInterval(timer)  // 每次 count 变都会清理旧 timer、创建新 timer
}, [count])
```

---

## 问题：useEffect 的清理函数什么时候执行？

两个时机：

1. **下次 effect 执行之前**：依赖变了，先清理上一次的 effect，再执行新的
2. **组件卸载时**：最后一次清理

```jsx
useEffect(() => {
  const subscription = subscribe(id)
  return () => {
    unsubscribe(subscription)  // 1. id 变了时清理旧订阅  2. 组件卸载时清理
  }
}, [id])
```

**常见需要清理的场景**：
- 定时器：`clearInterval` / `clearTimeout`
- 事件监听：`removeEventListener`
- 订阅：`unsubscribe`
- 请求取消：`AbortController.abort()`

**不清理的后果**：内存泄漏、重复订阅、请求竞态（旧请求的响应覆盖新数据）。

---

## 问题：useRef 有什么用？和 useState 有什么区别？

**useRef 的两个用途**：

**1. 引用 DOM 元素**

```jsx
const inputRef = useRef(null)
<input ref={inputRef} />
// inputRef.current 就是这个 input 的 DOM 节点
inputRef.current.focus()
```

**2. 存储可变值（不触发重渲染）**

```jsx
const timerRef = useRef(null)
const prevPropsRef = useRef(props)

// 修改 ref.current 不会触发重渲染
timerRef.current = setInterval(...)
```

**和 useState 的区别**：

| | useState | useRef |
| --- | --- | --- |
| 修改后是否重渲染 | 是 | 否 |
| 值的获取时机 | 当前 render 的快照 | 永远是最新值（可变） |
| 适用场景 | 需要驱动 UI 更新的数据 | 不需要渲染的数据（timer id、上一次的值、DOM 引用） |

---

## 问题：useCallback 和 useMemo 有什么区别？什么时候用？

**useMemo**：缓存**计算结果**

```jsx
const sortedList = useMemo(() => {
  return heavySort(list)  // 只有 list 变了才重新排序
}, [list])
```

**useCallback**：缓存**函数引用**（本质是 `useMemo(() => fn, deps)` 的语法糖）

```jsx
const handleClick = useCallback(() => {
  doSomething(id)
}, [id])  // 只有 id 变了才创建新函数
```

**什么时候用**：

1. 传给 `React.memo` 子组件的 props——如果不缓存，父组件每次 render 都创建新函数/新对象，子组件的 memo 就白做了
2. 作为其他 Hook 的依赖——避免 useEffect 无限循环
3. 真正昂贵的计算——用 useMemo 避免每次 render 都重算

**什么时候不用**：简单组件、没有性能问题时不要过度优化，memo 本身也有比较开销。

---

## 问题：useReducer 和 useState 怎么选？

**useState**：适合简单的、独立的状态

```jsx
const [count, setCount] = useState(0)
const [name, setName] = useState('')
```

**useReducer**：适合复杂的、多字段联动的状态

```jsx
const [state, dispatch] = useReducer(reducer, {
  loading: false,
  data: null,
  error: null
})

function reducer(state, action) {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null }
    case 'FETCH_SUCCESS':
      return { loading: false, data: action.payload, error: null }
    case 'FETCH_ERROR':
      return { loading: false, data: null, error: action.error }
  }
}
```

**useReducer 的优势**：
1. 多个状态字段需要联动更新时，逻辑集中在 reducer 里，不会漏改
2. `dispatch` 的引用是稳定的（不像 setState 可能因闭包问题需要 useCallback），传给深层子组件很方便
3. 状态转换逻辑可以单独测试

---

## 问题：自定义 Hook 是什么？和普通函数有什么区别？

自定义 Hook 就是一个以 `use` 开头的函数，内部可以调用其他 Hook。

```jsx
function useWindowSize() {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight })
  
  useEffect(() => {
    const handler = () => setSize({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  
  return size
}

// 使用
function MyComponent() {
  const { width, height } = useWindowSize()
}
```

**和普通函数的区别**：
- 自定义 Hook 内部可以调用 useState、useEffect 等 Hook
- 普通函数不行（Hook 规则要求只能在组件或自定义 Hook 里调用 Hook）
- 命名必须以 `use` 开头，这样 lint 工具才能检查 Hook 规则

**和 HOC / render props 的区别**：
- 自定义 Hook 不增加组件树层级（HOC 会多包一层）
- 逻辑复用更直观，就是调用一个函数拿返回值
- 多个自定义 Hook 之间不会互相干扰（HOC 的 props 可能命名冲突）

---

## 问题：React 18 的 Strict Mode 为什么 effect 会执行两次？

开发环境下，React 18 的 Strict Mode 会故意 **mount → unmount → mount** 组件一次，用来帮你发现 effect 清理逻辑的 bug。

**为什么这么做**：React 未来的特性（比如 Offscreen）可能会在组件不可见时卸载、重新可见时重新挂载。如果你的 effect 没有正确清理，就会出问题。

**常见问题**：请求打了两次

```jsx
// ❌ 没有取消逻辑，Strict Mode 下请求打两次
useEffect(() => {
  fetch('/api/data').then(r => r.json()).then(setData)
}, [])

// ✅ 加取消标记
useEffect(() => {
  let cancelled = false
  fetch('/api/data').then(r => r.json()).then(data => {
    if (!cancelled) setData(data)
  })
  return () => { cancelled = true }
}, [])

// ✅ 或用 AbortController
useEffect(() => {
  const controller = new AbortController()
  fetch('/api/data', { signal: controller.signal })
    .then(r => r.json())
    .then(setData)
    .catch(e => { if (e.name !== 'AbortError') throw e })
  return () => controller.abort()
}, [])
```

**面试怎么说**：
> "这是 React 故意的，用来压力测试 effect 的清理逻辑。只在开发环境生效，生产环境不会。如果你的 effect 写了正确的清理函数，双跑不会有任何副作用。"

---

## 问题：Hooks 和类组件的生命周期怎么对应？

| 类组件生命周期 | Hooks 对应 | 注意 |
| --- | --- | --- |
| `componentDidMount` | `useEffect(() => {}, [])` | 但 effect 是异步的，mount 是同步的 |
| `componentDidUpdate` | `useEffect(() => {}, [deps])` | 首次也会执行，不完全等同 |
| `componentWillUnmount` | effect 的 return 清理函数 | |
| `shouldComponentUpdate` | `React.memo` | 浅比较 props |
| `getDerivedStateFromProps` | 直接在 render 里计算 | 不需要单独的 Hook |
| `getSnapshotBeforeUpdate` | 没有直接对应 | 用 useLayoutEffect 部分替代 |

**重要区别**：不要机械地一一对应。Hooks 的心智模型是"每次 render 都是一个独立的快照"，而不是"组件有一个持续的生命周期"。

---

## 问题：useTransition 和 useDeferredValue 是什么？

这两个是 React 18 的并发特性，用来标记**非紧急更新**。

**useTransition**：把某个 setState 标记为低优先级

```jsx
const [isPending, startTransition] = useTransition()

function handleInput(e) {
  setInputValue(e.target.value)  // 高优先级：输入框立刻响应
  startTransition(() => {
    setSearchResults(filterData(e.target.value))  // 低优先级：搜索结果可以延后
  })
}
```

用户打字时，输入框不会卡顿，搜索结果的更新可以被打断和延后。

**useDeferredValue**：给一个值创建一个"延迟版本"

```jsx
const deferredQuery = useDeferredValue(query)
// deferredQuery 会在高优先级更新完成后才跟上 query 的最新值
```

**区别**：useTransition 是你主动控制"哪个 setState 是低优先级"；useDeferredValue 是你拿到一个值但告诉 React"这个值的消费可以延后"。
