# React Fiber 架构

## 面试回答

> Fiber 是 React 16 引入的运行时工作单元，也是一套可调度的协调架构。React 15 以前更新更像同步递归遍历，大组件树一旦开始就很难停，容易长时间占满主线程。Fiber 把树拆成链表上的一个个节点，每个节点带着类型、props、state、更新队列、优先级（lane）和副作用 flags，以及 child / sibling / return 指针。这样 render 阶段可以做一点歇一点：暂停、恢复，或丢掉未提交的 workInProgress 树，先响应用户输入。
>
> 被打断丢掉的是内存里的未提交树，update 还在队列里；挂太久的更新会过期，强制纳入本轮，避免饿死。commit 阶段仍然同步：真正改 DOM，不能中途停，否则屏幕会花。所以 Fiber 解决的是「可中断的计算」，不是「可中断的 DOM 突变」。

**一句话总结：**

> 同步递归 → Fiber 工作单元链表 → render 可中断可调度 → commit 同步提交 DOM → lane 防饿死。

---

## 核心原理

### 1. 为什么需要 Fiber

同步递归一旦开始难以让出主线程，输入和动画会卡。Fiber 让 React 能在帧预算内切片工作。

### 2. 整体链路

```text
setState / props 变化
  → 创建 update，标记 Fiber lane
  → Scheduler 调度
  → render：构建 workInProgress Fiber 树，diff，打 flags（可中断）
  → commit：同步改 DOM / 跑 layout 相关副作用
```

### 3. Fiber 节点常见字段

| 字段 | 作用 |
| --- | --- |
| `type` | 组件或 DOM 节点类型 |
| `stateNode` | DOM 节点或类组件实例 |
| `child` / `sibling` / `return` | 用链表表达树 |
| `memoizedProps` / `memoizedState` | 上次提交后的 props / state |
| `lanes` | 更新优先级 |
| `flags` | 本次要提交的副作用 |

### 4. 双缓冲直觉

current 树是屏幕上已提交的；workInProgress 是正在算的下一棵。算完 commit 后切换指针。中断时可以丢弃 wip，不影响 current。

---

## 常见误区

### ❌ Fiber 等于虚拟 DOM

### ✅ 更准确的说法

Element 描述 UI；Fiber 是带优先级和链表指针的工作单元。

### ❌ render 中断了 DOM 会停在一半

### ✅ 更准确的说法

render 不改已上屏 DOM；半截只存在于内存 wip 树。

---

## 高频追问

### Fiber 解决了什么问题？

让 render 可拆成小单元，必要时让出主线程，优先高优先级更新。

### render 为什么可中断、commit 为什么不行？

render 只算树和 flags；commit 改真实 DOM，中断会导致不一致 UI。

### 低优先级一直被打断会饿死吗？

不会无限挂着。update 还在；lane 过期后强制纳入本轮。详见下文历史说明。

### 低优先级渲染一直被高优先级打断，会不会饿死？

不会无限挂着。被丢掉的是未 commit 的 workInProgress 树，update 还在队列里。React 18 用 lane 的过期时间：工作循环前 `markStarvedLanesAsExpired` 把超时的 pending lane 标进 `expiredLanes`，`getNextLanes` 必须带上它们；过期工作通常不再时间切片让路，尽快 commit。Idle / Offscreen 一类可以不过期。React 16/17 用 `expirationTime` 表达同一件事。超时数值以源码为准（交互约 250ms，默认/transition 约 5s）。

---

## 延伸阅读

- [React 渲染原理](/md/框架/React/React%20渲染原理.md)
- [React Diff 算法](/md/框架/React/React%20Diff算法.md)
- [React Hooks](/md/框架/React/Hooks.md)
- [Vue vs React](/md/框架/Vue%20vs%20React.md)
