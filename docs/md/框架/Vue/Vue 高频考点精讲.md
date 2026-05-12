# Vue 高频面试题

深度原理见 [Vue3 响应式原理](/md/框架/Vue/vue3响应式原理.md)、[Vue Diff 算法](/md/框架/Vue/Vue%20Diff算法.md)、[Vue2 与 Vue3 的区别](/md/框架/Vue/vue2和3的区别.md)。

---

## 问题：Vue 的响应式原理是什么？Vue 2 和 Vue 3 有什么区别？

### Vue 2：Object.defineProperty

对 data 对象递归遍历，给每个属性用 `Object.defineProperty` 定义 getter/setter。getter 里收集依赖（当前正在渲染的 Watcher），setter 里通知依赖更新。

**局限**：
- 新增/删除属性检测不到，必须用 `Vue.set` / `Vue.delete`
- 数组下标赋值和 length 修改检测不到，需要重写数组的 7 个方法（push、pop、shift、unshift、splice、sort、reverse）
- 初始化时递归遍历整个 data，大对象性能差

### Vue 3：Proxy

用 `Proxy` 代理整个对象，拦截 get/set/deleteProperty/has/ownKeys 等操作。

**优势**：
- 新增/删除属性天然支持
- 数组操作天然支持
- **惰性代理**：只有访问到的嵌套对象才会被包装，不递归整棵树
- 逻辑集中在 `@vue/reactivity` 包，可独立使用

**核心流程**：
```
读属性 → get trap → track(target, key) → 收集当前 effect
写属性 → set trap → trigger(target, key) → 通知所有订阅的 effect 重跑
```

**面试怎么说**：
> "Vue 3 用 Proxy 替代了 defineProperty，解决了 Vue 2 不能检测属性新增删除和数组下标修改的问题。Proxy 是惰性代理，只有访问到的嵌套对象才会被包装，性能更好。依赖收集的核心数据结构是一个三层映射：WeakMap<target, Map<key, Set<effect>>>。"

---

## 问题：ref 和 reactive 有什么区别？什么时候用哪个？

**reactive**：只能接受对象类型，返回 Proxy 代理对象

```js
const state = reactive({ count: 0, name: 'test' })
state.count++  // 直接用，不需要 .value
```

**ref**：可以接受任何类型，包装成 `{ value: xxx }` 的对象

```js
const count = ref(0)
count.value++  // script 里需要 .value
// template 里自动解包，不需要 .value
```

**为什么 ref 需要 .value**：Proxy 只能代理对象，原始值（数字、字符串）没法拦截读写，所以 ref 包了一层对象，通过 getter/setter 拦截 `.value` 的访问。

**怎么选**：
- 单个原始值：`ref`
- 一组相关的状态：`reactive`
- 需要整块替换的对象（比如接口返回的数据）：`ref`（因为可以直接 `data.value = newData`）
- `reactive` 不能整块替换根引用，否则丢失响应式

**常见坑**：解构 reactive 会丢失响应式

```js
const state = reactive({ x: 1, y: 2 })
const { x, y } = state  // ❌ x, y 是普通值，不再响应式
const { x, y } = toRefs(state)  // ✅ x, y 是 ref
```

---

## 问题：computed 和 watch 有什么区别？什么时候用哪个？

**computed**：
- 有返回值，是一个派生状态
- 有缓存，依赖不变就不重新计算
- getter 应该是纯函数，不能有副作用

```js
const fullName = computed(() => `${firstName.value} ${lastName.value}`)
```

**watch**：
- 没有返回值，用来执行副作用
- 依赖变化时执行回调（请求接口、操作 DOM、写 localStorage 等）

```js
watch(() => route.params.id, async (newId) => {
  data.value = await fetchData(newId)
})
```

**watchEffect**：
- 自动收集依赖，不需要手动指定
- 立即执行一次

```js
watchEffect(() => {
  console.log(count.value)  // 自动追踪 count
})
```

**选择原则**：
- 需要一个派生值 → computed
- 需要在数据变化时做事情（副作用）→ watch / watchEffect
- 需要精确控制监听哪个数据 → watch
- 依赖关系复杂、不想手动列依赖 → watchEffect

---

