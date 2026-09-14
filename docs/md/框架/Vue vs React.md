# Vue 和 React 的对比

## 面试回答

> Vue 和 React 都在解决同一件事：数据变了，怎么高效、可预期地更新 UI。差别主要在**更新模型**，不是谁更先进。
>
> Vue 偏响应式：渲染过程中读到的数据会收集依赖，写入时 `trigger` 通知相关组件的更新 effect。再叠加模板编译（静态提升、patchFlag、Block Tree），运行时要比对的动态节点更少，所以日常开发里手动 memo 少，性能下限比较稳。更准确地说，默认仍是**组件级**重新渲染为主，不是 Solid 那种逐 DOM 绑定的极细粒度；细的是「依赖收集到哪个组件 effect」。
>
> React 偏状态驱动：`setState` 之后从触发点往下再算 UI，用 Fiber reconciliation（含 Diff）找差异。它不自动追踪「哪个字段被谁读了」，换来的是统一的运行时模型，以及 Fiber + Scheduler + Lane 上的可中断渲染、`startTransition` 这类优先级能力。控制渲染范围通常靠状态下沉、`memo`、稳定引用等显式手段。
>
> Diff 上 Vue 3 乱序中段更常走 LIS，偏向少搬 DOM；React 用 `lastPlacedIndex` 贪心，和「Render 只打标、Commit 再改 DOM」一致。逻辑复用现在都很像：Composable vs Hooks，但 Hooks 依赖调用顺序，Vue 的响应式不依赖。选型看团队与场景：中后台、约束清晰、快速交付常偏 Vue；复杂交互、跨平台、Next 生态常偏 React。我两边都用过，会按问题选工具。

**一句话总结：**

> Vue=依赖追踪+编译优化（组件级更新）→ React=状态驱动+Fiber 可中断 → Diff/复用路径不同 → 选型看场景。

---

## 核心原理

### 1. 为什么要对比「更新模型」

面试官很少要你背 API 清单，而是看你能否说清：

```text
数据怎么变
  → 框架怎么知道要更新谁
  → 怎么算差异
  → 怎么落到 DOM
  → 开发者要补什么优化
```

两条路径都能做成大应用；差异在默认成本与控制点。

---

### 2. 整体对照链路

| 步骤 | Vue | React |
| --- | --- | --- |
| 触发 | 改响应式数据 → trigger | `setState` / props / context |
| 知道更新谁 | 依赖收集到组件 render effect | 从触发 Fiber 向子树再 render（可 bailout） |
| 算差异 | VNode patch（常带编译提示） | Fiber reconcile + Diff |
| 提交 | patch 到 DOM | Commit 消费 flags |
| 调度 | job queue（多为同步组件更新） | Scheduler + Lane，Render 可中断 |

---

### 3. 响应式 vs 状态驱动

**Vue（可变 + 自动追踪）**

```js
state.count++ // 写入触发依赖了 count 的 effect
```

**React（不可变习惯 + 显式触发）**

```jsx
setState(prev => ({ ...prev, count: prev.count + 1 }))
```

| | Vue | React |
| --- | --- | --- |
| 「谁要更新」 | 框架大致知道 | 开发者用结构 / memo 收缩 |
| 默认手感 | 下限稳 | 更可预测的「显式数据流」 |
| 典型代价 | 代理与追踪成本；大对象要 shallow / markRaw | 子树易连带渲染；要会拆状态 |

面试可用但不绝对的概括：

> Vue 下限高；React 上限与控制力高——前提是团队真的会管渲染范围。

---

### 4. 模板 vs JSX

| | Vue 模板 | React JSX |
| --- | --- | --- |
| 优化 | 编译期可静态分析 | 主要靠运行时 + 人工 memo（编译器优化在演进，但心智仍偏运行时） |
| 表达力 | 约束强、风格统一 | 就是 JS，组合灵活 |
| 类型 | 很好，但路径与 JSX 不同 | TS 与 JSX 结合成熟 |

不是「模板落后」：约束换来了编译信息。也不是「JSX 一定更快」：灵活意味着优化责任更多在人。

---

### 5. Diff 差异（点到关键因果）

| 维度 | Vue 3 | React |
| --- | --- | --- |
| 乱序中段 | 常用 LIS，偏向少 DOM 移动 | `lastPlacedIndex` 贪心，不保证最少移动 |
| 与架构关系 | 多在同步 patch 路径 | Diff 在可中断 Render，只打 flags |
| 前置过滤 | patchFlag 等减少进 Diff 的工作 | 靠 bailout / memo 少进子树 |

完整 Trace 见 [Vue Diff](/md/框架/Vue/Vue%20Diff算法.md)、[React Diff](/md/框架/React/React%20Diff算法.md)。

