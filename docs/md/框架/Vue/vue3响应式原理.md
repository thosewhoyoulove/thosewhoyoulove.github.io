# Vue 3 响应式原理

## 面试定位

Vue 3 响应式是 Vue 面试最核心的原理题。回答时要讲清 `Proxy`、依赖收集、派发更新、`effect`、`ref`、`computed`、调度队列，以及为什么 Vue 3 相比 Vue 2 更好。

## 核心原理

响应式在 Vue 3 中被拆成独立包 **`@vue/reactivity`**，可脱离渲染器单独使用。核心就三件事：

1. **`Proxy`** 拦截读写；
2. 读时 **`track`**（收集当前活跃 effect），写时 **`trigger`**（取出并调度 effect）；
3. **`effect`** 把「副作用函数」和它读到的响应式数据双向绑起来，数据变就重跑。

组件渲染本身就是一个 `effect`：render 函数里读到的字段被订阅；字段变，组件重渲染。

---

## 1. 依赖图：`targetMap → depsMap → dep`

运行时全局维护一张**三层映射**：

```
WeakMap<target, Map<key, Set<ReactiveEffect>>>
   ↑              ↑          ↑
targetMap      depsMap      dep
```

- **`target`**：原始对象（原始值而非代理，避免循环）。  
- **`key`**：被读的属性名；数组的下标、`length`，以及特殊的 `ITERATE_KEY` / `MAP_KEY_ITERATE_KEY` 用于 `for...in` / `Map.keys()` 这类迭代。  
- **`dep`**：订阅该 `(target, key)` 的 effect 集合。

用 `WeakMap` 是为了让 `target` 被 GC 时依赖条目自动消失。

---

## 2. `Proxy` handler 做了什么

`reactive` 返回的不是普通对象，而是一个带 handler 的 `Proxy`。关键陷阱：

| trap | 触发时机 | 做的事 |
| --- | --- | --- |
| `get` | 读属性 | `track(target, key)`；若值是对象，**惰性**再包一层 `reactive` 返回 |
| `set` | 赋值 | 先比较新旧值（`Object.is`），变了才 `trigger` |
| `deleteProperty` | `delete obj.x` | 有这一项才 `trigger` |
| `has` | `'x' in obj` | `track` |
| `ownKeys` | `Object.keys` / `for...in` | `track(target, ITERATE_KEY)` |

**惰性代理**：只有访问到的嵌套对象才会被包装，初始化不递归整棵树，对大对象友好。

**`Reflect` 而非直接操作**：保证 `this` 指向代理，子类继承、访问器属性里的 `this.xxx` 才会再次命中 trap，依赖收集不丢。

```js
get(target, key, receiver) {
  const res = Reflect.get(target, key, receiver)
  track(target, key)
  return isObject(res) ? reactive(res) : res
}
```

### 集合类型单独一套 handler

`Map` / `Set` / `WeakMap` / `WeakSet` 不能靠 `get/set` 拦截它们的 `add / delete / has / size`——这些是原型上的方法。Vue 为它们挂了专用的 `mutableCollectionHandlers`：把 `add`、`delete`、`get`、`has`、`size`、迭代器都**重写**成会 track/trigger 的版本。

---

## 3. `effect`：当前活跃栈 + 依赖反向指针

`ReactiveEffect` 大致长这样：

```js
class ReactiveEffect {
  deps = []            // 反向引用：哪些 dep 里有我
  active = true
  constructor(public fn, public scheduler) {}

  run() {
    activeEffect = this
    try { return this.fn() }
    finally { activeEffect = prevEffect }
  }

  stop() {
    // 从每个 dep 里把自己摘掉
    this.deps.forEach(dep => dep.delete(this))
    this.deps.length = 0
  }
}
```

重点：

- **活跃 effect 用栈保存**（嵌套 effect 时外层会恢复），`track` 只往 `activeEffect` 的 dep 里塞。  
- **双向指针**：`dep` 里有 effect，effect 的 `deps` 里也记着自己被哪些 dep 收录——这样 `stop()` 和**每次 run 前的清理**都能 O(1) 找到。  
- **每次 run 前清空旧依赖**：避免条件分支变化后仍订阅走不到的 key（典型如 `show ? a.x : a.y`）。

```js
const e = effect(() => console.log(state.count))
// state.count 变 → e.scheduler?.() ?? e.run()
```

传 `scheduler` 就接管「怎么重跑」——组件渲染 effect 用的就是把自己推进 **更新队列**，合并成一次微任务。

---

## 4. `track` / `trigger` 的细节

### track

