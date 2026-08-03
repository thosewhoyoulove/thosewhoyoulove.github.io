# AI Agent 速记

## 面试定位

AI Agent 相关题重点不是背名词，而是能不能讲清：**LLM 能力边界、Agent 循环、Skill/工具调用、对话产品前端状态机、流式协议、以及 AI Coding 如何进入工程闭环**。前端基本功（React / TypeScript）仍走框架栏目，本速记只覆盖 AI 应用与 Agent 产品侧。

## 面试回答

> 我对 AI Agent 的理解分三层。第一层是模型层：LLM 是概率生成器，有上下文窗口和幻觉边界，Prompt Engineering 负责把任务、约束和格式说清楚。第二层是 Agent 层：模型通过规划、调用工具、观察结果形成闭环，Skill 是可复用的能力单元，MCP 则是工具发现与调用的协议化方式。第三层是产品前端：对话界面要管消息模型、流式渲染、工具调用展示、人工确认、上下文体验、安全和可观测性。做 AI 相关岗位时，我会强调自己既能用 Cursor/Copilot 提效，又能把 Agent 能力做成可靠的对客体验，而不是只会调一次 Chat API。

一句话总结：

> AI Agent = LLM 推理 + 工具/Skill 闭环 + 可中断可观测的前端状态机。

## 核心概念

| 题目 | 必背结论 | 深文 |
| --- | --- | --- |
| LLM 与 Prompt | 模型有窗口与幻觉；Prompt 要任务、约束、格式、示例齐全 | [LLM 与 Prompt Engineering](/md/Agent/LLM与PromptEngineering.md) |
| Agent 与 Skill | Agent 是感知→规划→工具→观察循环；Skill 沉淀可复用能力 | [Agent 与 Skill 体系](/md/Agent/Agent与Skill体系.md) |
| MCP 与工具调用 | Tool Calling 让模型选工具；MCP 标准化工具发现与权限边界 | [MCP 与工具调用概念](/md/Agent/MCP与工具调用概念.md) |

## Agent 产品前端

| 题目 | 必背结论 | 深文 |
| --- | --- | --- |
| 对话界面架构 | 以消息列表为中心，区分乐观 UI 与服务端流式真相 | [对话界面架构](/md/Agent/对话界面架构.md) |
| 流式渲染与 SSE | SSE/fetch stream 适合单向推送；必须支持取消与断线恢复 | [流式渲染与 SSE](/md/Agent/流式渲染与SSE.md) |
| 工具调用展示 | pending / success / error / cancelled，敏感操作要 HITL | [工具调用与结果展示](/md/Agent/工具调用与结果展示.md) |
| 上下文与 Token | 把成本与截断变成用户可理解的提示，而不是静默失败 | [上下文与 Token 体验](/md/Agent/上下文与Token体验.md) |
| 安全与合规 | 前端负责脱敏、拦截密钥、溯源展示，不能只靠后端 | [安全与合规（前端）](/md/Agent/安全与合规（前端）.md) |
| 可观测与 Debug | requestId、首 token、工具失败率决定能不能排障 | [可观测性与 Debug 体验](/md/Agent/可观测性与Debug体验.md) |

## AI Native 研发效能

| 题目 | 必背结论 | 深文 |
| --- | --- | --- |
| 工作中怎么用 AI | AI 给候选方案，人做判断、验证与质量负责 | [平时工作怎么使用 AI](/md/面试准备/综合/平时工作怎么使用AI.md) |
| Cursor / Copilot | 工具能力不同，关键是上下文质量与工程闭环 | [Cursor / Copilot 与 AI Coding](/md/Agent/Cursor与Copilot与AICoding.md) |
| 岗位冲刺 | 按 JD 映射概念、产品前端、提效与全栈边界 | [AI 应用岗位冲刺地图](/md/面试准备/技术/AI应用岗位冲刺地图.md) |

## 和 React / Node 的边界

| 方向 | 去哪复习 |
| --- | --- |
| React Hooks / Fiber / 状态管理 | [React & Vue 速记](/md/面试准备/技术/React%20&%20Vue.md) |
| BFF、流式接口、鉴权协作 | [Node.js 与全栈](/md/面试准备/技术/NodeJs%20&%20全栈开发.md) |
| XSS、敏感信息存储 | [网络与安全速记](/md/面试准备/技术/网络与安全.md) |

## 高频追问

### Agent 和普通 Chatbot 有什么区别？

Chatbot 主要是多轮文本问答；Agent 会规划步骤、调用工具、根据观察结果继续决策，前端要展示工具态和人工确认，而不只是打字机输出。

### 前端在 Agent 系统里最难的是什么？

状态一致性：流式增量、工具调用、取消重试、多会话切换同时发生时，必须以服务端事件为准，并保证 UI 可中断、可恢复、可解释。

### Skill 和 Prompt 有什么关系？

Prompt 是单次指令；Skill 是沉淀下来的能力包（说明、约束、工具权限、示例），让团队复用而不是每次从零写 Prompt。

## 相关链接

- [高频追问清单](/md/面试准备/高频追问清单.md)
- [复习路线](/md/面试准备/复习路线.md)
- [React & Vue 速记](/md/面试准备/技术/React%20&%20Vue.md)
