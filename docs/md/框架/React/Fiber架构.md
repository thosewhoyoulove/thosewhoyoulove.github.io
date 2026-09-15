# React Fiber 架构

## 面试回答

> Fiber 解决的核心问题，是 React 15 那种「一旦开始协调就很难停」的同步递归模型。大组件树更新时，主线程会被长时间占满，输入和动画就会卡。React 16 引入 Fiber，本质是把协调改成「可拆分、可保存现场」的工作循环。
>
> Fiber 可以理解为组件在 React 运行时对应的工作单元。UI 在逻辑上仍然是树，每个 Fiber 通过 `child`、`sibling`、`return` 指针表达父子兄弟关系，同时保存 state、更新队列、优先级和副作用标记等信息。因此 Fiber 不是简单的虚拟 DOM，也不是把整棵树拍平成一条链表，而是用可持久化的数据结构表示组件树和执行现场。
>
> 真正执行时，React 不再依靠一次递归调用完成整棵树，而是通过工作循环逐个处理 Fiber。`performUnitOfWork` 调用 `beginWork` 向下处理组件并返回 child；没有 child 后，`completeUnitOfWork` 会调用 `completeWork` 向上归并，再寻找 sibling 或继续返回 parent。下一个待处理节点保存在 Fiber 指针和 `workInProgress` 变量中，而不是只能依赖 JS 调用栈，所以并发 Render 可以在工作单元之间检查是否应该让出主线程，之后继续执行；如果更高优先级更新到来，也可能放弃未提交结果并重新计算。
>
> Fiber 还通过双缓冲保证中断安全：`current` Tree 对应当前已提交的页面，`workInProgress` Tree 是正在计算的下一版。Render 在 workInProgress 上进行，可以暂停、继续、重做或丢弃；用户仍然看到 current 对应的完整界面。Render 完成后得到 `finishedWork`，Commit 再把变更同步到宿主视图，并将 `root.current` 切换到新树。因此可中断的是计算过程，不是已经开始的用户可见提交。
>
> 这里还要分清三者的职责：Fiber 决定「工作怎么拆、现场存在哪」，Lane 决定「哪些更新更优先、哪些进入本轮」，Scheduler 决定「任务何时获得执行机会、时间片用完是否让出」。Fiber 配合 Lane 和 Scheduler，才为时间切片、`startTransition` 和并发更新提供基础；但同步更新、`flushSync` 或过期工作仍可能一次完成，并不是有了 Fiber，所有更新就都会异步或被切片。

**一句话总结：**

> Fiber 把同步递归协调改造成可保存现场的工作循环：`beginWork` 向下、`completeWork` 向上，Lane 选择本轮更新，Scheduler 协调执行时机，双缓冲保证 Render 可中断而已提交界面保持一致。

---

## 核心原理

### 1. 为什么需要这个机制

React 15 及以前的协调（Stack Reconciler）大致是递归调用：从根往下比，进入子树就一路走到底。问题不在「递归写法丑」，而在：

| 旧模型特征 | 带来什么后果 |
| --- | --- |
| 一次更新尽量一口气做完 | 大树时主线程长时间被 JS 占满 |
| 中途很难保存「做到哪了」 | 浏览器来不及处理输入、动画、滚动 |
| 优先级表达弱 | 紧急交互和普通渲染挤在同一条同步路上 |

没有 Fiber，时间切片、可中断 Render、高优先级插队都缺底座：你没法在「算差异」的中途安全停下来，因为现场不好存，也不好恢复。

Fiber 要同时回答三件事：

1. 工作怎么切成小段？
2. 切完之后现场存在哪？
3. 谁决定什么时候继续、谁更优先？

---

### 2. 整体执行链路

先分清对象和阶段：

| 概念 | 解决什么问题 |
| --- | --- |
| React Element | 这次 UI 描述成什么样（不可变） |
| Fiber | 这个节点的工作单元：关系、state、更新队列、flags、lanes |
| DOM Node | 浏览器真实节点；Render 可准备实例，已提交页面主要在 Commit 修改 |
| Scheduler | 这段工作何时执行、是否让出主线程 |
| Lane | 哪个更新集合更优先、会不会过期 |

