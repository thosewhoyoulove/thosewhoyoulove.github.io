# React Fiber 架构

## 面试回答

> 我对 Fiber 的理解，主要分成三个层面：为什么需要 Fiber、Fiber 是怎么工作的，以及它如何支撑 React 的并发渲染。
>
> **首先，Fiber 解决的是 React 早期同步递归协调模型的局限性。**
>
> 在 React 15 的 Stack Reconciler 中，组件树的协调过程主要依赖 JavaScript 递归调用。一旦开始处理一棵组件树，就很难在中途主动暂停。
>
> 因为 JavaScript 和浏览器的渲染工作通常共享主线程，如果组件树比较庞大，一次更新占用了过长时间，就可能阻塞用户输入、动画和页面绘制。
>
> 所以 React 16 引入 Fiber，核心思路就是：**把原来连续执行的递归协调过程，改造成可以拆分、可以保存执行进度的工作循环。**
>
> **第二，Fiber 不仅是一种数据结构，也是 React 的工作单元。**
>
> 每个 Fiber 节点描述一个组件或其他 React 工作对象，并通过 `child`、`sibling`、`return` 三个指针组织成一棵便于遍历的树。
>
> 与此同时，Fiber 还会保存组件状态、更新队列、优先级信息以及副作用标记等。
>
> 这样的设计有一个很重要的意义：React 不再需要完全依赖 JavaScript 的递归调用栈来记录遍历进度，而是可以通过 Fiber 节点和工作指针保存当前执行到哪里。
>
> **第三，Fiber 的执行过程可以理解为一个深度优先遍历的工作循环。**
>
> 在 Render 阶段，React 会通过 `performUnitOfWork` 逐个处理 Fiber 节点。
>
> 其中，`beginWork` 主要负责处理当前节点、计算子节点；`completeWork` 则负责完成当前节点的相关工作，并向上归并。
>
> 整个遍历过程就是：**有子节点就向下，没有子节点就向上完成工作，再寻找兄弟节点。**
>
> 由于每次处理的是一个独立的工作单元，React 在支持并发的渲染路径中，就有机会在工作单元之间判断是否需要让出主线程。
>
> 如果时间片用完，可以暂停后继续；如果有更高优先级的更新进入，也可能放弃尚未提交的工作，重新进行计算。
>
> **另外，Fiber 还采用了双缓冲机制。**
>
> React 会维护 `current` 和 `workInProgress` 两棵 Fiber 树。
>
> `current` 对应当前已经提交的界面，`workInProgress` 用来计算下一次更新。
>
> Render 阶段可以对新树进行计算、暂停甚至重新开始，而不会直接改变当前已经提交的界面。等 Render 完成后，再进入 Commit 阶段，把计算结果提交到真实 DOM。
>
> 这里要特别强调：**React 可以中断的是并发 Render 阶段，而 Commit 阶段不会像 Render 一样被时间切片打断。**
>
> 最后，我认为理解 Fiber 还需要结合 Lane 和 Scheduler。
>
> Fiber 负责组织工作单元和保存执行进度；Lane 负责更新优先级以及本轮需要处理哪些更新；Scheduler 负责调度任务执行和让出主线程的时机。
>
> 这三部分共同支撑了 React 的并发渲染能力。
>
> 不过，**Fiber 不等于所有更新都会异步执行，也不意味着 React 变成了多线程。** 它提供的是一种可中断、可恢复的协调基础，具体能否让出主线程，还取决于当前的更新优先级和执行模式。

**一句话总结：**

> 为什么需要 Fiber，它怎么作为工作单元做深度优先的循环，以及它怎样和 Lane、Scheduler 一起撑起可中断的并发 Render。能中断的是计算，不是 Commit；也不是每次都异步，更不是多线程。

---

## 核心原理

### 为什么需要 Fiber

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

### 一次更新怎么走

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

父组件传来的 props 变化、Context 传播，也会让 Fiber 进入这一轮 Render。它们不一定都像 `setState` 那样先创建一条 update。

走到这里要能分清三件事：现在是在 Render 还是 Commit；手里的是 Element、Fiber 还是 DOM；时机归 Scheduler，优先级归 Lane。

---

### Fiber 上记着什么

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

### 工作循环为什么能停下来

Fiber 解决的不是「递归语法性能差」，而是递归调用栈不适合作为一份可由 React 自主管理的执行现场。旧模型一旦进入深层递归，React 很难在任意组件边界暂停，把控制权还给浏览器，再从原位置继续。

