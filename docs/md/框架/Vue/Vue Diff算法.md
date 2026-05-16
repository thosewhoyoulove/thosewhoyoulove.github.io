# Vue Diff 算法

## 面试定位

Vue Diff 是框架原理高频题。回答重点是同层比较、`key` 的作用、Vue 2 双端 diff、Vue 3 最长递增子序列，以及 Vue 3 编译期优化如何减少 diff 工作量。

## 核心原理

Diff 的目标：给定新旧两棵 VNode 树，以**最少的 DOM 操作**把旧树变成新树。Vue 2 和 Vue 3 都遵循「同层比较、不跨层」的大前提，但子节点列表的比对策略有明显升级。

---

## 1. 为什么只做同层比较

跨层移动在真实业务中极少出现，而完整树 diff 是 O(n³)。Vue（和 React）都选择**只比同一父节点下的子节点列表**，把复杂度降到 O(n)。代价是：如果你真的把一棵子树从 A 移到 B，框架会销毁 + 重建，而不是移动。

---

## 2. patch 入口：先判断类型

```
patch(n1, n2, container)
  ├─ n1 === n2 → 什么都不做
  ├─ type 不同 → unmount(n1)，mount(n2)
  ├─ type 是文本 → 直接 setText
  ├─ type 是 Fragment → patchChildren
  ├─ type 是元素 → patchElement
  │     ├─ patchProps（逐个 prop diff）
  │     └─ patchChildren（核心）
  └─ type 是组件 → updateComponent（props 变了才重渲染）
```

重点在 **`patchChildren`**——它决定子节点列表怎么对齐。

---

## 3. Vue 2 的双端 diff

Vue 2 的 `updateChildren` 用**四个指针**（旧头、旧尾、新头、新尾）做双端比较：

```
oldStart →                    ← oldEnd
newStart →                    ← newEnd
```

每轮尝试四种匹配：

1. `oldStart` vs `newStart`（头头）
2. `oldEnd` vs `newEnd`（尾尾）
3. `oldStart` vs `newEnd`（头尾，旧头移到尾）
4. `oldEnd` vs `newStart`（尾头，旧尾移到头）

四种都不命中 → 用 `key` 在旧列表里查找 `newStart` 对应的节点，找到就移动，找不到就新建。

**循环结束后**：
- 旧列表有剩余 → 批量删除。
- 新列表有剩余 → 批量新增。

**优点**：头尾操作（push / unshift / reverse）只需 O(1) 次移动。  
**不足**：中间乱序部分退化为逐个查找 + 移动，移动次数不一定最少。

---

## 4. Vue 3 的快速 diff（patchKeyedChildren）

Vue 3 在双端思路上加了**最长递增子序列（LIS）**，目标是**最少移动**。分五步：

### 第一步：前置相同节点

从头开始，`type` 和 `key` 都相同的节点直接 patch，指针右移。

```
old: [a, b, c, d, e]
new: [a, b, d, c, e]
      ↑ ↑ 前两个相同，patch 后跳过
```

### 第二步：后置相同节点

从尾开始，相同的节点直接 patch，指针左移。

```
old: [a, b, c, d, e]
new: [a, b, d, c, e]
                  ↑ 尾部 e 相同，patch 后跳过
```

### 第三步：仅新增 / 仅删除

如果前后缩完后：
- 旧列表已遍历完、新列表有剩余 → 批量 mount。
- 新列表已遍历完、旧列表有剩余 → 批量 unmount。

这一步覆盖了**纯追加、纯删除**的常见场景，不进入后续复杂逻辑。

### 第四步：构建 keyToNewIndex 映射 + newIndexToOldIndex 数组

剩余的「中间乱序段」：

```
old 中间: [c, d]
new 中间: [d, c]
```

1. 遍历新中间段，建 `Map<key, newIndex>`。
2. 遍历旧中间段，用 key 查新位置：
   - 找不到 → unmount。
   - 找到 → 记录 `newIndexToOldIndex[newPos] = oldPos + 1`（0 表示新增）。
3. 同时标记 `moved = true`（如果出现 newIndex 不单调递增）。

### 第五步：最长递增子序列 → 最少移动

对 `newIndexToOldIndex` 求 **LIS**——LIS 中的节点**不需要移动**，只移动不在 LIS 中的节点。

```js
// newIndexToOldIndex = [4, 3]  (d 在旧中 index 3, c 在旧中 index 2)
// 实际存的是 oldIndex+1: [4, 3]
// LIS = [0]（只有第一个元素递增）
// index=1 的 c 不在 LIS 里 → 需要移动
```

**为什么 LIS 能保证最少移动**：LIS 代表已经处于正确相对顺序的最大子集，其余节点才需要 `insertBefore`。

### 伪代码骨架

