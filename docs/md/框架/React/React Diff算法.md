# React Diff 算法

## 面试回答

> React 的 Diff 属于 reconciliation：组件因 props、state、context 更新后，会重新算出这一轮的 React Element，再判断它们和上一轮留下的 Fiber 之间，哪些能复用、哪些要新增、删除或移动。
>
> 通用树 Diff 太贵，所以 React 用启发式把成本压到接近 O(n)。最核心的两点是：只比较同一层级；用 type 和 key 判断身份。type 不同通常不能复用原来的 Fiber；列表里的 key 用来告诉 React，前后两次 render 里哪个孩子是同一个业务实体。
>
> 为了方便理解，可以先把 Diff 想成「比较两棵虚拟 DOM 树」。更准确地说，在 Fiber 架构下，输入是旧的 child Fiber 链表和本次的新 children，输出是一条新的 workInProgress Fiber 链表。Diff 发生在 Render 阶段：这里只复用或创建 Fiber，并打上 Placement、ChildDeletion 这类 flags，不会立刻改已上屏的 DOM；真正的 DOM 变更在 Commit 阶段完成。
>
> 单节点比较相对简单，按 key 和 type 在旧链表里找能否复用。列表更常见：先从左到右按下标试探；新列表先走完就删掉剩余旧 Fiber；旧列表先走完就创建剩余新节点；两边都还有、中间又乱序时，把剩余旧 Fiber 放进 Map（有 key 用 key，没有就用旧 index），再按新 children 去匹配，Map 里最后剩下的就是要删的。
>
> 移动不是算最少次数，而是用 `lastPlacedIndex` 做贪心：它记录到目前为止「可以保持相对顺序、没有打 Placement」的复用 Fiber 里，最大的那个旧下标。若下一个复用节点的 `oldIndex` 比它小，说明相对顺序乱了，就给这个 Fiber 打 Placement。例如旧 `[A, B, C]` 变新 `[A, C, B]`：C 的旧下标是 2，可以当锚点；B 的旧下标是 1，小于 2，于是移动的是 B。Commit 时再 `insertBefore` / `appendChild`。
>
> 所以这套算法优化的是「常见 UI 更新下，接近线性地完成 Fiber 复用」，不是理论最优 DOM 搬运。这也是 key 必须稳定的原因：没有稳定身份，React 只能按位置填 props，内部 state 和 DOM 实例就会串。

**一句话总结：**

> 同层比较 → key/type 判断 Fiber 复用 → 数组顺序扫描 → Map 匹配剩余节点 → lastPlacedIndex 判断移动 → Placement → Commit 操作 DOM。

---

## 核心原理

### 1. 为什么需要这个机制

组件每次更新都会产出新的 React Element 描述。如果没有 Diff，React 只能整棵拆掉重建，DOM 成本高，组件内部 state 也会丢。

如果做成任意两棵树的最小编辑距离，复杂度接近 O(n³)，大列表上不可接受。UI 更新又有规律：跨层搬迁少见，同层增删改和重排很常见。于是 React 用启发式：

| 启发式 | 解决什么问题 | 代价 |
| --- | --- | --- |
| 只比同层 | 把问题从「整棵树」缩成「同一父节点下的孩子列表」 | 跨父节点移动 = 删旧 + 建新 |
| type 不同直接替换 | 避免在「标签都变了」时硬保住子树 | 子树 state / DOM 一起丢掉 |
| key 标识身份 | 列表重排时仍能找回同一个业务实体对应的 Fiber | key 不稳或用 index，会按错人 |

没有 Diff，更新不可用；没有启发式，Diff 算不起。React 的选择是：在常见场景够用的前提下，保证接近 O(n)。

### 2. 整体执行链路

先分清三种对象：

| 对象 | 白话 | 在 Diff 里扮演什么 |
| --- | --- | --- |
| React Element | 这次 render 描述的「UI 长什么样」 | 新 children 的来源 |
| Fiber | React 内部工作单元，挂着类型、指针、state、flags | 旧树是 Fiber 链表；结果也是 Fiber 链表 |
| DOM Node | 浏览器真实节点 | Commit 阶段才改；Render 阶段尽量只复用 `stateNode` 指针 |