Fiber 把遍历改成 React 自己控制的循环：

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

### 两棵树：current 和 workInProgress

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

### Scheduler 和 Lane 各管什么

容易混成「有了 Fiber，React 自己就会调度」。

| 概念 | 一句话职责 | 不管什么 |
| --- | --- | --- |
| **Fiber** | 工作如何拆分、现场存在哪、副作用记在哪 | 不直接等价于「浏览器空闲回调」 |
| **Scheduler** | 回调何时执行、时间片用完是否让出 | 不负责 Diff 出 Placement |
| **Lane** | 哪些更新进本轮、谁更优先、谁过期 | 不是 DOM API |

> Fiber 提供可以暂停的工作单元；Scheduler 决定现在做不做；Lane 决定这一轮带上哪些更新。

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

React 16 和 17 用 `expirationTime` 表达同一类问题。超时具体多久以对应版本源码为准。面试里说清楚就够：交互更短，transition 更长，过期的工作会强制带上。

#### 并发渲染不是多线程

并发在这里的意思是：多段渲染工作在**同一条主线程**上交替推进，用户看起来更新可以重叠、可以让路。多线程或并行是另一回事：同一时刻有多条线程真的同时在算。

React 的 Render 和浏览器的点击、样式、布局抢的是渲染进程里的那条主线程。Scheduler 只在 Fiber 工作单元之间看时间片是否用完（`shouldYield` 一类判断），用完就把剩余工作排到后面的任务里，常见实现是 `MessageChannel`，避免 `setTimeout` 的 4ms 下限。细节见 [浏览器的事件循环](/md/浏览器/浏览器的事件循环.md)。

所以：

- 高优先级输入能在低优先级 Render 的间隙插进来，是因为主线程被让出来了。
- 一次 Render 不会因此用上多核，大树本身也不会算得比「一口气算完」更少 CPU。
- 不能把 Fiber 丢给 Web Worker 去改 DOM。Worker 没有页面的 DOM；就算把纯计算放出去，Commit 仍要回到主线程。

`createRoot` 才具备这条可中断路径。同步更新、`flushSync`、已经过期的 lane，仍可能不让出，直到这一轮做完。

---

### 有 Fiber，也不等于每次都走完整棵树

bailout 可以先理解成：React 发现这个 Fiber 没有必要重新执行，于是复用已有结果，能跳过的子树就跳过。它发生在 Render 的 `beginWork`，跳过的是组件函数和它下面不相关的协调，不是把已经进队列的 update 删掉。

首次挂载没有 current Fiber，不能 bailout。更新时要同时看三件事：

| 条件 | 不满足时会怎样 |
| --- | --- |
| props 允许复用 | 普通函数组件比的是 props **对象引用**（`oldProps === newProps`），不是逐字段浅比较。父组件重新执行写出的 `<Child />` 是新对象，子组件会再跑 |
| 本 Fiber 的 `lanes` 与本轮 `renderLanes` 不相交 | 相交说明自己有 `setState`，或 Context 变化被标进了 lanes，必须进去处理更新队列 |
| 子树 `childLanes` 与本轮也不相交 | 节点自己可以不执行，但子树还有本轮工作，就要克隆孩子并继续向下 |

`React.memo`（以及类组件的 `PureComponent`）改变的是第一行：默认浅比较每个 prop，相等就当成 props 没变，即使父组件传下来的是新对象。自定义 `compare` 返回 `true` 表示「相等，可以跳过」。这和类组件 `shouldComponentUpdate` 相反：后者返回 `true` 表示「要更新」。

`lanes` 和 `childLanes` 因此不是重复字段：

| 字段 | 表示什么 | 命中本轮时 |
| --- | --- | --- |
| `lanes` | 当前 Fiber 自己还有哪些优先级的更新 | 重新执行这个组件 |
| `childLanes` | 后代子树里还有哪些优先级的更新 | 自己可以跳过，仍要走进对应子树 |

都没有命中，并且 props、context 也允许复用时，才整棵跳过。源码里这段提前退出常叫 `bailoutOnAlreadyFinishedWork`：先把 Hook 链表从 current 拷到 workInProgress，再决定返回 `null`（子树也不走）还是返回 child（只继续有工作的后代）。

#### Trace：父组件点击，子组件打不打日志

```jsx
function Parent() {
  const [n, setN] = useState(0)
  return (
    <>
      <button onClick={() => setN(n + 1)}>{n}</button>
      <Child />
    </>
  )
}

function Child() {
  console.log('child')
  return <p>child</p>
}
```

