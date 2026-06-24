# React Diff 算法

## 面试定位

React Diff 题考察你是否理解 reconciliation。回答时不要说成“直接比较真实 DOM”，要强调它发生在 React Element / Fiber 层，结果会在 commit 阶段统一提交。

## 面试回答

> React Diff 是 render 阶段 reconciliation 的一部分，用来比较新旧子节点，判断哪些 Fiber 可以复用、哪些需要插入、移动或删除。完整树编辑距离算法复杂度很高，React 基于 UI 场景做了三条启发式假设：不同类型节点直接替换；只做同层比较，不跨层级移动；同层列表用 key 标识节点身份。Diff 的结果不会立刻改 DOM，而是给 Fiber 打上 Placement、Update、Deletion 等标记，最后在 commit 阶段统一更新真实 DOM。

一句话总结：

> React Diff 用 type、层级和 key 做启发式比较，把常见 UI 更新从复杂树比较降到接近 O(n)。

## 核心原理

```text
新的 React Element
  + 旧 Fiber
  -> 判断 type / key 是否可复用
  -> 生成新的 workInProgress Fiber
  -> 标记插入、更新、删除、移动
  -> commit 阶段更新真实 DOM
```

三条核心规则：

| 规则 | 含义 |
| --- | --- |
| 不同类型直接替换 | `div` 变 `span`，旧节点和子树通常直接卸载重建 |
| 同层比较 | 不做跨层级移动检测，降低复杂度 |
| key 标识身份 | 列表里用稳定 key 判断复用、移动、删除 |

## 高频追问

### key 的作用是什么？

key 用来标识同一层级列表节点的稳定身份。key 相同且 type 相同，React 倾向于复用旧 Fiber 和 DOM；key 变化会被当作新节点。

### 为什么不建议用 index 做 key？

列表插入、删除、排序时，index 会变化，React 可能错误复用 DOM 和组件状态，导致输入框内容错位、动画异常等问题。

### Diff 和 reconciliation 是一回事吗？

不是完全等同。Diff 是 reconciliation 里的关键步骤之一；reconciliation 还包括调用组件、处理更新队列、生成 workInProgress Fiber 和收集副作用标记。

## 延伸阅读

- [React Fiber 架构](/md/框架/React/Fiber架构.md)
- [React 渲染原理](/md/框架/React/React%20渲染原理.md)
