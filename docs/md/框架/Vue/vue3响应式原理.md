# Vue 3 响应式原理

## 面试回答

> Vue 3 响应式的核心可以压成一句：用 Proxy 拦住读写，读的时候把「当前正在跑的 effect」记到依赖图里，写的时候把订阅了这个 key 的 effect 找出来重新调度。组件渲染本身就是一个 effect，所以模板里读到的字段一变，对应组件会进入更新队列，而不是数据直接改 DOM。
>
> 依赖关系可以先按“原始对象 → 属性 → 订阅者”三层理解。`get` 里 `track`，`set` / `delete` 里 `trigger`；嵌套对象是惰性再包一层 Proxy，大对象初始化更友好。原始值没法被 Proxy 代理，所以用 `ref` 包一层，靠 `.value` 的访问器做同样的收集和触发。computed 缓存派生结果，依赖变化后使缓存需要重新检查，读取时再按依赖状态决定是否重算。
>
> 真正刷 DOM 前还有 scheduler：渲染 effect 不立刻同步重跑，而是 `queueJob` 进微任务队列，同一轮里多次改同一组件只渲染一次。这就是为什么改完数据要 `nextTick` 才能读到新 DOM。和 Vue 2 比，Proxy 能拦新增删除、`in`、`keys`、数组下标和 `length`，少了很多 `$set` 心智；边界是第三方实例要 `markRaw` / `shallowRef`，别被深代理搅乱。
>
> 追问边界时我还会补两点：第一，收集依赖的是一次执行中真正读到的分支，effect 重新执行时要更新依赖关系，否则条件切换后会残留无效订阅；第二，`reactive` 返回的是 Proxy，直接解构基本类型属性或绕过 Proxy 修改原对象都会断开这次属性访问的响应式连接。需要解构传递时用 `toRef` / `toRefs`，外部实例或大块不可变数据再考虑浅响应式逃生舱。

**一句话总结：**

> Proxy 拦截 → track 收集 effect → trigger 调度 → scheduler 合并微任务 → 组件 render → patch DOM。

---

## 核心原理

### 1. 为什么需要响应式

模板读取 state.count 时，我们没有手写订阅，之后修改 count 却能更新界面。Vue 在渲染期间记录这次读取，把渲染副作用和属性关联起来；写入时先通知订阅者，再由调度器安排重新渲染。依赖追踪决定通知谁，调度器决定何时执行，两者分开才能合并连续修改。

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

下图是教学模型，不是所有 Vue 3 版本的字段定义。以 Vue 3.5.13 为例，源码通过 Dep 和 Link 维护依赖与订阅者的双向连接，并使用版本信息减少重复工作。读模型时抓住对象、属性、订阅关系，对照源码时再核对具体结构。

```text
WeakMap<target, Map<key, Set<effect>>>
```

| 层 | 含义 |
| --- | --- |
| target | **原始对象**，用作依赖索引的身份 |
| key | 属性名；数组还有 `length`；迭代用 `ITERATE_KEY` 等 |
| dep | 订阅了这个 `(target, key)` 的 effect 集合 |

WeakMap 的键不会单独阻止 target 被回收；组件或闭包仍引用的数据不会因此自动释放。

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
| 再 run | 更新本轮实际使用的依赖，移除失效订阅 |

`Map`/`Set` 等集合有专用 handler：方法在原型上，不能只靠普通 get/set。

---

### 5. effect：活跃栈、双向 deps、清理

- `track` 只认当前 `activeEffect`（嵌套时用栈恢复外层）。
- effect 需要反向维护依赖，支持停止和移除失效订阅；deps 数组是教学模型，Vue 3.5.13 使用链表连接及版本标记，不应概括成每次先全部清空。
- 组件渲染 effect 通常带 `scheduler`：把 job 推进更新队列，而不是同步 `run`。

#### 为什么依赖必须动态更新

```js
const state = reactive({ ok: true, text: 'hello' })
effect(() => {
  console.log(state.ok ? state.text : 'hidden')
})
state.ok = false
state.text = 'updated' // 已不再订阅 text，不应因此重新打印
```

第一次 `ok === true` 时会读取 `ok` 和 `text`；之后 `ok === false`，本轮只应依赖 `ok`。如果旧的 `text` 订阅不被清理，继续修改 `text` 仍会触发无意义执行。因此依赖关系不是初始化时固定下来，而要随着每次 effect 实际访问的分支更新。

