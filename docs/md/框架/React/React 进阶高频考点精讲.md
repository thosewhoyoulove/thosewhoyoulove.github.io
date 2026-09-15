# React 进阶考点索引

> 承接 [React 考点索引](/md/框架/React/React%20高频考点精讲.md)。本页只做题单导航，正文以专题深文为准。

## 专题深文

| 主题 | 深文 | 典型追问 |
| --- | --- | --- |
| 状态管理 | [状态管理](/md/框架/React/状态管理.md) | 状态分类、Context、selector、Redux/Zustand 取舍 |
| 组件设计 | [组件设计能力](/md/框架/React/组件设计能力.md) | 状态建模、受控/非受控、组合、Error Boundary |
| 渲染与并发 | [渲染原理](/md/框架/React/React%20渲染原理.md)、[Fiber](/md/框架/React/Fiber架构.md) | update/Lane、工作循环、自动批处理、bailout |
| SSR | [SSR 与 Hydration](/md/框架/React/SSR与Hydration.md) | Streaming/Suspense、Hydration mismatch、RSC |

## 题单 → 深文

### 状态管理

- React 自身状态怎么分层 → [状态管理](/md/框架/React/状态管理.md)
- useState / useReducer / useContext → [Hooks](/md/框架/React/Hooks.md)、[状态管理](/md/框架/React/状态管理.md)
- Redux / RTK / Zustand / MobX 选型 → [状态管理](/md/框架/React/状态管理.md)
- URL 状态、服务端缓存、外部 Store 与 tearing → [状态管理](/md/框架/React/状态管理.md)

### 表单与通信

- 受控 vs 非受控 → [组件设计能力](/md/框架/React/组件设计能力.md)
- 父子 / 兄弟 / 跨层通信、Context 性能 → [组件设计能力](/md/框架/React/组件设计能力.md)、[状态管理](/md/框架/React/状态管理.md)
- 非法状态、组合式 API、异步边界与 a11y → [组件设计能力](/md/框架/React/组件设计能力.md)

### 路由 / 错误边界 / React 18

- Hash vs History、权限路由、懒加载 → 结合项目口述 + [组件设计](/md/框架/React/组件设计能力.md)（工程侧可链 [打包优化](/md/工程化/体系与实践/打包优化面试专题.md)）
- Error Boundary 能捕/不能捕 → [组件设计能力](/md/框架/React/组件设计能力.md)
- Concurrent、自动批处理、startTransition、工作循环、Suspense → [Fiber](/md/框架/React/Fiber架构.md)、[渲染原理](/md/框架/React/React%20渲染原理.md)
- Streaming SSR、选择性 Hydration、mismatch 监控 → [SSR 与 Hydration](/md/框架/React/SSR与Hydration.md)

### 项目实践

- 组件封装、性能、列表 → [组件设计](/md/框架/React/组件设计能力.md)、[项目经历](/md/面试准备/项目与架构/你的项目经历（重点）.md)、[项目表达模板](/md/面试准备/项目表达模板.md)

## 延伸阅读

- [React 考点索引](/md/框架/React/React%20高频考点精讲.md)
- [面试速记：React & Vue](/md/面试准备/技术/React%20&%20Vue.md)
- [高频追问清单](/md/面试准备/高频追问清单.md)
