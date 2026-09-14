# React 渲染原理

## 面试回答

> React 渲染的核心不是 `setState` 直接改 DOM，而是：创建更新 → 调度 → Render 算差异 → Commit 提交到屏幕。
>
> 触发更新时，React 会给对应 Fiber 挂上 update、标上 lane，再交给 Scheduler 决定何时开工。Render 阶段从根（或仍有效的工作起点）构建 `workInProgress` Fiber 树：跑组件函数拿到新的 React Element，再做 reconciliation——其中子节点对齐就是 Diff——给 Fiber 打上 Placement、Update、ChildDeletion 这类 flags。这一阶段只动内存里的 Fiber 和标记，不改已上屏 DOM，所以可以暂停、恢复，甚至丢掉未提交的树再重来。也正因为可能执行多次，组件函数要尽量保持纯，副作用放进事件或 effect。
>
> Commit 阶段消费这些 flags：同步改 DOM，再按阶段跑 layout 相关逻辑；`useLayoutEffect` 在 paint 前，`useEffect` 通常在 paint 后。DOM 一旦开始改就不能改到一半停，否则界面会不一致。
>
> 和 Fiber、Diff 的关系可以记成：渲染原理讲整条流水线；Fiber 解释工作为何能拆、现场存在哪；Diff 解释孩子如何复用和移动。React 18 还会把同一事件循环里的多次 `setState` 自动批成一次 Render，必要时才用 `flushSync` 打破。

**一句话总结：**

> setState 建 update → Scheduler/Lane 调度 → Render 建 wip 打 flags → Commit 改 DOM → layout/passive effect。

---

## 核心原理

### 1. 为什么需要这条流水线

如果每次状态变化都立刻、同步、直接操作 DOM：

- 多次 `setState` 会反复读写 DOM，成本高；
- 大组件树一旦开始算就难停，交互易卡；
- 很难给「输入」和「列表过滤」不同优先级。

所以 React 拆成：

| 阶段 | 解决什么 |
| --- | --- |
| 触发 + 队列 | 先记账，不立刻改屏幕 |
| 调度 | 何时算、带上哪些优先级更新 |
| Render | 算出「下一屏应该怎样」，只产生 Fiber / flags |
| Commit | 一次性把账落到 DOM，再处理副作用 |

---

### 2. 整体执行链路

先分清三种对象：

| 对象 | 白话 |
| --- | --- |
| React Element | 这次 render 描述的 UI（不可变） |
| Fiber | 运行时工作单元：关系、state、队列、flags、lanes |
| DOM Node | 浏览器真实节点，主要在 Commit 修改 |

```text
setState / props / context
  → 创建 update，写入 Fiber.updateQueue
  → 标记 lanes，冒泡到根
  → Scheduler 调度
  → Render：beginWork → 跑组件 → reconcileChildren（含 Diff）
       → completeWork，合并 flags
  →（可中断 / 可丢弃 wip）
  → Commit：
       before mutation → mutation（改 DOM）→ layout（含 useLayoutEffect）
  → 浏览器 paint
  → passive effect（useEffect）
```

细节底座见 [Fiber 架构](/md/框架/React/Fiber架构.md)；孩子如何对齐见 [React Diff 算法](/md/框架/React/React%20Diff算法.md)。本文盯住**端到端流水线**。

---

### 3. 触发更新：`setState` 做了什么

```jsx
setCount(count + 1)
```

同步发生的是「调用 setter」；**状态出现在下一轮 render 的快照里、DOM 随后变更**，才是调度之后的事。

最小链路：

```text
setCount
  → 创建 update（可能带 lane）
  → 挂到该函数组件 Fiber 的 updateQueue
  → 从当前 Fiber 向上标记，确保根知道有活
  → scheduleUpdateOnFiber → Scheduler
```

#### Trace：一次点击里的三次 setState

```jsx
function onClick() {
  setCount(c => c + 1)
  setFlag(true)
  setName('x')
}
```

