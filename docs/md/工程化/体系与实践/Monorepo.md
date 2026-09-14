# Monorepo

## 面试回答

> Monorepo 是把多个相关应用/包放进同一 Git 仓统一管理，适合共享组件库、工具库、类型与 SDK、跨包改动很频繁的场景。好处是一次 PR 改多包、规范与脚本统一、依赖可见。代价是仓变大后安装、构建、权限和 CI 变复杂，所以通常 **pnpm workspace** 管包与本地链接，**Turborepo/Nx** 做任务编排、缓存和 affected，避免每次全量。选型看关联强度，不是看潮不潮；项目独立、权限隔离强时 MultiRepo 更简单。

**一句话总结：**

> 强关联多包 → 统一仓 + workspace → 任务缓存/affected → 换协作效率，守包边界。

---

## 核心原理

### 1. 解决什么问题

跨仓发版同步慢、重复配 lint/CI、改 UI 库要跳多个仓库。Monorepo 把「共享」变成本地包引用。

```text
apps/web, apps/admin
packages/ui, packages/utils
  → workspace 链接
  → 任务按依赖拓扑跑
  → CI 只跑受影响图
```

---

### 2. vs MultiRepo

| | Monorepo | MultiRepo |
| --- | --- | --- |
| 共享 | 本地引用，联改容易 | 发版/同步成本高 |
| 规范 | 易统一 | 易分叉 |
| CI | 需增量，否则更慢 | 天然隔离 |
| 权限 | 要额外设计 | 仓级隔离 |

---

### 3. 工具分层（别混）

| 工具 | 职责 |
| --- | --- |
| pnpm workspace | 包发现、链接、安装 |
| Turborepo / Nx | 编排、缓存、affected |
| Changesets 等 | 多包发版与 changelog |

---

### 4. 风险

包边界被业务打穿、CI 全量、发布权限乱、共享包一改全仓抖。

---

## 常见误区

### ❌ Monorepo 一定更现代更好

### ✅ 更准确的说法

强关联才赚；弱关联赚复杂度。

---

### ❌ 有了 pnpm workspace 就等于有了增量 CI

### ✅ 更准确的说法

workspace 管依赖；增量要任务图与缓存工具（或自建 affected）。

---

## 高频追问

### pnpm workspace 解决什么？

多包安装与本地 link，减少重复拷贝。

### Turborepo 和 Nx？

任务与缓存层；Nx 还常带项目图与生成器。

### 如何讲你做过的 Monorepo？

背景（共享痛点）→ workspace 结构 → CI 增量 → 结果指标 → 边界治理取舍。

---

## 延伸阅读

- [CI/CD](/md/工程化/体系与实践/CI&CD.md)
- [工程化体系](/md/工程化/体系与实践/工程化体系.md)
- [前端工程化速记](/md/面试准备/技术/前端工程化.md)
