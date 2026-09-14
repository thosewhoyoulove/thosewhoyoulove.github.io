# React Hooks

## 面试回答

> Hooks 让函数组件也能持有状态和副作用，但实现上并不魔法：每个函数组件 Fiber 上有一条 Hook 链表，挂在 `memoizedState` 上。首次 mount 按调用顺序建节点，更新时按**同一顺序**依次复用。所以 Hook 必须放在组件或自定义 Hook 顶层，不能放进条件、循环或普通函数——少调一次，后面全部错位。
>
> `useState` 的 setter 会入队更新并触发调度；当前这次 render 闭包里读到的仍是旧快照，所以连续 `setCount(count + 1)` 可能不如预期，依赖旧值时要用函数式更新。`useEffect` 在 Commit 之后处理副作用，依赖变化前先跑上一次 cleanup，卸载时再清理；这是订阅、定时器、请求取消的正确位置。`useRef` 保存可变盒，改 `current` 不触发渲染，适合 DOM 和「最新值」通道。
>
> `useMemo` / `useCallback` 是性能工具，不是默认姿势：只有昂贵计算、配合 `memo` 子组件稳定引用、或避免 effect 依赖抖动时才值得用。React 18 的 `useTransition` / `useDeferredValue` 把更新标成可打断的非紧急工作，让输入等高优交互先走。整条心智是：每次 render 一份快照；Hook 用调用顺序对齐快照里的状态；副作用用 effect 的生命周期管理，而不是模仿类组件生命周期表。

**一句话总结：**

> 调用顺序对齐 Hook 链表 → 快照 state + 函数式更新 → effect 订阅与 cleanup → ref 不触发渲染 → memo/transition 按需使用。

---

## 核心原理

### 1. 为什么需要 Hooks

类组件用 `this.state` 和生命周期集中管理，但逻辑复用常靠 HOC / render props，层层包裹、props 来源不清。Hooks 的目标是：在**不增加组件树层级**的前提下，把状态和副作用按关注点拆成函数。

代价是：函数组件每次 render 都是新闭包，状态不能靠「实例字段」自然存活，必须由 React 在 Fiber 上按规则替你保存。

---

### 2. 整体执行链路

```text
函数组件被 Render 调用
  → 按源码顺序执行 useXxx
  → 每个 Hook 对应链表上一个节点（memoizedState 串起来）
  → useState：读当前快照 / setter 入队 update
  → useEffect：此次只记录 effect 与 deps，真正执行在 Commit 后
  → 组件返回 Element
  → Commit 改 DOM 后：layout effect → paint → passive effect（useEffect）
```

| 概念 | 职责 |
| --- | --- |
| Hook 链表 | 按调用顺序保存每个 Hook 的状态与队列 |
| 状态快照 | 本轮 render 闭包捕获的 props/state |
| updateQueue | setter 创建的更新，Render 时计算下一份 state |
| effect 列表 | 记录要在 Commit 后执行的 create / destroy |

---

### 3. 核心机制：调用顺序 = 身份

Hook 没有「名字」作为稳定身份，**第几次调用**就是身份。

#### Trace：条件调用如何错位

```jsx
// ❌
if (cond) {
  useState(0) // Hook A
}
useState('x') // Hook B
```

| render | cond | 第 1 次 useState | 第 2 次 useState |
| --- | ---: | --- | --- |
| 1 | true | 读到 A（number） | 读到 B（string） |
| 2 | false | 本应读 B，却读到 A 的节点 | 越界 / 错位 |

所以规则是：顶层无条件；条件逻辑放在 Hook 内部，或拆到子组件（子组件自己的链表）。

自定义 Hook 只是「以 `use` 开头的函数里再调 Hook」：链表仍记在**当前组件 Fiber**上，按展开后的总调用顺序排列。

---

### 4. useState：快照、批处理、函数式更新

```jsx
const [count, setCount] = useState(0)

function onClick() {
  setCount(1)
  console.log(count) // 仍是 0：本轮闭包快照
}
```

| 说法 | 更准确 |
| --- | --- |
| setState 是异步的 | setter 同步执行；**更新应用与重渲染**经调度合并 |
| 连续三次 +1 一定 +3 | 若都读同一快照 `count`，可能只相当于一次；应用函数式 |

```jsx
setCount(count + 1)
setCount(count + 1) // 两次都基于同一 count

setCount(c => c + 1)
setCount(c => c + 1) // 队列依次基于上一次计算值
```

React 18 自动批处理：同一事件循环里的多个更新常合并为一次 Render。需要立刻刷新可用 `flushSync`，但会打断批处理。

---

### 5. 闭包陷阱（stale closure）

长生命周期回调（`setInterval`、订阅）若闭住了某次 render 的 state，会一直看到旧值。

```jsx
useEffect(() => {
  const id = setInterval(() => console.log(count), 1000)
  return () => clearInterval(id)
}, []) // count 永远是首次
```

| 手段 | 解决什么 | 注意 |
| --- | --- | --- |
| 函数式 `setCount(c => c + 1)` | **写入**时基于最新 prev | 不解决「只读旧值打印」 |
| `useRef` 同步最新值 | **读取**最新值且不想重订阅 | 改 ref 不触发渲染 |
| 补全 deps | 依赖变则重建 effect | 靠 cleanup 拆旧定时器 |
| 稳定回调 ref | 既要引用稳定又要逻辑新 | 常见于传给 memo 子组件 |
| `useSyncExternalStore` | 数据在外部 store | 订阅与快照由 React 协调 |

---

### 6. useEffect：时机与 cleanup

