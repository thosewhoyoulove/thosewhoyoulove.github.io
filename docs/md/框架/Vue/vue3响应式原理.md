# Vue 3 响应式原理

Vue 3 将响应式抽成独立包 **`@vue/reactivity`**（`reactive`、`ref`、`computed`、`effect` 等）。组件渲染本质是注册一个 **副作用（effect）**：读数据时 **track**，写数据时 **trigger**，调度后重跑 effect，从而更新视图。

与 Vue 2 对比见 [Vue 2 与 Vue 3 的区别](/md/框架/Vue/vue2和3的区别.md)；解包、 `watch`/`nextTick` 的时序见 [Vue 高频考点精讲](/md/框架/Vue/Vue%20高频考点精讲.md)。

---

## 1. 为何用 Proxy 而不是 `defineProperty`

- **属性增删、`ownKeys`**：`defineProperty` 只能对已存在属性描述符；Vue 2 需 `$set` / 改数组方法绕路；Proxy 可统一拦截。  
- **数组**：下标、长度变化在 Vue 2 要特殊处理；Vue 3 与普通对象同一套拦截。  
- **惰性**：`reactive` 往往**访问到哪一层代理到哪一层**，不必初始化时整树递归（大对象更友好）。

**限制**：`Proxy` 不能代理部分内置对象或已被 `Object.freeze` 等极端情况；若遇到，文档会建议 `shallowRef` / `markRaw` 等（见高频考点）。

---

## 2. 最小模型：`track` 与 `trigger`

简化理解（非逐行源码）：

1. **当前活跃 effect**（例如正在跑的组件渲染函数）在全局栈里有一份。  
2. **读**响应式对象某 key → `get`  trap → **track(target, key)**：把当前 effect 记到该数据的「订阅者集合」。  
3. **写**某 key → `set` trap → **trigger(target, key)**：取出订阅者，**调度**执行（合并同一轮多次写入）。

调度层会做 **去重与批处理**，同一 tick 内多次修改往往只触发**一轮**视图更新（与 [高频考点精讲 §4 nextTick](/md/框架/Vue/Vue%20高频考点精讲.md) 讲的批更新同一语境）。

---

## 3. `reactive`：仅对象，`ref`：任意值

**`reactive(raw)`**  
返回 `Proxy`；适用于对象 / 数组 / `Map` / `Set` 等支持的类型。嵌套对象在访问路径上**按需**转为响应式。

**`ref(initialValue)`**  
内部用一个对象包一层 `.value`：原始类型只能这样包；对象类型则 `.value` 内部再挂 `reactive`。模板里顶层 `ref` **自动解包**；`script` 里用 `.value`。

```js
import { reactive, ref } from 'vue'

const state = reactive({ count: 0 })
state.count++ // 触发更新

const n = ref(0)
n.value++     // 触发更新
```

---

## 4. `effect` 与依赖收集（与组件的关系）

运行时内部用 **`effect(fn, options?)`** 包装组件渲染、 `watch` 回调等）。`fn` 执行期间读到的响应式字段会被 **track**；字段变化后 **`fn` 被重新调度**。

- **`computed`**：内部是带缓存的 effect，仅依赖变时重算。  
- **`watch(source, cb)`**：`source` 变化触发 `cb`，带 `flush` 控制相对 DOM 的先后（见高频考点 §3、§4）。

若脱离框架单测 `@vue/reactivity`，典型写法：

```js
import { reactive, effect } from '@vue/reactivity'

const state = reactive({ count: 0 })

effect(() => {
  console.log('count =', state.count)
})

state.count = 1 // effect 再跑一次
```

---

## 5. 深度响应式与性能出口

- 默认 **深度**：嵌套对象访问路径会被代理（除非使用 **shallow** 系 API）。  
- **大对象 / 第三方实例**：不需要响应式可用 **`markRaw`** 或 **`shallowRef`**，避免无用代理和破坏类内部（如 ECharts）。

---

## 6. `toRef` / `toRefs` / `readonly`

- 解构 `reactive` 丢响应式 → **`toRefs(state)`** 返回同名 ref 对象。  
- **`toRef(state, 'key')`**：单字段桥接。  
- **`readonly(proxy)`**：禁止 `set`，仍可读并追踪（用于 `provide` 等「别改我」场景）。

---

## 7. `computed`

- **惰性 + 缓存**：依赖不变不重复求值；内部仍是基于 effect 的依赖图。  
- 应写**纯**派生；副作用放 `watch` / `watchEffect`。

```js
import { reactive, computed } from 'vue'
const s = reactive({ n: 1 })
const doubled = computed(() => s.n * 2)
console.log(doubled.value)
s.n = 2
console.log(doubled.value)
```

---

## 8. 与视图更新的衔接（口述题）

**数据变更** → `trigger` → 调度 **`scheduler`**（组件更新入队、合并）→ **渲染 effect** 重跑 → **render** 产出新 VNode → **patch** DOM。

编译期的 **patchFlag** 等会缩小 patch 范围（详见 [Vue 2 与 Vue 3 的区别 §5](/md/框架/Vue/vue2和3的区别.md)）。

---

## 9. 小结

| 概念 | 作用 |
| --- | --- |
| `Proxy` | 拦截读写，统一响应式语义 |
| `track` / `trigger` | 订阅与发布 |
| `effect` | 把「读数据」和「之后要重跑的逻辑」绑在一起 |
| `ref` / `reactive` | 两种入口，模板/组合式 API 协同 |
| 批处理 / 调度 | 少刷 DOM、合并更新，与 `nextTick` 同一套时间维度 |

掌握以上即可支撑大部分中高级面试中的「响应式」追问；再深到**位运算 patchFlag、数组降级策略**等，可对照 Vue core 源码按需向下钻。