点击后 `Parent` 重新执行，`<Child />` 是一次新的 Element，props 虽是空对象但是**新引用**。`Child` 没有自己的 update，仍会因为 `oldProps !== newProps` 再执行，控制台有 `child`。

把 `Child` 包进 `memo` 之后，浅比较发现没有 prop 变化，`Child` 的 `lanes` 和 `childLanes` 都不在本轮里，于是 bailout，不再打印。

再往下拆一层：`memo(Child)` 里面还有一个自己 `setState` 的孙子。`Child` 的 props 仍然可以复用，所以 `Child` 的函数可以不执行；但孙子的更新标在 `Child.childLanes` 上，React 还是要走进那棵子树。bailout 的是「这个组件函数」，不是「这个组件以下全部当没发生」。

---

### 为什么计算能停，提交不能停

| 阶段 | 做什么 | 能否中断 |
| --- | --- | --- |
| Render | 跑组件、Hooks、Diff，生成 / 复用 Fiber，打 flags | 并发路径可暂停 / 继续 / 丢弃重来 |
| Commit | 按 flags 改 DOM，执行 layout 相关副作用等 | 对用户可见的提交路径需同步完成 |

原因不是「Commit 代码写死不能停」，而是一致性约束：真实 DOM 改到一半再长时间让出，用户可能看到撕裂、错位的 UI，DOM、current Tree 和生命周期观察到的状态也可能不一致。Render 可以创建或准备宿主实例，但不会把半成品变化应用到当前已提交页面，因此停下来是安全的。

因此：

- 组件 render 路径应保持纯：别在函数体里乱写副作用。
- `useLayoutEffect` 在 paint 前同步跑，属于提交期 layout 工作；`useEffect` 在提交后被安排，通常在 paint 后处理。两者都不是 Render 可中断的一部分。

---

### 换到了什么

| 选择 | 换到了什么 | 代价 / 边界 |
| --- | --- | --- |
| 可中断 Render | 交互更跟手，为大树更新留出让路能力 | 实现复杂；Render 可能重复执行 |
| 启发式 Diff + flags | 和调度模型契合，Commit 一次消费 | 不是理论最少 DOM 操作 |
| Lane 多优先级 | 紧急更新可插队 | 要处理一直被插队，以及等太久必须做完 |
| 不自动做细粒度依赖追踪 | JSX 仍是「状态变了，再算 UI」 | 范围经常要靠 `memo` 或把状态下沉 |

Fiber 提供的是并发能力的底座。同步路径、`flushSync`、过期工作仍可能一口气做完。有 Fiber，不表示每次更新都会异步，也不表示每次都会被切开。

---

## 常见误区

把 Fiber 说成虚拟 DOM，或者把整棵树说成一条链表，都会把它多出来的职责说丢。Element 是这一次界面的描述。Fiber 会跨多次更新留下来，上面有优先级、副作用和更新队列。父子关系还在，只是用 `child`、`sibling`、`return` 串起来，循环才能停在任意一个节点。说成一条链表，一个父节点有两个孩子时先走谁，就说不清了。

Fiber 自己也不决定什么时候跑。它提供拆开的工作和现场。什么时候执行看 Scheduler，哪些更新放进一轮看 Lane。同步更新、`flushSync`、已经过期的工作，都可能一次做完。有这个能力，不表示每次都会切开。

Render 被打断时，已经显示的 DOM 不会停在改了一半的样子。半截进度在内存里的 `workInProgress` 上。真正改 DOM 在 Commit，这一段要一次做完。

低优先级被高优先级打断，丢掉的是还没提交的草稿树，不是更新本身。更新还在队列里。等得太久的 lane 会被标成过期，这一轮必须带上，所以不会永远做不上。

并发渲染也不是多线程。它是主线程上轮流做：时间片用完就让出，点击可以先处理。组件函数不会分到多条线程同时算。所以 Worker 不能代替改 DOM，`flushSync` 也仍然会把点击堵住，大树的总计算量并没有变少。

父组件重新执行，子组件默认不会跳过。父组件写出的 `<Child />` 是一个新的 Element，props 引用变了，子函数会再跑。要跳过，需要 props 没变，引用相同，或者 `memo`、`PureComponent` 认为相等，并且这个节点和它的子树都没有落在本轮 Lane 里。否则就会和「为什么还要 memo」对不上。