以及两个阶段：

- **Render / Reconciliation**：算差异、建/复用 Fiber、打 flags；可中断。
- **Commit**：按 flags 改 DOM、跑 layout 相关副作用；不可中断地提交到屏幕相关工作。

主链路：

```text
setState / props / context 变化
  → 调度更新
  → Render：beginWork
  → 执行组件，得到 nextChildren（React Element / 文本 / 数组）
  → reconcileChildren
       ├─ 该 Fiber 没有 current → mount（通常不记账）
       └─ 已有 current → update（记账：Placement / ChildDeletion …）
  → 输出：workInProgress.child 链表
  → Commit Mutation
       → 按父 Fiber.deletions 删除 DOM
       → 处理 Placement / Update
  → 浏览器 layout / paint
```

Diff 不是整段 reconciliation 的全部。reconciliation 还包括跑组件、处理更新队列、生成 workInProgress Fiber；Diff 特指「把新 children 对齐成 child Fiber 链表并打 flags」这一步。源码里对应 `ChildReconciler` 工厂产出的 `reconcileChildFibers` / `mountChildFibers`（React 16+ Fiber reconciler）。

这一层的输入输出：

```text
输入：旧 current.child → sibling → … → null
      新 nextChildren（文本 / 单个 Element / 数组 / null）
输出：wip.child → sibling → … → null
副作用：只改 Fiber 指针和 flags，不碰已上屏 DOM
```

### 3. 复用规则：先 key，再 type

**key** 可以先理解成：同一父节点下，给每个孩子贴的「工号」。React 在 Render 阶段读 key，用来判断「是不是同一个人」，不是用来直接命令 DOM 挪位置。

**type** 回答另一个问题：就算是同一个人，现在的工种能不能继续干。`div` 不能复用成 `span`；函数组件类型变了，一般也不能沿用旧 Fiber 上的那套实例/hooks 挂载点。

判定顺序不能反：

1. key 对位 → 认人
2. type 能否共用 → 能不能保住原来的 DOM / 组件状态

对上时，React 会 `createWorkInProgress` 拿出双缓冲的另一格 Fiber：`stateNode` 仍指向原来的 DOM（若有），再在新链表里重写 `index` / `sibling`。对不上就新建 Fiber，旧 Fiber 交给删除逻辑。

单节点例子：新 children 是单个 `<B key="b" />`，旧链表是 `A - B - C`。

```text
取新 Element 的 key = "b"
扫 A：key 不同 → 记删除 A，继续
扫 B：key 相同且 type 相同 → 复用 B，并把 B 后面的 C 整段记删除
返回复用后的 B 作为唯一 child
```

若 key 相同但 type 不同（旧 `<div key="x" />`，新 `<span key="x" />`）：从当前起整段删除，再新建——同一 key 在这一层只对应一种 type。

### 4. 列表 Diff：顺序扫描 → 纯增删 → Map

列表 Diff 的职责可以白话成：一边看新数组，一边拼一条新的 sibling 链表，尽量复用旧 Fiber。

源码入口是 `reconcileChildrenArray`：一边比较，一边把新 Fiber 挂到 `previousNewFiber.sibling` 上。旧结构是链表，新结构是数组，产出仍是链表。

控制流按四段理解：

#### （1）从左到右按下标试探

两边都还有时，拿「同一下标」上的旧 Fiber 和新 child 比 key。对得上就继续；对不上就 **break**，后面换方式匹配。

#### （2）新列表先走完 → 纯删

例如 `[A, B, C]` → `[A, B]`：下标 0、1 对上，剩余旧 Fiber 整段删除，不必建 Map。

#### （3）旧列表先走完 → 纯增

旧的没有了、新的还有：只新建。尾部追加最常见。

#### （4）两边都还有 → 剩余旧 Fiber 进 Map

典型是中间乱序、第一轮某次 key 对不上。Map 的键：有 key 用 key，没有用**旧 index**。新数组剩余项按 key（或下标）查找；复用成功的从 Map 删掉；最后留在 Map 里的记删除。