## 问题：Vue 的 nextTick 是什么？为什么需要它？

### 为什么需要

Vue 的 DOM 更新是**异步批处理**的——同一同步代码里多次改数据，只会触发一次渲染。所以改完数据后立刻读 DOM，拿到的还是旧的。

```js
message.value = 'Hello'
console.log(el.textContent)  // 还是旧内容！
await nextTick()
console.log(el.textContent)  // 现在是 'Hello'
```

### 实现原理

`nextTick` 本质是把回调放到微任务队列里（`Promise.resolve().then(...)`），排在 Vue 的 DOM 更新任务之后执行。

### 常见用途

- 改数据后需要量 DOM 尺寸、滚动到某位置、focus 某个输入框
- 等 `v-if` 控制的组件挂载后再操作它
- 测试里断言 DOM 内容

### 和 watch flush: 'post' 的区别

- `flush: 'post'`：只关心当前 watch 监听的数据对应的 DOM 更新
- `nextTick`：等整个 Vue 更新队列都 flush 完

---

## 问题：Vue 组件间通信有哪些方式？

| 方式 | 适用场景 | 说明 |
| --- | --- | --- |
| **props / emit** | 父子 | 最基础，单向数据流 |
| **v-model** | 父子双向绑定 | `modelValue` + `update:modelValue` 的语法糖 |
| **provide / inject** | 跨层级 | 祖先提供，后代注入，避免 props 逐层传递 |
| **Pinia / Vuex** | 全局状态 | 多组件共享的状态 |
| **ref + defineExpose** | 父调子方法 | 父组件通过 ref 直接调用子组件暴露的方法 |
| **事件总线（mitt）** | 任意组件 | Vue 3 移除了 `$on/$off`，用第三方 mitt 替代 |

**provide / inject 的响应式注意**：

```js
// 父组件
provide('count', ref(0))  // ✅ 传 ref，子组件能响应变化
provide('count', 0)       // ❌ 传原始值，子组件拿到的是快照
```

防止子组件乱改：用 `readonly` 包一层。

---

## 问题：v-model 在组件上是怎么工作的？

`v-model` 是语法糖：

```vue
<!-- 这两种写法等价 -->
<MyInput v-model="message" />
<MyInput :modelValue="message" @update:modelValue="message = $event" />
```

**子组件实现**：

```vue
<script setup>
const props = defineProps(['modelValue'])
const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <input :value="props.modelValue" @input="emit('update:modelValue', $event.target.value)" />
</template>
```

**Vue 3.4+ 的 defineModel**（更简洁）：

```vue
<script setup>
const model = defineModel()  // 自动处理 props + emit
</script>

<template>
  <input v-model="model" />
</template>
```

**多个 v-model**：

```vue
<UserForm v-model:name="userName" v-model:age="userAge" />
```

---

## 问题：keep-alive 是什么？怎么用？有什么坑？

`keep-alive` 缓存组件实例，切换时不销毁而是"冻结"，再切回来直接恢复，避免重复创建和请求数据。

```vue
<keep-alive :include="['UserList', 'OrderList']" :max="10">
  <router-view />
</keep-alive>
```

**生命周期**：
- 进入缓存：`onDeactivated`（代替 `onUnmounted`）
- 恢复：`onActivated`（代替 `onMounted`）

**常见坑**：

1. **include 匹配的是组件 name**：`<script setup>` 里需要 `defineOptions({ name: 'UserList' })`，否则匹配不上
2. **定时器/订阅泄漏**：组件被缓存时不会触发 unmounted，定时器还在跑。必须在 `onDeactivated` 里清理
3. **max LRU 淘汰**：超过 max 数量时最久没用的组件会被销毁，要确保 deactivated 里做了清理

---

## 问题：Vue Router 的导航守卫有哪些？执行顺序是什么？

### 三种级别

**全局守卫**：
- `router.beforeEach`：每次导航前
- `router.afterEach`：每次导航后

**路由独享守卫**：
- `beforeEnter`：写在路由配置里

**组件内守卫**：
- `onBeforeRouteLeave`：离开当前路由
- `onBeforeRouteUpdate`：路由参数变化但组件复用

### 完整执行顺序