主链路：

```text
setState / dispatch
  → 创建 update 并分配 Lane
  → 将 Lane 沿 Fiber 路径标记到 FiberRoot
  → Root 选择下一批 Lanes
  → 同步执行，或通过 Scheduler 安排并发任务
  → Render：从根构建 / 复用 workInProgress Fiber
       ├─ performUnitOfWork
       ├─ beginWork：向下处理组件，reconcile children
       └─ completeUnitOfWork / completeWork：向上归并 flags
  → 没时间时让出；高优先级到来时可能重做或丢弃未提交 wip
  → Render 完成，得到 finishedWork
  → Commit：同步修改用户可见视图
       → root.current 切换到新树
       → 处理 layout 相关逻辑
  → passive effect 在提交后另行处理
```

父组件带来的 props 变化、Context 传播等同样可能让 Fiber 进入本轮 Render，但不宜全部简化成「都像 `setState` 一样创建 update」。

读者定位口诀：

- 当前在 **Render** 还是 **Commit**？
- 手里拿的是 **Element**、**Fiber** 还是 **DOM**？
- 决定时机的是 **Scheduler**，决定优先级的是 **Lane**。

---

### 3. Fiber 节点：树关系 + 工作现场

可以把单个 Fiber 理解成「这个组件 / 宿主节点在运行时的档案袋」：

| 字段（常见） | 白话 | 为什么需要 |
| --- | --- | --- |
| `type` | 是什么类型（`div` / 函数组件 / …） | Diff 认身份的第一关 |
| `key` | 列表身份 | 同层复用时认人 |
| `stateNode` | DOM 或类组件实例 | Commit 时找到宿主对象 |
| `child` / `sibling` / `return` | 第一个孩子 / 下一个兄弟 / 父节点 | 把树变成可迭代遍历 |
| `memoizedProps` / `memoizedState` | 上次提交后的 props / state | 对比与 Hooks 链表挂载点 |
| `updateQueue` | 待处理更新 | 中断后更新不丢 |
| `lanes` / `childLanes` | 本节点 / 子树还有哪些优先级工作 | 决定要不要继续往下算 |
| `flags` / `subtreeFlags` | 本节点 / 子树要提交的副作用 | Render 记账，Commit 消费 |
| `alternate` | 指向另一棵树上的对应 Fiber | 双缓冲成对出现 |

#### 为什么是「指针表达的树」，不是「整棵树变成一条链表」

逻辑结构仍是树：一个父节点可以有多个孩子。实现上，孩子之间用 `sibling` 串起来，父通过 `child` 找到长子，孩子通过 `return` 回到父。工作循环类似：

```text
有 child → 先处理 child
否则有 sibling → 处理 sibling
否则 return 回父节点继续 complete
```

这样每处理完一个 Fiber，都可以问 Scheduler：「这帧还有时间吗？」——递归调用栈做不到这种细粒度让出。

#### 最小 Trace：三个 Fiber 怎么走

假设树是：

```text
App
├─ Header
└─ List
```

指针关系：

| Fiber | child | sibling | return |
| --- | --- | --- | --- |
| App | Header | null | HostRoot… |
| Header | null | List | App |
| List | null | null | App |

推进顺序直觉：

```text
App（begin）
  → Header（begin → complete）
  → List（begin → complete）
→ App（complete）
```

每完成一个单元，都可以检查是否让出；递归版则是「进了 App 就很难在 Header 和 List 之间把主线程还给浏览器」。

---

### 4. 工作循环：Fiber 为什么能够中断

Fiber 解决的不是「递归语法性能差」，而是递归调用栈不适合作为一份可由 React 自主管理的执行现场。旧模型一旦进入深层递归，React 很难在任意组件边界暂停，把控制权还给浏览器，再从原位置继续。

Fiber 把遍历改造成 React 自己控制的循环。概念链路可以记成：

