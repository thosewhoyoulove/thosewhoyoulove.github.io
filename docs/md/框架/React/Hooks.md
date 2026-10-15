# React Hooks

## 面试回答

> 我理解 Hooks 的关键，是组件函数每次都会重新执行，但状态由 React 保存在组件对应的数据结构里。useState、useEffect 这些普通 Hook 按调用顺序和上一次渲染对齐，所以不能放进条件或循环。自定义 Hook 复用的是逻辑，每次调用的状态仍属于各自组件。
>
> setter 不会改掉当前函数已经拿到的 state，而是为后续渲染登记更新。同一事件里两次 setCount(count + 1)，用的是同一轮的 count；两次 setCount(c => c + 1) 则会在处理队列时依次累加。这个区别也解释了旧闭包：定时器保留的是创建它那次渲染中的值，需要根据用途补依赖、用函数式更新，或用 ref 保存不驱动渲染的可变信息。
>
> Effect 用来连接外部系统，比如订阅、定时器和网络连接。依赖改变后，React 先清理旧连接，再按新值建立连接；卸载时也要清理。它不保证一定在浏览器绘制后执行，必须在绘制前完成的布局测量才考虑 useLayoutEffect。能直接算出的派生值，通常不用 Effect 再写回 state。
>
> 性能优化上，我会先确认昂贵计算或引用变化是否造成了实际问题，再考虑 useMemo 和 useCallback。需要让紧急输入先响应时，再区分 useTransition 标记更新与 useDeferredValue 延后消费值。理解这些行为后，源码可以继续沿 Hook 链表、更新队列和 Effect 队列追踪。

**一句话总结：**

> `renderWithHooks` 按调用顺序挂载或复用 Hook 节点 → update queue 在下一次 Render 计算 state → 每次 Render 形成独立闭包快照 → Commit 后按依赖执行 Effect 的 cleanup/setup。

---

## 核心原理

### 1. 为什么需要 Hooks

类组件用 `this.state` 和生命周期集中管理，但逻辑复用常靠 HOC / render props，层层包裹、props 来源不清。Hooks 的目标是：在**不增加组件树层级**的前提下，把状态和副作用按关注点拆成函数。

组件函数每次执行都会创建新的局部变量，为什么 count 没有回到初始值？因为 useState 从 React 保存的数据中读取本轮状态，局部变量只是接过这个值。接下来先解释 React 如何认领同一位置的 Hook，再解释队列如何算出下一份状态。

---

### 2. 整体执行链路

```text
Render 进入函数组件
  → renderWithHooks 设置 currentlyRenderingFiber
  → mount：创建 Hook 节点
     update：按顺序从 current Hook 链表复用 / 克隆节点
  → useState / useReducer：处理 update queue，得到本轮 state
  → useEffect：记录 Effect、create、deps，并标记是否需要执行
  → 函数组件返回 React Element
  → Render 完成，Hook 状态保存在 workInProgress Fiber
  → Commit 修改宿主视图
       → Layout Effect（同步、paint 前）
       → 安排 Passive Effect（useEffect）
  → 浏览器通常先 paint，再处理 Passive Effect
```

| 概念 | 职责 |
| --- | --- |
| Hook 链表 | 按调用顺序保存大多数有状态 Hook 的数据与队列 |
| 状态快照 | 本轮 render 闭包捕获的 props/state |
| updateQueue | setter 创建的更新，Render 时计算下一份 state |
| effect 队列 | 记录要在提交后处理的 create / destroy |

Hook 链表解决的是「这个 Hook 的状态存在哪里、怎样和上次对齐」；Effect 本身还会形成可供 Commit 遍历的 Effect 结构，通常挂在函数组件 Fiber 的更新队列上。两者不要混成“所有 Effect 就是 Hook 链表节点本身”。

---

### 3. `renderWithHooks`：调用顺序如何对应状态

大多数 Hook 没有「变量名」作为运行时身份，**在当前组件中第几次调用**就是它和上次 Render 对齐的依据。

```text
FunctionComponent Fiber
└─ memoizedState
    → Hook 1
       → Hook 2
          → Hook 3
```

一个 Hook 节点可以概念化为：