```js
function patchKeyedChildren(c1, c2, container) {
  let i = 0
  let e1 = c1.length - 1
  let e2 = c2.length - 1

  // 1. 前置
  while (i <= e1 && i <= e2 && sameVNode(c1[i], c2[i])) {
    patch(c1[i], c2[i], container)
    i++
  }

  // 2. 后置
  while (i <= e1 && i <= e2 && sameVNode(c1[e1], c2[e2])) {
    patch(c1[e1], c2[e2], container)
    e1--; e2--
  }

  // 3. 仅新增
  if (i > e1 && i <= e2) {
    while (i <= e2) { mount(c2[i++], container, anchor) }
  }
  // 3. 仅删除
  else if (i > e2 && i <= e1) {
    while (i <= e1) { unmount(c1[i++]) }
  }
  // 4 + 5. 乱序段
  else {
    const s1 = i, s2 = i
    // 4a. key → newIndex
    const keyToNewIndex = new Map()
    for (let j = s2; j <= e2; j++) keyToNewIndex.set(c2[j].key, j)

    // 4b. 遍历旧段
    const toBePatched = e2 - s2 + 1
    const newIndexToOldIndex = new Array(toBePatched).fill(0)
    let moved = false, maxNewIndexSoFar = 0

    for (let j = s1; j <= e1; j++) {
      const newIndex = keyToNewIndex.get(c1[j].key)
      if (newIndex === undefined) {
        unmount(c1[j])
      } else {
        newIndexToOldIndex[newIndex - s2] = j + 1
        if (newIndex < maxNewIndexSoFar) moved = true
        else maxNewIndexSoFar = newIndex
        patch(c1[j], c2[newIndex], container)
      }
    }

    // 5. LIS + 移动/挂载
    const seq = moved ? getSequence(newIndexToOldIndex) : []
    let seqIdx = seq.length - 1

    for (let j = toBePatched - 1; j >= 0; j--) {
      const newIdx = j + s2
      const anchor = newIdx + 1 < c2.length ? c2[newIdx + 1].el : null
      if (newIndexToOldIndex[j] === 0) {
        mount(c2[newIdx], container, anchor)
      } else if (moved) {
        if (seqIdx < 0 || j !== seq[seqIdx]) {
          insert(c2[newIdx].el, container, anchor)
        } else {
          seqIdx--
        }
      }
    }
  }
}
```

---

## 5. LIS 算法（贪心 + 二分）

Vue 3 源码里的 `getSequence` 返回的是**索引数组**（哪些位置不动）：

```js
function getSequence(arr) {
  const p = arr.slice()       // 前驱索引，用于回溯
  const result = [0]          // 存的是 arr 的下标
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] === 0) continue // 0 表示新增，跳过
    const last = result[result.length - 1]
    if (arr[i] > arr[last]) {
      p[i] = last
      result.push(i)
      continue
    }
    // 二分找第一个 >= arr[i] 的位置
    let lo = 0, hi = result.length - 1
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (arr[result[mid]] < arr[i]) lo = mid + 1
      else hi = mid
    }
    if (arr[i] < arr[result[lo]]) {
      if (lo > 0) p[i] = result[lo - 1]
      result[lo] = i
    }
  }
  // 回溯得到真正的 LIS 索引
  let len = result.length, idx = result[len - 1]
  while (len-- > 0) {
    result[len] = idx
    idx = p[idx]
  }
  return result
}
```

时间 O(n log n)，空间 O(n)。

---

## 6. `key` 的作用与常见错误

- **没有 key**：Vue 走 `patchUnkeyedChildren`——就地复用 DOM 节点，只 patch props/children。列表项有**内部状态**（input 值、动画）时会串。
- **用 index 做 key**：头部插入 / 中间删除时，index 全部偏移，等于没 key——每个节点都要 patch，性能退化且状态错乱。
- **正确做法**：用业务唯一 ID（数据库主键、uuid 等）。

```vue
<!-- ❌ -->
<li v-for="(item, i) in list" :key="i">{{ item.name }}</li>

<!-- ✅ -->
<li v-for="item in list" :key="item.id">{{ item.name }}</li>
```

---

## 7. 编译期优化如何减少 diff 工作量

Vue 3 的 diff 快不只因为算法，还因为**进入 diff 的节点更少**：

| 编译优化 | 效果 |
| --- | --- |
| **patchFlag** | 标记节点哪些部分是动态的（文本 / class / style / props），patch 时只比对标记位 |
| **Block Tree** | 把动态节点「拍平」收集到最近的 block 根，跳过中间静态结构 |
| **静态提升** | 不变的 VNode 提到 render 外，不重复创建、不参与 diff |
| **cacheHandlers** | 事件处理函数缓存，避免子组件因 props 引用变化而无意义更新 |

所以真实场景下，大部分节点根本不会走到 `patchKeyedChildren`——它们要么被 block 跳过，要么被 patchFlag 精确定位到只 diff 文本。

---

## 8. Vue 2 vs Vue 3 diff 对比