##### Trace：有稳定 key 的乱序

旧 Fiber 链表（index 写在下标上）：`A0 - B1 - C2`  
新 children：`[A, C, B]`（都有稳定 key）

| 步骤 | 动作 | 状态变化 |
| --- | --- | --- |
| 1 | 下标 0：旧 A vs 新 A，key 相同 | 复用 A，继续 |
| 2 | 下标 1：旧 B vs 新 C，key 不同 | break，进入后续分支 |
| 3 | 两边都还有 | 剩余旧 Fiber 进 Map：`{B, C}` |
| 4 | 新剩余 `[C, B]` 从 Map 按 key 取 | 复用 C，再复用 B；Map 空 |
| 5 | 对每个复用节点做 place（见下一节） | A、C 可不打 Placement；B 打 Placement |

##### 没写 key 时为什么会串状态

不要笼统说「没 key 就用下标」：

- **第一轮**：两边 key 都是 `null`，`null === null`，会按位置对上，**根本不会 break 去 Map**。
- **Map 阶段**：没 key 的节点才用旧 index 当 Map 的键。

因此 `[A, B, C]` 倒序成 `[C, B, A]` 且都没写 key 时：不是在挪 DOM，而是把新 props 填进「还停在原下标上的旧 Fiber」。行内输入框、展开 state 会粘在错误的业务行上。这才是「必须写稳定 key」更精确的原因——key 解决的是**认人**，不是性能口号。

### 5. `lastPlacedIndex`：如何判断要不要移动

#### 它是什么？

`lastPlacedIndex` 是列表 Diff 过程中的一个局部变量：到目前为止，在那些**复用成功且没有打 Placement、可以留在相对顺序里**的旧 Fiber 中，记录它们旧 `index` 的最大值。可以把它想成「当前锚点」：后面的人如果想「就地留下」，旧下标不能比锚点更靠前。

#### 为什么需要它？

没有它，React 很难在一次从左到右的扫描里，判断「这个复用节点在新顺序里是否相对前面已放置的节点失序」。它用贪心代替「求最少移动次数」的复杂计算。

#### 何时读取 / 何时更新？

- **读取**：每处理一个新位置上的 Fiber，在 `placeChild` 里拿它的 `oldIndex`（来自复用前旧 Fiber 的 `index`）和当前 `lastPlacedIndex` 比较。
- **更新**：仅当这个节点复用成功、并且判定**不需要** Placement、可以就地留下时，若 `oldIndex` 更大，就把 `lastPlacedIndex` 更新为该 `oldIndex`。
- **不更新**：新建节点、或被判定需要 Placement 的复用节点，都不推进这个锚点。

#### 判定式

```text
若 oldIndex < lastPlacedIndex → 相对顺序回退 → 打 Placement
否则 → 不打 Placement，并用 oldIndex 刷新 lastPlacedIndex（取更大）
```

**Placement** 可以先理解成：Commit 时需要把这个 DOM「再插一次」的标记。它可能是首次插入，也可能是列表里失序后的再插入。Render 阶段只打标，**不会**立刻移动 DOM。

#### Trace：`[A, B, C]` → `[A, C, B]`

假设 A、B、C 都有稳定 key，且已通过上一节的扫描 + Map 完成复用。初始 `lastPlacedIndex = 0`。

| 当前节点 | oldIndex | lastPlacedIndex（比较前） | 判断 | 结果 |
| --- | ---: | ---: | --- | --- |
| A | 0 | 0 | 0 >= 0 | 不移动；lastPlacedIndex = 0 |
| C | 2 | 0 | 2 >= 0 | 不移动；lastPlacedIndex = 2（C 成为锚点） |
| B | 1 | 2 | 1 < 2 | 打 Placement；锚点仍为 2 |

为什么 `1 < 2` 表示要移动 B？

