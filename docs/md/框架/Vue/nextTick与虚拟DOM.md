# Vue nextTick 与虚拟 DOM

## 面试回答

> 改响应式数据时，数据本身已经变了，但 DOM 通常不会同步改完。组件更新会进 scheduler 队列，当前同步代码跑完后用微任务批量 flush：再 render 出新 VNode，patch 到真实 DOM。`nextTick` 等的就是这批更新做完之后的时机，方便你读最新 DOM 或接后续逻辑——它不是「让数据更新」的 API。
>
> 虚拟 DOM 这边：render 的结果是 VNode，用 JS 对象描述 UI。patch 对比新旧 VNode，复用节点并改差异。模板编译还能带上 patchFlag 等，减少运行时比对。所以 nextTick 管「何时能看见更新后的 DOM」，VNode 管「如何描述并对齐 DOM」。

**一句话总结：**

> 写数据已生效 → 更新入队微任务 → patch DOM → nextTick 回调；VNode 是中间描述。

---

## 核心原理

### 1. 为什么要异步队列

同一事件里改很多次，若每次都同步 render/patch，会重复劳动。排队去重后一次 flush。

```text
count++
count++
  → trigger（数据已新）
  → queueJob（组件 job 去重）
  → 同步代码继续（此时 DOM 可能仍旧）
  → 微任务 flushJobs
  → render → 新 VNode → patch
  → nextTick 队列中的回调
```

```js
count.value++
console.log(el.textContent) // 可能旧
await nextTick()
console.log(el.textContent) // 已新
```

---

### 2. nextTick 是什么、不是什么

| 是 | 不是 |
| --- | --- |
| 等 Vue 本轮 DOM 更新相关工作完成 | 用来「触发」数据更新 |
| 常用微任务（如 Promise）衔接 | 宏任务 `setTimeout(0)` 的精确等价（实现可选降级） |

`watch` 的 `flush: 'post'` 与「更新后读 DOM」场景相近；`sync` 则同步执行，慎用。

---

### 3. 虚拟 DOM / VNode

```js
const vnode = {
  type: 'div',
  props: { class: 'box' },
  children: 'hello',
}
```

| 价值 | 说明 |
| --- | --- |
| 声明式对齐 | 先描述再 patch，少手写 DOM 操作 |
| 统一节点类型 | 元素 / 组件 / 文本 / Fragment… |
| 跨平台底座 | 同一套 VNode 可对接不同 runtime |

有 VDOM 仍要模板编译：编译提供静态分析，运行时更省。

---

### 4. 设计取舍

批量异步更新换吞吐；心智上必须区分「数据时刻」和「DOM 时刻」。

---

## 常见误区

### ❌ nextTick 是让 data 变成新值

### ✅ 更准确的说法

data 在赋值时已变；nextTick 等 DOM（及更新队列）侧完成。

---

### ❌ 虚拟 DOM 一定比直接操作 DOM 快

### ✅ 更准确的说法

换的是可维护性、批量与跨平台；局部极热路径仍可能手写 DOM / 编译优化更关键。

---

### ❌ 有了 nextTick 就不需要理解调度队列

### ✅ 更准确的说法

nextTick 建立在 queue flush 之上；说不清队列就说不清它等的是什么。

---

## 高频追问

### 改完数据下一行为什么读到旧 DOM？

更新异步入队，同步代码尚未 flush patch。

### nextTick 为什么常用微任务？

同步结束后尽快跑，且通常早于下一帧绘制，适合合并更新。

### VNode 和真实 DOM 什么关系？

VNode 描述期望 UI；patch 把它对齐到 DOM。

### 和 React 的 `useEffect` 读 DOM 怎么类比？

都不是「赋值当下」；React 更常在 commit/paint 相关时机，Vue 用 nextTick 等本轮 patch。机制不同，问题同类。

---

## 延伸阅读

- [Vue 渲染原理](/md/框架/Vue/Vue%20渲染原理.md)
- [Vue 3 响应式原理](/md/框架/Vue/vue3响应式原理.md)
- [模板编译流程](/md/框架/Vue/模板编译流程.md)
- [Vue Diff 算法](/md/框架/Vue/Vue%20Diff算法.md)
