# React 渲染原理

## 面试定位

React 渲染原理是 React 原理题的主线。回答时要讲清楚：**状态更新如何进入调度，render 阶段如何基于 Fiber 计算新树，diff 如何找变化，commit 阶段如何把变化提交到真实 DOM，以及为什么 render 阶段必须是纯函数**。

## 面试回答

可以这样答：

> React 的渲染流程可以分成触发更新、调度、render、commit 四步。组件调用 `setState` 或父组件重新渲染后，React 会为对应 Fiber 创建更新并进入调度；调度器会根据更新优先级决定什么时候执行。render 阶段会从根 Fiber 开始构建 workInProgress Fiber 树，调用函数组件或类组件的 render 方法，得到新的 React Element，并通过 reconciliation 对比新旧 Fiber，标记需要插入、更新、删除的副作用。render 阶段只做计算，不操作真实 DOM，所以在并发模式下可以被中断、恢复或重启。commit 阶段不可中断，会把 render 阶段计算出的变更一次性提交到真实 DOM，并按顺序执行 ref、生命周期、`useLayoutEffect` 和 `useEffect`。React 的 diff 基于同层比较、不同类型直接替换、key 标识同一节点，把复杂度降到 O(n)。所以 React 渲染的核心不是 state 直接改 DOM，而是 state 触发 Fiber 更新，render 计算差异，commit 提交 DOM。

一句话总结：

> React 渲染原理 = 状态更新触发调度，render 阶段基于 Fiber 计算差异，commit 阶段把变化提交到真实 DOM。

---

## 核心原理

React 的更新不是直接修改 DOM，而是先创建一次更新任务，再经过 Fiber 调度和协调，最后统一提交。

完整链路：

```
setState / props 变化 / context 变化
  → 创建 update
  → 标记 Fiber lane
  → scheduler 调度
  → render 阶段构建 workInProgress Fiber 树
  → reconciliation 对比新旧 Fiber
  → 收集 DOM 变更、副作用标记
  → commit 阶段提交真实 DOM
  → 执行 layout effect / passive effect
```

---

## 1. React Element 和 Fiber 的关系

JSX 会被编译成 React Element：

```jsx
const element = <div className="user">Tungee</div>
```

大致等价于：

```js
const element = {
  type: 'div',
  props: {
    className: 'user',
    children: 'Tungee'
  }
}
```

React Element 是描述 UI 的普通对象，创建后不可变。它更像一次 render 的结果。

Fiber 则是 React 运行时用来管理更新的工作单元。每个组件或 DOM 节点通常对应一个 Fiber 节点，Fiber 上会保存：

- `type`：节点类型，例如 `div`、函数组件、类组件。
- `stateNode`：真实 DOM 或类组件实例。
- `child`、`sibling`、`return`：链表结构，用来遍历整棵树。
- `memoizedProps`、`memoizedState`：上一次渲染后的 props 和 state。
- `flags`：本次更新需要执行的操作，例如插入、更新、删除。
- `lanes`：更新优先级。

可以理解为：

> React Element 描述这次 UI 长什么样，Fiber 负责记录这个 UI 节点的状态、关系、优先级和副作用。

---

## 2. 为什么需要 Fiber

React 15 及之前的协调过程主要是递归执行。一旦开始比较一棵大组件树，就很难中断。如果组件树很大，主线程会被长时间占用，输入、动画、点击都会卡顿。

Fiber 把递归树遍历改成了可暂停的链表式工作循环：

```js
while (nextUnitOfWork) {
  nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
}
```

每个 Fiber 都是一个工作单元。React 做完一小段工作后，可以判断当前是否还有时间：

- 有时间：继续处理下一个 Fiber。
- 没时间：先把主线程还给浏览器。
- 有更高优先级更新：中断当前低优先级渲染，先处理高优先级任务。

Fiber 解决的核心问题：