```text
Render 记录 effect
  → Commit 更新 DOM
  → useLayoutEffect
  → paint
  → useEffect（create）
```

cleanup 两个典型时机：

1. **下次同位置 effect 再跑之前**（deps 变了）；
2. **组件卸载时**。

```jsx
useEffect(() => {
  const sub = subscribe(id)
  return () => unsubscribe(sub)
}, [id])
```

不清理的常见后果：重复订阅、定时器叠加、请求竞态（旧响应覆盖新数据）。开发态 Strict Mode 会故意 mount → unmount → mount，逼你写出可重复挂载的 cleanup；生产不会双调用这套压力测试。

`useLayoutEffect` 在 paint 前同步执行，适合测量 DOM；默认副作用优先 `useEffect`。

---

### 7. useRef vs useState

| | useState | useRef |
| --- | --- | --- |
| 改值 | 触发重渲染 | 只改 `current`，不渲染 |
| 读值 | 本轮快照 | 可变，可读到最新 |
| 适合 | 驱动 UI 的数据 | DOM、timer id、最新回调/值通道 |

---

### 8. useMemo / useCallback 边界

- `useMemo`：缓存**计算值**。
- `useCallback(fn, deps)`：缓存**函数引用**（等价于 memo 一个函数）。

值得用时：

1. 计算很贵；
2. 传给 `React.memo` 子组件，避免每轮新引用打穿 memo；
3. 作为其他 Hook 依赖，避免无意义重建。

不值得：无测量依据地包一层；memo 自己也有比较成本。

---

### 9. useReducer、自定义 Hook、并发 Hook

**useState vs useReducer**：字段少、更新独立 → `useState`；多字段联动、转换表清晰、方便测纯函数 → `useReducer`。`dispatch` 引用稳定，利于往下传。

**自定义 Hook vs 普通函数**：前者内部可调 Hook，状态落在调用方组件链表；普通函数不能破例调 Hook。命名 `use*` 是为了 lint 能检查规则。

**useTransition / useDeferredValue**：把更新或值的消费标成非紧急，让输入等高优先完成。它们建立在 Fiber + Lane 上，不是替代 `useState` 的新状态模型。详见 [Fiber 架构](/md/框架/React/Fiber架构.md)。

---

### 10. 设计取舍

| 选择 | 得到 | 代价 |
| --- | --- | --- |
| 顺序链表存 Hook | 实现简单、无「Hook 名」注册表 | 禁止条件调用 |
| 每轮 render 快照 | 易推理 UI = f(state) | stale closure 要显式处理 |
| effect 延后执行 | 不阻塞 paint（useEffect） | 与类生命周期不能机械对应 |

---

## 常见误区

### ❌ Hook 不能写在 if 里是因为「React 语法规定」

### ✅ 更准确的说法

是链表用**调用顺序**对齐状态；条件调用会错位。

### 为什么？

只背规则答不出「为什么」，追问源码模型会空。

---

### ❌ setState 是异步的，所以 console.log 才是旧值

### ✅ 更准确的说法

本轮闭包快照不会被 setter 当场改写；更新在后续 Render 应用。

### 为什么？

「异步」含糊，和批处理、并发重算搅在一起。

---

### ❌ useEffect 在 DOM 更新前执行 / 等价 didMount

### ✅ 更准确的说法

在 Commit 之后；`useEffect` 通常在 paint 后。首次也会执行，和类生命周期不是双射。

### 为什么？

时机说错会影响闪烁、测量、请求时序题。

---

### ❌ 到处 useMemo / useCallback 就是高级

### ✅ 更准确的说法

按需使用；无稳定引用或昂贵计算需求时，增加噪音与比较成本。

### 为什么？

面试官听的是判断力，不是 API 覆盖率。

---

### ❌ Strict Mode 双跑 effect 是生产 bug

### ✅ 更准确的说法

开发态刻意压力测试 cleanup；生产不这样双调用。

### 为什么？

应修的是可重入与清理，而不是关掉 Strict Mode 当修复。

---

## 高频追问

### 为什么 Hook 不能条件调用？

Fiber 上 Hook 链表靠调用次序对齐；少一次调用，后续节点全部错位。

### 什么是 stale closure？怎么解？

回调闭住了旧 render 的快照。写回用函数式更新；只读最新用 ref；可接受重建就补 deps；外部 store 用 `useSyncExternalStore`。

### useEffect cleanup 何时跑？

deps 变化导致 effect 重跑之前，以及卸载时。用于取消订阅、清定时器、abort 请求。

### useRef 和 useState 怎么选？

要驱动 UI → state；要可变且不渲染（DOM、最新值）→ ref。

### useMemo 和 useCallback 区别？何时用？

缓存值 vs 缓存函数。配合昂贵计算、`memo` 子组件或稳定 deps 时用，不默认全包。

### useTransition 解决什么问题？

把非紧急更新降优先级，避免大渲染堵住输入等高优交互；依赖并发调度，不是新的状态容器。

### 自定义 Hook 和 HOC 怎么选？

逻辑复用优先自定义 Hook（不加深组件树）。需要整树包裹（鉴权壳、错误边界外观）再用 HOC / 包裹组件。

---

## 延伸阅读

- [React 渲染原理](/md/框架/React/React%20渲染原理.md)
- [React Fiber 架构](/md/框架/React/Fiber架构.md)
- [React 状态管理](/md/框架/React/状态管理.md)
- [React 组件设计能力](/md/框架/React/组件设计能力.md)
- [Vue vs React](/md/框架/Vue%20vs%20React.md)
- [面试速记：React & Vue](/md/面试准备/技术/React%20&%20Vue.md)
