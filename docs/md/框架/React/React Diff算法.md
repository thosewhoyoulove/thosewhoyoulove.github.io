# React Diff 算法

## 面试定位

React Diff 题考的不是「虚拟 DOM 比真实 DOM 快」，而是 **reconciliation 里子节点怎么对上号**。面试官想听：比较发生在 Element / Fiber 层、结果只打 flags、commit 才改已上屏的 DOM。追问通常会落到 `key`、列表移动、以及和 Vue 3 LIS 的差别。

常见误区：把 Diff 说成直接改 DOM；把 `mount` 理解成「第一次 `render` 整棵树都不打 Placement」；把 `Placement` 说成「相对前移」；把没写 `key` 理解成「第二轮才按下标认人」。

深度实现对应 Fiber reconciler 的 `ChildReconciler`（React 16+）。教学实现会省略 Fragment / Portal 等，机制与官方同源。

## 面试回答

> React Diff 是 render 阶段 reconciliation 的一部分，发生在 Fiber 层，不直接改已上屏的 DOM。完整树编辑距离太贵，所以只做同层比较：type 不同就整棵子树替换；同层列表先用 key 对位，再用 type 决定能不能复用 DOM。具体落在 `ChildReconciler`：新 children 是文本、单个元素还是数组，走不同路径。单元素会沿旧 sibling 链表找相同 key+type；数组先按下标试探，某一边走完就纯增或纯删，两边都剩再把旧节点放进 Map 按 key 匹配。移动不是 LIS，只用 `lastPlacedIndex` 做贪心：就地留下的旧下标必须单调不减，回退了就打 Placement，commit 时再 `insertBefore` / `appendChild`。删除名单挂在父 Fiber 的 `deletions` 上，打的是 `ChildDeletion`。

一句话总结：

> React Diff = 同层启发式 + `ChildReconciler`（单节点扫链表 / 数组下标再 Map）+ `lastPlacedIndex` 贪心移动，commit 时才改已挂载的 DOM。

---

## 核心原理

输入输出是两条链，不是两棵任意树：

```text
旧：current.child → sibling → sibling → null
新：nextChildren（文本 / 单个 Element / 数组）
出：wip.child    → sibling → sibling → null

这一层只改 Fiber 指针和 flags：
  Placement     → 要插入，或列表里相对锚点失序、需要再插一次
  ChildDeletion → 父节点 deletions[] 记下要摘掉的旧孩子
```

调用链：

```text
beginWork
  → 取出 nextChildren（函数组件要先执行）
  → reconcileChildren
       current == null → mountChildFibers（不记账）
       current != null → reconcileChildFibers（记账）
  → 结果接到 wip.child

completeWork（新建 Host）
  → createInstance
  → appendAllChildren（把子孙 DOM 接到这个新实例上，此时还不一定在文档里）

commit Mutation
  → 先按父节点 deletions 删除
  → 再处理 Placement / Update
```

三条启发式把复杂度从树编辑距离降到接近 O(n)：

| 规则 | 含义 | 代价 |
| --- | --- | --- |
| 不同类型直接替换 | `div` 变 `span`，旧节点连同子树卸载重建 | 不会尝试「改标签名、保住子树」 |
| 只做同层比较 | 不检测跨父节点移动 | 跨层搬迁 = 删旧 + 建新，state 丢失 |
| key 标识身份 | 同层列表用稳定 key 认人 | 没写 key 时按位置复用，重排会错位 |

---

## 1. 工厂：`shouldTrackSideEffects` 在管什么

`ChildReconciler` 是工厂，闭包固定一个布尔值，产出两套函数：

| 导出 | 开关 | 何时选用 |
| --- | --- | --- |
| `mountChildFibers` | `false` | **当前这个 Fiber 没有 `current`** |
| `reconcileChildFibers` | `true` | **当前这个 Fiber 已有 `current`** |

`false` 时删除和 Placement 都变成空操作，但 Fiber 链表照样建，`index` 也会写上。第一次更新时旧节点才有正确下标可对。

