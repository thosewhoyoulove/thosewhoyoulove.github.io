# 标杆文章索引

撰写前阅读 **同类型 1 篇**，模仿密度、主链路与追问深度，不要复制正文。

**结构说明：** 现行规范以 `knowledge-article-author/SKILL.md` 为准——标题后第一节为「面试回答」，不再生成「面试定位」；须含「常见误区」。仓库里较早的深文可能仍保留「面试定位」，作标杆时学**链路 / Trace / Why / 取舍 / 追问链**，不要照搬旧目录骨架。

## 原理深文（口述 → 原理 → 误区 → 追问）

| 主题 | 路径 | 学什么 |
| --- | --- | --- |
| React Diff | `docs/md/框架/React/React Diff算法.md` | 2～3 分钟口述、一句话箭头总结、列表 Trace、`lastPlacedIndex`、与 Vue 取舍 |
| React 渲染 | `docs/md/框架/React/React 渲染原理.md` | 更新主链路、Element/Fiber 区分、Render vs Commit |
| Vue 渲染 | `docs/md/框架/Vue/Vue 渲染原理.md` | 与 React 篇对称，便于写对比文 |
| Promise | `docs/md/基础/ES6/Promise.md` | 基础概念 + 手写题衔接 |
| HTTP | `docs/md/网络/HTTP.md` | 网络类叙述节奏 |
| Vite 为什么快 | `docs/md/工程化/Vite/为什么Vite快.md` | 工程化「为什么」型论证 |

## 面试速记（短、可串联）

| 主题 | 路径 |
| --- | --- |
| React & Vue | `docs/md/面试准备/技术/React & Vue.md` |
| 网络与安全 | `docs/md/面试准备/技术/网络与安全.md` |
| 前端工程化 | `docs/md/面试准备/技术/前端工程化.md` |

速记文：**提纲 + 关键词 + 链接深文**，不重复深文整段原理。速记可省略 Trace / 常见误区全文，但须能指回深文。

## 项目与架构

| 主题 | 路径 | 学什么 |
| --- | --- | --- |
| 高级筛选系统 | `docs/md/面试准备/项目与架构/高级筛选系统.md` | 架构分层、扩展性、业务抽象 |
| WebRTC 会议室 | `docs/md/面试准备/项目与架构/WebRTC 会议室项目.md` | 实时项目表述 |
| 架构升级方案 | `docs/md/面试准备/项目与架构/项目架构的整体升级方案.md` | 方案演进与取舍 |

## 综合 / AI / 协作

| 主题 | 路径 | 学什么 |
| --- | --- | --- |
| 平时工作怎么使用 AI | `docs/md/面试准备/综合/平时工作怎么使用AI.md` | 流程闭环、风险、工程化意识 |
| 团队协作 | `docs/md/面试准备/综合/团队协作与主导能力.md` | 软技能 + 可追问点 |

## 面经

| 主题 | 路径 | 学什么 |
| --- | --- | --- |
| 百度面经 | `docs/md/面试准备/百度面经.md` | 原题保留 + 结构化答案（含工具对比题） |

## 全栈（边界参考）

| 主题 | 路径 | 学什么 |
| --- | --- | --- |
| Node 与全栈 | `docs/md/面试准备/技术/NodeJs & 全栈开发.md` | 前端视角的全栈：不写成后端教材 |

## Skill 协作链

```text
knowledge-article-author     # 写什么、结构、口述与原理精度
  → technical-accuracy-review  # 定稿事实校对
  → docsify-knowledge-site     # 路径、侧边栏、站内链接
  → interview-curriculum-sync  # 总览 / 路线 / 追问清单 / 速记

领域扩写（仍服从主编结构）：
  fullstack-knowledge-expansion
  agent-frontend-knowledge
```
