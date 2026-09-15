# React 渲染原理

## 面试回答

> 调用 `setState` 或 Hooks 的 `dispatch` 后，React 不会直接操作 DOM，而是先创建一次 update，并为它分配一个 Lane。Lane 表示这次更新所属的优先级集合，不同更新并不只是按「谁先调用谁先执行」来处理。
>
> React 会把 Lane 标记到触发更新的 Fiber，并沿 `return` 链向上合并到祖先的 `childLanes`，最终找到 `FiberRoot`。Root 汇总整棵树的待处理 Lane，再选择下一批工作：同步执行，或者通过 Scheduler 安排一个具有相应优先级的任务。这里要分清：Lane 决定「哪些更新更优先」，Scheduler 协调「任务何时获得执行机会」，Fiber 则提供「工作如何拆分和保存现场」的结构。
>
> 真正开始工作后进入 Render Phase。它的核心目标不是直接改 DOM，而是**基于 current Fiber Tree 计算下一棵 workInProgress Fiber Tree**。React 以 Fiber 为工作单元，通过 `beginWork` 向下遍历：处理 update、计算新 state、执行函数组件和 Hooks，得到新的 React Element，再进入 `reconcileChildren`。
>
> Reconciliation 是新旧两棵 React 树的整个协调过程，Diff 是其中对子节点进行匹配的一部分。React 会结合 `key`、`type` 和位置判断旧 Fiber 能否复用；新增、移动、删除或属性变化不会立刻反映到页面，而是先在 Fiber 上记录 `Placement`、`Update`、`ChildDeletion` 等 flags。
>
> `beginWork` 一路向下，到叶子节点后通过 `completeWork` 向上归并，完成 Host Component 的相关处理，并把子树的 flags 汇总到父节点。最终得到完整的 `workInProgress` 树，也就是本轮的 `finishedWork`，Render Phase 到此结束。
>
> Render Phase 不会修改当前已经提交、用户正在看到的宿主视图。因为并发渲染下 Render 可能暂停、继续、重新执行，甚至丢弃尚未提交的 workInProgress；如果此时直接修改页面 DOM，用户就可能看到不一致的中间状态。这也是 React 要把「计算变化」和「应用变化」分开的原因。
>
> 接下来进入 Commit Phase。Render 可以被打断，而 Commit 的用户可见提交路径需要同步完成。Commit 大致分为 Before Mutation、Mutation 和 Layout：Before Mutation 读取更新前的 DOM 信息；Mutation 根据 flags 真正插入、更新和删除 DOM；随后 `root.current = finishedWork`，本轮 workInProgress 正式成为新的 current Tree；Layout 阶段执行 `useLayoutEffect`、`componentDidMount`、`componentDidUpdate` 等需要访问最新 DOM 的逻辑。
>
> 浏览器随后进行绘制，Passive Effect，也就是 `useEffect`，通常在绘制后异步处理。因此如果把一次更新压缩成一句话：**更新先进入 Lane 优先级体系并调度；Render Phase 基于 current Tree，通过 Reconciliation 计算出 workInProgress Tree 并记录 flags；Commit Phase 再一次性把这些变化同步到 DOM，并处理 Layout 和 Passive Effects。**
>
> Fiber 真正重要的并不是「链表结构」本身，而是它把原本难以中断的递归更新拆成了一个个可以调度、可以保存现场的工作单元，从而让 Render 具备暂停、继续、重做和按优先级处理的基础。

**一句话总结：**

> dispatch 创建 update 并分配 Lane → 向上标记到 FiberRoot → 选择 Lane 并安排工作 → Render 用 `beginWork` 向下协调、`completeWork` 向上归并，得到 `finishedWork` → Commit 消费 flags、切换 current Tree 并更新 DOM → Layout Effect → paint → Passive Effect。

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
setState / dispatch
  → 创建 Update，并分配 Lane
  → 将 Lane 从源 Fiber 向上标记到 FiberRoot
  → Root 选择下一批要处理的 Lanes
  → 同步执行，或通过 Scheduler 安排任务
  → Render Phase（可暂停 / 继续 / 重做）
       beginWork：向下处理组件和 update
         → 执行函数组件 / Hooks
         → reconcileChildren（其中包含 Diff）
         → 复用或创建 child Fiber，记录 flags
       completeWork：向上完成节点并汇总 subtreeFlags
       → 得到 finishedWork
  → Commit Phase（用户可见提交同步完成）
       Before Mutation
       → Mutation：根据 flags 修改 DOM
       → root.current = finishedWork
       → Layout：useLayoutEffect / didMount / didUpdate
  → 浏览器 paint
  → Passive Effect：useEffect（通常在 paint 后）
```

细节底座见 [Fiber 架构](/md/框架/React/Fiber架构.md)；孩子如何对齐见 [React Diff 算法](/md/框架/React/React%20Diff算法.md)。本文盯住**端到端流水线**。

---

### 3. 触发更新：Update、Lane 与 Root 调度

```jsx
setCount(count + 1)
```

同步发生的是「调用 setter」；**状态出现在下一轮 render 的快照里、DOM 随后变更**，才是调度之后的事。

最小链路：

```text
setCount
  → requestUpdateLane：选择 Lane
  → 创建 update，加入对应的更新队列
  → 将 Lane 标记到源 Fiber
  → 沿 return 链合并到祖先 childLanes
  → 找到 FiberRoot
  → scheduleUpdateOnFiber
  → ensureRootIsScheduled：比较并安排 Root 的下一批工作