```text
workLoopConcurrent
  → performUnitOfWork(workInProgress)
      → beginWork：处理当前 Fiber
      → 有 child：child 成为下一个 workInProgress
      → 没有 child：completeUnitOfWork
          → completeWork：完成并向上归并
          → 有 sibling：转向 sibling
          → 没有 sibling：继续 return 到 parent
```

并发工作循环会在 Fiber 单元之间检查是否应该让出执行权。让出时，当前节点和已经完成的结果仍保存在堆上的 Fiber 结构及相关变量中，JS 调用栈可以退出；后续获得执行机会时再从尚未完成的位置推进。

这里的「中断」至少有两种情况：

| 情况 | 后续处理 |
| --- | --- |
| 当前时间片用完，主动让出 | 通常保留当前进度，之后继续 |
| 更高优先级更新到来 | 当前结果可能失效，从合适的位置重算或放弃未提交 wip |

因此不要把「可恢复」理解成每次都保证从完全相同的指令位置继续。React 保存的是可重新推进的 Fiber 工作现场，不是冻结整个 JavaScript 调用栈。

---

### 5. 双缓冲：`current` 与 `workInProgress`

| 树 | 含义 |
| --- | --- |
| `current` | 上次 Commit 成功、与当前屏幕一致的 Fiber 树 |
| `workInProgress`（wip） | 本轮正在计算的下一棵树 |

`fiber.alternate` 指向另一棵上的对偶节点。Render 在 wip 上计算；完成后得到 `finishedWork`。Commit 修改宿主视图，并通过 `root.current = finishedWork` 让新树成为 current；旧树的节点可在下一次更新中作为 alternate 被复用。

这对「可中断」很关键：

- 中断或高优先级插队时，可以丢弃未完成的 wip。
- 屏幕仍由 `current` 解释，用户不会看到「算到一半的树」。
- update 挂在队列里，不是挂在「已经扔掉的那棵半成品树」上唯一副本里，所以可以重来。

为了方便理解，可把双缓冲想成「前台页 / 后台草稿」；更准确地说，是两棵 Fiber 树交替充当 current。

---

### 6. Scheduler 与 Lane：和 Fiber 如何分工

面试里最容易混的是「Fiber 自己就会调度」。

| 概念 | 一句话职责 | 不管什么 |
| --- | --- | --- |
| **Fiber** | 工作如何拆分、现场存在哪、副作用记在哪 | 不直接等价于「浏览器空闲回调」 |
| **Scheduler** | 回调何时执行、时间片用完是否让出 | 不负责 Diff 出 Placement |
| **Lane** | 哪些更新进本轮、谁更优先、谁过期 | 不是 DOM API |

记忆句：

> Fiber 提供可暂停的工作单元；Scheduler 决定现在是否执行这些单元；Lane 决定执行时带上哪些更新。

一次更新获得 Lane 后，Lane 会从源 Fiber 向祖先路径传播，最终让 FiberRoot 知道整棵树还有哪些待处理工作。Root 根据 `pendingLanes` 选择下一批 Lanes，再决定走同步路径，还是为并发工作安排 Scheduler 回调。

```text
Update 获得 Lane
  → Fiber.lanes / 祖先 childLanes 被标记
  → FiberRoot.pendingLanes 汇总待处理工作
  → 选择 nextLanes
  → 同步执行，或安排 / 调整 Scheduler callback
```

React 18 用 lane 位掩码表达优先级集合。交互更新通常更「急」；`startTransition` 打上的更新更「可打断」。若低优先级一直被高优先级打断：

1. 丢掉的是未 Commit 的 wip 树；
2. update 仍在；
3. 工作循环前会把饿太久的 lane 标成过期，本轮必须带上；
4. 过期工作往往不再时间切片让路，尽快 Commit，避免饿死。

（React 16/17 用 `expirationTime` 表达同类问题；具体超时阈值以源码为准，面试说「交互更短、transition 更长，过期会强制纳入」即可。）

---

### 7. Bailout：有 Fiber 不等于每次遍历整棵树

