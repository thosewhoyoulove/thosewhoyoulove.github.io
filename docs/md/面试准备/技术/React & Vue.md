# React & Vue（面试提纲）

用于面试前的提纲。**Vue** 见 [Vue 高频考点精讲](/md/框架/Vue/Vue%20高频考点精讲.md)（含 `nextTick` §4）。**React** 见 [React 高频考点精讲](/md/框架/React/React%20高频考点精讲.md)、[Hooks 专篇](/md/框架/React/Hooks.md)。Vue 原理文：[Vue3 响应式原理](/md/框架/Vue/vue3响应式原理.md)、[Vue2 与 Vue3 的区别](/md/框架/Vue/vue2和3的区别.md)。

- 你在项目中用到了 React Hooks，能讲一下 `useEffect` 的执行机制吗？
- React 组件的更新机制是怎样的？为什么 React 会使用虚拟 DOM？
- **React Fiber 是什么？**它如何提高渲染性能？
- 你有在 React 项目里用过 `React.memo` 或 `useMemo`/`useCallback` 吗？它们的作用是什么？
- 在 React 中，父组件重新渲染时，如何避免子组件不必要的渲染？

### 答题要点（简）

**`useEffect`**：在 commit 后异步调度执行；依赖数组对比决定是否重新执行；返回清理函数在下次 effect 前与卸载时执行；不要漏依赖（可用 `eslint-plugin-react-hooks`）。  

**更新机制**：状态变更触发调度 → Fiber 可中断调和 → 生成新的 React 元素树 → 对比（diff）打补丁更新真实 DOM。  

**虚拟 DOM**：用轻量对象描述 UI，利于批量对比与跨平台；不等于一定比原生 DOM 快，价值在**可维护性 + 声明式 + 调和策略**。  

**Fiber**：可中断的单元工作，带优先级与时间切片，利于并发特性（如 `startTransition`）和更细粒度更新。  

**.memo / useMemo / useCallback**：稳定的 props 引用可避免子组件无效重渲染；勿滥用，以测量为准。

---

## Vue 相关

- Vue3 的 Composition API 和 Options API 的区别是什么？你更倾向于使用哪个？为什么？
- Vue3 的响应式原理是如何实现的？它和 Vue2 的 `Object.defineProperty` 有什么不同？
- 你在 Vue3 项目里有没有用过 `Pinia`？和 `Vuex` 相比，它的优点是什么？
- Vue3 里 `setup()` 和 `onMounted()` 的执行顺序是怎样的？
- 你在 Vue3 里用过 `Teleport` 或 `Suspense` 吗？它们的作用是什么？

### 答题要点（简）

**Composition API**：逻辑按功能聚合，类型推导更好，适合大型组件复用（`composables`）。  

**响应式**：Vue3 用 `Proxy` 拦截对象，数组、新增属性天然支持；Vue2 需 `Vue.set` 等补丁。  

**Pinia**：更轻、无 `mutations` 啰嗦、TS 友好、模块化 store。  

**顺序**：`setup` 在实例创建阶段**同步**执行完；随后完成挂载，再执行 `onMounted` 里注册的回调。因此 **setup 中的同步代码总是先于 onMounted 回调运行**。  

**Teleport**：把子 DOM 挂到别处（如 `body`），适合弹窗。  

**Suspense**：异步组件/异步 setup 的占位与回退（与实验特性、路由结合时需看版本文档）。
