# React Fiber 架构

## 面试回答

> Fiber 解决的核心问题，是 React 15 那种「一旦开始协调就很难停」的同步递归模型。大组件树更新时，主线程会被长时间占满，输入和动画就会卡。React 16 引入 Fiber，本质是把协调改成「可拆分、可保存现场」的工作循环。
>
> 为了方便理解，可以说 Fiber 把组件树变成了可逐个处理的工作单元。更准确地说：UI 在逻辑上仍是树，每个 Fiber 用 `child` / `sibling` / `return` 指针表达父子兄弟关系；工作循环按这些指针迭代推进，做完一个单元就能检查要不要让出主线程。所以它不是「树消失、只剩一条链表」，而是「用链表指针把树的遍历改成可中断的迭代」。
>
> 这里要分清三件事：Fiber 负责工作如何拆分、如何挂状态和副作用、如何保存执行现场；Scheduler 负责这段工作什么时候跑、有没有时间继续；Lane 负责这次更新相对其他更新的优先级。一句话记：Fiber 管「怎么拆和怎么存」，Scheduler 管「何时做」，Lane 管「先做谁」。
>
> 运行时还有双缓冲：`current` 树对应已上屏结果，`workInProgress` 是正在算的下一棵。Render 阶段只构建 / 复用 Fiber、打 flags，可以暂停、恢复，甚至丢掉未提交的 wip，再从 update 队列重来；Commit 阶段才改真实 DOM，必须同步推进，否则界面会不一致。所以 Fiber 让「计算」可中断，不是让「DOM 突变」可中断。低优先级一直被打断也不会无限饿死：update 还在队列里，lane 过期后会强制纳入本轮。
>
> 总结一句：Fiber 是可调度协调的底座——树形关系用指针表达，工作按单元推进，配合 Scheduler 和 Lane，才有时间切片、`startTransition`、并发更新这些能力。

**一句话总结：**

> 同步递归卡顿 → Fiber 工作单元保存现场 → Scheduler 决定何时做 → Lane 决定先做谁 → Render 可中断 / Commit 同步提交。

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
| DOM Node | 浏览器真实节点（Commit 才动） |
| Scheduler | 这段工作何时执行、是否让出主线程 |
| Lane | 哪个更新集合更优先、会不会过期 |

主链路：

```text
setState / props / context
  → 创建 update，写入 Fiber.updateQueue
  → 给相关 Fiber 标 lanes，冒泡到根
  → Scheduler 调度回调
  → Render：从根构建 / 复用 workInProgress Fiber
       ├─ beginWork：处理当前 Fiber，reconcile children
       └─ completeWork：回溯，合并 flags
  →（可中断：没时间 / 有更高优 → 暂停或丢弃 wip）
  → Commit：同步按 flags 改 DOM，跑 layout / passive effect
  → current 指针切到新树
```

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

### 4. 双缓冲：`current` 与 `workInProgress`

| 树 | 含义 |
| --- | --- |
| `current` | 上次 Commit 成功、与当前屏幕一致的 Fiber 树 |
| `workInProgress`（wip） | 本轮正在计算的下一棵树 |

`fiber.alternate` 指向另一棵上的对偶节点。Render 在 wip 上算；成功 Commit 后，根上的 `current` 指针切换，上一棵变成下次的对照基线。

这对「可中断」很关键：

- 中断或高优先级插队时，可以丢弃未完成的 wip。
- 屏幕仍由 `current` 解释，用户不会看到「算到一半的树」。
- update 挂在队列里，不是挂在「已经扔掉的那棵半成品树」上唯一副本里，所以可以重来。

为了方便理解，可把双缓冲想成「前台页 / 后台草稿」；更准确地说，是两棵 Fiber 树交替充当 current。

---

### 5. Scheduler 与 Lane：和 Fiber 如何分工

面试里最容易混的是「Fiber 自己就会调度」。

| 概念 | 一句话职责 | 不管什么 |
| --- | --- | --- |
| **Fiber** | 工作如何拆分、现场存在哪、副作用记在哪 | 不直接等价于「浏览器空闲回调」 |
| **Scheduler** | 回调何时执行、时间片用完是否让出 | 不负责 Diff 出 Placement |
| **Lane** | 哪些更新进本轮、谁更优先、谁过期 | 不是 DOM API |

记忆句：

> Fiber 提供可暂停的工作单元；Scheduler 决定现在是否执行这些单元；Lane 决定执行时带上哪些更新。

React 18 用 lane 位掩码表达优先级集合。交互更新通常更「急」；`startTransition` 打上的更新更「可打断」。若低优先级一直被高优先级打断：

1. 丢掉的是未 Commit 的 wip 树；
2. update 仍在；
3. 工作循环前会把饿太久的 lane 标成过期，本轮必须带上；
4. 过期工作往往不再时间切片让路，尽快 Commit，避免饿死。

（React 16/17 用 `expirationTime` 表达同类问题；具体超时阈值以源码为准，面试说「交互更短、transition 更长，过期会强制纳入」即可。）

---

### 6. 为什么 Render 可中断、Commit 不行

| 阶段 | 做什么 | 能否中断 |
| --- | --- | --- |
| Render | 跑组件、Hooks、Diff，生成 / 复用 Fiber，打 flags | 可以暂停 / 丢弃重来 |
| Commit | 按 flags 改 DOM，执行 layout 相关副作用等 | 对用户可见的提交路径需同步完成 |

原因不是「Commit 代码写死不能停」，而是产品约束：真实 DOM 改到一半再让出，用户会看到撕裂、错位的 UI。Render 只动内存里的 Fiber 和标记，停下来是安全的。

因此：

- 组件 render 路径应保持纯：别在函数体里乱写副作用。
- `useLayoutEffect` 在 paint 前同步跑，仍属「提交相关」；`useEffect` 更靠后，调度语义不同，但都不是「Render 中断」的同义词。

---

### 7. 设计取舍与边界

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

### Fiber、Scheduler、Lane 分别做什么？

Fiber：拆分工作、保存现场、挂 state / flags。Scheduler：何时跑、是否让出。Lane：哪些更新优先、是否过期。三者一起才构成「可调度的更新」。

### 什么是双缓冲？中断时为什么能丢 wip？

`current` 对应当前屏幕；`wip` 是草稿。未 Commit 的草稿丢掉不影响已上屏树；update 仍在队列，可重新开一轮 Render。

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