```js
function track(target, key) {
  if (!activeEffect) return
  let depsMap = targetMap.get(target)
  if (!depsMap) targetMap.set(target, (depsMap = new Map()))
  let dep = depsMap.get(key)
  if (!dep) depsMap.set(key, (dep = new Set()))
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect)
    activeEffect.deps.push(dep)
  }
}
```

### trigger

写数组 `length`、新增/删除对象属性这类变动会**连带触发多个 key**：

- `ADD` 一个键 → 触发该 key + `ITERATE_KEY`（有人 `for...in` 或 `Object.keys`）；数组还要触发 `length`。  
- `DELETE` → 同上。  
- `SET` 且数组下标 ≥ `length` → 触发 `length`。

所以 `trigger` 的真正工作是：**按操作类型收集需要通知的 dep 集合，合并去重后逐个执行**（有 scheduler 走 scheduler，否则 `effect.run()`）。

---

## 5. `ref`：为什么要 `.value`

`Proxy` 只能代理对象。原始值 `0` / `'x'` 没法拦截读写——于是 `ref` 包一层对象：

```js
class RefImpl {
  _value
  dep = new Set()
  constructor(raw) {
    this._value = isObject(raw) ? reactive(raw) : raw
  }
  get value() { trackEffects(this.dep); return this._value }
  set value(v) {
    if (!Object.is(v, this._rawValue)) {
      this._value = isObject(v) ? reactive(v) : v
      triggerEffects(this.dep)
    }
  }
}
```

要点：

- **对象型 `ref`**：`.value` 内部挂一个 `reactive`；`ref({a:1})` 和把整个对象塞进 `reactive` 语义等价，区别是 `ref` 允许**整块替换** `.value`。  
- **模板解包**：编译产物里顶层 `ref` 访问会被加上 `.value`；但**不会递归解包**嵌套在普通对象里的 ref。  
- **`reactive` 里的 ref**：通过 baseHandlers 里的 `unref` 分支实现 unwrap——所以 `reactive({ n: ref(0) }).n` 读出的是数字，不是 ref 对象。

---

## 6. `computed`：带 dirty 位的惰性 effect

`computed` 内部也是 `ReactiveEffect`，但带**缓存**：

```js
class ComputedRefImpl {
  _dirty = true
  _value
  effect = new ReactiveEffect(getter, () => {
    if (!this._dirty) {
      this._dirty = true
      triggerEffects(this.dep)
    }
  })
  get value() {
    trackEffects(this.dep)
    if (this._dirty) {
      this._value = this.effect.run()
      this._dirty = false
    }
    return this._value
  }
}
```

行为：

- **首次读**才算；后续依赖没变直接返回缓存。  
- 依赖变化时**不立即重算**，只把 `_dirty` 置回 `true` 并通知自己的订阅者；下一次读 `.value` 才重新跑 getter。  
- getter 应当是**纯函数**。在里面做副作用会违反惰性假设，调度时机也不对。

---

## 7. 调度：把同一 tick 的多次变更合并成一次渲染

组件渲染 effect 创建时传了 `scheduler`：它不直接重跑 effect，而是把一个 **job** 推进 `queue`，用微任务在本轮同步代码跑完后统一 flush。

```js
function queueJob(job) {
  if (!queue.includes(job)) queue.push(job)
  queueFlush()
}
function queueFlush() {
  if (!isFlushing) {
    isFlushing = true
    Promise.resolve().then(flushJobs)
  }
}
```

所以：

- 同一同步块里 `count++` 三次 → 只排一个 job，只渲染一次。  
- `watch(..., { flush: 'pre' | 'post' | 'sync' })` 就是决定回调被放进 **pre 队列 / post 队列 / 同步执行**。  
- `nextTick` = 在 flush 队列之后追加一个微任务。

`pre` 在组件更新前、`post` 在组件更新后——两者的顺序相对于 DOM 补丁不同，但都在**同一个微任务链**里处理。

---

## 8. 变体：`shallow` / `readonly` / `raw`

同一套 `track / trigger` 机制，换不同 handler 即可得到不同语义：

| API | 代理谁 | 写入 | 深浅 |
| --- | --- | --- | --- |
| `reactive` | 任意对象 | ✅ | 深 |
| `shallowReactive` | 对象 | ✅ | 只代理顶层，内层原样返回 |
| `readonly` | 对象 | ❌（写入警告） | 深 |
| `shallowReadonly` | 对象 | ❌ | 顶层 |
| `ref` / `shallowRef` | 任意值 | ✅ | `shallowRef` 内部**不** reactive |
| `markRaw(obj)` | — | — | 打标记，`reactive` 遇到跳过包装 |
| `toRaw(proxy)` | — | — | 取回底层原始对象 |