触发时也不能只通知当前 key：新增或删除对象属性会影响 `Object.keys` / `for...in` 的迭代依赖；数组新增下标可能影响 `length`；`Map` / `Set` 的 add、delete、clear 也有相应迭代依赖。这是 `TriggerOpTypes` 和 `ITERATE_KEY` 一类内部标识存在的原因。

---

### 6. ref / computed

**ref**：Proxy 代理不了 `0`/`'x'`，用 `{ value }` 访问器做 track/trigger。对象型 ref 内部常再挂 `reactive`；模板顶层会解包 `.value`。

computed 缓存 getter 的结果。依赖变化后缓存需要检查，后续读取时再按依赖状态决定是否重算。Vue 3.5.13 使用标志和版本信息协作维护缓存，不宜把所有版本都概括成同一个 `_dirty` 字段。getter 应保持纯。

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

#### 常见响应式断链

```js
const state = reactive({ count: 0 })
let { count } = state
count++ // 只是修改局部变量，不再经过 state.count 的 Proxy trap

const raw = {}
const proxy = reactive(raw)
raw.value = 1 // 绕过 proxy，不会触发依赖 proxy.value 的 effect
```

Proxy 和原对象身份也不同：`proxy !== raw`。业务代码应尽量统一使用代理对象；需要保留属性响应式地解构时使用 `toRef` / `toRefs`。

---

## 常见误区

- **依赖按属性收集，所以修改属性就直接改 DOM**：依赖追踪确定订阅者，组件通常重新渲染并 patch；通知粒度和 DOM 更新方式不是一回事。
- **Proxy 全方位比 Vue 2 更快**：它能拦截更多操作，也支持惰性深代理，但实际耗时还取决于组件拆分、列表规模和编译优化。
- **ref 和 reactive 只是写法不同**：ref 能承载原始值并整体替换内容，reactive 返回对象代理；它们的身份、解构与解包规则不同。
- **修改数据后马上就能读到新 DOM**：状态先变，组件 DOM 更新通常被调度合并。需要等待已安排的 DOM 更新时使用 nextTick，它不保证浏览器已经绘制。
- **computed 依赖一变就同步执行 getter**：它先使缓存需要检查，读取时再按依赖状态决定是否重算；教学里的 dirty 不应理解成所有版本都使用同一字段。

## 高频追问

### Vue 3 响应式一句话怎么说？

Proxy 拦截读写，track/trigger 维系 effect 依赖图，组件渲染是 effect，经 scheduler 批量更新再 patch。

### 为什么用 Proxy 替代 defineProperty？

能拦新增删除、迭代、数组下标与 length；Vue 2 对已有属性劫持，动态增删和数组要额外手段。

### 依赖存在哪？为什么用 WeakMap？

按 target → key → 订阅者理解；Set 是教学模型。Vue 3.5.13 由 Dep/Link 维护具体关系，WeakMap 不会单独阻止 target 回收。

### reactive 和 ref 怎么选？

原始值 / 要整体替换 → ref；一组稳定字段对象 → reactive 也可。模板注意解包。

### computed 的 dirty 是什么？

惰性缓存开关：依赖变了标脏，读时才重算。

### 为什么多次修改只渲染一次？

渲染 effect 走 scheduler 入队去重，微任务里 flush 一次。

### markRaw / shallowRef 什么时候用？

第三方实例自管状态、或大数据只整体替换时，避免深代理成本与行为干扰。

### reactive 解构为什么可能丢响应式？

把基本类型属性解构到局部变量后，后续读写不再经过原对象的 Proxy trap。需要保持连接时使用 `toRef` / `toRefs`，或继续通过代理对象访问。

---

## 延伸阅读

- [Vue 渲染原理](/md/框架/Vue/Vue%20渲染原理.md)
- [nextTick 与虚拟 DOM](/md/框架/Vue/nextTick与虚拟DOM.md)
- [模板编译流程](/md/框架/Vue/模板编译流程.md)
- [Vue 2 和 Vue 3 区别](/md/框架/Vue/vue2和3的区别.md)
- [Vue vs React](/md/框架/Vue%20vs%20React.md)
- [面试速记：React & Vue](/md/面试准备/技术/React%20&%20Vue.md)

核查参考：[Vue 响应式深入](https://vuejs.org/guide/extras/reactivity-in-depth)、[Vue 3.5.13 dep.ts](https://github.com/vuejs/core/blob/v3.5.13/packages/reactivity/src/dep.ts)。
