# Vue nextTick 与虚拟 DOM

## 面试定位

`nextTick` 和虚拟 DOM 经常连着问。回答时要把“响应式数据变了”和“DOM 已经更新”区分开，同时说明 VNode 在 Vue 渲染流程里的作用。

## 面试回答

> Vue 修改响应式数据后，DOM 不会立刻同步更新。Vue 会把组件更新任务放入调度队列，在当前同步代码执行完后，通过微任务批量刷新，避免同一轮多次状态变化导致重复渲染。`nextTick` 的作用就是等这批 DOM 更新完成后再执行回调，适合在状态变化后读取最新 DOM。虚拟 DOM 则是 render 函数执行后生成的 VNode，用 JavaScript 对象描述 UI。更新时 Vue 会重新生成 VNode，通过 patch 对比新旧 VNode，把变化同步到真实 DOM。Vue 3 还会借助模板编译产生的 patchFlag 和静态提升，减少运行时 diff 范围。

一句话总结：

> nextTick 解决“什么时候能读到更新后的 DOM”，虚拟 DOM 解决“如何用 VNode 描述并更新真实 DOM”。

## 核心原理

```text
state.count++
  -> trigger 组件更新
  -> 更新任务进入 scheduler 队列
  -> 当前同步代码继续执行
  -> 微任务 flush 队列
  -> render 生成新 VNode
  -> patch 更新真实 DOM
  -> nextTick 回调执行
```

示例：

```js
count.value++;
console.log(el.textContent); // 可能还是旧 DOM

await nextTick();
console.log(el.textContent); // DOM 已更新
```

VNode 示例：

```js
const vnode = {
  type: "div",
  props: { class: "box" },
  children: "hello",
};
```

## 高频追问

### nextTick 为什么常用微任务？

微任务会在当前同步代码结束后、浏览器下一轮渲染前尽快执行，适合把多次状态变化合并成一次 DOM 更新。具体实现会根据环境选择 Promise 等能力。

### nextTick 是让数据更新吗？

不是。响应式数据已经更新了，`nextTick` 等的是 Vue 把更新后的 VNode patch 到真实 DOM 后的时机。

### Vue 有虚拟 DOM 为什么还要模板编译？

虚拟 DOM 提供跨平台和声明式更新模型；模板编译能提前分析静态和动态部分，给运行时提供 patchFlag、静态提升等优化信息。

## 延伸阅读

- [Vue 渲染原理](/md/框架/Vue/Vue%20渲染原理.md)
- [Vue 模板编译流程](/md/框架/Vue/模板编译流程.md)
- [Vue Diff 算法](/md/框架/Vue/Vue%20Diff算法.md)
