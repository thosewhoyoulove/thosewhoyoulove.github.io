# Vue 渲染原理

## 面试定位

Vue 渲染原理是把响应式、模板编译、虚拟 DOM、Diff、调度队列串起来的综合题。回答重点不是背源码细节，而是讲清楚：**模板如何变成 render 函数，render 如何生成 VNode，响应式数据变化后如何触发组件重新渲染，最后如何通过 patch 更新真实 DOM**。

## 面试回答

可以这样答：

> Vue 的渲染流程分为编译、挂载和更新。编译阶段会把 template 解析成 AST，再生成 render 函数；运行时执行 render 函数得到 VNode，也就是用 JavaScript 对象描述的 UI 树。首次渲染时，Vue 会根据 VNode 创建真实 DOM 并插入页面。组件渲染本身会被包装成一个响应式 effect，render 过程中读取到的响应式数据会被 track 收集依赖。当数据变化时，trigger 会通知对应组件更新，但 Vue 不会立即同步更新 DOM，而是通过 scheduler 把更新任务放到队列里，在微任务中批量执行。更新时会重新执行 render 得到新的 VNode，再通过 patch 对比新旧 VNode，复用相同节点，只更新变化的 props、文本或子节点。Vue 3 还通过 patchFlag、静态提升、Block Tree 等编译优化减少运行时 diff 的范围。

一句话总结：

> Vue 渲染原理 = 模板编译成 render，render 生成 VNode，响应式触发 render 重跑，patch / diff 负责把 VNode 的变化同步到真实 DOM。

## 核心原理

Vue 的渲染流程可以概括成一句话：

> 模板编译成 render 函数，render 执行后生成 VNode，数据变化触发渲染 effect 重新执行，生成新的 VNode，再通过 patch / diff 把变化更新到真实 DOM。

完整链路如下：

```
template
  → compiler 编译
  → render 函数
  → 执行 render
  → 生成 VNode
  → mount / patch
  → 真实 DOM
  → 响应式数据变化
  → scheduler 调度组件更新
  → 重新执行 render
  → 新旧 VNode diff
  → 更新真实 DOM
```

---

## 1. 模板不是直接变成 DOM

我们写的模板：

```vue
<template>
  <div class="user">
    <h2>{{ name }}</h2>
    <p>{{ age }}</p>
  </div>
</template>
```

浏览器并不认识 Vue 模板。Vue 会先经过编译阶段，把模板解析成 AST，再基于 AST 生成渲染函数。

大致过程：

```
template
  → parse：解析成 AST
  → transform：标记动态节点、静态提升、生成优化信息
  → codegen：生成 render 函数字符串
```

编译后的 render 函数大致类似：

```js
function render(ctx) {
  return h('div', { class: 'user' }, [
    h('h2', null, ctx.name),
    h('p', null, ctx.age)
  ])
}
```

所以 Vue 的模板本质上只是更适合人写的声明式语法，真正运行时执行的是 `render` 函数。

---

## 2. render 函数生成 VNode

`render` 函数执行后不会直接创建真实 DOM，而是先生成 VNode。

VNode 是一个普通 JavaScript 对象，用来描述真实 DOM 或组件：

```js
const vnode = {
  type: 'div',
  props: {
    class: 'user'
  },
  children: [
    { type: 'h2', children: 'Tungee' },
    { type: 'p', children: '18' }
  ]
}
```

VNode 的价值：

- 用对象描述 UI，创建和比较成本低于直接操作 DOM。
- 统一描述元素、组件、文本、Fragment 等不同节点。
- 让同一套渲染逻辑可以对接不同平台，例如浏览器 DOM、小程序、自定义渲染器。

Vue 运行时真正操作页面时，会根据 VNode 创建真实 DOM，或者拿新旧 VNode 做对比后复用已有 DOM。

---

## 3. 首次渲染：mount

组件首次渲染时，没有旧 VNode，所以走的是 mount 流程：

