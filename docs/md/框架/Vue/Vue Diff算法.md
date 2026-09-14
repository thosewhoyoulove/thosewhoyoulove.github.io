# Vue Diff 算法

## 面试回答

> Vue 的 Diff 发生在 patch 子节点时：同层比较，不跨层搬子树，把通用树编辑从理论 O(n³) 压到接近 O(n)。type / key 对不上就卸旧挂新；对得上才复用并继续比 props 和孩子。
>
> Vue 2 用双端四指针：头头、尾尾、头尾、尾头，适合 push / unshift / reverse；中间乱序时移动次数不一定最少。Vue 3 的 keyed 列表是：先前后缩掉两端相同节点，纯增删走快路径，中间乱序段建 `key → newIndex`，再对 `newIndexToOldIndex` 求最长递增子序列（LIS）——LIS 里的节点保持相对顺序，尽量不搬，只移动不在序列里的，从而减少 DOM `insertBefore`。
>
> 还要强调：Vue 3「快」不只靠 LIS。编译期的 patchFlag、静态提升、Block Tree 让很多节点根本进不了重 Diff。和 React 比，React 用 `lastPlacedIndex` 贪心，Diff 在可中断 Render 里只打 flags；Vue 更追求少搬 DOM，并和同步 patch 路径契合。key 必须稳定：无 key 就地复用，index key 在插入删除时容易状态错位。

**一句话总结：**

> 同层比较 → 前后缩 + 增删快路径 → Map 对齐中间段 → LIS 少搬 DOM → 编译优化减少进 Diff 的节点。

---

## 核心原理

### 1. 为什么需要 Diff

每次更新都重建整棵 DOM 太贵，也丢内部状态。完整最小树编辑又算不起。启发式：只比同一父下的孩子列表。

代价：跨父移动 ≈ 删除 + 新建。

---

### 2. 整体链路（Diff 在哪）

```text
组件 render → 新 VNode
  → patch(oldVNode, newVNode)
       ├─ type 不同 → unmount + mount
       ├─ 元素 → patchProps + patchChildren
       └─ 组件 → 按需更新子树
  → patchChildren / patchKeyedChildren ← Diff 主战场
```

| 对象 | 含义 |
| --- | --- |
| VNode | UI 描述 |
| 真实 DOM | patch 的产物；`vnode.el` 常挂着宿主节点 |

---

### 3. Vue 2：双端四指针

每轮试：头头 / 尾尾 / 头尾 / 尾头；都不行则用 key 在旧列表查新头。结束时旧剩则删、新剩则加。

| 擅长 | 不足 |
| --- | --- |
| 头尾操作 | 中间乱序移动不保证最少 |

---

### 4. Vue 3：快速 Diff（重点）

#### 步骤

1. **前置相同**：从头 `sameVNode` 则 patch 并 `i++`
2. **后置相同**：从尾同上
3. **纯增 / 纯删**：一侧耗尽则批量 mount / unmount
4. **中间乱序**：`keyToNewIndex`；扫旧段，找不到则 unmount，找到则记 `newIndexToOldIndex` 并 patch；newIndex 非单调则 `moved`
5. **LIS**：对 `newIndexToOldIndex` 求最长递增下标序列；序列内尽量不搬，其余 `insert`；值为 0 表示新节点要 mount

#### Trace：`[a,b,c,d,e]` → `[a,b,d,c,e]`

| 阶段 | 结果 |
| --- | --- |
| 前置 | a、b patch，跳过 |
| 后置 | e patch，跳过 |
| 中间旧 | c, d |
| 中间新 | d, c |
| Map / 记录 | d、c 都能对齐；相对顺序乱了 → moved |
| LIS | 例如保住 d，移动 c（具体以实现回溯为准，目标是少搬） |

LIS 用贪心 + 二分，约 O(n log n)，返回的是**不动的下标序列**。

---

### 5. key

| 做法 | 后果 |
| --- | --- |
| 无 key | 就地复用 DOM，内部状态易串 |
| index key | 头插/中删时身份漂移 |
| 业务 id | 稳定认人 |

key 解决「是不是同一个逻辑节点」；LIS / 移动决策建立在认人之后。

---

### 6. 编译如何减负

| 优化 | 作用 |
| --- | --- |
| patchFlag | 只比动态文本/class/style/props… |
| 静态提升 | 静态 VNode 提到 render 外 |
| Block Tree | 动态子节点拍平收集，跳过静态骨架 |
| cacheHandlers | 稳定事件函数引用 |

真实业务里大量更新到不了完整 `patchKeyedChildren`。

---

### 7. 与 React Diff

| | Vue 3 | React |
| --- | --- | --- |
| 乱序移动 | LIS，偏向少搬 | `lastPlacedIndex` 贪心 |
| 阶段 | 多在同步 patch | Render 打 flags，Commit 再搬 |
| 前置减负 | 编译强 | 靠 bailout / memo |

详见 [React Diff 算法](/md/框架/React/React%20Diff算法.md)。

---

### 8. 设计取舍

Vue 3 在常见列表形态下用预处理 + LIS 换更少 DOM 移动；实现更复杂。React 用更简单贪心，换与可中断 Render 模型一致。两者都不是通用树最小编辑距离。

---

## 常见误区

### ❌ Vue Diff 保证任意情况下全局最少操作

### ✅ 更准确的说法

同层启发式；LIS 优化的是 keyed 中间段的移动次数，外加编译减少进入 Diff 的节点。

---

### ❌ Vue 3 快只因为 LIS

### ✅ 更准确的说法

编译优化常常贡献更大：进 Diff 的节点变少。

---

### ❌ 有 key 就一定会移动 DOM

### ✅ 更准确的说法

key 用于认人；是否移动看相对顺序 / LIS（或 React 的锚点规则）。

---

### ❌ index 做 key 永远没事

### ✅ 更准确的说法

静态只追加的列表风险较小；重排、头插、删除易错状态。

---

## 高频追问

### Vue Diff 核心思想？

同层比较；Vue 3 = 前后缩 + 增删快路径 + 中间 LIS；再叠加编译减负。

### Vue 2 和 Vue 3 Diff 差在哪？

2：双端四指针。3：预处理 + LIS，编译辅助更强。

### 为什么要用 LIS？

找已处正确相对顺序的最大子集，减少 DOM 移动。

### 为什么不能用 index 做 key？

身份随位置变，易错复用与多余 patch。

### Diff 快只靠算法吗？

不。patchFlag / 静态提升 / Block 往往更关键。

### 和 React 列表 Diff 怎么对比？

都认 type/key；移动策略 LIS vs lastPlacedIndex；阶段与调度模型不同。

---

## 延伸阅读

- [Vue 渲染原理](/md/框架/Vue/Vue%20渲染原理.md)
- [Vue 3 响应式原理](/md/框架/Vue/vue3响应式原理.md)
- [模板编译流程](/md/框架/Vue/模板编译流程.md)
- [React Diff 算法](/md/框架/React/React%20Diff算法.md)
- [Vue vs React](/md/框架/Vue%20vs%20React.md)