```

需要注意，函数组件 Hook 有自己的更新队列，不能简单理解成所有 update 都直接放在 `Fiber.updateQueue` 字段中。面试时说「update 被加入对应 Fiber/Hooks 的更新队列」更稳妥。

#### Fiber、Lane、Scheduler 分别负责什么

| 概念 | 核心职责 | 不负责什么 |
| --- | --- | --- |
| Fiber | 把组件树表示成可逐单元处理的工作树，并保存 state、队列、flags 等现场 | 不直接表示任务优先级策略 |
| Lane | 表示更新优先级集合，决定哪些更新进入本轮 | 不负责占用或让出浏览器时间片 |
| Scheduler | 按任务优先级和时间预算协调执行机会 | 不负责 React 子节点 Diff |

Root 会根据 `pendingLanes` 选择下一批 Lane。同步更新可能直接进入同步工作路径；可并发更新则可以交给 Scheduler 安排。因此不要把所有更新都概括成「setState 后异步交给 Scheduler」。

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

### 4. Render：计算下一棵 Fiber Tree

Render 的核心产出是新的 `workInProgress` 树和 flags；完成后，这棵树会成为本轮的 `finishedWork`。

#### `beginWork`：向下展开

对函数组件，`beginWork` 会处理更新队列、得到本轮 state、调用组件函数和 Hooks，产生新的 React Element，然后通过 `reconcileChildren` 与 current Fiber 的 children 对齐。

```text
beginWork(current, workInProgress)
  → 处理本轮 Update / state
  → 执行函数组件与 Hooks
  → 得到新的 React Element
  → reconcileChildren
  → 返回下一个 child Fiber
```

#### Reconciliation 和 Diff 的关系

- **Reconciliation**：React 根据新 Element 计算下一棵 Fiber Tree 的整个协调过程；
- **Diff**：Reconciliation 中比较新旧子节点、判断复用/新增/移动/删除的算法环节；
- **flags**：Render 对未来 Commit 记下的变更账单，不代表 DOM 已经修改。

#### `completeWork`：向上归并

当一个节点没有更多 child 后，React 开始执行 `completeWork` 并沿父节点返回：

```text
叶子 Fiber
  → completeWork：完成 Host 节点相关工作
  → 汇总 children 的 subtreeFlags
  → 回到 sibling 或 parent
  → Root 完成
  → workInProgress 成为 finishedWork
```

首次挂载时，`completeWork` 可能创建尚未挂到页面上的 DOM 实例；但 Render 不会修改当前已提交、用户正在看到的宿主视图。真正把变更应用到页面发生在 Commit。

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

### 5. Commit：消费 flags 并切换 current Tree

Commit 同步推进用户可见的提交路径，大致三段：

| 子阶段 | 典型工作 |
| --- | --- |
| before mutation | 读 DOM 快照等（如 `getSnapshotBeforeUpdate`） |
| mutation | 插删改 DOM、更新文本与属性、处理部分 ref |
| layout | DOM 已更新、paint 前：`useLayoutEffect`、类组件 didMount/Update |

Mutation 完成后会发生关键切换：

```js
root.current = finishedWork
```

这表示本轮算出的 workInProgress Tree 正式成为新的 current Tree。下一次更新会以它为 current，并复用另一棵树作为新的 workInProgress，这就是 Fiber 双缓冲机制在提交阶段的落点。

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
| `useEffect` | 通常在 paint 后 | 请求、订阅、日志等非同步视觉必需 |

能 `useEffect` 就不要上 `useLayoutEffect`。

---

### 6. 为什么 Render 可中断，Commit 必须完成

Render 处理的是尚未提交的 workInProgress。React 可以在 Fiber 工作单元之间让出执行权，之后继续，也可以在出现更高优先级工作时重新计算或丢弃未提交结果。用户此时仍看到 current Tree 对应的页面。

Commit 已经开始修改用户可见的宿主视图。如果只提交一部分就长期让出，Fiber current Tree、DOM 和生命周期观察到的状态可能互相不一致。因此，Commit 的用户可见提交路径要同步完成。

这也是为什么组件 Render 逻辑必须尽量保持纯：Render 可能不止执行一次，但只有成功进入 Commit 的结果才真正生效。

---

### 7. Diff 在流水线中的位置

Diff 不是整条渲染的全部，只是 Render 里「把新 children 对齐成 child Fiber 并打 flags」的那一步。

启发式三板斧（细节与 `lastPlacedIndex` Trace 见 Diff 专文）：

1. 只比同层；
2. `type` 不同倾向于整段替换；
3. 列表用 `key` 认身份。

面试一句话：

> 渲染原理负责阶段划分；Diff 负责孩子怎么复用；Fiber 负责工作单元和可中断。

---

### 8. 与 Vue 更新模型的对照（点到为止）

| 维度 | React | Vue |
| --- | --- | --- |
| 谁先知道要更新 | 显式 `setState` 等 | 响应式 `trigger` 通知组件 effect |
| 默认范围 | 从触发点向子树再 render，靠 memo 等收缩 | 依赖收集到组件级更新为主 |
| 调度 | Fiber + Scheduler + Lane | 队列与 scheduler job，默认更偏同步组件更新 |
| 编译 | JSX 偏运行时 | 模板可静态提升 / patchFlag |

详解见 [Vue vs React](/md/框架/Vue%20vs%20React.md)、[Vue 渲染原理](/md/框架/Vue/Vue%20渲染原理.md)。

---

### 9. 设计取舍

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

dispatch 创建 update 并分配 Lane，Lane 沿 Fiber 向上标记到 Root；Root 选择下一批 Lane 并安排执行。Render 中 `beginWork` 向下协调、`completeWork` 向上归并，得到带有 flags 的 `finishedWork`；Commit 再消费 flags、切换 current Tree、更新 DOM，并处理 Layout 与 Passive Effects。

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
