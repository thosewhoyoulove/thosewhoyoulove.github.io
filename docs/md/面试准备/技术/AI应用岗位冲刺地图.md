# AI 应用岗位冲刺地图

## 面试定位

面向「云计算 / AI 服务平台前端 + 参与 Agent/Skills 建设」类 JD。目标不是再学一套百科，而是按岗位职责把已有文章串成**可口述的准备路径**。React / TypeScript / Node 基本功仍走原栏目。

## 面试回答

> 这类岗位我会按四条线准备：第一，AI 核心概念——LLM 边界、Prompt、Agent 循环、Skill 与 MCP；第二，Agent 产品前端——对话状态机、SSE 流式、工具调用与 HITL、Token 体验、安全与可观测；第三，AI Native 提效——Cursor/Copilot 用在哪些环节、如何验证与合规；第四，前端基本功与 BFF 协作——React 工程能力加上流式接口在 Node/BFF 的落点。对客官网场景我会强调开发者体验、国际化文案与稳定的错误可恢复；对内提效场景强调 Skill 沉淀和可观测。准备时用速记过一遍，再用追问清单自测，保证能落到项目例子。

一句话总结：

> 冲刺地图 = 概念能讲清 + 产品前端能设计 + AI 提效有闭环 + 基本功不丢。

---

## 核心原理

```text
JD 职责/要求
  → 映射到知识文章
  → 每条准备「结论 + 原理 + 项目例子 + 边界」
  → 用追问清单模拟连续追问
```

---

## 1. 岗位职责 → 复习条目

| 职责 | 你要能讲什么 | 去读 |
| --- | --- | --- |
| 对客官网 / 开发者平台 | 文档助手、控制台体验、错误可恢复、i18n | [对话界面架构](/md/Agent/对话界面架构.md)、本文 §4 |
| 对客 + 内部运营产品 | 同一套消息模型，权限与审计不同 | [安全与合规（前端）](/md/Agent/安全与合规（前端）.md) |
| 构建 Agent / Skills | Agent 循环、Skill 治理、工具展示 | [Agent 与 Skill 体系](/md/Agent/Agent与Skill体系.md)、[工具调用与结果展示](/md/Agent/工具调用与结果展示.md) |
| 团队 AI 能力沉淀 | 规则、Skill、Review、指标 | [Cursor / Copilot 与 AI Coding](/md/Agent/Cursor与Copilot与AICoding.md)、[平时工作怎么使用 AI](/md/面试准备/综合/平时工作怎么使用AI.md) |

---

## 2. 岗位要求 → 复习条目

| 要求 | 必背结论 | 去读 |
| --- | --- | --- |
| LLM / Agent / Prompt / Skill | 模型有边界；Agent 是工具闭环；Skill 可复用 | [LLM 与 Prompt Engineering](/md/Agent/LLM与PromptEngineering.md)、[Agent 与 Skill 体系](/md/Agent/Agent与Skill体系.md)、[MCP 与工具调用概念](/md/Agent/MCP与工具调用概念.md) |
| AI Native + Cursor/Copilot | 上下文质量 + 验证闭环 | [Cursor / Copilot 与 AI Coding](/md/Agent/Cursor与Copilot与AICoding.md) |
| React + TypeScript | 更新模型、Hooks、类型建模 | [React & Vue 速记](/md/面试准备/技术/React%20&%20Vue.md) |
| Node / BFF / SSR | 流式聚合、鉴权、错误结构 | [Node.js 与全栈](/md/面试准备/技术/NodeJs%20&%20全栈开发.md)、[流式渲染与 SSE](/md/Agent/流式渲染与SSE.md) |
| 独立解决 AI 前端问题 | 状态机、取消、脱敏、可观测 | 产品前端 6 篇 |
| 英文与国际化 | 能读官方文档；UI 预留 i18n | 本文 §4 |

总入口：[AI Agent 速记](/md/面试准备/技术/AI%20Agent.md)。

---

## 3. 建议冲刺顺序（2～3 天）

### Day 1：概念 + 提效

- [AI Agent 速记](/md/面试准备/技术/AI%20Agent.md)
- 核心概念 3 篇
- [平时工作怎么使用 AI](/md/面试准备/综合/平时工作怎么使用AI.md)
- [Cursor / Copilot 与 AI Coding](/md/Agent/Cursor与Copilot与AICoding.md)

### Day 2：产品前端主链路

- [对话界面架构](/md/Agent/对话界面架构.md)
- [流式渲染与 SSE](/md/Agent/流式渲染与SSE.md)
- [工具调用与结果展示](/md/Agent/工具调用与结果展示.md)
- [上下文与 Token 体验](/md/Agent/上下文与Token体验.md)

### Day 3：安全可观测 + 基本功回炉

- [安全与合规（前端）](/md/Agent/安全与合规（前端）.md)
- [可观测性与 Debug 体验](/md/Agent/可观测性与Debug体验.md)
- React / Node 速记查漏
- [高频追问清单](/md/面试准备/高频追问清单.md) 中 AI Agent 小节自测

---

## 4. 英文与国际化（短节）

岗位常要求英文基础与国际化思维，面试可这样答：

> 我会直接阅读模型与协议的英文文档（OpenAI、MCP 等），把概念翻译成团队可落地的中文方案。对客官网上，所有 AI 相关文案、错误码说明、合规提示走 i18n；日期、数字、语气按 locale 处理；不要在 Prompt 或 UI 里写死只对中文友好的假设。

检查清单：

- 关键文案进资源文件，不硬编码
- 错误与合规提示有英文稿
- Prompt 与用户语言策略明确（跟随 UI 语言或用户消息语言）

---

## 高频追问

### 没有线上 Agent 项目怎么谈经验？

可谈：用 Cursor 在业务仓库提效的流程与指标；侧项目或内部原型的对话/SSE 实现；把现有 B 端做成“助手化”的设计方案。重点讲状态机与验证，少吹模型调参。

### 和纯前端岗位面试有何不同？

多出一层：你会不会把不确定的生成式能力做成可靠产品。基本功仍要硬，但加分在 Agent 前端与 AI 工程闭环。

### 先深挖概念还是先深挖 SSE？

对工程岗，建议概念速通后马上拿对话 + SSE + 工具 UI 当主线，概念题用速记顶住即可。

---

## 延伸阅读

- [AI Agent 速记](/md/面试准备/技术/AI%20Agent.md)
- [复习路线](/md/面试准备/复习路线.md)
- [高频追问清单](/md/面试准备/高频追问清单.md)
