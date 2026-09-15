# Vue 考点索引

> 旧「高频考点精讲」收成索引，避免与专题深文重复。速记入口：[React & Vue](/md/面试准备/技术/React%20&%20Vue.md)。

## 专题深文（主路径）

| 主题 | 深文 | 典型追问 |
| --- | --- | --- |
| 响应式 | [Vue3 响应式原理](/md/框架/Vue/vue3响应式原理.md) | 依赖图、分支清理、集合触发、响应式断链 |
| Diff | [Vue Diff 算法](/md/框架/Vue/Vue%20Diff算法.md) | 双端、LIS、与 React Diff 差别 |
| 渲染 | [Vue 渲染原理](/md/框架/Vue/Vue%20渲染原理.md) | mount/patch、组件更新判定、稳定 props |
| 编译 | [模板编译流程](/md/框架/Vue/模板编译流程.md) | patchFlag、静态提升、dynamicChildren |
| 调度 | [nextTick 与虚拟 DOM](/md/框架/Vue/nextTick与虚拟DOM.md) | pre/job/post 队列、nextTick 与浏览器帧 |
| 版本 | [Vue2 和 Vue3 区别](/md/框架/Vue/vue2和3的区别.md) | 迁移成本、破坏性变更 |
| 迁移 | [Vue2 升级 Vue3 与 TS](/md/框架/Vue/Vue2升级Vue3与TS迁移专题.md) | 兼容包、类型、踩坑（附录精读） |

## 题单 → 深文

- 响应式原理、Vue2 vs Vue3 → [响应式](/md/框架/Vue/vue3响应式原理.md)、[区别](/md/框架/Vue/vue2和3的区别.md)
- ref / reactive、computed / watch、解构断链 → [响应式](/md/框架/Vue/vue3响应式原理.md)
- 组件更新、稳定 props、生命周期 → [渲染原理](/md/框架/Vue/Vue%20渲染原理.md)
- Diff / key / 列表 → [Vue Diff](/md/框架/Vue/Vue%20Diff算法.md)
- 编译优化、为何 Vue 能跳过静态 → [模板编译](/md/框架/Vue/模板编译流程.md)
- nextTick、watch flush、浏览器 paint → [nextTick 与虚拟 DOM](/md/框架/Vue/nextTick与虚拟DOM.md)
- 与 React 对比 → [Vue vs React](/md/框架/Vue%20vs%20React.md)

## 延伸阅读

- [高频追问清单](/md/面试准备/高频追问清单.md)
- [框架开放性面试题](/md/框架/框架开放性面试题.md)