```
setup / data 初始化
  → 创建组件渲染 effect
  → 执行 render
  → 得到 subTree
  → patch(null, subTree, container)
  → 创建真实 DOM
  → 插入页面
```

`patch(null, vnode, container)` 中的 `null` 表示旧节点不存在，因此 Vue 会根据 VNode 类型创建节点。

例如元素节点会走 `mountElement`：

```js
function mountElement(vnode, container) {
  const el = document.createElement(vnode.type)
  patchProps(el, null, vnode.props)
  mountChildren(vnode.children, el)
  container.appendChild(el)
}
```

真实源码会复杂很多，需要处理组件、指令、事件、生命周期、Teleport、Suspense 等，但主线就是：**VNode 描述什么，运行时就创建什么 DOM**。

---

## 4. 组件渲染本身是一个 effect

Vue 3 中，组件更新和响应式系统连接的关键是 `effect`。

组件挂载时，Vue 会把组件的渲染逻辑包装成一个响应式副作用：

```js
effect(() => {
  const subTree = render()
  patch(prevTree, subTree, container)
  prevTree = subTree
})
```

当 render 执行时，如果读取了响应式数据：

```vue
<h2>{{ name }}</h2>
```

就等价于在 render 中访问了 `state.name`。这个读取会触发 `track`，把当前组件的渲染 effect 收集起来。

当后续执行：

```js
state.name = 'new name'
```

写操作会触发 `trigger`，找到依赖 `name` 的渲染 effect，通知组件更新。

这也是为什么说：

> Vue 不是数据直接改 DOM，而是数据变化触发组件重新 render，render 产出新的 VNode，再由 patch 更新 DOM。

---

## 5. 更新不是立即同步刷 DOM

响应式数据变化后，Vue 通常不会立刻同步执行 DOM 更新，而是通过 scheduler 把组件更新任务放进队列。

```js
state.count++
state.count++
state.count++
```

同一个同步任务里多次修改同一个组件依赖的数据，Vue 会合并成一次组件更新，避免重复 render 和重复 patch。

大致逻辑：

```js
function queueJob(job) {
  if (!queue.includes(job)) {
    queue.push(job)
  }
  Promise.resolve().then(flushJobs)
}
```

所以修改数据后立刻读 DOM，可能读到旧 DOM：

```js
count.value++
console.log(el.textContent) // 可能还是旧值

await nextTick()
console.log(el.textContent) // 更新后的值
```

`nextTick` 的作用就是等待当前更新队列 flush 完成。

---

## 6. 更新渲染：patch

当组件重新渲染时，Vue 会再次执行 render，得到新的 VNode：

```
oldVNode: <p>Hello</p>
newVNode: <p>Hi</p>
```

然后进入 patch：

```js
patch(oldVNode, newVNode, container)
```

patch 的基本判断：

```js
function patch(n1, n2, container) {
  if (n1 && !sameVNode(n1, n2)) {
    unmount(n1)
    n1 = null
  }

  const { type } = n2

  if (typeof type === 'string') {
    processElement(n1, n2, container)
  } else if (isComponent(type)) {
    processComponent(n1, n2, container)
  }
}
```

如果新旧节点 `type` 和 `key` 不同，Vue 会认为不是同一个节点，直接卸载旧节点并挂载新节点。

如果是同一个节点，就尽量复用旧 DOM，只更新变化的部分：

```js
function patchElement(n1, n2) {
  const el = n2.el = n1.el
  patchProps(el, n1.props, n2.props)
  patchChildren(n1, n2, el)
}
```

---

## 7. 子节点更新：文本、数组与 key

元素的 children 常见有三种情况：

- 文本：`<p>{{ msg }}</p>`
- 数组：`<ul><li v-for="item in list"></li></ul>`
- 空节点：条件渲染后没有内容

文本更新最简单：

```js
if (oldChildren !== newChildren) {
  el.textContent = newChildren
}
```

数组子节点才会进入列表 diff。对于有 `key` 的列表，Vue 会根据 `key` 判断节点身份：