| 步骤 | 发生什么 | 屏幕 |
| --- | --- | --- |
| 三次 setter 调用 | 三个 update 入队（同事件里通常同批） | 仍是旧 UI |
| 调度到 Render | 合并处理，组件函数跑一轮，读到新快照 | 仍未改 DOM |
| Commit mutation | 按 flags 改 DOM | 变为新 UI |
| layout / paint / effect | 测量、绘制、被动副作用 | 用户看见后 effect 再跑 |

React 18 默认自动批处理：Promise、`setTimeout`、原生事件里的多更新也常合并。需要立刻读更新后 DOM 时才考虑 `flushSync`（会打破批处理，慎用）。

---

### 4. Render：只计算，不改已上屏 DOM

Render（常与 reconciliation 连用）核心产出是新的 `workInProgress` 树和 flags。

对函数组件：调用组件函数 → 得到 Element 树 → `reconcileChildren` 对齐旧 child Fiber。

| Render 会做 | Render 不会做 |
| --- | --- |
| 跑组件 / Hooks | 改已上屏 DOM |
| Diff 子节点 | 跑 `useEffect` |
| 打 Placement / Update / ChildDeletion… | 跑 `useLayoutEffect` |

因为可能被中断或重启：

```jsx
// ❌ 不要在 render 路径里写必然副作用
function App() {
  localStorage.setItem('x', '1')
  return <div />
}
```

「纯」不是教条，而是：同一 props/state 多次进入应得到相同 UI 描述，且不依赖「只执行一次」的外部突变。

---

### 5. Commit：把 flags 变成 DOM 与副作用

Commit 同步推进用户可见的提交路径，大致三段：

| 子阶段 | 典型工作 |
| --- | --- |
| before mutation | 读 DOM 快照等（如 `getSnapshotBeforeUpdate`） |
| mutation | 插删改 DOM、更新文本与属性、处理部分 ref |
| layout | DOM 已更新、paint 前：`useLayoutEffect`、类组件 didMount/Update |

时机关系：

```text
Commit mutation 改 DOM
  → useLayoutEffect（paint 前，可阻塞绘制）
  → 浏览器 paint
  → useEffect（paint 后，不阻塞首屏绘制）
```

| Hook | 时机 | 适合 |
| --- | --- | --- |
| `useLayoutEffect` | DOM 更新后、paint 前 | 测量布局、避免闪烁的同步调整 |
| `useEffect` | paint 后 | 请求、订阅、日志等非同步视觉必需 |

能 `useEffect` 就不要上 `useLayoutEffect`。

---

### 6. Diff 在流水线中的位置

Diff 不是整条渲染的全部，只是 Render 里「把新 children 对齐成 child Fiber 并打 flags」的那一步。

启发式三板斧（细节与 `lastPlacedIndex` Trace 见 Diff 专文）：

1. 只比同层；
2. `type` 不同倾向于整段替换；
3. 列表用 `key` 认身份。

面试一句话：

> 渲染原理负责阶段划分；Diff 负责孩子怎么复用；Fiber 负责工作单元和可中断。

---

### 7. 与 Vue 更新模型的对照（点到为止）

| 维度 | React | Vue |
| --- | --- | --- |
| 谁先知道要更新 | 显式 `setState` 等 | 响应式 `trigger` 通知组件 effect |
| 默认范围 | 从触发点向子树再 render，靠 memo 等收缩 | 依赖收集到组件级更新为主 |
| 调度 | Fiber + Scheduler + Lane | 队列与 scheduler job，默认更偏同步组件更新 |
| 编译 | JSX 偏运行时 | 模板可静态提升 / patchFlag |

详解见 [Vue vs React](/md/框架/Vue%20vs%20React.md)、[Vue 渲染原理](/md/框架/Vue/Vue%20渲染原理.md)。

---

### 8. 设计取舍

