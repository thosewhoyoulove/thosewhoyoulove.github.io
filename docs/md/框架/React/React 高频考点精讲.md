# React 考点索引

> 旧「高频考点精讲」全文已收成索引，避免与专题深文重复背两遍。考前用本页找题，精读右侧深文。

进阶实践类（状态库选型、路由、Error Boundary、React 18 落地）见 [React 进阶考点索引](/md/框架/React/React%20进阶高频考点精讲.md)。速记入口：[React & Vue](/md/面试准备/技术/React%20&%20Vue.md)。

## 怎么用

1. 先看 [高频追问清单 · React](/md/面试准备/高频追问清单.md) 标出不会的。
2. 点进**一篇**专题深文把口述稿讲透。
3. 不要试图把本页当成百科整本背完。

## 专题深文（主路径）

| 主题 | 深文 | 典型追问 |
| --- | --- | --- |
| Hooks | [Hooks 原理](/md/框架/React/Hooks.md) | Hook 链表、update queue、Effect 同步模型、闭包陷阱 |
| Fiber | [Fiber 架构](/md/框架/React/Fiber架构.md) | 工作循环、可中断 Render、Lane、双缓冲、bailout |
| Diff | [React Diff 算法](/md/框架/React/React%20Diff算法.md) | 同层、key、lastPlacedIndex、Placement vs Commit |
| 渲染 | [React 渲染原理](/md/框架/React/React%20渲染原理.md) | Render / Commit、Element vs Fiber、批处理 |
| SSR | [SSR 与 Hydration](/md/框架/React/SSR与Hydration.md) | Streaming/Suspense、mismatch 治理、RSC 边界 |
| 状态 | [状态管理](/md/框架/React/状态管理.md) | 状态分类、Context、selector、外部 Store 一致性 |
| 组件 | [组件设计能力](/md/框架/React/组件设计能力.md) | 状态建模、受控/非受控、组合、错误与 a11y |

## 题单 → 深文

### 基础思想与组件

- React 是什么 / 声明式 / 单向数据流 → [渲染原理](/md/框架/React/React%20渲染原理.md)、[Vue vs React](/md/框架/Vue%20vs%20React.md)
- 何时重渲染、父更子是否必更、不能直接改 state → [渲染原理](/md/框架/React/React%20渲染原理.md)、[Hooks](/md/框架/React/Hooks.md)
- key / 为何不用 index → [Diff](/md/框架/React/React%20Diff算法.md)

### Hooks / useEffect

- `renderWithHooks`、Hook 链表、update queue、调用顺序 → [Hooks](/md/框架/React/Hooks.md)
- Effect 是否必要、依赖、cleanup、Strict Mode、闭包陷阱 → [Hooks](/md/框架/React/Hooks.md)
- useMemo / useCallback / useRef / useReducer / useContext → [Hooks](/md/框架/React/Hooks.md)、[状态管理](/md/框架/React/状态管理.md)

### Fiber / Diff / 性能

- Fiber 工作循环、时间切片、Lane、双缓冲、bailout → [Fiber](/md/框架/React/Fiber架构.md)
- Diff O(n)、同层、Placement → [Diff](/md/框架/React/React%20Diff算法.md)
- memo、列表虚拟化、避免无效渲染 → [组件设计](/md/框架/React/组件设计能力.md)、[性能速记](/md/面试准备/技术/前端性能优化.md)

## 延伸阅读

- [React 进阶考点索引](/md/框架/React/React%20进阶高频考点精讲.md)
- [高频追问清单](/md/面试准备/高频追问清单.md)
- [复习路线](/md/面试准备/复习路线.md)
