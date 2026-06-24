# React Fiber 架构

## 面试定位

Fiber 是 React 原理题的核心。面试官通常会从“Fiber 是什么”追到“为什么能调度”“render 和 commit 为什么一个可中断一个不可中断”。

## 面试回答

> Fiber 是 React 16 引入的运行时工作单元，也是一种新的协调架构。React 15 以前的更新更像同步递归，一旦开始遍历大组件树就很难暂停，容易长时间占用主线程。Fiber 把组件树拆成一个个 Fiber 节点，每个节点保存组件类型、props、state、更新队列、优先级、副作用标记，以及 child、sibling、return 指针。这样 React 在 render 阶段可以把大任务拆成小任务，根据优先级暂停、恢复或丢弃低优先级工作，优先响应用户输入。commit 阶段仍然同步不可中断，因为真实 DOM 必须一次性保持一致。

一句话总结：

> Fiber 把 React 更新从不可中断的递归遍历，改造成可保存进度、可调度、可中断的工作单元模型。

## 核心原理

```text
setState / props 变化
  -> 创建 update
  -> 标记 Fiber lane
  -> scheduler 调度
  -> render 阶段构建 workInProgress Fiber 树
  -> diff 并收集副作用标记
  -> commit 阶段同步提交真实 DOM
```

Fiber 节点常见信息：

| 字段 | 作用 |
| --- | --- |
| `type` | 组件或 DOM 节点类型 |
| `stateNode` | DOM 节点或类组件实例 |
| `child` / `sibling` / `return` | 用链表结构表达树关系 |
| `memoizedProps` / `memoizedState` | 上一次提交后的 props 和 state |
| `lanes` | 更新优先级 |
| `flags` | 本次需要提交的副作用 |

## 高频追问

### Fiber 解决了什么问题？

解决同步递归更新难以中断的问题。它让 render 阶段可以拆成多个小工作单元，必要时让出主线程，优先处理高优先级任务。

### render 阶段为什么可以中断？

render 阶段只在内存里计算新的 Fiber 树和副作用标记，不直接改真实 DOM。中断后可以继续、重来或丢弃，不会让页面处于半更新状态。

### commit 阶段为什么不能中断？

commit 阶段会真正修改 DOM、执行 ref、layout effect 等副作用。如果中断，用户可能看到不一致的 UI，所以必须同步完成。

## 延伸阅读

- [React 渲染原理](/md/框架/React/React%20渲染原理.md)
- [React Diff 算法](/md/框架/React/React%20Diff算法.md)
- [React Hooks](/md/框架/React/Hooks.md)
