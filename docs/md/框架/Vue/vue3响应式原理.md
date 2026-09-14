# Vue 3 响应式原理

## 面试回答

> Vue 3 响应式的核心可以压成一句：用 Proxy 拦住读写，读的时候把「当前正在跑的 effect」记到依赖图里，写的时候把订阅了这个 key 的 effect 找出来重新调度。组件渲染本身就是一个 effect，所以模板里读到的字段一变，对应组件会进入更新队列，而不是数据直接改 DOM。
>
> 依赖图是三层：`WeakMap<target, Map<key, Set<effect>>>`。`get` 里 `track`，`set` / `delete` 里 `trigger`；嵌套对象是惰性再包一层 Proxy，大对象初始化更友好。原始值没法被 Proxy 代理，所以用 `ref` 包一层，靠 `.value` 的访问器做同样的收集和触发。`computed` 是带 dirty 位的惰性 effect：依赖变了先标脏、通知订阅者，下次读才重算。
>
> 真正刷 DOM 前还有 scheduler：渲染 effect 不立刻同步重跑，而是 `queueJob` 进微任务队列，同一轮里多次改同一组件只渲染一次。这就是为什么改完数据要 `nextTick` 才能读到新 DOM。和 Vue 2 比，Proxy 能拦新增删除、`in`、`keys`、数组下标和 `length`，少了很多 `$set` 心智；边界是第三方实例要 `markRaw` / `shallowRef`，别被深代理搅乱。

**一句话总结：**

> Proxy 拦截 → track 收集 effect → trigger 调度 → scheduler 合并微任务 → 组件 render → patch DOM。

---

## 核心原理

### 1. 为什么需要响应式

没有依赖追踪，框架只能「整页重算」或让你手动订阅。Vue 选的是：在跑副作用时自动记住读过哪些字段，字段变了只通知相关副作用。

组件更新单元通常是**组件的 render effect**（不是 Solid 那种逐 DOM 绑定）。说「细粒度」时，更准确是指依赖按 key 收集，触发精确到订阅了该 key 的 effect。

---

### 2. 整体执行链路

```text
reactive / ref 创建代理
  → 组件挂载：创建渲染 effect 并 run
  → render 读 state.xxx → get trap → track(target, key)
  → 写入 state.xxx → set trap → trigger
  → effect.scheduler → queueJob
  → 微任务 flush → effect.run → 新 VNode
  → patch → 真实 DOM
```

| 概念 | 一句话职责 |
| --- | --- |
| Proxy | 拦住读写，插入 track/trigger |
| effect | 可重新执行的副作用，组件渲染是其中一种 |
| track / trigger | 建边 / 通知 |
| scheduler | 决定「怎么重跑」（常进队列） |
| ref | 给原始值（和可整体替换的对象）做盒子 |

---

### 3. 依赖图：`targetMap → depsMap → dep`

```text
WeakMap<target, Map<key, Set<ReactiveEffect>>>
```

| 层 | 含义 |
| --- | --- |
| target | **原始对象**（不用 proxy 当 key，避免环） |
| key | 属性名；数组还有 `length`；迭代用 `ITERATE_KEY` 等 |
| dep | 订阅了这个 `(target, key)` 的 effect 集合 |

`WeakMap`：target 可被 GC 时依赖条目一起消失。

---

### 4. Proxy：读收集、写通知

| trap | 时机 | 行为 |
| --- | --- | --- |
| `get` | 读属性 | `track`；对象值惰性 `reactive` |
| `set` | 赋值 | `Object.is` 有变化才 `trigger` |
| `deleteProperty` | `delete` | 有键才 `trigger` |
| `has` / `ownKeys` | `in` / `keys` / `for...in` | track（迭代常挂 `ITERATE_KEY`） |

用 `Reflect.get/set(..., receiver)`，保证访问器里的 `this` 仍走代理，依赖不丢。

#### Trace：一次读写

```js
const state = reactive({ count: 0 })
effect(() => console.log(state.count))
state.count++
```

| 步骤 | 发生什么 |
| --- | --- |
| effect.run | `activeEffect =` 当前 effect |
| 读 `count` | track：把 effect 放进 `dep(count)`，effect.deps 反向记下 |
| `count++` | set → trigger → 取出 dep → scheduler 或 run |
| 再 run | 先清旧依赖再收集，避免条件分支残留订阅 |

`Map`/`Set` 等集合有专用 handler：方法在原型上，不能只靠普通 get/set。

---

### 5. effect：活跃栈、双向 deps、清理