| 选择 | 得到 | 代价 |
| --- | --- | --- |
| Render / Commit 分离 | 可中断计算、统一提交 | 心智上要分清「算」和「画」 |
| 批处理 | 少次 Render | 当次闭包里读到的仍是旧快照 |
| 不自动追踪字段依赖 | JSX 灵活、调度模型统一 | 常需状态下沉 / memo 控制范围 |

---

## 常见误区

### ❌ `setState` 立刻改 state 和 DOM

### ✅ 更准确的说法

setter 同步入队；新 state 在下次 Render 快照中出现，DOM 在 Commit 后变。

### 为什么？

否则无法解释批处理、`console.log` 仍是旧值、以及并发下重算。

---

### ❌ Render 被打断时 DOM 会停在一半

### ✅ 更准确的说法

Render 改的是内存里的 wip；已上屏 DOM 仍由 `current` 解释。半截提交发生在 Commit，且提交路径按同步语义推进。

### 为什么？

这是渲染题和 Fiber 题共用的高危混淆点。

---

### ❌ Diff、Fiber、渲染原理是三个无关考点

### ✅ 更准确的说法

同一条更新链上的不同切片：流水线 / 工作单元 / 孩子对齐。

### 为什么？

分不清职责时，追问很容易从一个词跳到另一个词却接不上因果。

---

### ❌ React 18 所有更新都一定批处理、都一定时间切片

### ✅ 更准确的说法

多数场景自动批处理；`flushSync` 可打破。时间切片是能力，不是每次更新的保证。

### 为什么？

「提供能力」被说成「一定发生」会在追问里露馅。

---

### ❌ `useEffect` 等同 `componentDidMount`，且在 DOM 更新前执行

### ✅ 更准确的说法

effect 在 Commit 之后；`useEffect` 通常在 paint 后。首次也会跑，和类生命周期不是严格一一对应。

### 为什么？

时机说错会直接导致「闪烁 / 测量」类题答反。

---

## 高频追问

### React 一次更新的主链路是什么？

触发建 update → 标 lane → 调度 → Render 建 wip、Diff、打 flags → Commit 改 DOM → layout / passive effect。

### Render 和 Commit 有什么区别？

Render：算 Fiber 与差异，可中断，不动已上屏 DOM。Commit：消费 flags 改 DOM 并处理提交期副作用，用户可见提交同步完成。

### 为什么组件函数要尽量纯？

Render 可能重复执行或丢弃重来；写在函数体里的请求、订阅、随意 DOM 操作会重复或与「未提交树」不一致。

### 批处理解决了什么？`flushSync` 呢？

批处理把同一轮里的多更新合并，减少重复 Render。`flushSync` 强制同步刷新，便于立刻读 DOM，但打断批处理且更易卡顿。

### `useLayoutEffect` 和 `useEffect` 差在哪？

都在 DOM 更新后的 Commit 相关路径里；前者在 paint 前（可阻塞绘制），后者通常在 paint 后。测量并同步改布局用前者，其余优先后者。

### Fiber / Diff 分别在这条链的哪一段？

Fiber 贯穿：工作单元、双缓冲、可中断 Render。Diff 发生在 Render 的 `reconcileChildren`：对齐孩子并打 flags，不负责立刻搬 DOM。

### key 在渲染过程中何时起作用？

在 Render 阶段列表 Diff 认身份时；不直接等于「一定会移动 DOM」。移动由后续 Placement 与 Commit 决定。

---

## 延伸阅读

- [React Fiber 架构](/md/框架/React/Fiber架构.md)
- [React Diff 算法](/md/框架/React/React%20Diff算法.md)
- [React Hooks](/md/框架/React/Hooks.md)
- [SSR 与 Hydration](/md/框架/React/SSR与Hydration.md)
- [Vue 渲染原理](/md/框架/Vue/Vue%20渲染原理.md)
- [Vue vs React](/md/框架/Vue%20vs%20React.md)
- [面试速记：React & Vue](/md/面试准备/技术/React%20&%20Vue.md)