React 开始一轮 Render，不代表一定无条件执行所有后代组件。若一个 Fiber 的 props、state、context 没有需要处理的变化，并且它和子树的 Lane 不属于本轮工作，React 可以 bailout，复用已有结果并跳过不相关部分。

这里 `lanes` 和 `childLanes` 的作用不同：

| 字段 | 表示什么 |
| --- | --- |
| `lanes` | 当前 Fiber 自己还有哪些优先级的更新 |
| `childLanes` | 后代子树中还有哪些优先级的更新 |

即使当前组件自身可以复用，只要 `childLanes` 命中本轮 Lane，React 仍需要继续进入对应子树。反过来，如果当前节点和子树都没有本轮工作，就可以更大范围地跳过。

需要注意，bailout 是否成立还会受 props 引用、Context、组件类型、`memo` 等因素影响；不能简化成「有 Fiber 就自动只更新一个节点」。

---

### 8. 为什么 Render 可中断、Commit 不行

| 阶段 | 做什么 | 能否中断 |
| --- | --- | --- |
| Render | 跑组件、Hooks、Diff，生成 / 复用 Fiber，打 flags | 并发路径可暂停 / 继续 / 丢弃重来 |
| Commit | 按 flags 改 DOM，执行 layout 相关副作用等 | 对用户可见的提交路径需同步完成 |

原因不是「Commit 代码写死不能停」，而是一致性约束：真实 DOM 改到一半再长时间让出，用户可能看到撕裂、错位的 UI，DOM、current Tree 和生命周期观察到的状态也可能不一致。Render 可以创建或准备宿主实例，但不会把半成品变化应用到当前已提交页面，因此停下来是安全的。

因此：

- 组件 render 路径应保持纯：别在函数体里乱写副作用。
- `useLayoutEffect` 在 paint 前同步跑，属于提交期 layout 工作；`useEffect` 在提交后被安排，通常在 paint 后处理。两者都不是 Render 可中断的一部分。

---

### 9. 设计取舍与边界

| 选择 | 换到了什么 | 代价 / 边界 |
| --- | --- | --- |
| 可中断 Render | 交互更跟手，为大树更新留出让路能力 | 实现复杂；Render 可能重复执行 |
| 启发式 Diff + flags | 和调度模型契合，Commit 一次消费 | 不是理论最少 DOM 操作 |
| Lane 多优先级 | 紧急更新可插队 | 要理解 starvation / 过期 |
| 不自动细粒度依赖追踪 | JSX 灵活，心智是「状态变 → 再算 UI」 | 常需 `memo` / 状态下沉控制渲染范围 |

Fiber **提供**并发能力的基础，不等于「所有更新都会被时间切片」。同步路径、`flushSync`、过期工作等仍可能一口气做完。面试别说成「有了 Fiber，React 就一定异步」。

---

## 常见误区

### ❌ Fiber 就是虚拟 DOM / Fiber 把树变成了一条链表

### ✅ 更准确的说法

Element 是 UI 描述；Fiber 是运行时工作单元。树形父子关系还在，只是用 `child` / `sibling` / `return` 指针支持迭代式、可中断遍历。

### 为什么？

说「等于 vdom」会丢掉优先级、副作用、更新队列这些运行时职责；说「整棵树变链表」会让面试官以为没有多孩子结构，追问遍历顺序时容易崩。

---

### ❌ Fiber 自己完成了调度；有 Fiber 就一定时间切片

### ✅ 更准确的说法

Fiber 提供可拆分的工作与现场；**何时执行**看 Scheduler，**哪些更新一起做**看 Lane。很多更新仍可能同步完成。

### 为什么？

把「基础能力」说成「一定发生」，追问 `flushSync`、过期 lane、Legacy 模式时会露馅。

---

### ❌ Render 被打断时，DOM 会停在改到一半的状态

### ✅ 更准确的说法

Render 默认不改已上屏 DOM；半截进度在内存里的 wip。真正改 DOM 在 Commit，且提交路径按同步语义推进。

### 为什么？