`true` 时只记账，仍然不改已上屏 DOM：要删的孩子挂到**父节点** `deletions[]`，父节点打 `ChildDeletion`；要插或要挪的孩子自己打 `Placement`。

不要说成「第一次 `root.render` 整棵树都不打 Placement」。`createRoot` 时 HostRoot 已经有 `current`，第一次 `render(<App />)`：

- HostRoot 走 **update 调和**，`<App />` 新建且 `alternate == null`，**会打 Placement**，commit 时插进容器。
- `App` 自己没有 `current`，它的孩子走 `mountChildFibers`，不打 Placement。
- 新建 `div` 在 `completeWork` 里创建 DOM，再用 `appendAllChildren` 把子孙接到这个 `div` 上。

真正「免 Placement、由 completeWork 往父实例上 append」的，是**某个新建 Host 节点的子树**，不是整棵应用的每一个节点。

---

## 2. 入口只看新 children 的形态

分流依据是**新的** `nextChildren`，不是旧树长什么样：

| 新 children | 路径 |
| --- | --- |
| `string` / `number` | `reconcileSingleTextNode`，再 `placeSingleChild` |
| 单个 ReactElement | `reconcileSingleElement`，再 `placeSingleChild` |
| 数组 | `reconcileChildrenArray`（内部 `placeChild`） |
| `null` / `false` / `undefined` | 旧孩子全记删除，返回 `null` |

旧的是一条 sibling 链表、新的是单个元素，也会走单元素路径：沿旧链表找能复用的，其余记删除。

`placeSingleChild` 只问有没有 `alternate`：没有就是新建，打 Placement；有就是复用，**不管挪不挪位置**。从多个孩子变成一个孩子时，靠删掉其它兄弟，让复用到的节点成为唯一孩子。位置变化是数组路径里 `placeChild` 的事。

---

## 3. 复用：先 key，再 type

两层判定，顺序不能反。

1. **key 对位**：是不是同一个人。第一轮 `updateSlot` 只做这一层，对不上返回 `null`。
2. **type 能否共用 DOM**：`div` 不能复用成 `span`。`updateElement` / `updateTextNode` 做这一层；对不上就新建，旧 Fiber 留给调用方去删。

`useFiber` 不是「同一个对象继续用」。它 `createWorkInProgress` 拿出双缓冲的另一格，`stateNode` 仍指向原来的 DOM，然后清掉 `index` / `sibling`——这两格表示在**新**链表里的位置，必须等后面的 `placeChild` 和 `sibling` 挂接再写。

`updateSlot` 返回 `null` 的含义：不是「这个新 child 丢了」，而是「**当前位置按下标已经对不上了**」。外层 `break` 之后，这个新 child 还在，后面会换方式再匹配。

第一轮里真正触发「删旧节点」的条件，也不是单纯的「type 变了」，而是：

```text
oldFiber != null && newFiber.alternate == null
```

`alternate == null` 表示这次没有克隆旧 Fiber，而是新建的。原因可能是 type 变了，也可能是旧文本对新元素这类对不上。

---

## 4. 单节点路径

新 children 是单个 `<B key="b" />`，旧链表是 `A - B - C`：

```text
取出新元素的 key = "b"
扫 A：key 不同 → deleteChild(A)，继续
扫 B：key 相同且 type 相同
      → deleteRemainingChildren(C)   // 只删 B 后面的
      → useFiber(B)，return
```

两个容易混的分支：

- **key 相同、type 不同**（旧 `<div key="x" />`，新 `<span key="x" />`）：从当前节点起整段删除，然后 `break`，不再往后找。同一个 key 在这一层只能对应一个 type。最后新建。
- **整条链都找不到**：路过的都已经 `deleteChild`，末尾新建。

单文本更窄：只看旧链表**头**是不是 `HostText`。是，就复用头、删后面兄弟；不是，旧的全删，新建文本 Fiber。它不会像单元素那样沿链表找「某一个文本」。

---

## 5. 数组路径：按控制流讲，不要先背「三轮」

`reconcileChildrenArray` 一边比较，一边把新 Fiber 接到 `previousNewFiber.sibling` 上，最后返回链表头。旧的是链表，新的是数组，产出仍是链表。