| 字段 | 作用 |
| --- | --- |
| `memoizedState` | 当前 Hook 本轮使用的状态；不同 Hook 也可能存不同结构 |
| `baseState` | 已经处理到的基础状态 |
| `baseQueue` | 尚未在当前优先级完成的基础更新队列 |
| `queue` | dispatch 加入更新的位置及相关信息 |
| `next` | 指向下一个 Hook 节点 |

首次 Render 中，`mountWorkInProgressHook` 按调用顺序创建节点；更新 Render 中，`updateWorkInProgressHook` 按相同顺序读取 current Hook，并为 workInProgress 构造本轮链表。源码名称不必死背，但要能解释「状态存在 Fiber 上，调用顺序负责认领」。

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

> 版本边界：新版 React 的 `use` 可以出现在条件和循环中，但仍不能放在 `try/catch` 中。它是特殊 API，不代表普通 Hooks 的调用顺序规则失效。

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

React 18 使用 createRoot 的根扩大了自动批处理范围，Promise、定时器和原生事件等场景中的多个更新也通常可以合并。需要强制同步刷新时可以使用 `flushSync`，但它会打断批处理并可能影响性能。

#### update queue 如何计算下一份 state

传值可以理解成「用这个值替换结果」，函数则会收到队列处理到当前位置的 state：

```jsx
setNumber(number + 5) // 假设当前快照 number = 0：加入“替换为 5”
setNumber(n => n + 1) // 基于队列上一步：5 → 6
setNumber(42)         // 最后替换为 42
```

下一次 Render 处理队列后结果是 `42`。这说明函数式更新的价值不只是“异步时更安全”，而是它能基于**更新队列中的上一步结果**继续计算。

批处理也不等于所有更新永远合并。React 会在安全范围内批量处理更新，但不会把多个独立的用户意图事件简单合成一批。面试时用「setter 入队，React 在合适的边界统一 Render」比「setState 是异步的」更准确。

#### 队列为什么是环，而不是一个数组

为了方便理解，可以把更新想成按调用顺序排成的数组。更准确地说，每个 Hook 上有一块会跨渲染留下来的 `queue`，里面的更新用链表串成环：`pending` 指向**最后**一项，最后一项的 `next` 指回第一项。这样每次 `setState` 追加都是常数时间，不用再找尾巴。

current Fiber 和 workInProgress Fiber 上的这个 Hook **共用同一个 `queue`**。Render 被打断、草稿树丢掉时，已经 dispatch 出去的更新还在队列上，不会跟着半成品一起消失。

和「这一轮算出来的 state」有关的字段在 Hook 节点自己身上：

| 字段 | 是什么 | 为什么需要 |
| --- | --- | --- |
| `memoizedState` | 这一轮渲染实际使用的 state | 组件函数和本次 UI 读的就是它 |
| `baseState` | 从哪一份 state 开始重放还没完成的更新 | 中间如果跳过了低优先级更新，不能把「跳过之后的结果」当成下次的起点 |
| `baseQueue` | 上次没能全部提交进 `baseState` 的更新 | 下一轮要把跳过的更新按原顺序再算一遍 |
| `queue.pending` | 上次处理之后新 dispatch 的更新 | Render 开始时接到 `baseQueue` 后面，然后清空 |

Render 处理这条 Hook 时，先把 `pending` 接到 `baseQueue` 上，再从 `baseState` 出发逐个看更新。更新自己带着 Lane。本轮 `renderLanes` 包含它，就执行：传入的是值就替换，传入的是函数就把上一步的 state 交给它。本轮不包含它，就把它留在新的 `baseQueue` 里，并且 `baseState` 停在**第一个被跳过的更新之前**。

被跳过之后、但优先级又够本轮的更新，这一轮仍会算进 `memoizedState`，同时也会留在 `baseQueue` 里，留给以后从 `baseState` 重放。否则低优先级那一步会丢，或者把后面的更新算在错误的起点上。

#### Trace：紧急更新插进一条 transition 前面

当前 `baseState` 是 `0`。先有一条 transition 更新 `T`：`n => n + 1`。随后一条紧急更新 `U`：`n => n + 100`。这一轮只渲染紧急 lane。

