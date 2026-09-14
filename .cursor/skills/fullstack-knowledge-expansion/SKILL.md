---
name: fullstack-knowledge-expansion
description: >-
  Expands the knowledge base from frontend toward full-stack topics (Node.js,
  BFF, API, auth, DB basics, deployment) using frontend-candidate interview
  framing. Use when writing Node/后端协作/BFF/REST/JWT/ORM/SSR  articles or
  extending 面试准备/技术/NodeJs  related content.
---

# 全栈知识扩写（前端候选人视角）

在前端面试知识库中扩写「前后端边界」内容。**不是**后端教材：面试官考察的是协作、取舍、边界，而非 DBA 或内核级深度。

**写作结构与精度一律服从** `knowledge-article-author`（面试回答 → 一句话总结 → 核心原理 → 常见误区 → 高频追问 → 延伸阅读）。本 skill 只约束**范围、目录与表述角度**。

## 何时使用

- 新建/扩写 Node、BFF、API 设计、鉴权、数据库协作、部署发布
- 用户要求「全栈」「后端协作」「接口层」类文章
- 深化 `docs/md/面试准备/技术/NodeJs & 全栈开发.md` 或 `docs/md/Node.js/`

## 表述原则

### 必须讲清

| 主题 | 前端候选人应达到的深度 |
| --- | --- |
| Node.js | 事件循环、I/O vs CPU、高并发模型、不适合场景 |
| BFF | 为什么有、聚合/裁剪/鉴权、代价与监控 |
| REST / API | 资源语义、状态码、错误结构、幂等、分页；前端关心的取消/重试/超时 |
| 鉴权 | Session vs JWT 取舍、存储风险（XSS）、refresh、HttpOnly |
| DB / ORM | 索引、N+1、分页、缓存、事务边界；ORM 利弊，不展开 SQL 调优教科书 |
| 框架（Nest 等） | 分层（Controller/Service/Guard）、与前端工程化类比即可 |

### 刻意不深挖

- 内核、K8s 运维手册、复杂分库分表方案
- 某种数据库厂商专属语法大全
- 未在项目中验证的「最佳架构」口号

### 口述角度（写入「面试回答」）

全栈题仍按主编口述结构（2～3 分钟），领域主线建议：

```text
Node/BFF 解决什么边界问题（为什么）
→ 核心机制一句话（事件驱动 / 聚合接口）
→ 关键协作流程（契约、错误码、鉴权）
→ 设计取舍 / 不适合什么 / 风险
```

正文须解释口述中的每个关键结论；鉴权、JWT、事件循环等关键概念第一次出现时用白话，再给技术定义。

### 常见误区（全栈文建议覆盖）

- 「Node 完全单线程」→ JS 单线程 + libuv 线程池
- 「JWT 加密了内容」→ 仅签名/编码，payload 可读
- 「BFF 可以替代所有后端」→ 聚合适配层，业务域仍在服务端
- 「CORS 能防 CSRF」→ 不能

## 推荐目录与互链

| 内容类型 | 建议路径 | 互链 |
| --- | --- | --- |
| 机制深文 | `docs/md/Node.js/` | 链到 `事件循环.md` |
| 面试速记/综合 | `docs/md/面试准备/技术/` | 提纲 + 链深文 |
| 与网络重叠 | — | 链 `docs/md/网络/`、`安全/`，避免整段复制 |

标杆：`docs/md/面试准备/技术/NodeJs & 全栈开发.md`、`docs/md/Node.js/事件循环.md`。

专题提纲见 [reference/topic-outline.md](reference/topic-outline.md)。

## 与现有文章的分工

- **HTTP/TCP/HTTPS**：写在 `网络/`，全栈文只引用
- **XSS/CSRF 与 token 存储**：写在 `安全/`，鉴权文强调「存储策略」并链过去
- **CI/CD、Monorepo**：写在 `工程化/`，部署文只写「前端关心的发布与回滚」

## 与其他 skill 的关系

```text
knowledge-article-author       # 结构与写作精度（必须先读）
  ↑ 本 skill 只补领域边界
technical-accuracy-review      # 定稿校对（JWT/Node 等易错点）
docsify-knowledge-site         # 导航
interview-curriculum-sync      # 速记 / 追问清单
```

## 完成后

- [ ] 符合 `knowledge-article-author` 自检（无「面试定位」；有口述 / 一句话 / 原理 / 常见误区 / 追问）
- [ ] 至少 1 处「前端如何消费该能力/接口」
- [ ] 已查重并与速记/深文互链
- [ ] 新导航项 → `docsify-knowledge-site`
- [ ] 大栏目变更 → `interview-curriculum-sync`
