# Vue 渲染原理

## 面试回答

> Vue 渲染可以串成一条链：模板先编译成 render 函数；执行 render 得到 VNode；首次 `patch(null, vnode)` 挂载真实 DOM。组件渲染被包成响应式 effect，render 里读到的数据会被 track；数据一变，trigger 把更新推进 scheduler 队列，微任务里再跑 render，拿新旧 VNode 做 patch / Diff，最后才改 DOM。
>
> 所以不是「改 data 等于改 DOM」，而是「改数据 → 通知订阅它的组件 effect → scheduler 去重排序 → 重新描述组件子树 → patch 宿主视图」。父组件更新也不意味着所有子组件都一定执行更新：运行时会结合稳定 props、动态插槽等条件判断子组件是否需要更新；编译器又通过静态提升、patchFlag 和 Block Tree，把更新范围进一步收缩到动态节点。
>
> 调度阶段不仅为了批处理，还要保证父组件通常先于子组件更新、已卸载组件的任务可以跳过，并协调 pre-flush watcher、组件 job 和 post-flush callback。`nextTick` 等的是当前 flush Promise，因此适合在本轮 patch 完成后读 DOM，但不代表浏览器已经完成下一帧绘制。

**一句话总结：**

> template→render→VNode → effect+track → trigger→队列 → 再 render → patch/Diff → DOM。

---

## 核心原理

### 1. 为什么要这条链

模板不能直接给浏览器执行；直接改 DOM 难批量、难跨平台、难复用。中间的 VNode + patch 把「描述 UI」和「操作宿主」分开；响应式 effect 则把「数据变了」接到「哪棵子树该重算」。

---

### 2. 整体执行链路

```text
template
  → compile：AST → transform → render 函数
挂载：
  → setup / 创建渲染 effect
  → render() → VNode（subTree）
  → patch(null, subTree) → 真实 DOM
更新：
  → 写响应式数据 → trigger
  → queueJob（微任务批量）
  → render() → 新 VNode
  → patch(old, new) → Diff / 更新 DOM
  → nextTick 回调可安全读 DOM
```

| 对象 | 白话 |
| --- | --- |
| render 函数 | 运行时真正执行的 UI 工厂 |
| VNode | 用 JS 对象描述的 UI 节点 |
| 渲染 effect | 连接响应式与组件更新的副作用 |
| patch | 把 VNode 差异落到宿主（DOM） |

响应式细节见 [Vue 3 响应式原理](/md/框架/Vue/vue3响应式原理.md)；孩子对齐见 [Vue Diff](/md/框架/Vue/Vue%20Diff算法.md)；编译优化见 [模板编译流程](/md/框架/Vue/模板编译流程.md)。

---

### 3. 编译：模板不是 DOM

```vue
<template>
  <div class="user">
    <h2>{{ name }}</h2>
  </div>
</template>
```

大致变成执行 `h('div', …)` 的 render。编译期可标记动态点、提升静态节点，减少更新时 Diff 范围。

---

### 4. VNode 与 mount

VNode 统一描述元素、文本、组件、Fragment 等。首次无旧树：

```text
patch(null, vnode) → mountElement / mountComponent …
```

元素路径直觉：创建 DOM → 挂 props → 挂 children → 插入容器。

---

### 5. 组件更新 = effect + 队列 + patch

```js
// 心智模型（非源码逐字）
effect(() => {
  const subTree = render()
  patch(prev, subTree, container)
  prev = subTree
}, { scheduler: queueJob })
```

#### Trace：连续三次自增

| 步骤 | 结果 |
| --- | --- |
| `count++` ×3（同步） | trigger 多次，同一 job 只留一份 |
| 同步代码结束 | 微任务 flush |
| render + patch 一次 | DOM 从旧值到最终值 |
| 若中途读 `el.textContent` | 可能仍是旧 DOM → 需 `nextTick` |

#### 父组件更新，子组件一定更新吗

