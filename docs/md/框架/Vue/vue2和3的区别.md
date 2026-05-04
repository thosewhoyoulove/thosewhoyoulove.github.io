# Vue 2 与 Vue 3 的核心差异

侧重**原理与行为差异**，工程向细节见 [Vue 高频考点精讲](/md/框架/Vue/Vue%20高频考点精讲.md)，响应式展开见 [Vue 3 响应式原理](/md/框架/Vue/vue3响应式原理.md)。

---

## 1. 响应式：从 `defineProperty` 到 `Proxy`

| 维度 | Vue 2 | Vue 3 |
| --- | --- | --- |
| API | `Object.defineProperty` 劫持**已有**属性的 `get/set` | `Proxy` 拦截 `get/set/deleteProperty/ownKeys` 等 |
| 新增 / 删除属性 | 需 `Vue.set` / `Vue.delete` | 原生支持 |
| 数组 | 下标、长度需 **改写数组方法** 等方式间接监听 | 与对象一致，由 Proxy 处理 |
| 性能与实现 | 初始化递归遍历 `data`；无法追踪部分动态用法 | **懒代理**（访问深层再包装）；逻辑集中在 `@vue/reactivity` |

**迁移含义**：Vue 3 少了很多「必须用 `$set`」的运维记忆；但 **Proxy 无法代理的特例**（部分内置对象、被 `freeze` 等）仍需知道边界。

---

## 2. 应用与全局 API

- Vue 2：`new Vue()` 单一根实例；`Vue.use` / `Vue.mixin` 全局副作用多。  
- Vue 3：**`createApp`**，插件、指令、组件挂在 app 实例上，**多应用实例**互不污染。  
- 事件总线：`$on` / `$off` / `$once` **移除**，建议用明确的 store / mitt 等。

---

## 3. 组合式 API 与类型

- Vue 3 引入 **Composition API**（`setup`、`ref`、`reactive`…），逻辑可按**功能**聚合，TS 推断优于 mixin。  
- Options API 仍可用；大型项目常见「新模块 composition、老模块渐进迁」。

---

## 4. 模板与内置能力

- **Fragment**：可多根节点。  
- **Teleport**：子树挂到外层 DOM（弹窗常用）。  
- **Suspense**：异步组件 / 异步 `setup` 的占位（需正确配置）。  
- **v-model**：组件上可多绑定，`modelValue` / `update:modelValue` 替代默认的 `value` / `input`（迁移时注意命名）。

---

## 5. diff 与编译期优化（简述）

**Vue 2**：双端 diff + `key`；比对基本在**同级子节点**。  

**Vue 3**：保留双端思路；对有 `key` 的子节点列表用 **最长递增子序列（LIS）** 近似**最少移动**，减少 DOM `insertBefore` 次数。  

**编译期**（Vue 3 明显更强）：

- **静态提升（hoist）**：不变节点少重建。  
- **patchFlag**：运行时只比对**动态**片段。  
- **事件缓存 `cacheHandlers`** 等：减轻无谓子更新。

二者关系：**编译信息**喂给 **runtime patch**，所以「快」不只来自 diff 算法，还来自**更少的比对工作量**。

---

## 6. 状态与生态

- 新组合：**Pinia**（推荐）替代 Vuex 在新项目中的地位。  
- **Tree-shaking**：Vue 3 按模块引入，未用功能可打出更小包（视构建配置）。

---

## 7. 小结表（背诵版）

| 项 | Vue 2 | Vue 3 |
| --- | --- | --- |
| 响应式 | `defineProperty` + 数组补丁 | `Proxy` + `@vue/reactivity` |
| 启动 | `new Vue` | `createApp` |
| 逻辑复用 | mixin / HOC | Composition（+ 可选 Options） |
| 模板 | 单根（2.x 限制） | Fragment / Teleport / Suspense |
| 典型性能手段 | 靠运行时 | 编译标记 + runtime diff 优化 |

若要准备迁移题：补充 **@vue/compat**、依赖库兼容性、E2E 回归，见 [高频考点精讲 §20](/md/框架/Vue/Vue%20高频考点精讲.md)（`@vue/compat` 一节）。