Lane、Scheduler、flags 也不是一件事。Lane 是更新的优先级集合，Scheduler 管任务什么时候跑，flags 是 Render 记下的账，Commit 才拿去改界面。

---

## 高频追问

### 为什么 Fiber 使用 `child`、`sibling`、`return`，而不是普通递归？

普通递归把「走到哪了」留在 JavaScript 调用栈上。函数还没返回，这一帧就出不去，React 也不能在做完一个子节点之后把主线程还给浏览器，下一次再从同一个栈帧接着走。

`child`、`sibling`、`return` 是写在 Fiber 上的三个指针：第一个孩子、下一个兄弟、父节点。下一个要处理的节点记在 `workInProgress` 里。循环每做完一个单元，调用栈可以空出来，进度还在堆上。换指针不是因为递归慢，而是调用栈没法当成一份 React 自己能暂停、再恢复的现场。

### React 在 `beginWork` 和 `completeWork` 分别做了什么？

`beginWork` 向下。它处理当前 Fiber：函数组件会在这里执行，拿到子元素，再和上一轮的孩子做协调，然后返回 child，循环继续往下走。

`completeWork` 向上。这条分支没有还要先处理的孩子时，完成当前节点。宿主节点在这里创建 DOM 实例，把已经完成的子节点在内存里挂上去，这时还不会改页面上已经显示的那一版。随后沿兄弟或父节点回去，把这一支要提交的标记归并上去。

有孩子就先 `beginWork`，整支走完才 `completeWork`。这就是深度优先：先下去，再上来。

### Fiber 什么时候能够被中断？在一个组件函数执行到一半时能中断吗？

能停的时机在两个工作单元之间，不在组件函数的半截。并发路径里，`performUnitOfWork` 做完一个 Fiber，循环才会看要不要让出。时间片用完，就把主线程还回去，下次从 `workInProgress` 继续。更高优先级的更新来了，也可以丢掉还没提交的草稿，整轮重算。

组件函数一旦被调用，这次调用会跑完。函数中间有一段很长的同步计算，React 切不进去。同步更新、`flushSync`、已经过期的 lane 走的是中间不让出的循环，单元和单元之间也不会停。

### `current` 和 `workInProgress` 两棵树是完整复制的吗？

不是一开始把整棵树深拷贝一份。每个 Fiber 用 `alternate` 指向另一棵树上的对应节点。渲染走到某个节点，才把这个节点的字段拷到对偶节点上；还没有对偶节点时才新建一个。没走到的子树仍然是原来的节点。能跳过的子树也不会为了复制一棵而再执行一遍组件。

所以双缓冲是节点成对复用，不是把整棵树克隆出来。屏幕认 `current`。没提交的 `workInProgress` 可以丢，因为已经显示的那棵还在，更新也还在队列里。

### Fiber、Lane、Scheduler 各自有什么职责？

Fiber 组织工作单元，用指针和 `workInProgress` 记住执行到哪，并挂上 state、更新队列和副作用标记。

Lane 给更新标优先级，并决定这一轮带上哪些更新。等太久的 lane 会被标成过期，这一轮必须做完。

Scheduler 决定任务现在有没有执行机会，时间片用完要不要让出主线程。让出发生在 Fiber 单元之间。

时间切片是 Scheduler 的让出策略，不是 Lane 的另一个名字，也不是多线程。

### 既然 Fiber 能中断，为什么 React 页面仍然可能卡顿？

Fiber 只让并发 Render 有机会在单元之间让出，不保证页面不会卡。

组件函数执行到一半不能切开。一个组件里如果有很长的同步计算，这一段会占满主线程。Commit 要一次改完真实 DOM，大量 DOM 更新，或者 `useLayoutEffect` 里的同步工作，也不会被时间切片打断。`flushSync`、过期的更新、旧的同步模式会整段做完，中间不让出。

就算让出了，总计算量也没有变少，只是拆开做。主线程还要处理输入、样式和布局。只要有一段长时间不交还，点击和动画仍然会卡。

---

## 延伸阅读

- [React 渲染原理](/md/框架/React/React%20渲染原理.md)
- [React Diff 算法](/md/框架/React/React%20Diff算法.md)
- [React Hooks](/md/框架/React/Hooks.md)
- [Vue vs React](/md/框架/Vue%20vs%20React.md)
- [React 19 相对 18](/md/框架/React/React%2019%20变化.md)
- [面试速记：React & Vue](/md/面试准备/技术/React%20&%20Vue.md)
- [高频追问清单](/md/面试准备/高频追问清单.md)
