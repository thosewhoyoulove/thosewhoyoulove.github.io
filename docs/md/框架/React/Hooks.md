# Hooks 与函数组件（机制与踩坑）

函数组件**没有**实例，`useXxx` 本质是「对当前 fiber 挂载一条状态/副作用」的 API。通用架构与 Fiber 见 [React 高频考点精讲](/md/框架/React/React%20高频考点精讲.md)。

---

## 1. Hook 规则（为何不能 if 里调 Hook）

React 依赖**每次 render 调用顺序一致**来把 `useState` 等对到内部链表上。条件分支里少调一次，后续 hook 全错位 → 运行时崩溃或错乱。

**改法**：提前 return 放在所有 hook 之后；或把带条件的逻辑拆到子组件。

---

## 2. `useState`：异步合并与函数式更新

同一事件里多次 `setState`，通常会合并（见 React 18 批处理）。

```jsx
setCount(c => c + 1) // 函数式：保证基于「最新」状态累加，避免闭包拿到旧值
```

**惰性初始 state**：`useState(() => expensive())`，只跑一次。

---

## 3. `useEffect`：执行时机与依赖

- **何时跑**：组件 **commit 之后**、浏览器 **paint 之后**（异步），多数副作用放这里。  
- **依赖数组**：`[]` 仅 mount/unmount；省略依赖（旧版）或 eslint 关闭会踩 **stale closure**。  
- **清理函数**：下次 effect **前** + **卸载**时执行；请求、订阅、定时器在这里撤销。

**常见 bug**：effect 里用 `count` 却只写了 `[]` → 回调永远闭住**第一次**的 count。

```jsx
useEffect(() => {
  const id = setInterval(() => {
    setCount(c => c + 1) // 用函数式，避免依赖 count
  }, 1000)
  return () => clearInterval(id)
}, [])
```

**与 `useLayoutEffect`**：布局测量、避免闪烁的同步 DOM 读写在 **layoutEffect**；其余默认 **useEffect**。

---

## 4. Stale Closure（过时闭包）短例

```jsx
function Bad() {
  const [count, setCount] = useState(0)
  useEffect(() => {
    const t = setInterval(() => {
      console.log(count) // 若依赖 []，这里永远是 0
    }, 1000)
    return () => clearInterval(t)
  }, []) // 应加 [count] 或用 ref / 函数式 setState
}
```

**工具**：`useRef` 存最新值、`useEvent` 模式（React 官方讨论过）、或把逻辑放进 **依赖正确** 的 effect。

---

## 5. `useRef`

- **`ref.current` 可变**，变更**不**触发渲染。  
- 既可挂 DOM，也可存**任意可变盒子**（interval id、上一次的 props）。

```jsx
const latest = useRef(props.id)
latest.current = props.id
```

---

## 6. `useMemo` / `useCallback`

稳定**引用**给 `React.memo` 子组件或 `useEffect`/`useMemo` 依赖，或缓存**纯**重计算。

不必 memo 每一个内联函数；依赖写全，配合 `eslint-plugin-react-hooks`。

---

## 7. `useReducer`

局部状态机、多字段联动更新时用 reducer 比多个 `useState` 更清晰；`dispatch` 引用稳定，适合传给深层回调。

---

## 8. `useContext`

见 [精讲 §6 Context](/md/框架/React/React%20高频考点精讲.md)：`value` 引用大变 → 子树大面积更新。优先**拆 Context** 或外部 store。

---

## 9. 自定义 Hook

命名 **`useXxx`**，内部可组合其他 hook；**逻辑复用**不增加组件树层级（对比 HOC/render props）。

注意：**不要**在自定义 hook 里偷偷违反规则（条件调用 hook）。

---

## 10. Strict Mode 与 effect 双跑

开发环境 **mount → unmount → mount** 用于压力测清理逻辑。若 effect 里**没有对称清理**，会出现「请求打两次」等——必须 **AbortController** 或取消标记。

```jsx
useEffect(() => {
  let cancelled = false
  fetch('/api').then(r => r.json()).then(data => {
    if (!cancelled) setData(data)
  })
  return () => { cancelled = true }
}, [])
```

---

## 11. `useId`（并发安全 id）

生成 **稳定的、SSR 友好** 的 id，避免手写 `Math.random()` 导致 hydration 不一致。

---

## 12. 与类组件生命周期对比（口述）

| 类组件 | Hooks 大致对应 |
| --- | --- |
| `componentDidMount` | `useEffect(() => {}, [])` |
| `componentDidUpdate` | `useEffect(() => {}, [deps])` |
| `componentWillUnmount` | effect **return** 清理 |
| `getSnapshotBeforeUpdate` | `useLayoutEffect`（场景不同，勿机械等同） |

---

掌握以上可覆盖大部分 **Hooks 深挖** 面试；Fiber、批处理、Concurrent 见 [React 高频考点精讲](/md/框架/React/React%20高频考点精讲.md)。
