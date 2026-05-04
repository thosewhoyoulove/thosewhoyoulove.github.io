# Vue 高频考点精讲（工程向）

面向**已写过业务代码**的读者：尽量写清**机制、边界、可复现的踩坑**和**改法**。深度补充见 [Vue3 响应式原理](/md/框架/Vue/vue3响应式原理.md)、[Vue2 与 Vue3 的区别](/md/框架/Vue/vue2和3的区别.md)。

---

## 1. `ref` 的解包规则（template vs 对象属性）

- **模板里**：顶层 `ref` 自动解包，**不需要** `.value`。
- **对象属性里**：**不会**解包。

```vue
<script setup>
import { ref, reactive } from 'vue'
const count = ref(0)
const state = reactive({ nested: ref(0) })
</script>

<template>
  <div>{{ count }}</div>
  <div>{{ state.nested }}</div>
  <!-- reactive 里嵌套的 ref，模板里也会解包 -->
</template>
```

`script` 里顶层 `count` 需 `.value`；`state.nested` 在 `reactive` 内按 ref 代理 unwrap。

**坑**：解构 `reactive` → 普通值，丢响应式：

```js
const { x, y } = reactive({ x: 1, y: 2 })
```

改法：`toRefs` / `storeToRefs`（Pinia），或不解构。

---

## 2. `reactive` 只接受「对象类型」；`ref` 包对象等价于 `reactive`

`ref({ a: 1 })` 内部对该对象仍走 `reactive`。需**整块替换**时用 `ref`，改 `.value`；`reactive` 的根引用一般不替换。

---

## 3. `watch` 的 `flush`：什么时候 DOM 已更新？

| `flush` | 回调时机 | 典型用途 |
| --- | --- | --- |
| `pre`（默认） | 组件 **DOM 更新前** | 与组件更新同一批、读「旧 DOM」 |
| `post` | **DOM 更新后** | 量尺寸、`focus`、读新文本 |
| `sync` | **同步** | 慎用，易拖慢主线程 |

```js
watch(() => props.id, () => { /* ... */ }, { flush: 'post' })
```

**和 `nextTick`**：多数「DOM 已更新再干活」优先用 `flush: 'post'`；跨多个组件更新顺序或补丁外的逻辑再用 `nextTick`（见下节）。

---

## 4. `nextTick`：队列、批更新与何时 DOM 已对

### 为什么需要

响应式变更后，视图更新**异步、批处理**：同一同步代码里多次改数据，通常**合并成一次**组件渲染，避免每个赋值刷一遍 DOM。

因此赋值后立刻读 DOM / `ref` 指向的节点，往往还是**旧视图**。

### 用法

```vue
<script setup>
import { ref, nextTick } from 'vue'

const message = ref('Hello')
const box = ref(null)

async function update() {
  message.value = 'World'
  // 此时多数情况下 DOM 仍是旧内容
  await nextTick()
  // 此时本组件这一轮补丁已刷完，可读新 DOM
  console.log(box.value?.textContent)
}
</script>

<template>
  <div ref="box">{{ message }}</div>
</template>
```

`nextTick()` **返回 Promise**，可 `await nextTick()`；也支持 `nextTick(() => {})`。

### 与「同一轮多次赋值」