**什么时候用 raw/shallow**：

- 第三方类实例（ECharts、Three.js、富文本编辑器等）——它们自管状态，深代理会让内部 `this.xxx = ...` 的写入绕进 Vue 的调度，性能和行为都坏。`markRaw` 或 `shallowRef` 挡住。  
- 大数组但只整体替换的场景（表格数据）——`shallowRef` 省掉整树代理成本。

---

## 9. Proxy 不能覆盖的边界

- **原始值**：靠 `ref`。  
- **已有引用未经过代理**：同一对象 `reactive(raw)` 两次返回同一代理（内部 `reactiveMap` 缓存）；但**两个不同原始对象**互相赋值需要知道哪个是 raw、哪个是 proxy——`toRaw` 就是干这个的。  
- **`Object.freeze`**：冻结的对象写入本就无效，Proxy 的 `set` trap 也无能为力；一般直接 `markRaw`。  
- **部分内置对象**：如 `Date`、`RegExp`、`Promise`，Vue 默认不深代理，按值用。  

---

## 10. 从变更到 DOM 的整条链

```
data 变
  → set trap
  → trigger(target, key)
  → 取出 dep 里的 effect
  → effect 有 scheduler → queueJob
  → 微任务 flushJobs
  → 渲染 effect.run()
  → render() 产出新 VNode
  → patch 旧 VNode / 新 VNode
  → 真实 DOM
```

编译期的 **patchFlag / 静态提升 / block tree** 决定 `patch` 阶段只比对动态部分（展开见 [Vue 2 与 Vue 3 的区别 §5](/md/框架/Vue/vue2和3的区别.md)）；响应式这一层只负责**精确地**告诉渲染器「哪几个组件该重跑」。

---

## 小结

| 层 | 数据结构 / 机制 | 你会直接用到的 API |
| --- | --- | --- |
| 拦截 | `Proxy` + `Reflect`；集合类型专用 handler | `reactive` / `readonly` |
| 包装 | `RefImpl` 类，`.value` 访问器 | `ref` / `shallowRef` |
| 依赖图 | `WeakMap<target, Map<key, Set<effect>>>` | — |
| 订阅者 | `ReactiveEffect`，双向 deps，活跃栈 | `effect` / `watchEffect` |
| 派生 | 带 dirty 位的 effect | `computed` |
| 调度 | `scheduler` + 微任务队列 | `watch(..., { flush })` / `nextTick` |
| 出口 | `markRaw` / `toRaw` / `shallowRef` | 第三方实例、只读数据 |

再往下可以啃 [`packages/reactivity/src`](https://github.com/vuejs/core/tree/main/packages/reactivity/src) 的 `baseHandlers.ts`、`effect.ts`、`reactiveEffect.ts`——代码量不大，读完对上面每一条都能自己画图说明。

## 面试回答

可以这样答：

> Vue 3 响应式核心是 `Proxy + effect + track/trigger`。`reactive` 返回一个 Proxy，读属性时通过 `get` 拦截并执行 `track(target, key)` 收集当前活跃 effect；写属性时通过 `set/deleteProperty` 拦截并执行 `trigger(target, key)`，找到依赖这个属性的 effect 重新调度。依赖关系用 `WeakMap<target, Map<key, Set<effect>>>` 保存。组件渲染本身就是一个 effect，所以模板里读到的响应式数据变了，就会触发组件更新。`ref` 是为了解决原始值不能被 Proxy 代理的问题，用 `.value` 的 getter/setter 做依赖收集和触发。`computed` 本质是带缓存和 dirty 标记的惰性 effect。Vue 3 还通过 scheduler 把多次变更合并到同一个微任务里，避免重复渲染。

## 高频追问

### Vue 3 为什么用 Proxy 替代 defineProperty？

`Proxy` 可以拦截新增、删除、`in`、`Object.keys`、数组下标和 `length` 等操作；`defineProperty` 只能劫持已有属性的 getter/setter，新增删除属性需要额外 API，数组也要重写方法。

### reactive 和 ref 怎么选？

原始值用 `ref`，对象状态可以用 `reactive`。如果对象需要整体替换，例如接口返回数据，常用 `ref`；如果是一组稳定的状态字段，可以用 `reactive`。

### computed 为什么有缓存？

`computed` 内部是惰性 effect。依赖没变时直接返回缓存；依赖变化时只把 dirty 置为 true，等下次读取时再重新计算。