| 更新 | 本轮是否包含它的 Lane | 处理 | 之后的状态 |
| --- | --- | --- | --- |
| 起点 |  |  | `baseState = 0`，`memoizedState` 从 0 开始算 |
| `T` | 否 | 留在 `baseQueue`，`baseState` 保持 0 | 本轮画面还不能算进这 +1 |
| `U` | 是 | 应用到本轮结果：`0 + 100 = 100`；同时接到 `baseQueue` 后面，标记成下次重放时一定要算 | `memoizedState = 100` |

这次 Commit 用户可以先看到 `100`。`baseState` 仍是 `0`，`baseQueue` 里按顺序还有 `T` 和 `U`。

下一轮把 `T` 的 lane 纳入，从 `baseState` 重放：`T` 得到 `1`，再执行 `U` 得到 `101`。终态是 `101`，不是把紧急那次的 `100` 当成最终结果。函数式更新必须能按入队顺序重放，所以跳过的前缀不能直接扔掉。

还有一个短路：这条 Fiber 和它的 alternate 都没有待处理 Lane 时，setter 会先用上次渲染的 state 算一次。`Object.is` 相同就入队、不调度渲染。已经有 Lane 等着这一轮时不做这个短路，因为上次渲染的 state 还不是队列里后续更新算完的结果。

组件函数执行过程中再次 `setState`，会进当前这轮的 render phase 队列，React 重跑该组件来消化，而不是再排一次独立渲染。这是边界路径。正常的更新放在事件里。

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

### 6. useEffect：与外部系统同步

Effect 的第一判断不是「组件渲染完后我要做什么」，而是：

> 当前组件是否需要和 React 之外的系统建立并维持同步关系？

典型外部系统包括：事件订阅、定时器、WebSocket、浏览器 API、网络连接、埋点 SDK 和第三方 UI 组件。

以下逻辑通常不需要 Effect：

| 需求 | 更合适的位置 |
| --- | --- |
| 根据 props/state 计算派生值 | 直接在 Render 中计算，昂贵时再考虑 `useMemo` |
| 用户点击后提交请求 | 对应事件处理函数 |
| props 改变时重置一部分派生状态 | 调整状态建模、使用 key 或在 Render 中推导 |
| 串联多个只为计算下一份 state 的 Effect | 在一次事件或状态更新中完成计算 |

把 Effect 当成通用流程控制工具，容易产生额外 Render、依赖循环和难以追踪的数据流。

#### Effect 的生命周期

```text
Render 记录 effect
  → Commit 更新 DOM
  → useLayoutEffect
  → 安排 Passive Effect
  → 通常先 paint
  → useEffect（setup）
```

依赖 id 从 A 变成 B 时，旧订阅不会自动切换。React 先执行上一次的 cleanup 撤销 A，再用 B 执行新的 setup；卸载时撤销最后保留的订阅。把建立和撤销写在一起，可以直接检查两者是否配对。

```jsx
useEffect(() => {
  const sub = subscribe(id)
  return () => unsubscribe(sub)
}, [id])
```

更准确地看，每个 Effect 都是在描述一个独立的同步过程：用当前依赖执行 setup，需要重新同步时先用旧依赖 cleanup，再用新依赖 setup；组件卸载时停止最后一次同步。

不清理的常见后果：重复订阅、定时器叠加、请求竞态（旧响应覆盖新数据）。开发环境 Strict Mode 会额外执行一次 setup → cleanup → setup，检查清理是否和初始化对称；这不是生产环境的正常执行次数。

#### 依赖数组不是执行时机开关

依赖数组应描述 Effect 使用了哪些 reactive values，包括 props、state，以及组件内部声明的变量和函数。React 使用 `Object.is` 比较每一项与上次的值：

```jsx
useEffect(() => {
  const connection = createConnection(serverUrl, roomId)
  connection.connect()
  return () => connection.disconnect()
}, [serverUrl, roomId])
```

不要为了“只执行一次”而故意漏依赖。出现对象或函数依赖频繁变化时，优先判断它是否真的需要 Effect，再考虑把对象放进 Effect、把逻辑移到事件中、拆分 Effect、使用函数式更新，最后才是用 memoization 稳定引用。

#### Effect 与浏览器 paint

`useEffect` 在提交后处理，通常不会阻塞浏览器绘制，但不能依赖它绝对发生在 paint 之后；交互触发等情况下，React 可能更早处理。必须在用户看到页面前完成的 DOM 测量或同步布局调整，应使用 `useLayoutEffect`。

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