- **可中断渲染**：render 阶段可以暂停、恢复、丢弃、重来。
- **优先级调度**：用户输入优先于列表过滤、页面切换等非紧急更新。
- **并发能力基础**：`startTransition`、`Suspense`、时间切片都依赖 Fiber。

---

## 3. 触发更新：setState 做了什么

函数组件中调用：

```jsx
setCount(count + 1)
```

React 不会立刻改 DOM，而是创建一个 update，挂到当前 Fiber 的更新队列上，然后从当前 Fiber 一路向上标记到根节点，告诉 React：这棵树有更新需要处理。

大致流程：

```
setState
  → 创建 update
  → 加入 updateQueue
  → 标记当前 Fiber 和父级 Fiber 的 lanes
  → 找到 FiberRoot
  → scheduleUpdateOnFiber
```

React 18 中，不同更新会分配不同优先级：

- 输入、点击：高优先级，需要尽快响应。
- `startTransition` 包裹的更新：低优先级，可以被打断。
- 普通状态更新：默认优先级。

这也是为什么 React 18 可以让输入框保持流畅，同时延后大列表过滤结果的渲染。

---

## 4. render 阶段：计算新树和差异

render 阶段也叫 reconciliation 阶段，核心工作是构建新的 workInProgress Fiber 树。

对函数组件来说，React 会调用组件函数：

```jsx
function User({ name }) {
  return <div>{name}</div>
}
```

调用后得到新的 React Element，再和旧 Fiber 的子节点做对比，生成新的 Fiber。

render 阶段做的事情：

- 调用函数组件或类组件 `render`。
- 执行 Hook 链表读取和更新。
- 计算新的 React Element。
- 对比新旧子节点。
- 给 Fiber 打 `Placement`、`Update`、`Deletion` 等标记。

render 阶段不做的事情：

- 不创建或修改真实 DOM。
- 不执行 `useEffect`。
- 不执行 `useLayoutEffect`。

因为 render 阶段可能被中断或重启，所以组件函数必须是纯函数：

```jsx
// ❌ 不应该在 render 中做副作用
function App() {
  localStorage.setItem('x', '1')
  return <div />
}
```

副作用应该放在事件处理函数或 effect 中。

---

## 5. diff：React 如何比较子节点

React diff 基于三个假设，把树比较从 O(n³) 降到 O(n)：

### 不同类型直接替换

```jsx
<div />
```

变成：

```jsx
<span />
```

类型不同，React 会直接卸载旧节点并创建新节点，不继续深度比较。

### 只做同层比较

React 不会跨层级移动节点。如果一个节点从一个父节点移动到另一个父节点下，通常会被看作删除加新增。

### key 标识同一节点

列表中通过 `key` 判断新旧节点是否是同一个：

```jsx
{list.map(item => (
  <li key={item.id}>{item.name}</li>
))}
```

没有稳定 key 时，React 只能按位置复用。使用 index 做 key，在头部插入、删除、排序时容易导致组件状态错位。

---

## 6. commit 阶段：提交真实 DOM

render 阶段结束后，React 已经知道哪些 Fiber 需要插入、更新、删除。commit 阶段负责把这些变更同步到宿主环境，也就是浏览器 DOM。

commit 阶段是同步且不可中断的，因为真实 DOM 一旦开始修改，不能改到一半停下来，否则用户会看到不一致的界面。

commit 大致分三段：

### before mutation

DOM 修改前的阶段，用于读取 DOM 快照，类组件的 `getSnapshotBeforeUpdate` 就发生在这里。

### mutation

真正执行 DOM 操作：

- 插入节点。
- 删除节点。
- 更新属性。
- 更新文本。
- 绑定或解绑 ref。

### layout

DOM 已经更新，但浏览器还没完成下一次绘制。此时执行：

- 类组件 `componentDidMount` / `componentDidUpdate`。
- `useLayoutEffect`。