局部变量：

| 变量 | 职责 |
| --- | --- |
| `oldFiber` | 旧链表游标 |
| `newIdx` | 新数组下标 |
| `nextOldFiber` | 先存 `oldFiber.sibling`。本轮可能把 `oldFiber` 临时改成 `null`（空洞），也可能随后删除 |
| `lastPlacedIndex` | 到目前为止，**就地留下、没有打 Placement** 的那个复用节点的旧 `index`。新建和被移动的节点都不更新它 |
| `resultingFirstChild` / `previousNewFiber` | 在拼新链表 |

### 第一段 for：同一下标试探

循环条件：两边都还有。

若 `oldFiber.index > newIdx`，说明旧列表这一格曾经是空洞（`null` / `false`），后面节点 `index` 跳号。本轮当作没有旧节点，真正的旧节点放到 `nextOldFiber`，避免被吃掉。

然后 `updateSlot(旧这一格, 新这一格)`：key 对得上就继续（可能复用也可能新建）；对不上返回 `null`，**break**。

break 之后不一定立刻进 Map。源码接下来是两个 if，必须按顺序看。

### 新数组先走完

`newIdx === newChildren.length`：新列表更短，或第一轮一路对上并把新数组用完。剩下的旧节点整段删除。**不建 Map**。

例：`[A, B, C]` → `[A, B]`，下标 0、1 对上，删 C。

### 旧链表先走完

旧的没有了、新的还有：只新建，不复用。尾部追加最常见。`null` / `false` 不会变成空 Fiber，直接跳过。

### 两边都还有：剩余旧节点进 Map

只有上面两个 if 都没 return，才到这里。典型情况是第一轮某次 key 对不上。

Map 的键：有 key 用 key，没有用**旧的 `index`**。新数组剩下的每一项按 key（或下标）查找。

收尾协议：

- 复用成功（`alternate != null`）→ 从 Map 里删掉，免得收尾当成垃圾。
- type 对不上时会新建，`alternate` 仍是 `null` → 旧 Fiber **留在 Map 里**，最后一起删。
- 新列表根本没有的旧节点，同样留在 Map 里被删。

没写 key 时，第一轮和第二轮是两套规则，不能混成一句「没 key 就用下标」：

- **第一轮**：两边 `key` 都是 `null`，`null === null`，会按位置对上，**根本不会 break 去 Map**。
- **Map 轮**：没 key 的节点才用旧 `index` 当 Map 的键。

所以 `[A, B, C]` 倒序成 `[C, B, A]` 且都没写 key 时：不是在挪 DOM，而是把新 props 填进旧 Fiber。组件 state、DOM 实例都还粘在原来的下标上。这才是「列表必须写稳定 key」更精确的原因。

---

## 6. `lastPlacedIndex`：失序就再插一次，不是「前移」

判定是 `oldIndex < lastPlacedIndex`：就地留下的那串旧下标必须单调不减；一旦回退，这个节点就要从原位置摘出来再插一次。

旧 `[A0, B1, C2]`，新 `[A, C, B]`（都有稳定 key）：

```text
第一轮：A 对上；下一格 B vs C，key 不同，break
Map：{B, C}，C、B 先后按 key 复用

placeChild：
  放 A  oldIndex=0 ≥ 0  不打 Placement  lastPlacedIndex = 0
  放 C  oldIndex=2 ≥ 0  不打 Placement  lastPlacedIndex = 2   // C 成为锚点
  放 B  oldIndex=1 < 2  打 Placement    锚点仍是 2
```

B 的新位置其实是往后，不是往前。commit 时没有 Placement 的节点留在原 DOM 位置；有 Placement 的 B 已被挂在父节点里，再 `appendChild(B)` 表现为挪到末尾。最终 DOM：A, C, B。

只追加、不移动：`[A, B]` → `[A, B, D]`。旧链表先走完，D 没有 `alternate`，打 Placement，`lastPlacedIndex` 不变。

这是贪心锚点，**不是**最长递增子序列。可能比最优移动次数更多。和 Vue 3 的差别可以落在这句话上：Vue 3 乱序段求 LIS，尽量少搬 DOM；React 为了实现简单、并和可中断的 Fiber 工作循环配合，接受多搬几次。

