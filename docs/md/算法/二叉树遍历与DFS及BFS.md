# 二叉树遍历与 DFS、BFS

## 面试回答

> 我会从访问顺序、待处理状态和空间成本三个层面讲。
>
> 首先，**前序、中序、后序都是深度优先，区别在于何时访问根节点**。前序是根左右，中序是左根右，后序是左右根。层序按深度逐层访问，通常采用广度优先。这里的访问是记录节点值或处理业务，不是第一次进入递归函数。
>
> 第二，**DFS 用栈保存尚未完成的路径，BFS 用队列保存等待扩展的节点**。递归依赖调用栈保存返回位置，显式栈把这份状态放在可控的数据结构里。栈的后进先出使最新发现的分支先深入；队列先进先出，使先发现的浅层节点先扩展。
>
> 第三，**遍历时间通常都是 O(n)，空间要看树的形状**。递归 DFS 的辅助空间是树高 O(h)；按层保存前沿的 BFS 是最大宽度 O(w)。链状树可能让递归栈很深，宽树可能让 BFS 占用更多内存。
>
> **DFS 不等于必须递归，层序也不等于仅输出一个扁平数组**。返回每层结果时，要明确本层边界。

**一句话总结：** 前序根左右 / 中序左根右 / 后序左右根；DFS 保存路径，BFS 保存层前沿。

## 核心原理

### 同一棵树怎样得到四种顺序

```text
        A
       / \
      B   C
     / \   \
    D   E   F
```

| 遍历 | 访问位置 | 结果 |
| --- | --- | --- |
| 前序 | 进入当前非空节点后，递归前 | A B D E C F |
| 中序 | 左子树结束后，右子树之前 | D B E A C F |
| 后序 | 左右子树都结束后 | D E B F C A |
| 层序 | 同一深度按从左到右处理 | A / B C / D E F |

递归对每个节点都有“进入、左子树返回、右子树返回”几个时刻。所谓前、中、后，就是把处理当前节点的动作放在不同位置。后序适合先获得子问题答案再处理父节点，例如计算目录总大小；中序对二叉搜索树有特别价值，但对任意二叉树不保证升序。

下面是 JavaScript 教学实现，约定节点是 `{ value, left, right }`，空子树为 null 或 undefined；输入是一棵无环、无共享子节点的树。

```js
export function dfsOrders(root) {
  const preorder = []
  const inorder = []
  const postorder = []

  function visit(node) {
    if (node == null) return
    preorder.push(node.value)
    visit(node.left)
    inorder.push(node.value)
    visit(node.right)
    postorder.push(node.value)
  }

  visit(root)
  return { preorder, inorder, postorder }
}
```

这段代码一次递归同时记录三种访问时机，便于理解；手写某一种遍历时只保留对应数组即可。输出总量是 O(n)，递归辅助空间为 O(h)，两者要分开计算。

### DFS 为什么可以用显式栈

```js
export function preorderIterative(root) {
  if (root == null) return []
  const stack = [root]
  const result = []
  while (stack.length > 0) {
    const node = stack.pop()
    result.push(node.value)
    if (node.right != null) stack.push(node.right)
    if (node.left != null) stack.push(node.left)
  }
  return result
}
```

栈右端为栈顶：弹出 A 后先压 C 再压 B，栈为 `[C, B]`；弹出 B，再压 E、D，栈为 `[C, E, D]`；随后先处理 D、E，再回到 C。因为后进先出，必须右子树先入栈，才能得到根左右。

这个简单版本模拟前序；中序需要保存当前向左下降的位置，后序需要区分子树是否处理完成。仅把 push 的左右顺序反过来，不能直接变成中序或后序。显式栈避免依赖引擎的递归深度限制，但仍需内存保存进度。

### 层序为什么要保存本层边界

只要把孩子追加到队尾，队列会先处理早已存在的同层节点，再处理下一层。若输出要按层分组，处理本层前必须固定本层大小，否则新入队的孩子会混进当前层。

```js
export function levelOrder(root) {
  if (root == null) return []
  const levels = []
  let current = [root]

  while (current.length > 0) {
    const values = []
    const next = []
    for (const node of current) {
      values.push(node.value)
      if (node.left != null) next.push(node.left)
      if (node.right != null) next.push(node.right)
    }
    levels.push(values)
    current = next
  }
  return levels
}
```

这是按层拆开的队列前沿：`current` 是本层，`next` 是下一层。两者同时存在也只是常数倍的最大宽度，辅助空间 O(w)，输出空间另计。

| 轮次 | current | 处理过程 | next | 新增结果 |
| --- | --- | --- | --- | --- |
| 1 | A | 记录 A，加入 B、C | B C | [A] |
| 2 | B C | B 加入 D、E；C 加入 F | D E F | [B, C] |
| 3 | D E F | 都没有孩子 | 空 | [D, E, F] |

若使用单数组模拟队列，可以用 head 下标向前读取，避免每次 shift 移动元素。不过数组若一直保留所有已消费节点，实际存储可达 O(n)，不能直接声称整个实现只占 O(w)。按层数组能更清楚地体现宽度空间界限。

### 为什么 DFS 常用栈，BFS 常用队列

数据结构保存的是“下一步该处理谁”。DFS 要把最近发现的分支先处理，栈刚好满足后进先出；BFS 要先完成已发现的浅层，再扩展深层，队列刚好满足先进先出。递归和栈不是两种互斥思路，递归本身就使用了隐式调用栈。

在无权图中，BFS 按距离逐层扩展，第一次到达目标就能确定最少边数。树只有唯一简单路径；扩展到一般图时，DFS 和 BFS 都需要合适的 visited 或距离状态防止重复与环。加权最短路径不能直接套普通 BFS。

## 常见误区

### ❌ 中序遍历一定得到有序数组

✅ 只有满足相应顺序约束的二叉搜索树，中序才得到非递减等约定顺序。为什么：普通二叉树没有左右值的大小关系。

### ❌ BFS 一定比 DFS 更耗内存

✅ 要比较树高和最大宽度。为什么：链状树高度大但宽度为 1，完全树则可能宽度很大。

### ❌ 层序遍历用递归就不可能实现

✅ 可以通过 DFS 携带深度并写入对应分组实现层序结果；但执行过程仍是 DFS。为什么：输出顺序与实际扩展策略是两个维度。

## 高频追问

### 空树和单节点返回什么？

空树各遍历返回空数组；单节点的三个 DFS 顺序相同，层序返回 `[[value]]`。

### 为什么先序迭代要先压右孩子？

因为栈后进先出，最后压入左孩子，下一次才先访问左子树。

### 树有十万层怎么办？

避免直接递归，使用显式栈或队列，并评估输出与存储成本。递归可承受的深度由运行环境决定。

### 能否仅凭前序和后序唯一恢复二叉树？

一般不能，单孩子在左或右可能产生相同结果。值互异且已知中序与前序，或中序与后序时，才可按根位置划分子树并唯一重建。

## 延伸阅读

- [Trie 前缀树](/md/算法/trie.md)
- [Fiber 架构](/md/框架/React/Fiber架构.md)
