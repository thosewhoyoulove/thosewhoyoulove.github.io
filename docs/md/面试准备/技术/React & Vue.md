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
| Hooks 原理 | 调用顺序对齐 Hook 链表 → 快照 + effect cleanup → memo/transition 按需 | [React Hooks](/md/框架/React/Hooks.md) |
| Fiber 架构 | Fiber 管拆分与现场，Scheduler 管何时，Lane 管优先级；Render 可中断 / Commit 同步 | [Fiber 架构](/md/框架/React/Fiber架构.md) |
| Diff 算法 | 同层比较；下标试探再 Map；lastPlacedIndex 贪心；Render 打标 / Commit 改 DOM | [React Diff 算法](/md/框架/React/React%20Diff算法.md) |
| 渲染原理 | setState→调度→Render 打 flags→Commit 改 DOM→layout/passive effect | [React 渲染原理](/md/框架/React/React%20渲染原理.md) |
| SSR / Hydration | 服务端出 HTML → hydrate 复用 DOM；RSC ≠ 传统 SSR | [SSR 与 Hydration](/md/框架/React/SSR与Hydration.md) |
| 状态管理 | 按作用域选型；Context 低频；高频用 store+selector | [React 状态管理](/md/框架/React/状态管理.md) |
| 组件设计 | 职责与状态归属 → API 可组合 → 边界完整 → 测量后再 memo | [组件设计能力](/md/框架/React/组件设计能力.md) |

## Vue 次主流题

| 题目 | 必背结论 | 深文 |
| --- | --- | --- |
| 响应式原理 | Proxy 拦截读写，track 收集，trigger 触发 | [Vue 3 响应式原理](/md/框架/Vue/vue3响应式原理.md) |
| 模板编译 | template -> AST -> transform -> render 函数 | [模板编译流程](/md/框架/Vue/模板编译流程.md) |
| nextTick | 等待批量 DOM 更新完成后执行回调 | [nextTick 与虚拟 DOM](/md/框架/Vue/nextTick与虚拟DOM.md) |
| 虚拟 DOM | render 生成 VNode，patch 同步到真实 DOM | [Vue 渲染原理](/md/框架/Vue/Vue%20渲染原理.md) |
| Diff 算法 | 同层比较，key 帮助节点复用和移动 | [Vue Diff 算法](/md/框架/Vue/Vue%20Diff算法.md) |
| Vue 2 vs Vue 3 | 响应式、Composition API、编译优化和性能差异 | [Vue 2 和 Vue 3 区别](/md/框架/Vue/vue2和3的区别.md) |
| Vue2→3 / JS→TS 迁移 | 分阶段 + compat + 回归指标；TS 渐进 | [Vue2 升级 Vue3 与 TS 迁移](/md/框架/Vue/Vue2升级Vue3与TS迁移专题.md) |

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

Hooks 依赖调用顺序保存状态：首次 `mountWorkInProgressHook` 建链表，更新时 `updateWorkInProgressHook` 按 `next` 对齐。如果条件分支导致某次 render 少调用一个 Hook，后面的 Hook 状态会错位。原理展开见 [Hooks 原理](/md/框架/React/Hooks.md)。

### Fiber 解决了什么问题？

Fiber 把难中断的同步递归协调拆成可保存进度的工作单元：Render 可暂停/丢弃 wip，Commit 同步改 DOM。Scheduler 管何时做，Lane 管先做谁；更新仍在队列，lane 过期防饿死。详见 [Fiber 架构](/md/框架/React/Fiber架构.md)。

### Vue 和 React 更新模型差在哪？

Vue：依赖追踪 + 模板编译优化，默认组件级更新、少手动 memo。React：显式 setState 驱动再 reconcile，换 Fiber 可中断调度，范围靠结构/memo 收缩。详见 [Vue vs React](/md/框架/Vue%20vs%20React.md)。

### React 列表 Diff 和 Vue 3 有什么差别？

两边都是同层比较、靠 key 认人。React 的 `ChildReconciler` 先按下标试探，对不上再进 Map；移动用 `lastPlacedIndex` 贪心，不保证最少 DOM 移动。Vue 3 乱序段求最长递增子序列。细节见 [React Diff 算法](/md/框架/React/React%20Diff算法.md)、[Vue Diff 算法](/md/框架/Vue/Vue%20Diff算法.md)。

### Vue 3 为什么用 Proxy？

Proxy 可以更自然地拦截新增属性、删除属性、数组和对象操作，不需要像 Vue 2 那样递归 defineProperty 初始化。

### nextTick 解决什么问题？

Vue DOM 更新是异步批量执行的。状态变了不代表 DOM 立刻更新，`nextTick` 用来等待本轮 DOM patch 完成后再读取最新 DOM。

### SSR 和 CSR 核心差别是什么？Hydration / RSC 怎么答？

CSR 靠客户端 JS 生成首屏 DOM；SSR 服务端先出带内容的 HTML。Hydration 是客户端复用这段 DOM 并绑定事件，不是拆掉重画。RSC 关注「哪些组件代码留在服务端、少下发 JS」，和「首屏谁出 HTML」的传统 SSR 不是同一层问题。详见 [SSR 与 Hydration](/md/框架/React/SSR与Hydration.md)。

## 相关链接

- [Vue vs React](/md/框架/Vue%20vs%20React.md)
- [前端框架原理对比](/md/框架/前端框架原理对比.md)
- [SSR 与 Hydration](/md/框架/React/SSR与Hydration.md)
- [高频追问清单](/md/面试准备/高频追问清单.md)