同一同步块里 `count.value++` 三次 → 默认仍一次调度更新（与 [`queueJob`](https://github.com/vuejs/core) 同类批处理）。不要在每个赋值后都指望中间态 DOM。

### 与 `watch flush: 'post'`

- **只关心本 `watch` 触发的数据**对应的视图：`flush: 'post'` 更直接。  
- **要等全局这一轮 Vue 更新都结束**（多个子组件、第三方库写 DOM）：`nextTick` 更常见。

### 实现（面试够用版）

运行时把 `nextTick` 回调放进 **微任务**；环境不支持时用 `MutationObserver` / `setImmediate` / `setTimeout` 降级。故一般**紧跟他处产生的同一轮微任务之后**，晚于当前同步栈，且多在浏览器**本次 DOM 补丁之后**（与 [事件循环](/md/浏览器/浏览器的事件循环.md) 中微任务顺序一致）。

### 常见用途

- 改数据后**量宽高、滚动到某元素、`.focus()`**。  
- 等子组件 `v-if` Mount 后再调子方法（仍要注意解耦，能用 props 就不用 ref 遥控）。  
- 测试里 `await nextTick()` 断言 DOM。

---

## 5. `watchEffect` 的清理：`onInvalidate`

```js
watchEffect((onInvalidate) => {
  const id = route.params.id
  let cancelled = false
  onInvalidate(() => { cancelled = true })
  fetchDetail(id).then((d) => { if (!cancelled) detail.value = d })
})
```

---

## 6. `provide` / `inject`：响应式必须在「引用」上贯穿

父 `provide('x', 纯数字)` → 子拿到**快照**。应 `provide('n', ref(0))` 或 `reactive`；防乱改可用 `readonly`（深层对象另议）。

---

## 7. 子组件何时重渲染？（和 `props` 引用有关）

`v-for` 里 `:item="{ ...row }"` 每次父 render **新对象** → 子 props 全变 → 大列表性能杀手。用 `computed` 稳定引用或 `v-memo`。

---

## 8. `v-model` 在组件上的协议

`v-model` → `modelValue` + `update:modelValue`；`v-model:title` → `title` + `update:title`。Vue 3.4+ 可 `defineModel`。

---

## 9. 列表 `key`

**业务主键**作 key；头部插入 + `index` key → 输入状态「串行」是典型的复用错误。

---

## 10. `keep-alive`：`include` / `exclude` 匹配的是**组件 `name`**

`script setup` 需 `defineOptions({ name: 'Foo' })`，否则匹配失败。`max` LRU 时注意 `deactivated` 里是否清定时器。

---

## 11. `v-memo`（3.2+）

依赖数组漏写会变但应刷新的字段 → **界面不更新**。昂贵子树再考虑用。

```vue
<div v-memo="[item.id, item.selected]">
  <HeavyChild :item="item" />
</div>
```

---

## 12. 编译期优化与运行时观测

- **静态提升**：不变 vnode 结构提到渲染闭包外，降创建/GC。  
- **patchFlag**：runtime 只 diff 动态位。  
- **`cacheHandlers`**：减少内联函数导致子组件无意义更新。

可结合 **Vue DevTools Timeline**、Chrome Performance 看 update 耗时。

---

## 13. `watch` 的 `flush: 'sync'` 与级联

`sync` 内再改别的响应式会**同步连锁**更新，栈深、难测，线上尽量不用。

---

## 14. Vue Router 4：`push` 可能 reject

守卫拦截、重复导航会 **reject**，需 `.catch` 或统一处理。

**history 部署** Nginx：

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

---

## 15. Pinia：`storeToRefs`

解构 store 状态丢响应式 → `storeToRefs(store)`；`action` 可直接解构。

---

## 16. `Teleport`：层叠、滚动、焦点

挂 `body` 避免父级 `overflow` 裁剪；模态要锁 `body` 滚动；可访问性考虑焦点陷阱。

---

## 17. `Suspense` 与异步 `setup`

顶层 `await` 需配合 `Suspense`/路由策略，并设计错误态。

---

## 18. `markRaw` / `shallowRef`

ECharts 等实例勿深度 `reactive`，易坏内部逻辑：

```js
const chart = shallowRef(null)
onMounted(() => {
  chart.value = markRaw(echarts.init(el))
})
```

---

## 19. `v-html` 与 XSS

只信**消毒后**内容，配 CSP。见 [XSS](/md/安全/XSS的理解.md)。

---

## 20. `@vue/compat`：按模块关特性

`compatConfig` 粒度化迁移，勿假设依赖库「默认可用」。

---

## 21. 微前端叠 Vue：三类真问题

多份 **Vue runtime**、**全局样式**、**基路径与 history** 不同步——会实实在在报错或白屏，不是概念题。

---

若你补充 **真实项目栈**，可把某一节改成「排障记录」叙事。