```
1. 触发导航
2. 失活组件的 onBeforeRouteLeave
3. 全局 beforeEach
4. 复用组件的 onBeforeRouteUpdate
5. 路由配置的 beforeEnter
6. 解析异步路由组件
7. 激活组件的 beforeRouteEnter（Options API）
8. 全局 beforeResolve
9. 导航确认
10. 全局 afterEach
11. DOM 更新
12. beforeRouteEnter 的 next 回调
```

**常见用途**：
- `beforeEach`：登录鉴权、权限校验
- `afterEach`：页面标题设置、埋点上报
- `onBeforeRouteLeave`：表单未保存提示

---

## 问题：Pinia 和 Vuex 有什么区别？

| 维度 | Vuex | Pinia |
| --- | --- | --- |
| API 风格 | mutations + actions | 只有 actions（同步异步都行） |
| TypeScript | 支持但类型推断弱 | 原生 TS，类型推断完整 |
| 模块化 | 需要 modules 嵌套 | 每个 store 独立，按需引入 |
| 体积 | 较大 | 更轻量 |
| DevTools | 支持 | 支持 |
| SSR | 需要额外配置 | 内置支持 |

**Pinia 的优势**：
- 去掉了 mutations，减少样板代码
- store 之间可以互相引用，不需要嵌套 modules
- 完美的 TypeScript 支持
- 支持 Composition API 风格定义 store

```js
// Pinia store
export const useUserStore = defineStore('user', () => {
  const name = ref('')
  const isLoggedIn = computed(() => !!name.value)
  
  async function login(credentials) {
    const user = await api.login(credentials)
    name.value = user.name
  }
  
  return { name, isLoggedIn, login }
})
```

**storeToRefs 的坑**：解构 store 的状态要用 `storeToRefs`，否则丢失响应式；action 可以直接解构。

```js
const store = useUserStore()
const { name, isLoggedIn } = storeToRefs(store)  // ✅ 响应式
const { login } = store  // ✅ action 直接解构
```

---

## 问题：Vue 3 的 Teleport 是什么？解决什么问题？

**问题**：模态框、下拉菜单、Toast 这些组件逻辑上属于某个父组件，但 DOM 上需要挂到 `body` 下面——否则会被父级的 `overflow: hidden`、`z-index`、`transform` 等 CSS 影响。

**Teleport 的作用**：把组件的 DOM 渲染到指定的目标位置，但逻辑（props、事件、生命周期）仍然属于原来的组件树。

```vue
<template>
  <button @click="showModal = true">打开</button>
  
  <Teleport to="body">
    <div v-if="showModal" class="modal">
      <!-- 渲染到 body 下，但逻辑仍属于当前组件 -->
      <p>{{ message }}</p>
      <button @click="showModal = false">关闭</button>
    </div>
  </Teleport>
</template>
```

**注意事项**：
- 模态框要做焦点陷阱（Tab 键不能跳出模态框）
- 打开时锁 body 滚动（`overflow: hidden`）
- 关闭时恢复焦点到触发元素

---

## 问题：Vue 3 的编译期优化有哪些？

Vue 3 的模板编译器做了大量优化，让运行时 diff 的工作量大幅减少：

### 1. 静态提升（Static Hoisting）

不变的 VNode 提升到 render 函数外面，只创建一次，后续 render 直接复用，不参与 diff。

### 2. PatchFlag

给动态节点打标记，标明哪些部分是动态的（文本、class、style、props）。patch 时只比对标记位，不做全量 props diff。

```js
// 编译产物
createVNode("div", { class: dynamicClass }, text, 2 /* TEXT */)
// patchFlag = 2 表示只有文本是动态的，patch 时只比对文本
```

### 3. Block Tree

把动态节点"拍平"收集到最近的 block 根节点，跳过中间的静态结构。这样 diff 时直接遍历动态节点数组，不需要递归整棵树。

### 4. 事件缓存（cacheHandlers）

内联事件处理函数被缓存，避免每次 render 创建新函数导致子组件因 props 引用变化而无意义更新。

**面试怎么说**：
> "Vue 3 快不只因为 diff 算法改进，更因为编译器让进入 diff 的节点大幅减少。静态节点提升后不参与 diff，动态节点通过 patchFlag 精确标记变化位，Block Tree 跳过静态结构直接遍历动态节点。"

