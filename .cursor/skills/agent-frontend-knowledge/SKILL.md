---
name: agent-frontend-knowledge
description: >-
  Authors interview-oriented articles on AI agent product frontends: chat UI,
  SSE/streaming, tool-call rendering, human-in-the-loop, context UX, safety, and
  observability. Use when writing Agent/LLM/对话流式/MCP/ChatGPT-like UI/Cursor
  类产品前端  knowledge for this Docsify repo.
---

# Agent 产品前端知识

为本知识库新增「**AI Agent / 对话式产品前端**」栏目。读者仍是**面试候选人** + **真实做 Agent 界面的前端**：要能口述、能讲架构取舍、能讲工程验证。

**文章骨架与写作精度遵循** `knowledge-article-author`（面试回答为首章、2～3 分钟口述、主链路、Trace、常见误区、追问链）。本 skill 定义**领域边界与专题地图**。

## 何时使用

- 写聊天 UI、流式输出、工具调用展示、多会话、附件、人工确认
- 写 SSE、WebSocket 与 LLM 协议在前端的落点
- 写 AI 研发流程（可链到 `平时工作怎么使用AI.md`）
- 面经中出现 Cursor、Copilot、Agent 模式对比类题目

## 与「平时工作怎么使用 AI」的分工

| 文档侧重 | 路径倾向 |
| --- | --- |
| 研发流程、prompt、review、风险 | `面试准备/综合/平时工作怎么使用AI.md` |
| **产品 UI、协议、性能、状态机** | 新建 `docs/md/Agent/` 或 `面试准备/技术/` 下 Agent 专题 |

避免同一机制写两遍；用 `延伸阅读` 互链。

## 建议目录

```text
docs/md/Agent/                    # 推荐新建分类
├── 对话界面架构.md
├── 流式渲染与SSE.md
├── 工具调用与结果展示.md
├── 上下文与Token体验.md
├── 安全与合规（前端）.md
└── 可观测性与Debug体验.md
```

侧边栏：在 `generateSidebar.js` 增加分组「Agent 与 AI 前端」（放在「协作与加分项」前或作为其子项），执行 `docsify-knowledge-site`。

## 每篇必须覆盖的面试维度

1. **用户感知**：加载、打字机、中断、重试、失败可复制
2. **状态模型**：消息列表、分支、编辑、多会话、乐观更新 vs 服务端真相
3. **协议层**：SSE / fetch stream / WebSocket 选型；事件类型解析；背压与取消
4. **工具调用 UI**：pending / success / error；参数 JSON 展示；需人工 approve 的流程
5. **性能**：长列表虚拟滚动、markdown 增量解析、防抖渲染
6. **安全**：敏感信息不上传、脱敏展示、内网/密钥不进 prompt 的前端拦截
7. **可观测**：requestId、trace、复现步骤（可对照 `百度面经.md` 中 Debug 模式题）

写入正文时：先画整体链路（例如：用户发送 → 建消息 → 建连接 → 增量渲染 → 工具调用态 → 完成/失败），再展开各维；协议/状态机至少给一个最小 Trace。

## 技术表述注意

- **SDK / 官方 API**（Cursor Agent、OpenAI 等）：先查官方文档或 Cursor `sdk` skill，再写入；版本不明则标注「以官方文档为准」。
- 区分 **产品概念**（Agent、Tool、MCP）与 **实现细节**（具体字段名易变，用示意图 + 伪结构）；术语首次出现先白话。
- 区分直觉模型（「像打字机一样往外蹦字」）与工程模型（chunk 缓冲、未完成 markdown 如何渲染）。
- 全栈衔接：流式接口常在 BFF/Node 聚合，可链 `fullstack-knowledge-expansion`。

## 口述模板（写入「面试回答」）

```text
场景（聊天/IDE/企业 Copilot）解决什么问题
→ 前端状态机与消息模型
→ 流式/工具调用的渲染与错误恢复（带一例）
→ 性能与安全边界 / 设计取舍
→ 怎么验证（E2E、录屏、日志、人工 approve）
```

## 常见误区（Agent 文建议覆盖）

- 「SSE 是双向通信」→ 下行推送；上行另接口
- 「流式 = WebSocket」→ 协议、代理、重连策略不同
- 「乐观更新永远正确」→ 以服务端事件为准的冲突处理
- 把易变 SDK 字段名写成跨产品通用事实

## 专题地图

详见 [reference/topic-outline.md](reference/topic-outline.md)。

## 与其他 skill 的关系

```text
knowledge-article-author       # 结构与写作精度（必须先读）
  ↑ 本 skill 只补 Agent 领域
technical-accuracy-review      # SSE/SDK 等事实校对
docsify-knowledge-site         # Agent 分组进侧边栏
interview-curriculum-sync      # 追问清单 / 可选速记
fullstack-knowledge-expansion  # BFF 流式聚合等后端边界
```

## 完成后

- [ ] 符合 `knowledge-article-author` 自检（无「面试定位」；有口述 / 一句话 / 原理 / 常见误区 / 追问）
- [ ] 与 `平时工作怎么使用AI.md` / 面经互链
- [ ] `SIDEBAR` + generate-sidebar（`docsify-knowledge-site`）
- [ ] 可选：在 `高频追问清单.md` 增加「Agent 前端」小节 2～5 题 → `interview-curriculum-sync`