---

### 6. 逻辑复用：Composable vs Hooks

写法很像，机制不同：

| | Vue Composable | React Hook |
| --- | --- | --- |
| 状态载体 | `ref` / `reactive` | Hook 链表上的快照 state |
| 能否放进 if | 可以（仍要注意 effect 生命周期） | **顶层调用**，依赖顺序 |
| 心智 | 依赖自动追踪 | 每轮 render 新闭包 |

---

### 7. 状态管理与性能优化思路

| | Vue（如 Pinia） | React（Redux / Zustand） |
| --- | --- | --- |
| 订阅 | 天然贴近响应式 | selector / `useSyncExternalStore` |
| 写法 | 常直接改 store 字段 | 不可变更新更常见 |

优化：

- Vue：多数场景少手动优化；大列表、第三方实例、极端热路径再处理。
- React：先问渲染范围（状态下沉、拆组件），再 `memo` / 稳定引用，再用 transition；不要一上来包满 `useMemo`。

---

### 8. 选型与设计取舍

| 更偏 Vue | 更偏 React |
| --- | --- |
| 中后台、强约定、快速交付 | 复杂交互、跨平台、RN / Next |
| 希望官方全家桶路径清晰 | 接受社区选型换灵活度 |
| 国内小程序 / uni-app 等 | 国际化团队与 React 生态岗 |

取舍一句话：Vue 把更多「谁该更新」收进框架；React 把更多控制权留给运行时调度与显式结构。

---

## 常见误区

### ❌ Vue 一定比 React 快 / React 一定更先进

### ✅ 更准确的说法

默认成本曲线不同；真实瓶颈常在业务与列表策略。先进与否看问题匹配。

### 为什么？

绝对化是面试减分项。

---

### ❌ Vue 是逐属性改 DOM 的极细粒度更新

### ✅ 更准确的说法

依赖按属性收集，但常见结果是组件 render effect 重跑再 patch；不是 Solid 模型。

### 为什么？

「细粒度」说满了，追问组件更新单元时容易崩。

---

### ❌ React 每次 setState 必然整页 Diff

### ✅ 更准确的说法

从触发点向子树再 render；可通过 bailout、`memo`、状态下沉缩小范围。Diff 也在子节点层，不是无脑整站。

### 为什么？

和渲染原理专文一致，避免恐吓式表述。

---

### ❌ Hooks 和 Composable 完全一样

### ✅ 更准确的说法

复用形态像；React 有调用顺序规则与快照闭包，Vue 靠响应式。

### 为什么？

这是对比题里最容易露出「只背过表」的点。

---

### ❌ 有 Fiber 的 React 就不需要 memo

### ✅ 更准确的说法

Fiber 解决可中断与优先级，不自动追踪字段依赖；范围控制仍常要显式做。

### 为什么？

调度 ≠ 依赖追踪。

---

## 高频追问

### Vue 和 React 最本质的区别是什么？

更新模型：Vue 用依赖追踪驱动组件更新并善用编译优化；React 用显式状态更新驱动再 reconcile，并强调可调度运行时。

### 为什么说 Vue 下限高、React 上限高？

Vue 默认少做无效工作；React 显式控制空间大，但也更容易因结构不当导致多余渲染——上限取决于团队能力。

### Diff 有何不同？为什么 React 不追求最少移动？

Vue 3 中段常 LIS；React 贪心打 Placement，优先简单与可中断 Render 模型。目标是常见 UI 下接近线性复用，不是通用最小编辑距离。

### 为什么 React Hook 不能进 if，Vue composable 可以？

Hook 身份=调用顺序；Vue 状态活在响应式对象上，不靠「第几次调用 useState」。

### 什么时候选谁？

看团队栈、交付节奏、交互复杂度、跨平台与生态，而不是论坛战队。

### React 18 并发能抹平和 Vue 的性能观感差吗？

能改善「大更新堵输入」，不自动消灭多余子树渲染；该拆状态、该虚拟列表仍要做。

---

## 延伸阅读

- [Vue 3 响应式原理](/md/框架/Vue/vue3响应式原理.md)
- [Vue 渲染原理](/md/框架/Vue/Vue%20渲染原理.md)
- [React 渲染原理](/md/框架/React/React%20渲染原理.md)
- [React Fiber 架构](/md/框架/React/Fiber架构.md)
- [React Diff 算法](/md/框架/React/React%20Diff算法.md)
- [Vue Diff 算法](/md/框架/Vue/Vue%20Diff算法.md)
- [框架开放性面试题](/md/框架/框架开放性面试题.md)
- [面试速记：React & Vue](/md/面试准备/技术/React%20&%20Vue.md)