| 维度 | Vue 2 | Vue 3 |
| --- | --- | --- |
| 子节点对比 | 双端四指针 | 前后缩 + LIS |
| 最少移动 | 不保证 | LIS 近似最优 |
| 编译辅助 | 无 | patchFlag / Block / 静态提升 |
| 无 key 列表 | 就地复用 | 同 |
| Fragment | 不支持（单根） | 支持，Fragment 也参与 diff |

---

## 9. 面试回答

### 总体思路（开场）

> Vue 的 diff 遵循「同层比较」原则——只对同一父节点下的子节点列表做对比，不跨层移动，把 O(n³) 降到 O(n)。新旧节点 type 或 key 不同就直接销毁重建；相同才进入 patch 复用。

### Vue 2 的双端 diff

> Vue 2 用四个指针：旧头、旧尾、新头、新尾。每轮做四次比较——头头、尾尾、头尾、尾头，命中就移动指针并复用节点。四种都不命中时，拿新头的 key 去旧列表里查，找到就移过来，找不到就新建。循环结束后，旧列表有剩余就批量删，新列表有剩余就批量加。这个算法对头尾操作（push、unshift、reverse）很高效，但中间乱序时移动次数不一定最少。

### Vue 3 的快速 diff（重点展开）

> Vue 3 把子节点对比分成五步：
>
> **第一步，前置预处理**：从头开始逐个比，type 和 key 都相同就直接 patch 并跳过，直到遇到不同的为止。
>
> **第二步，后置预处理**：从尾开始往前比，同理跳过相同的。这两步把列表两端稳定不变的部分快速消化掉，实际业务中大部分更新只改了中间一小段。
>
> **第三步，简单情况快路径**：如果前后缩完后旧列表已经遍历完、新列表还有剩余，说明是纯新增，直接批量 mount；反过来旧列表有剩余就批量 unmount。这一步覆盖了「追加」「删除尾部」等高频场景，不进入后续复杂逻辑。
>
> **第四步，处理中间乱序段**：对新列表的中间段建一个 `key → newIndex` 的 Map；然后遍历旧列表中间段，用 key 去查——查不到说明该节点被删了，unmount；查到就记录一个 `newIndexToOldIndex` 数组（新位置对应旧位置），同时 patch 复用。遍历过程中如果发现 newIndex 不是单调递增的，就标记 `moved = true`。
>
> **第五步，最长递增子序列（LIS）**：对 `newIndexToOldIndex` 数组求 LIS——LIS 代表已经处于正确相对顺序的最大子集，这些节点**不需要移动**。只有不在 LIS 中的节点才做 `insertBefore`。这样就保证了**最少的 DOM 移动次数**。LIS 用贪心 + 二分实现，时间 O(n log n)。

### key 的作用

> key 是 diff 判断「是否同一节点」的依据。没有 key 就走就地复用策略，列表项有内部状态时会串。用 index 做 key 等于没 key——头部插入时所有 index 偏移，每个节点都要重新 patch。正确做法是用业务唯一 ID。

### 编译期优化（加分项）

> Vue 3 的 diff 快不只因为算法改进，还因为**进入 diff 的节点更少**。编译器会给动态节点打 patchFlag，标记哪些部分是动态的（文本、class、style、props），patch 时只比对标记位。静态节点会被提升到 render 函数外面，不重复创建也不参与 diff。Block Tree 把动态节点拍平收集，跳过中间的静态结构。所以真实场景下大部分节点根本不会走到 `patchKeyedChildren`。

### 一句话总结

> Vue 3 diff = 前后缩 + 纯增删快路径 + 中间乱序段用 LIS 求最少移动，再加上编译期 patchFlag / Block Tree 大幅减少需要 diff 的节点数量。

---

## 延伸阅读

- 响应式如何触发 patch：[Vue 3 响应式原理](/md/框架/Vue/vue3响应式原理.md)  
- 编译优化细节：[Vue 2 与 Vue 3 的区别 §5](/md/框架/Vue/vue2和3的区别.md)  
- Vue 3 源码入口：[`packages/runtime-core/src/renderer.ts` → `patchKeyedChildren`](https://github.com/vuejs/core/blob/main/packages/runtime-core/src/renderer.ts)

## 高频追问

### 为什么不能用 index 做 key？

头部插入或中间删除会导致 index 整体偏移，框架会错误复用节点，可能造成输入框状态错乱，也会让更新退化成大量无意义 patch。

### Vue 3 为什么要用最长递增子序列？

LIS 表示新列表中已经保持正确相对顺序的最大节点集合，这些节点不需要移动。只移动不在 LIS 中的节点，可以减少 DOM 移动次数。

### Vue 3 的 diff 快只靠 LIS 吗？

不是。LIS 只优化 keyed children 的移动。Vue 3 更大的收益来自编译期的 patchFlag、静态提升和 Block Tree，让运行时进入 diff 的节点更少。