---

## 7. 和 Vue Diff 比什么

| 维度 | React（ChildReconciler） | Vue 3（patchKeyedChildren） |
| --- | --- | --- |
| 前提 | 同层、type、key | 同样同层、type、key |
| 列表策略 | 按下标试探 → 纯增删 → 剩余进 Map | 前后预处理相同节点，中间乱序再处理 |
| 移动 | `lastPlacedIndex` 贪心，不保证最少 | LIS，尽量最少移动 |
| 编译辅助 | JSX 运行时很难静态分析 | `patchFlag` / Block Tree 可跳过静态子树 |
| 和调度的关系 | Diff 在可中断的 render 里，只打 flags | 一般同步 patch 到 DOM |

面试不要说「React Diff 更先进」或「Vue 一定更快」。React 的优势在 Fiber 可中断和优先级；Vue 的优势在编译期缩小 diff 范围，以及乱序列表更少 DOM 移动。

---

## 8. 项目里怎么用、怎么验

- **场景**（B 端列表示例）：筛选表格、会话列表、可拖拽排序。行组件内部有输入框或展开 state。
- **做法**：`key` 用业务 id，不要用 `index`。过滤、排序只改数组顺序，让 Fiber 按 key 复用，输入框不会串行。
- **验证**：排序前后在同一行继续输入，值还在；React DevTools 看组件实例有没有被卸载重建；必要时对列表更新打 performance mark，确认不是整表 DOM 重建。
- **风险**：后端临时 id、列表拼接后 id 冲突，表现为「明明写了 key 还是错位」。key 必须在**同一父节点的 children 里唯一**。

---

## 高频追问

### key 的作用是什么？

第一轮用 key 决定这一格能不能继续按下标走，对不上就放弃下标对齐。Map 里用 key（没 key 时用旧 index）把旧 Fiber 找回来。key 相同再比 type，决定复用还是新建。

### 为什么不建议用 index 做 key？

没写 key 或用 index 当 key 时，第一轮 `null === null`（或 index 碰巧相同）会按位置复用 Fiber。头部插入、删除、倒序时，新数据填进旧 Fiber，内部 state 和 DOM 粘在下标上，输入框会串行。

### Diff 和 reconciliation 是一回事吗？

不是。Diff / `ChildReconciler` 是 reconciliation 里「把新 children 对成 child 链表并打 flags」这一步。reconciliation 还包括跑组件函数、处理更新队列、生成 workInProgress Fiber。

### 删除为什么记在父节点？

commit Mutation 先看当前节点的 `ChildDeletion` 和 `deletions[]`，再递归孩子。被删子树往往已经不在 `wip.child` 链上，不挂在父节点上就会丢失。不要说成「删除 flag 打在被删节点自己身上」。

### 第一次渲染为什么有的节点有 Placement、有的没有？

看这个 Fiber 有没有 `current`，不是看是不是应用的第一次 `render`。HostRoot 第一次调和会给新建的应用根打 Placement；根下面新建 Host 的孩子们走 mount，由 `completeWork.appendAllChildren` 接到新实例上。

### React 为什么不做 LIS？

`lastPlacedIndex` 一次扫描就能标出要移动的节点，实现简单，也和「render 只打标记、commit 再插」的模型一致。代价是移动次数不一定最少。列表真的很大且频繁乱序，优先稳定 key、虚拟列表、避免无意义重排，而不是指望 Diff 算出最优搬动。

---

## 延伸阅读

- [React Fiber 架构](/md/框架/React/Fiber架构.md)
- [React 渲染原理](/md/框架/React/React%20渲染原理.md)
- [React 高频考点](/md/框架/React/React%20高频考点精讲.md)
- [Vue Diff 算法](/md/框架/Vue/Vue%20Diff算法.md)
- [Vue vs React](/md/框架/Vue%20vs%20React.md)
- [面试速记：React & Vue](/md/面试准备/技术/React%20&%20Vue.md)
- [高频追问清单](/md/面试准备/高频追问清单.md)