因为已经有一个「就地留下」的节点 C，它的旧下标是 2；B 的旧下标是 1，说明在旧列表里 B 在 C 前面，但在新 children 里 B 却排在 C 后面。相对顺序变了。React 选择让没有 Placement 的 A、C 先留在原 DOM 位置，再在 Commit 里把带 Placement 的 B 摘出来 `insertBefore` / `appendChild` 到新位置。最终 DOM 顺序变成 A, C, B。

注意：B 的新位置是往后，不是「往前移」。面试里不要把 Placement 说成「相对前移」。

#### Placement 如何变成真实 DOM 移动？

```text
Render：placeChild 给 Fiber.flags 加上 Placement
  → Commit Mutation
  → commitPlacement
  → 在父 DOM 上 insertBefore / appendChild
```

没有 Placement 的兄弟 DOM 先留着；有 Placement 的再插，利用「已挂载节点再 append/insert 等于移动」的浏览器行为，完成重排。

### 6. 设计取舍

| 问题 | React 的选择 |
| --- | --- |
| 为什么用启发式而不是通用树 Diff？ | 通用编辑距离太贵；同层 + type/key 覆盖绝大多数 UI 更新 |
| 有没有更简单的方案？ | 整表重建更简单，但 DOM 与 state 成本不可接受 |
| 有没有理论上更优的移动方案？ | 有，例如 Vue 3 乱序段求 LIS，尽量少搬 DOM |
| 当前方案优化目标？ | 接近 O(n) 完成 Fiber 复用；实现简单；贴合「Render 只打标、Commit 再插」 |
| 牺牲了什么？ | 移动次数不一定最少；极端乱序可能多搬几次 |
| 哪些场景不好？ | 超大列表频繁无意义重排；此时应稳定 key、虚拟列表、减少重排，而不是指望 Diff 最优 |

和 Vue 3 对比时，不要说谁「更先进」：

| 维度 | React | Vue 3 |
| --- | --- | --- |
| 列表乱序 | `lastPlacedIndex` 贪心 | 预处理头尾 + 中间 LIS |
| 编译 | JSX 运行时难静态跳过 | `patchFlag` / Block Tree 可缩小范围 |
| 调度 | Diff 在可中断 Render 里只打 flags | 多为同步 patch 到 DOM |

React 的优势在 Fiber 可中断与优先级；Vue 的优势常在编译期缩小工作量和更少的 DOM 移动。

### 7. 项目里怎么用、怎么验

- **场景**（B 端示例）：筛选表格、会话列表、拖拽排序；行内有受控输入或展开 state。
- **做法**：`key` 用业务 id，不用 `index`；排序/过滤只改数组顺序，让 Fiber 按 key 复用。
- **验证**：排序后同一业务行继续输入，值还在；React DevTools 看实例是否被卸载重建。
- **风险**：临时 id、拼接列表 id 冲突，会出现「写了 key 仍错位」。key 须在**同一父节点的 children 内唯一**。

---

## 常见误区

### ❌ Diff 就是直接改真实 DOM

### ✅ 更准确的说法

Diff 在 Render 阶段只处理 Fiber 与 flags；DOM 变更发生在 Commit。

### 为什么？

Render 需要可中断、可重启；若边比边改 DOM，中断后屏幕会处于中间态。所以先记账，再一次性提交。

---

### ❌ React Diff 就是比较两棵虚拟 DOM 树

### ✅ 更准确的说法

教学上可以先这么理解；Fiber 下更准确的说法是：用旧 child Fiber 链表对齐本次的新 children，生成新的 workInProgress Fiber 链表。

### 为什么？

Element 是不可变的 UI 描述；Fiber 才是带指针、state、flags 的运行时结构。面试若只说「两棵 vdom」，追问双缓冲 / flags 时容易接不上。

---

### ❌ Placement 表示节点相对前移；打了 Placement 就立刻移动 DOM

### ✅ 更准确的说法

Placement 是「Commit 时需要再插入一次」的标记，既可能是新建插入，也可能是失序后再插。Render 阶段不移动 DOM。

### 为什么？

`lastPlacedIndex` 判断的是相对锚点是否回退；像 `[A,C,B]` 里 B 是往后插。真正的 `insertBefore` / `appendChild` 在 `commitPlacement`。