- `track` 只认当前 `activeEffect`（嵌套时用栈恢复外层）。
- effect 上有 `deps[]`，方便 `stop` 和**每次 run 前清旧依赖**。
- 组件渲染 effect 通常带 `scheduler`：把 job 推进更新队列，而不是同步 `run`。

---

### 6. ref / computed

**ref**：Proxy 代理不了 `0`/`'x'`，用 `{ value }` 访问器做 track/trigger。对象型 ref 内部常再挂 `reactive`；模板顶层会解包 `.value`。

**computed**：依赖变 → 标 `_dirty` 并 trigger 自己的订阅者 → **下次读 `.value` 才重算**。getter 应保持纯。

| API | 心智 |
| --- | --- |
| `reactive` | 对象深代理（惰性） |
| `ref` | 任意值盒子，可整体替换 |
| `shallowRef` / `markRaw` | 大列表整替、第三方实例 |
| `computed` | 缓存派生 |

---

### 7. 调度与 nextTick

```text
同一同步块 count++ 三次
  → trigger 多次
  → 同一组件 job 只入队一次
  → Promise 微任务 flushJobs
  → 一次 render + patch
```

`nextTick` ≈ 等这轮队列（及相关 DOM 更新）完成后再跑回调。`watch` 的 `flush: 'pre' | 'post' | 'sync'` 决定回调相对组件更新的位置。

---

### 8. 设计取舍与边界

| 选择 | 得到 | 代价 / 边界 |
| --- | --- | --- |
| Proxy | 新增删除、迭代、数组更自然 | 不能代理原始值；部分内置对象需特殊对待 |
| 惰性深代理 | 大对象友好 | 忘记解包 / raw 混用会踩坑 |
| 组件级 render effect | 实现清晰 | 不是逐 DOM 细更新；大组件仍要拆 |

---

## 常见误区

### ❌ Vue 3 是逐属性直接改 DOM 的极细粒度更新

### ✅ 更准确的说法

依赖按 key 收集；常见结果是组件 render effect 重跑再 patch。

### 为什么？

和 Solid 模型不同，追问更新单元时容易露馅。

---

### ❌ 有了 Proxy 就一定比 Vue 2 全方位更快

### ✅ 更准确的说法

少了初始化递归劫持和 `$set` 坑；性能还取决于组件切分、列表、编译优化。

### 为什么？

面试要听边界，不听口号。

---

### ❌ `ref` 只是语法糖，和 `reactive` 完全一样

### ✅ 更准确的说法

`ref` 解决原始值与整体替换；`reactive` 适合稳定对象结构。解包规则也不同。

---

### ❌ 改完响应式数据，下一行一定能读到新 DOM

### ✅ 更准确的说法

更新常进微任务队列；要新 DOM 用 `nextTick` 或 flush 之后的时机。

---

### ❌ `computed` 依赖一变就立刻重算

### ✅ 更准确的说法

先标脏；下次读取才算。有人订阅时会通知，但不等于同步重跑 getter。

---

## 高频追问

### Vue 3 响应式一句话怎么说？

Proxy 拦截读写，track/trigger 维系 effect 依赖图，组件渲染是 effect，经 scheduler 批量更新再 patch。

### 为什么用 Proxy 替代 defineProperty？

能拦新增删除、迭代、数组下标与 length；Vue 2 对已有属性劫持，动态增删和数组要额外手段。

### 依赖存在哪？为什么用 WeakMap？

`target → key → Set<effect>`；WeakMap 让 target 可被回收。

### reactive 和 ref 怎么选？

原始值 / 要整体替换 → ref；一组稳定字段对象 → reactive 也可。模板注意解包。

### computed 的 dirty 是什么？

惰性缓存开关：依赖变了标脏，读时才重算。

### 为什么多次修改只渲染一次？

渲染 effect 走 scheduler 入队去重，微任务里 flush 一次。

### markRaw / shallowRef 什么时候用？

第三方实例自管状态、或大数据只整体替换时，避免深代理成本与行为干扰。

---

## 延伸阅读

- [Vue 渲染原理](/md/框架/Vue/Vue%20渲染原理.md)
- [nextTick 与虚拟 DOM](/md/框架/Vue/nextTick与虚拟DOM.md)
- [模板编译流程](/md/框架/Vue/模板编译流程.md)
- [Vue 2 和 Vue 3 区别](/md/框架/Vue/vue2和3的区别.md)
- [Vue vs React](/md/框架/Vue%20vs%20React.md)
- [面试速记：React & Vue](/md/面试准备/技术/React%20&%20Vue.md)