---

## 问题：v-if 和 v-show 有什么区别？什么时候用哪个？

| | v-if | v-show |
| --- | --- | --- |
| 原理 | 条件为 false 时**不渲染** DOM | 始终渲染，用 `display: none` 隐藏 |
| 切换成本 | 高（销毁/重建组件） | 低（只切换 CSS） |
| 初始成本 | 条件为 false 时无成本 | 始终有渲染成本 |
| 适用场景 | 不频繁切换、或条件很少为 true | 频繁切换 |

**注意**：`v-if` 切换时组件会经历完整的销毁和重建生命周期，内部状态会丢失。如果需要保留状态，用 `v-show` 或 `keep-alive`。

---

## 问题：Vue 的生命周期有哪些？父子组件的执行顺序是什么？

### Vue 3 生命周期（Composition API）

```
setup()
onBeforeMount → onMounted
onBeforeUpdate → onUpdated
onBeforeUnmount → onUnmounted
```

### 父子组件执行顺序

**挂载**：
```
父 setup → 父 onBeforeMount → 子 setup → 子 onBeforeMount → 子 onMounted → 父 onMounted
```

**更新**：
```
父 onBeforeUpdate → 子 onBeforeUpdate → 子 onUpdated → 父 onUpdated
```

**销毁**：
```
父 onBeforeUnmount → 子 onBeforeUnmount → 子 onUnmounted → 父 onUnmounted
```

**规律**：父组件的"完成"钩子（mounted、updated、unmounted）总是等子组件先完成。

---

## 问题：key 的作用是什么？为什么不能用 index？

**key 的作用**：在 diff 算法中标识"这是同一个节点"，让 Vue 能正确复用和移动 DOM 元素。

**用 index 的问题**：

```vue
<!-- 列表：[A, B, C]，用 index 做 key：A→0, B→1, C→2 -->
<!-- 头部插入 D 后：[D, A, B, C]，key 变成：D→0, A→1, B→2, C→3 -->
<!-- Vue 认为 key=0 的节点从 A 变成了 D，会更新内容而不是移动 -->
```

后果：
1. **性能差**：每个节点都要更新内容，而不是简单移动
2. **状态错乱**：如果列表项有输入框，输入的内容会错位

**正确做法**：用业务唯一 ID

```vue
<li v-for="item in list" :key="item.id">{{ item.name }}</li>
```

---

## 问题：Vue 3 的 Suspense 是什么？怎么用？

Suspense 用来处理异步组件的加载状态——在异步内容准备好之前显示 fallback（loading）。

```vue
<Suspense>
  <template #default>
    <AsyncComponent />  <!-- 异步组件或顶层 await 的组件 -->
  </template>
  <template #fallback>
    <LoadingSpinner />  <!-- 加载中显示 -->
  </template>
</Suspense>
```

**触发条件**：子组件的 `setup` 是 async 的（顶层 await）

```vue
<script setup>
const data = await fetchData()  // 顶层 await，需要 Suspense 包裹
</script>
```

**注意**：
- Suspense 不处理错误，错误需要配合 `onErrorCaptured` 或 Error Boundary 模式
- 目前仍是实验性功能，API 可能变化

---

## 问题：markRaw 和 shallowRef 什么时候用？

当你有一个**不需要深度响应式**的对象时——典型场景是第三方库的实例。

**问题**：ECharts 实例、编辑器实例这些对象内部有大量属性和方法，如果被 `reactive` 深度代理，会：
1. 性能差（代理整棵树）
2. 行为异常（内部 `this.xxx = ...` 的写入会触发 Vue 的调度）

**解决**：

```js
import { shallowRef, markRaw } from 'vue'

// 方式一：shallowRef，只有 .value 的替换是响应式的，内部不代理
const chart = shallowRef(null)
onMounted(() => {
  chart.value = echarts.init(el)
})

// 方式二：markRaw，标记对象永远不被代理
const chart = ref(null)
onMounted(() => {
  chart.value = markRaw(echarts.init(el))
})
```

**其他场景**：大数组只整体替换不修改内部元素时，`shallowRef` 省掉整树代理成本。