```vue
<li v-for="item in list" :key="item.id">
  {{ item.name }}
</li>
```

`key` 的作用是告诉 Vue：这个节点在新旧列表中是不是同一个节点。

- 没有 `key`：Vue 倾向于按位置就地复用。
- 用 `index` 做 `key`：插入、删除、排序时容易造成错误复用。
- 用业务唯一 ID：可以稳定识别节点，减少状态错乱和无意义更新。

列表 diff 的细节可以继续展开 Vue 2 双端 diff、Vue 3 最长递增子序列，见 [Vue Diff 算法](/md/框架/Vue/Vue%20Diff算法.md)。

---

## 8. Vue 3 的编译优化

Vue 3 渲染性能提升不只来自运行时 diff，也来自编译期优化。编译器会提前分析模板，把静态信息和动态信息标出来，让运行时少做判断。

### 静态提升

不会变化的节点会被提到 render 函数外面：

```vue
<div>
  <h1>固定标题</h1>
  <p>{{ msg }}</p>
</div>
```

`h1` 不依赖响应式数据，不需要每次更新都重新创建 VNode，也不需要参与 diff。

### patchFlag

Vue 3 会给动态节点打标记，告诉运行时这个节点到底哪里会变：

```js
createElementVNode('p', null, msg, PatchFlags.TEXT)
```

如果只有文本会变，patch 时就只更新文本，不需要完整比较 props、class、style、children。

### Block Tree

Vue 3 会以 block 为单位收集动态子节点。更新时可以跳过大段稳定的静态结构，直接定位动态节点。

所以 Vue 3 的渲染优化核心是：

> 编译期尽量标出动态部分，运行时只更新动态部分。

---

## 9. Vue 2 和 Vue 3 渲染差异

| 维度 | Vue 2 | Vue 3 |
| --- | --- | --- |
| 响应式基础 | `Object.defineProperty` | `Proxy` |
| 模板编译优化 | 相对有限 | patchFlag、Block Tree、静态提升 |
| 根节点 | 单根组件 | 支持 Fragment 多根 |
| diff | 双端 diff | 快速 diff + LIS |
| 调度 | watcher 队列 | effect scheduler + job queue |
| 静态节点 | 有静态标记 | 静态提升更彻底 |

Vue 2 的核心链路也是「数据变化 → watcher 更新 → render → VNode → patch」，只是响应式实现、编译优化和 diff 策略不如 Vue 3 精细。

---

## 高频追问

### Vue 是数据变化后直接更新 DOM 吗？

不是。数据变化会触发组件的渲染 effect 重新执行，生成新的 VNode，然后通过 patch 对比新旧 VNode，最后更新真实 DOM。

### 为什么 Vue 要使用虚拟 DOM？

虚拟 DOM 用普通对象描述 UI，方便跨平台、组件化和统一 diff。它不是一定比手写 DOM 快，而是让复杂 UI 的更新过程更可控，并且可以结合编译优化减少真实 DOM 操作。

### nextTick 为什么能拿到更新后的 DOM？

Vue 会把组件更新放入异步队列，在当前同步代码执行完后统一 flush。`nextTick` 等待这轮更新队列执行完成，所以回调里能读到更新后的 DOM。

### Vue 3 为什么比 Vue 2 渲染更快？

Vue 3 不只是 diff 算法升级，还依赖编译期优化：静态提升减少重复创建 VNode，patchFlag 精确标记动态字段，Block Tree 跳过稳定静态结构，让运行时只关注真正会变化的节点。

## 延伸阅读

- 响应式如何收集依赖：[Vue 3 响应式原理](/md/框架/Vue/vue3响应式原理.md)
- 子节点如何更新：[Vue Diff 算法](/md/框架/Vue/Vue%20Diff算法.md)
- Vue 2 / Vue 3 差异：[Vue 2 和 Vue 3 区别](/md/框架/Vue/vue2和3的区别.md)
