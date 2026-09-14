# Vue 2 与 Vue 3 的核心差异

## 面试回答

> Vue 3 相对 Vue 2，我会按「机制 → 工程 → 性能」说，而不是背 API 清单。机制上，响应式从 `defineProperty` 换成 Proxy：新增删除、数组下标和 length、迭代都能更自然拦截，并且惰性代理；原始值继续用 ref。工程上，入口变成 `createApp`，插件挂在应用实例上，少全局污染；Composition API 按功能聚合逻辑，TS 更友好，Options 仍可用。模板侧有 Fragment、Teleport、Suspense，`v-model` 默认变成 `modelValue`。
>
> 性能上，编译期 patchFlag、静态提升、Block Tree 减少运行时比对；列表 Diff 在 Vue 3 用前后缩 + LIS 偏向少搬 DOM。生态上新项目更常 Pinia。迁移风险通常在依赖兼容、全局 API、事件总线移除、以及旧代码隐含的 Vue 2 响应式边界，而不是「背不会 Composition」。

**一句话总结：**

> Proxy 响应式 → createApp/Composition → 编译优化+LIS Diff → 迁移盯依赖与全局 API。

---

## 核心原理

### 1. 为什么要升级认知，而不只背 API

面试官听的是：你是否理解每个变化解决的旧痛点，以及迁移时哪里会炸。

---

### 2. 响应式

| 维度 | Vue 2 | Vue 3 |
| --- | --- | --- |
| 实现 | `defineProperty` 劫持已有属性 | Proxy + `@vue/reactivity` |
| 增删属性 | `$set` / `$delete` | 原生支持 |
| 数组 | 方法劫持等补丁 | Proxy 更统一 |
| 初始化 | 递归遍历 data | 惰性代理 |

详解：[Vue 3 响应式原理](/md/框架/Vue/vue3响应式原理.md)。

---

### 3. 应用实例与逻辑复用

| | Vue 2 | Vue 3 |
| --- | --- | --- |
| 启动 | `new Vue` | `createApp` |
| 全局 | `Vue.use` 易污染 | 挂 app，多实例隔离 |
| 复用 | mixin 常见 | Composition 优先；Options 仍在 |
| 事件总线 | `$on/$off` | 移除，改显式方案 |

---

### 4. 模板与内置

- Fragment 多根；Teleport 挂外层 DOM；Suspense 异步边界。
- 组件 `v-model`：`modelValue` / `update:modelValue`。

---

### 5. Diff 与编译

| | Vue 2 | Vue 3 |
| --- | --- | --- |
| 列表 | 双端 diff | 前后缩 + LIS |
| 编译 | 弱 | patchFlag / 提升 / Block |

「快」= **更少比对** + **更少移动**，不只换算法。见 [Vue Diff](/md/框架/Vue/Vue%20Diff算法.md)、[模板编译](/md/框架/Vue/模板编译流程.md)。

---

### 6. 生态与包体

Pinia 更常见；Tree-shaking 友好（视构建）。迁移专题：[Vue2 升级 Vue3 与 TS 迁移](/md/框架/Vue/Vue2升级Vue3与TS迁移专题.md)、[兼容包](/md/面试准备/技术/vue兼容包的作用.md)。

---

### 7. 设计取舍

Vue 3 用现代语言能力与编译换开发体验和默认性能；代价是生态迁移动作与心智升级（Proxy 边界、Composition 风格）。

---

## 常见误区

### ❌ Vue 3 废弃了 Options API

### ✅ 更准确的说法

仍支持；Composition 更适合复杂复用与 TS。

---

### ❌ 上了 Vue 3 就一定明显更快

### ✅ 更准确的说法

机制更好；真实收益还看组件切分、列表、是否吃到编译优化。

---

### ❌ 迁移只要把 `new Vue` 改成 `createApp`

### ✅ 更准确的说法

依赖、全局 API、事件总线、v-model、过滤器和隐性响应式假设才是大头。

---

## 高频追问

### Vue 3 最大的几项变化？

响应式 Proxy、createApp、Composition、编译优化与 Diff、内置能力与生态。

### 为什么更适合 TypeScript？

函数式组合推断路径更直接；mixin/`this` 合并对 TS 不友好。

### 迁移最大风险？

第三方兼容与隐藏的 Vue 2 写法假设，其次才是语法迁移。

### Composition 和 React Hooks 像不像？

复用形态像；Vue 不依赖调用顺序，状态活在响应式对象上。

### Options 还要不要学？

要。存量与部分团队规范仍用；能读能改即可，新复杂逻辑可 Composition。

---

## 延伸阅读

- [Vue 3 响应式原理](/md/框架/Vue/vue3响应式原理.md)
- [Vue Diff 算法](/md/框架/Vue/Vue%20Diff算法.md)
- [模板编译流程](/md/框架/Vue/模板编译流程.md)
- [Vue2 升级 Vue3 与 TS 迁移](/md/框架/Vue/Vue2升级Vue3与TS迁移专题.md)
- [Vue vs React](/md/框架/Vue%20vs%20React.md)
- [面试速记：React & Vue](/md/面试准备/技术/React%20&%20Vue.md)