---

### ❌ 没写 key 时，React 第二轮才按下标认人；用 index 做 key 永远没事

### ✅ 更准确的说法

没写 key 时，第一轮 `null === null` 就会按位置复用，常常进不了 Map。用 index 当 key 时，头部插入、删除、倒序会把新数据填进旧 Fiber，state 与 DOM 错位。

### 为什么？

key 的本质是稳定身份。index 随数组位置变，身份就不稳定；静态只追加、从不重排的列表里用 index 风险较小，但不能说成「永远没事」。

---

### ❌ React 的列表 Diff 能算出最少 DOM 移动；删除 flag 打在被删节点自己身上

### ✅ 更准确的说法

React 用贪心，不保证最少移动。删除名单挂在**父 Fiber** 的 `deletions` 上，父节点打 `ChildDeletion`。

### 为什么？

被删子树往往已经不在 `wip.child` 链上；Commit 先看父节点的删除列表。若 flag 只打在已摘掉的孩子上，提交阶段容易丢删除信息。

---

## 高频追问

### React Diff 的核心思想是什么？

同层启发式比较：type/key 决定能否复用 Fiber；列表顺序扫描，必要时 Map；用 `lastPlacedIndex` 贪心标移动；Render 打 flags，Commit 改 DOM。目标是接近 O(n) 的复用，不是通用树最小编辑距离。

### 为什么需要 key？

Render 阶段用 key 认人：第一轮决定能否继续按下标走；对不上后在 Map 里按 key 找回旧 Fiber。key 相同再比 type。key 不直接等于「DOM 一定会移动」，移动另由 `lastPlacedIndex` / Placement 决定。

### 数组 Diff 怎么处理？

先左右下标试探 → 新先结束则纯删 → 旧先结束则纯增 → 两边都剩则剩余旧 Fiber 进 Map，再按新 children 匹配，Map 残留删除。一边产出新的 sibling 链表。

### `lastPlacedIndex` 是什么？

列表 Diff 里的锚点：已就地留下的复用节点中，最大的旧 `index`。用来判断后续复用节点相对顺序有没有回退。初始为 0；仅「复用且不 Placement」时可能增大；新建或 Placement 节点不更新它。

### 为什么 `[A,B,C] → [A,C,B]` 移动的是 B？

C 的 `oldIndex` 为 2，可就地留下，锚点变成 2；B 的 `oldIndex` 为 1，小于锚点，说明旧顺序里 B 在 C 前、新顺序里 B 在 C 后，于是给 B 打 Placement。A、C 通常不搬。

### Placement 是不是立即移动 DOM？

不是。Placement 是 Fiber 上的 flags，在 Render 标记；Commit 的 mutation 阶段才 `commitPlacement`，对父 DOM 做插入，从而表现为移动或首次挂载。

### Commit 阶段怎么处理删除和移动？

大致先处理父节点 `deletions`（ChildDeletion），再处理 Placement / Update。被删子树靠父节点上的名单找到；带 Placement 的 Fiber 再插入到正确兄弟位置。

### React 和 Vue 3 Diff 有什么区别？

都是同层 + type/key。React：下标试探 → Map，`lastPlacedIndex` 贪心，Diff 在可中断 Render 只打标。Vue 3：头尾预处理 + 中间 LIS，编译期还可跳过静态。React 换简单与调度模型契合；Vue 常更少 DOM 移动。列表很大时两边都应先保证稳定 key 与合理渲染范围。

---

## 延伸阅读

- [React Fiber 架构](/md/框架/React/Fiber架构.md)
- [React 渲染原理](/md/框架/React/React%20渲染原理.md)
- [React 高频考点](/md/框架/React/React%20高频考点精讲.md)
- [Vue Diff 算法](/md/框架/Vue/Vue%20Diff算法.md)
- [Vue vs React](/md/框架/Vue%20vs%20React.md)
- [面试速记：React & Vue](/md/面试准备/技术/React%20&%20Vue.md)
- [高频追问清单](/md/面试准备/高频追问清单.md)