Render / Commit 混淆是 Fiber 题最常见翻车点。

---

### ❌ 低优先级被高优先级打断，更新就丢了 / 一定会饿死

### ✅ 更准确的说法

丢掉的是未提交的 wip 树；update 还在队列。lane 过期后会强制纳入，避免无限饿死。

### 为什么？

双缓冲 + 更新队列 + 过期机制是一条因果链，缺一环都会说错。

---

### ❌ Lane 就是 Scheduler，flags 就是立刻操作 DOM

### ✅ 更准确的说法

Lane 描述更新优先级集合；Scheduler 管任务时机；flags 是 Render 打的账，Commit 才消费。

### 为什么？

术语堆在一起却说不清职责，面试官会认定「背过名词」。

---

## 高频追问

### Fiber 到底解决了什么问题？

让协调从「难中断的同步递归」变成「可拆分的工作循环」，从而支持在 Render 阶段让出主线程，并为优先级更新、并发特征提供底座。

### 为什么用 child / sibling / return，而不是继续递归？

递归依赖调用栈，栈帧不方便在任意子节点边界把主线程还给浏览器。指针迭代可以每完成一个 Fiber 就检查调度条件，并把「下一个要做的单元」存在 `nextUnitOfWork` 这类变量里。

### Fiber 工作循环具体怎么走？

工作循环反复调用 `performUnitOfWork`。`beginWork` 处理当前 Fiber 并优先返回 child；没有 child 时进入 `completeUnitOfWork`，调用 `completeWork` 向上归并。如果存在 sibling 就转向 sibling，否则继续沿 `return` 回到父节点。并发循环可以在单元之间通过 `shouldYield` 一类判断让出执行权。

### Fiber、Scheduler、Lane 分别做什么？

Fiber：拆分工作、保存现场、挂 state / flags。Scheduler：何时跑、是否让出。Lane：哪些更新优先、是否过期。三者一起才构成「可调度的更新」。

### 什么是双缓冲？中断时为什么能丢 wip？

`current` 对应当前屏幕；`wip` 是草稿。未 Commit 的草稿丢掉不影响已上屏树；update 仍在队列，可重新开一轮 Render。

### React 有 Fiber 后，每次更新还会遍历整棵树吗？

不一定。若当前 Fiber 没有本轮 Lane 对应的更新，props、state、context 等也允许复用，并且 `childLanes` 表明子树没有本轮工作，React 可以 bailout。若当前节点自身能复用但 `childLanes` 命中，仍要继续进入相关子树。

### 为什么 Render 可中断、Commit 不行？

Render 只计算 Fiber 与 flags；Commit 改真实 DOM。DOM 改到一半会让用户看到不一致 UI，所以提交路径要同步完成。

### 低优先级一直被打断会怎样？

不会靠「扔掉 update」解决。wip 可丢，update 保留；饿太久的 lane 会被标过期并纳入本轮，尽快 Commit。Idle 一类特殊优先级另有策略。

### Fiber 和 React Element 有什么区别？

Element 是一次 render 产出的不可变描述；Fiber 是长期存在的运行时节点，承载关系、状态、更新与副作用。Diff / 调度操作的是 Fiber，不是把 Element 直接当成工作单元。

### 有了 Fiber，是不是所有 setState 都异步、都会切片？

不是。Fiber 提供能力，不保证每次都切片。批处理、优先级、是否同步刷新（如 `flushSync`）、是否过期，都会影响实际行为。更准确的说法是：更新进入调度，再经 Render / Commit，而不是「setState 立刻改 DOM」。

---

## 延伸阅读

- [React 渲染原理](/md/框架/React/React%20渲染原理.md)
- [React Diff 算法](/md/框架/React/React%20Diff算法.md)
- [React Hooks](/md/框架/React/Hooks.md)
- [Vue vs React](/md/框架/Vue%20vs%20React.md)
- [面试速记：React & Vue](/md/面试准备/技术/React%20&%20Vue.md)
- [高频追问清单](/md/面试准备/高频追问清单.md)
