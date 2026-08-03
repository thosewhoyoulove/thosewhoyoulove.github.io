# AI Agent 速记

## 面试定位

AI Agent 相关题重点不是背名词，而是能不能讲清：**LLM 能力边界、Agent 循环、Skill/工具调用、对话与生成式 UI、不确定数据下的状态机、RAG/Eval、以及 AI Coding 工程闭环**。前端基本功（React / TypeScript）仍走框架栏目，本速记只覆盖 AI 应用与 Agent 产品侧。

## 面试回答

> 我对 AI Agent 的理解分三层。第一层是模型层：LLM 是概率生成器，有上下文窗口和幻觉边界，Prompt Engineering 负责把任务、约束和格式说清楚；私有知识靠 RAG，质量靠 Eval。第二层是 Agent 层：模型通过规划、调用工具、观察结果形成闭环，Skill 是可复用的能力单元，MCP 则是工具发现与调用的协议化方式。第三层是产品前端：不只聊天气泡，还包括生成式 UI 协议、Run 状态机、人机协同与主动式交互，以及流式不确定数据下仍要确定性的体验。做 AI 相关岗位时，我会强调自己既能用 Cursor/Copilot 提效，又能把 Agent 能力做成可靠的对客/B2B 工作台体验。

一句话总结：

> AI Agent = LLM/RAG 推理 + 工具闭环 + 协议化生成式 UI + 可评测的确定性状态机。

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
| 生成式 UI | 白名单组件协议 + 流式 partial + 未知类型降级 | [生成式 UI 与动态组件协议](/md/Agent/生成式UI与动态组件协议.md) |
| 不确定状态机 | 模型可随机，Run 事件归约必须确定可回放 | [不确定性下的前端状态机](/md/Agent/不确定性下的前端状态机.md) |
| 人机协同 / 主动式 | 分级介入；主动推送可管理、可追溯 | [人机协同与主动式交互](/md/Agent/人机协同与主动式交互.md) |
| RAG 体验 | 检索可见、citation 可点、空结果诚实降级 | [RAG 与检索增强体验](/md/Agent/RAG与检索增强体验.md) |
| 上下文与 Token | 把成本与截断变成用户可理解的提示，而不是静默失败 | [上下文与 Token 体验](/md/Agent/上下文与Token体验.md) |
| 安全与合规 | 前端负责脱敏、拦截密钥、溯源展示，不能只靠后端 | [安全与合规（前端）](/md/Agent/安全与合规（前端）.md) |
| 可观测与 Debug | requestId、首 token、工具失败率决定能不能排障 | [可观测性与 Debug 体验](/md/Agent/可观测性与Debug体验.md) |
| Eval 质量体系 | 契约 + 黄金集 + 线上反馈，防随机性回退 | [AI 输出 Eval 与质量体系](/md/Agent/AI输出Eval与质量体系.md) |

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

状态一致性：流式增量、生成式 UI patch、工具调用、取消重试、多会话切换同时发生时，必须以服务端事件为准，并保证 UI 可中断、可恢复、可解释。

### 生成式 UI 和 Markdown 气泡有什么差别？

Markdown 适合叙述；生成式 UI 用白名单协议渲染对比卡、工作台等高密度交互，流式中 patch 同一 block，非法类型必须降级。

### Skill 和 Prompt 有什么关系？

Prompt 是单次指令；Skill 是沉淀下来的能力包（说明、约束、工具权限、示例），让团队复用而不是每次从零写 Prompt。

## 相关链接

- [高频追问清单](/md/面试准备/高频追问清单.md)
- [复习路线](/md/面试准备/复习路线.md)
- [React & Vue 速记](/md/面试准备/技术/React%20&%20Vue.md)