不一定。父组件重新执行 render 会生成新的子组件 VNode，但运行时仍会判断子组件是否需要进入更新。稳定 props、没有需要强制更新的动态插槽时，子组件可以跳过；反过来，如果父组件把每次新建的对象、数组或函数作为 prop 传下去，就更容易让子组件进入更新。

编译器生成的 `patchFlag` 还能告诉运行时具体是哪类动态信息变化，例如文本、class、style 或某组 props，从而避免全量比较所有属性。

---

### 6. patch 在流水线中的位置

`patch(n1, n2)`：类型不同则卸旧挂新；同类型再比 props / children。列表 Diff、key、LIS 是 children 路径上的细节，不是整条渲染的全部。

Vue 3 运行时还能吃编译产物：`patchFlag` 提示哪些 props/文本动了，Block 把动态子节点收成列表，更新时直达动态点。

---

### 7. 与 React 的对照（点到为止）

| | Vue | React |
| --- | --- | --- |
| 谁该更新 | 依赖追踪到组件 effect | 从 setState 触发点向子树再 render |
| 中间描述 | VNode | Element → Fiber |
| 调度 | 多为队列批量，组件更新偏同步跑完 | Fiber 可中断 Render |
| 优化重心 | 编译 + 响应式 | 结构 / memo / 优先级 |

---

### 8. 设计取舍

| 选择 | 得到 | 代价 |
| --- | --- | --- |
| 模板 + 编译 | 静态分析、少手动 memo | 表达力受模板约束（仍可用 render/JSX） |
| 异步队列更新 | 合并渲染 | 同步读 DOM 要 nextTick |
| 组件级 effect | 实现清晰 | 大组件要拆分 |

---

## 常见误区

### ❌ 改 data 就会同步立刻改 DOM

### ✅ 更准确的说法

先 trigger → 入队 → flush 后 render/patch；同步代码里常读到旧 DOM。

---

### ❌ VNode 就是真实 DOM

### ✅ 更准确的说法

VNode 是描述；DOM 是宿主节点，由 patch 创建或更新。

---

### ❌ Diff 等于整条渲染原理

### ✅ 更准确的说法

Diff 是 patch 子节点时的对齐策略；渲染还包括编译、effect、调度。

---

### ❌ Vue 更新一定比 React 可中断

### ✅ 更准确的说法

Vue 默认组件更新路径更偏同步完成；可中断是 React Fiber 强项。Vue 强在依赖与编译减负。

---

## 高频追问

### Vue 一次更新的主链路？

写数据 → trigger → queueJob → flush → render 出新 VNode → patch → DOM。

### 为什么组件渲染是 effect？

render 读数据时 track，写数据时才能精确找到该组件的更新函数。

### nextTick 解决什么？

等本轮更新队列（及 DOM patch）完成后再读最新 DOM 或接后续逻辑。

### 编译优化如何减少 Diff？

静态提升、patchFlag、Block Tree 等让运行时少走无相关节点。

### 父组件更新，子组件一定重新渲染吗？

不一定。父 render 会产生子 VNode，但 Vue 会结合 props 稳定性、动态插槽和编译标记判断是否需要更新子组件。保持传入 props 稳定可以缩小更新范围。

### mount 和 patch 差别？

无旧 VNode 时挂载创建；有旧树时对齐复用并改差异。

### 和 React 渲染最大不同？

Vue 自动追踪依赖并善用编译；React 显式触发更新并强调可调度运行时。

---

## 延伸阅读

- [Vue 3 响应式原理](/md/框架/Vue/vue3响应式原理.md)
- [Vue Diff 算法](/md/框架/Vue/Vue%20Diff算法.md)
- [模板编译流程](/md/框架/Vue/模板编译流程.md)
- [nextTick 与虚拟 DOM](/md/框架/Vue/nextTick与虚拟DOM.md)
- [React 渲染原理](/md/框架/React/React%20渲染原理.md)
- [Vue vs React](/md/框架/Vue%20vs%20React.md)