`useEffect` 属于 passive effect，通常会在浏览器绘制之后异步执行，不阻塞页面显示。

---

## 7. 自动批处理

React 18 默认开启自动批处理。同一个事件循环中的多次状态更新会合并成一次 render：

```jsx
setCount(c => c + 1)
setName('new name')
setVisible(true)
```

这三次更新通常只会触发一次重新渲染。

React 17 及之前，批处理主要发生在 React 事件处理函数中；React 18 扩展到了 Promise、setTimeout、原生事件等更多场景。

如果确实需要立刻同步更新 DOM，可以使用 `flushSync`：

```jsx
flushSync(() => {
  setOpen(true)
})
```

但 `flushSync` 会打破批处理并阻塞主线程，一般只在必须立刻读取更新后 DOM 的场景使用。

---

## 8. useEffect 和 useLayoutEffect 的执行时机

一次更新中，常见顺序是：

```
render 阶段计算 Fiber
  → commit mutation 更新 DOM
  → useLayoutEffect
  → 浏览器 paint
  → useEffect
```

区别：

| Hook | 执行时机 | 是否阻塞绘制 | 适合场景 |
| --- | --- | --- | --- |
| `useLayoutEffect` | DOM 更新后、paint 前 | 阻塞 | DOM 测量、同步布局调整 |
| `useEffect` | paint 后 | 不阻塞 | 请求、订阅、日志、非视觉副作用 |

原则是：能用 `useEffect` 就不要用 `useLayoutEffect`。只有需要避免闪烁，必须在用户看到页面前同步测量或修改 DOM 时，才使用 `useLayoutEffect`。

---

## 9. React 渲染和 Vue 渲染的关键差异

| 维度 | React | Vue |
| --- | --- | --- |
| 更新触发 | `setState` / props / context | 响应式依赖 `trigger` |
| 依赖粒度 | 组件级重新执行 | 响应式属性收集到组件 render effect |
| 编译优化 | JSX 主要是语法转换 | 模板编译可生成 patchFlag、静态提升 |
| 调度核心 | Fiber + lanes | effect scheduler + job queue |
| render 阶段 | 可中断、可重启 | 通常同步执行组件 render |
| diff | Fiber reconciliation | VNode patch / keyed diff |

React 更强调运行时调度能力，Vue 更强调响应式依赖和编译期优化。两者最终都不是直接用数据改 DOM，而是先生成中间描述，再通过 diff / patch 更新真实 DOM。

---

## 高频追问

### render 阶段和 commit 阶段有什么区别？

render 阶段负责计算新 Fiber 树和差异，不操作真实 DOM，可以被中断和重启；commit 阶段负责把变更提交到真实 DOM，不可中断。

### 为什么 React 组件函数必须是纯函数？

因为 render 阶段可能执行多次、被中断或被丢弃。如果在组件函数里写请求、订阅、DOM 操作、日志上报等副作用，就可能重复执行或产生不一致。

### Fiber 是什么？

Fiber 是 React 的运行时工作单元。它用链表结构描述组件树，保存状态、props、DOM、更新优先级和副作用标记，让 React 可以把渲染拆成可中断的小任务。

### key 的作用是什么？

key 用来在同层列表中标识新旧节点是否是同一个。稳定 key 可以帮助 React 复用组件和 DOM；index key 在插入、删除、排序时容易导致状态错位。

### React 18 自动批处理解决了什么问题？

它把同一事件循环中的多次状态更新合并成一次 render，减少重复渲染。React 18 之前，Promise、setTimeout、原生事件中的更新通常不会自动批处理。

## 延伸阅读

- React 核心考点：[React 高频考点](/md/框架/React/React%20高频考点精讲.md)
- Hooks 更新模型：[React Hooks](/md/框架/React/Hooks.md)
- Vue 渲染对比：[Vue 渲染原理](/md/框架/Vue/Vue%20渲染原理.md)