**useTransition / useDeferredValue** 都建立在 Fiber + Lane 上，不是另一套 state。差别在「你能不能包住那次 `setState`」。详见下一节，调度底座见 [Fiber 架构](/md/框架/React/Fiber架构.md)。

---

### 10. `useTransition` 和 `useDeferredValue` 各解决什么

两者都是把非紧急渲染放进可中断的 transition lane，让输入先完成。它们不是同一个入口。

| | `useTransition` | `useDeferredValue` |
| --- | --- | --- |
| 你控制的是 | 哪一次 `setState` 降优先级 | 一个已经到来的值，何时被昂贵子树消费 |
| 返回 | `isPending` 和 `startTransition` | 滞后的那份值 |
| 典型场景 | 输入用紧急 state，列表用另一份放进 transition 的 state | 值从 props 来，父组件已经紧急提交了 |
| 怎么看还在滞后 | `isPending` | `value !== deferredValue` |

#### 你能包住更新：`useTransition`

```jsx
const [text, setText] = useState('')
const [query, setQuery] = useState('')
const [isPending, startTransition] = useTransition()

function onChange(e) {
  const next = e.target.value
  setText(next)
  startTransition(() => setQuery(next))
}
```

`setText` 是紧急更新，输入框跟着这一次 Commit。`setQuery` 发生在 `startTransition` 里，Lane 是 transition，大列表可以暂停、被下一次按键打断。`isPending` 在这次 transition 还没 Commit 时为真，用来显示「结果还在算」，而不是把输入框本身设成 loading。

React 18 里这个回调应按同步来写：`await` 之后的 `setState` 不一定还算在同一次 transition 的 pending 里。React 19 的 async Action 会把 pending 保持到 Promise 结束，见 [React 19 相对 18](/md/框架/React/React%2019%20变化.md)。

#### 更新已经发生：`useDeferredValue`

```jsx
function SearchResults({ query }) {
  const deferredQuery = useDeferredValue(query)
  const items = useMemo(() => heavyFilter(deferredQuery), [deferredQuery])
  return <List items={items} />
}
```

父组件已经用紧急更新提交了新的 `query`，子组件改不了那次 `setState`。`useDeferredValue` 在这次紧急渲染里先返回**上一次的值**，昂贵计算仍基于旧关键字；然后再安排一次 transition 渲染，改用新值。首次挂载时返回的就是当前值，没有「上一次」。React 19 可以传第二个参数作为首次渲染的初始值，第一次先用初始值，再在后台换上真正的 `query`。

`Object.is` 认为值没变时，不会多排这一轮。

#### 怎么选

输入和重活都在自己的事件里：拆成两个 state，用 `useTransition` 包住重的那次更新，这样输入的 Commit 里根本可以不带上新列表。值是 props，重活在子树：用 `useDeferredValue`，让子树这一轮先吃旧值。

两者都不替代 `useState`，也都不把计算搬到 Worker。没有 `createRoot` 的旧入口没有这套可中断渲染。若昂贵计算直接读了紧急值，推迟就没有落点。

---

### 11. 设计取舍

| 选择 | 得到 | 代价 |
| --- | --- | --- |
| 顺序链表存 Hook | 实现简单、无「Hook 名」注册表 | 禁止条件调用 |
| 跳过的更新留在 `baseQueue`，从 `baseState` 重放 | 低优先级不会丢，函数式更新仍按入队顺序 | 中间一次 Commit 可能暂时看不到被跳过的更新 |
| transition 和 deferred 分成两个入口 | 能包住更新时，紧急 Commit 可以不带上重活 | 包不住那次 `setState` 时，只能推迟消费 |
| 每轮 render 快照 | 易推理 UI = f(state) | stale closure 要显式处理 |
| effect 与 Render 分离 | 默认不阻塞 paint（useEffect） | 与类生命周期不能机械对应 |

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

### ❌ 派生数据和事件逻辑都应该放进 useEffect

### ✅ 更准确的说法

Effect 用来同步外部系统。能在 Render 中推导的数据直接计算；由用户操作触发的逻辑优先放在事件处理函数。

### 为什么？

滥用 Effect 会增加一次多余的状态同步和 Render，还容易形成依赖循环及竞态。

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

