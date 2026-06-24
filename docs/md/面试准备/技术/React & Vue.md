# React & Vue 速记

## 面试定位

React 和 Vue 的框架题重点不是“API 会不会用”，而是能不能讲清更新模型、组件复用、状态管理、Diff、响应式、渲染链路和框架取舍。

## 面试回答

> React 和 Vue 都是状态驱动 UI 的组件化框架，但更新模型不同。React 更强调显式状态更新，调用 setState 后重新执行组件函数，通过 Fiber 调度、Diff 和 commit 把变化提交到 DOM；Hooks 的状态挂在 Fiber 的 Hook 链表上，所以必须保持调用顺序稳定。Vue 更强调响应式依赖追踪，Vue 3 用 Proxy 拦截读写，读取时 track 收集依赖，写入时 trigger 触发组件 render effect；模板会先编译成 render 函数，运行时生成 VNode，再通过 patch 更新 DOM。项目里我会根据团队熟悉度、业务复杂度和生态要求选型，而不是简单说谁更好。

一句话总结：

> React 偏显式状态更新和 Fiber 调度，Vue 偏响应式依赖追踪和模板编译优化。

## React 常见题

| 题目 | 必背结论 | 深文 |
| --- | --- | --- |
| Hooks 原理 | Hook 状态挂在 Fiber 上，按调用顺序读取 | [React Hooks](/md/框架/React/Hooks.md) |
| Fiber 架构 | 把递归更新拆成可中断、可调度工作单元 | [Fiber 架构](/md/框架/React/Fiber架构.md) |
| Diff 算法 | 同层比较、不同类型替换、key 标识身份 | [React Diff 算法](/md/框架/React/React%20Diff算法.md) |
| 渲染原理 | render 阶段计算差异，commit 阶段提交 DOM | [React 渲染原理](/md/框架/React/React%20渲染原理.md) |
| 状态管理 | 先看状态作用域，再选 Redux / Zustand / Recoil | [React 状态管理](/md/框架/React/状态管理.md) |
| 组件设计 | 职责单一、状态归属清晰、API 可组合 | [组件设计能力](/md/框架/React/组件设计能力.md) |

## Vue 次主流题

| 题目 | 必背结论 | 深文 |
| --- | --- | --- |
| 响应式原理 | Proxy 拦截读写，track 收集，trigger 触发 | [Vue 3 响应式原理](/md/框架/Vue/vue3响应式原理.md) |
| 模板编译 | template -> AST -> transform -> render 函数 | [模板编译流程](/md/框架/Vue/模板编译流程.md) |
| nextTick | 等待批量 DOM 更新完成后执行回调 | [nextTick 与虚拟 DOM](/md/框架/Vue/nextTick与虚拟DOM.md) |
| 虚拟 DOM | render 生成 VNode，patch 同步到真实 DOM | [Vue 渲染原理](/md/框架/Vue/Vue%20渲染原理.md) |
| Diff 算法 | 同层比较，key 帮助节点复用和移动 | [Vue Diff 算法](/md/框架/Vue/Vue%20Diff算法.md) |
| Vue 2 vs Vue 3 | 响应式、Composition API、编译优化和性能差异 | [Vue 2 和 Vue 3 区别](/md/框架/Vue/vue2和3的区别.md) |

## 框架对比

| 维度 | React | Vue |
| --- | --- | --- |
| 更新模型 | setState 触发组件重新执行 | 响应式依赖追踪触发更新 |
| UI 表达 | JSX，JavaScript 表达能力强 | 模板 + 指令，约定更强 |
| 逻辑复用 | Hooks | Composition API / composables |
| 优化重点 | Fiber 调度、memo、状态下沉 | 响应式粒度、编译优化、patchFlag |
| 适合场景 | 生态灵活、复杂工程组合 | 上手快、约定清晰、团队统一 |

## 高频追问

### React Hooks 为什么不能写在条件语句里？

Hooks 依赖调用顺序保存状态。如果条件分支导致某次 render 少调用一个 Hook，后面的 Hook 状态会错位。

### Fiber 解决了什么问题？

Fiber 把不可中断的递归更新拆成可保存进度的工作单元，让 render 阶段可以按优先级暂停、恢复或丢弃。

### Vue 3 为什么用 Proxy？

Proxy 可以更自然地拦截新增属性、删除属性、数组和对象操作，不需要像 Vue 2 那样递归 defineProperty 初始化。

### nextTick 解决什么问题？

Vue DOM 更新是异步批量执行的。状态变了不代表 DOM 立刻更新，`nextTick` 用来等待本轮 DOM patch 完成后再读取最新 DOM。

## 相关链接

- [Vue vs React](/md/框架/Vue%20vs%20React.md)
- [前端框架原理对比](/md/框架/前端框架原理对比.md)
- [高频追问清单](/md/面试准备/高频追问清单.md)