### ❌ `useState` 的更新队列就是数组，跳过的更新可以直接丢掉

### ✅ 更准确的说法

更新挂在 Hook 的 `queue` 上，链表成环，`pending` 指向最后一项。低优先级更新被本轮跳过时留在 `baseQueue`，`baseState` 停在它之前；后面已经算进画面的更新还要能从这份 `baseState` 重放。

### 为什么？

说成「数组里删掉低优先级」，紧急渲染先看到的结果就会变成终态，函数式更新的顺序就错了。

---

### ❌ `useTransition` 和 `useDeferredValue` 是同一个东西

### ✅ 更准确的说法

`useTransition` 包住你发起的 `setState`，并给出 `isPending`。`useDeferredValue` 不改变来源更新，只让消费侧在紧急渲染里先用旧值，再以 transition 渲染新值。

### 为什么？

值来自 props 时你包不住那次 `setState`；更新在自己的事件里时，推迟消费不如直接把重的更新降优先级。

---

## 高频追问

### 为什么 Hook 不能条件调用？

大多数有状态 Hook 在 Fiber 上靠调用次序对齐；少一次调用，后续节点全部错位。新版 `use` 是可以条件调用的特殊例外，不代表普通 Hook 规则失效。

### Hook 的状态到底存在哪里？更新时怎样找到？

状态不保存在函数局部变量中，而在函数组件 Fiber 的 Hook 链表里。首次 Render 按调用顺序创建节点；更新 Render 按同一顺序读取 current Hook，并为 workInProgress 构造本轮 Hook 节点。

### useState 连续更新是怎么计算的？队列怎么设计？

setter 把值或函数追加到 Hook 的环状 `queue.pending`。下一次 Render 从 `baseState` 按顺序处理：值更新替换当前结果，函数更新接收上一步的结果。本轮 Lane 盖不住的更新留在 `baseQueue`，下次连同后面的更新从跳过之前的 `baseState` 重放。current 和 workInProgress 共用这个 `queue`，草稿丢掉也不会丢更新。

### 什么是 stale closure？怎么解？

回调闭住了旧 render 的快照。写回用函数式更新；只读最新用 ref；可接受重建就补 deps；外部 store 用 `useSyncExternalStore`。

### useEffect cleanup 何时跑？

deps 变化导致 effect 重跑之前，以及卸载时。用于取消订阅、清定时器、abort 请求。

### useEffect 的依赖数组可以为了少执行而删吗？

不能随意删。依赖数组是在声明 Effect 使用的 reactive values，不是手动控制执行频率的开关。应先移除不必要的 Effect，或重构对象、函数和状态读取方式，再让 lint 帮助校验依赖。

### useRef 和 useState 怎么选？

要驱动 UI → state；要可变且不渲染（DOM、最新值）→ ref。

### useMemo 和 useCallback 区别？何时用？

缓存值 vs 缓存函数。配合昂贵计算、`memo` 子组件或稳定 deps 时用，不默认全包。

### `useTransition` 和 `useDeferredValue` 有什么区别？

`useTransition` 把回调里的 `setState` 降成 transition，并用 `isPending` 表示这次还没提交。`useDeferredValue` 在紧急渲染里先返回旧值，再安排一次 transition 去用新值，适合值已经从 props 进来、昂贵计算在子树的情况。两者都不是新的状态容器。

### 自定义 Hook 和 HOC 怎么选？

逻辑复用优先自定义 Hook（不加深组件树）。需要整树包裹（鉴权壳、错误边界外观）再用 HOC / 包裹组件。

---

## 延伸阅读

- [React 渲染原理](/md/框架/React/React%20渲染原理.md)
- [React Fiber 架构](/md/框架/React/Fiber架构.md)
- [React 状态管理](/md/框架/React/状态管理.md)
- [React 组件设计能力](/md/框架/React/组件设计能力.md)
- [Vue vs React](/md/框架/Vue%20vs%20React.md)
- [React 19 相对 18](/md/框架/React/React%2019%20变化.md)
- [面试速记：React & Vue](/md/面试准备/技术/React%20&%20Vue.md)

行为核查参考：[React useEffect](https://react.dev/reference/react/useEffect)。源码字段属于实现说明，阅读时需核对相应版本。
