# 探迹多产品 Agent 前端（tungee-agent）

## 面试定位

这是你**已上线、可深挖的 AI Agent 产品前端项目**，最适合对标 Accio / AI 应用前端岗。面试官会追问：多产品如何复用、SSE 状态怎么稳、iframe 嵌入怎么做、扩展点怎么设计、哪些没做完。

回答要分清边界：

- **你做的是前端 monorepo**（协议、流式、UI、Extension、嵌入与发布）。
- **LLM / Agent Backend / DB** 是独立服务；前端通过同源 `/api/*` 对接，不要吹成「自己训模型」。
- Sales 非 Chat 导航页、正式 Host Bridge RPC 等是**未完成/可优化点**，主动讲比被问穿更安全。

相关原理可链：[对话界面架构](/md/Agent/对话界面架构.md)、[流式渲染与 SSE](/md/Agent/流式渲染与SSE.md)、[工具调用与结果展示](/md/Agent/工具调用与结果展示.md)、[生成式 UI 与动态组件协议](/md/Agent/生成式UI与动态组件协议.md)。

## 面试回答

可以这样答（2 分钟版）：

> 我独立负责并上线了探迹多产品 Agent 前端 workspace。业务上要把 AI Agent 聊天能力铺到销售独立站、拓客宿主内嵌、智能呼叫跨域嵌入三套产品，后端与登录态各自独立，前端不能写成一个大泥球。
>
> 我做成 npm workspaces monorepo：抽出 `@tungee/agent-core`，沉淀 SSE 会话协议、事件归约、流控取消、通用 Chat UI 和 Extension 扩展点；`sales` / `tuoke` / `ai-call` 三个应用只写产品差异——CRM 确认、客群/AiTable 开宿主面板、外呼三步向导等。宿主是 React 17 + 老 Ant Design，iframe 里是 React 19 + Ant Design 6，用 iframe 隔离而不是强行 Module Federation 共享 React。
>
> 难点主要在流式不确定事件下的确定性 UI，以及嵌入场景的鉴权与通信。我用 event_id 去重合并、AbortController 取消、wait 做人机确认；拓客/呼叫通过 postMessage 同步登录失效和打开宿主面板。发布上走 GitLab CI 多环境构建和 CDN。如果重做，我会优先补齐正式 Host Bridge RPC、产品层自动化测试和 Sales 非 Chat 页面，并把端侧性能与 Eval 埋点做实。

一句话总结：

> tungee-agent = 多产品共享 Agent Core（SSE + Runtime + UI）+ Extension 差异化 + iframe 嵌入上线。

---

## 核心原理

```text
产品应用（sales / tuoke / ai-call）
  → 实现 AgentClient（对接各自 Backend）
  → @tungee/agent-core：协议事件 → eventStore → streamController → React Hooks → Conversation UI
  → Extension：Tool / Wait / Widget / SidePanel / Composer 插槽
  →（嵌入产品）Host Bridge postMessage ↔ 宿主
```

仓库结构（面试可画）：

```text
tungee-agent/
├── agent-core/core          # @tungee/agent-core：协议 / SSE / Runtime / UI
├── agent-core/host-bridge   # 正式桥接包（目前偏骨架）
├── sales/                   # agent.tungee.com 独立站
├── tuoke/                   # 拓客 /agent-frame iframe
├── ai-call/                 # 智能呼叫跨域 iframe
└── docs/                    # 多产品架构文档
```

技术栈：**React 19、Ant Design 6、React Router 7、Vite 8、JS ESM、CSS Modules/Less**；Node 22；GitLab CI + rsync/CDN。

---

## 1. 业务背景与产品形态

| 产品 | 形态 | 用户价值（口述） |
| --- | --- | --- |
| Sales Agent | 独立站 `agent.tungee.com` | 销售侧 AI 助手：会话、Skills、Connectors、CRM 写入确认 |
| Tuoke Agent | 拓客产品内 iframe | 在拓客作业流里用 Agent：客群、筛选、企业详情、积分 |
| AI Call Agent | 跨域 iframe | 智能外呼场景：选线路/意向/推送对象的向导式确认 |

架构约束（文档与实现一致）：

- **共享前端协议与 UI，不共享 Backend / DB / 登录态**。
- Core **禁止**依赖产品代码；产品禁止深入 `agent-core/core/src` 内部路径，走包导出。

---

## 2. 你的职责（怎么说「独立开发」）

建议表述（按你真实情况微调百分比）：

> 我作为前端侧主要负责人，从零搭了多产品 Agent workspace：Core 抽取、三产品接入、SSE/会话体验、Extension 扩展、iframe 通信与多环境发布，并推动与各 Agent Backend 联调上线。

可举证的交付物：

1. `@tungee/agent-core`：协议事件、SSE 解析、eventStore、streamController、会话 Hooks、通用 UI。
2. 三产品 Client + Extensions + 鉴权适配。
3. 拓客/呼叫 Host Bridge（产品内实现）与分享、积分等页面。
4. GitLab 多产品多环境构建发布链路。

不要说成：独立完成 LLM、RAG、Python Agent 编排——那些在 Backend。

---

## 3. 重点能力（面试主菜）

### 3.1 SSE 流式会话与状态归约

链路：

```text
createSession → POST chat（Accept: text/event-stream）
  → 解析 SSE（粘包 / comment / 结束标记）
  → event_id 去重与深度合并
  → 更新 message / tool / plan / todo / wait / widget
  → 停止（Abort）/ 继续 / 重试
```

为什么难：事件乱序与重复、用户取消、工具与文本交错、MapReduce 子任务进度（`map_subtask`）。

对应知识库：[流式渲染与 SSE](/md/Agent/流式渲染与SSE.md)、[不确定性下的前端状态机](/md/Agent/不确定性下的前端状态机.md)。

### 3.2 Extension：多产品差异不污染 Core

| 扩展点 | Sales | Tuoke | AI Call |
| --- | --- | --- | --- |
| Wait / HITL | CRM 写入确认、Connector | （业务确认） | 外呼三步向导 |
| Widget / 卡片 | 消息撰写等 | 客群、筛选、企业、AiTable | `outbound_task` |
| Composer | Skills / Connectors / Mode | 积分相关能力 | 智能体 @mention |
| Host | 较少 | 开宿主面板、登录失效、分享 URL | cookie / api_host、登录失效 |

口述金句：

> 产品差异走注册表扩展，Core 只认协议事件。否则三个 Backend 字段一变，公共 UI 就会被 if-else 炸穿。

### 3.3 iframe 嵌入与技术栈隔离

- 宿主：React 17 + 老 Ant Design；iframe：React 19 + Ant Design 6。
- **选型**：iframe 隔离，而不是 Module Federation 强行共享 React（版本冲突与样式污染成本更高）。
- 通信：`postMessage`（会话变更、打开面板、`authenticationExpired`）；正式 `@tungee/agent-host-bridge` RPC 尚未补齐（见第 6 节）。

### 3.4 人机协同（HITL）

`wait` 事件驱动确认流：CRM 写入审核、Connector 授权、外呼参数三步选择。高风险动作不自动落库。

对应：[工具调用与结果展示](/md/Agent/工具调用与结果展示.md)、[人机协同与主动式交互](/md/Agent/人机协同与主动式交互.md)。

### 3.5 工程化与发布

- workspaces + `run.js` 编排 `dev/build`（先构建 core 再起产品）。
- GitLab CI：按 commit 关键字构建 `sales|tuoke|ai-call` 与环境后缀，产物进 CDN 目录。
- 压缩：`vite-plugin-compression`；附件预览：PDF / 表格 / PPT / Markdown 等（Core 能力）。

---

## 4. 难点与方案（深挖版）

### 难点 1：流式下 UI 如何「确定」

**问题**：Backend 推送非结构化增量（文本 delta、tool、wait、widget 交错），直接 setState 会闪、会串、取消后仍写入。

**方案**：

- Runtime 层统一收事件，按 `event_id` 去重合并。
- `streamController` 管 Abort 与请求序列，过期流丢弃。
- UI 订阅会话快照，而不是每个 chunk 各自为政。

**验证**：停止生成后不再追加；刷新进未完成会话可恢复或明确结束；弱网下不出现双份助手气泡。

### 难点 2：三产品 Backend 字段不一致

**问题**：共享 UI，但 API 前缀、登录、业务 widget 不同。

**方案**：

- 每产品 `createXxxAgentClient` + Adapter 归一到 Core 协议。
- 业务 UI 只挂 Extension，不进 Core。
- Tuoke 用 URL/cookie 同步 `product_type` / `api_prefix`。

### 难点 3：嵌入场景鉴权失效

**问题**：iframe 内 401 不能只跳自己的登录页，宿主会话可能已掉。

**方案**：Tuoke / AI Call 401 → 通知宿主 `authenticationExpired`；Sales 独立站则按域名映射跳转用户中心。

### 难点 4：宿主能力调用的超时降级

**问题**：打开 AiTable / 企业详情依赖宿主面板；宿主未实现或超时会卡住。

**方案**：bridge 调用设超时；失败时前端提示降级，不阻塞聊天主路径（正式 RPC 包仍待补齐）。

---

## 5. 结果怎么讲（缺精确指标时）

仓库内没有现成的延迟/转化大盘数字时，用**可核实结果**说：

| 维度 | 可讲法 |
| --- | --- |
| 交付 | 三套产品形态已对接独立 Backend 并上线部署链路 |
| 复用 | Chat 主链路收敛进 `@tungee/agent-core`，产品以 Extension 接入 |
| 体验 | 流式会话、停止/重试、工具卡、wait 确认、附件预览可用 |
| 工程 | 多环境 CI 构建 + CDN；Core 侧有 sse/eventStore 等单测 |

有数据再补：首 token、会话成功率、工具失败率、bridge 超时率。

---

## 6. 没做完的 / 可优化点（主动讲）

面试官喜欢听「你知道边界」。建议原话：

> 项目已经上线支撑三产品 Chat 主链路，但我清楚还有几块没做完或偏弱。

| 项 | 现状 | 优化方向 |
| --- | --- | --- |
| Sales 侧栏多页 | `task-results` / `automation` / `personalization` / `customers` / `calls` 多为「开发中」占位 | 按业务优先级做真页面，或未做前不进主导航承诺 |
| `@tungee/agent-host-bridge` | 正式包偏协议常量骨架；产品用本地 `hostBridge.js` | 补握手、RPC、超时、白名单、版本协商，替换产品私有实现 |
| 产品层自动化测试 | CI 偏构建发布；产品 E2E 弱 | 黄金路径：发消息 / 取消 / wait 确认 / 401 通知宿主 |
| 前端可观测 / Eval | 缺统一 runId 大盘与输出评测门禁 | 对齐 [可观测性与 Debug](/md/Agent/可观测性与Debug体验.md)、[Eval](/md/Agent/AI输出Eval与质量体系.md) |
| RAG / 检索 UX | 检索类能力在 Backend tool；前端无独立 RAG 面板 | 若岗位强调 RAG，补 citation / 检索中态（见 [RAG 体验](/md/Agent/RAG与检索增强体验.md)） |
| TypeScript | 主体仍是 JS ESM | 对 Core 协议与 Client 边界渐进 TS，降契约事故 |
| Tuoke 能力开关 | 聊天里 Skills/语音等有关闭，与 manifest 不完全一致 | 产品配置单一事实源 |
| 上游同步工具 | `upstream:diff` 等规划未落地 | 减少从销售基线同步的手工成本 |

**重做会先做的三件事**：

1. Host Bridge 正式化（嵌入是拓客/呼叫的生命线）。  
2. Chat 黄金路径 E2E + 契约测试（防 SSE/协议回归）。  
3. runId 贯通的前端埋点（首 token、取消率、wait 转化、bridge 失败）。

---

## 7. 30 秒 / 深挖追问

### 30 秒版

> 我做了探迹多产品 Agent 前端：抽 Core 做 SSE 会话和通用 Chat UI，销售站、拓客 iframe、呼叫跨域三套产品用 Extension 接差异，已上线。重点是流式状态稳定和嵌入隔离，Backend 与模型不在这个仓。

### 常见追问速答

**为什么不用 Module Federation？**  
宿主与 iframe React 大版本不一致，共享运行时冲突和样式污染风险高；iframe + 协议通信更可控。

**Agent 和普通 ChatBot 在你项目里差在哪？**  
不只打字机：有 tool 卡、plan/todo、wait 确认、业务 widget，以及外呼向导这种多步 HITL。

**你怎么保证三产品不互相拖累？**  
依赖单向、Client 适配、Extension 注册；发布可按产品关键字单独构建。

**前端调了哪个模型？**  
前端不直连模型，只消费 Backend SSE 协议；模型与编排在 Agent 服务侧。

---

## 8. 简历条目示例（可改）

```text
探迹多产品 Agent 前端（独立负责 · 已上线）
- 搭建 React19 + Vite8 monorepo，抽取 agent-core（SSE 协议、流控、Chat UI、Extension）
- 落地销售独立站 / 拓客 iframe / 智能呼叫跨域三套产品，对接独立 Agent Backend
- 解决流式事件归约与取消、HITL 确认、iframe 鉴权与宿主通信；GitLab 多环境 CDN 发布
- 后续规划：Host Bridge RPC 正式化、E2E/可观测、Sales 非 Chat 页面与 Core TS 化
```

---

## 延伸阅读

- [你的项目经历（重点）](/md/面试准备/项目与架构/你的项目经历（重点）.md)
- [项目表达模板](/md/面试准备/项目表达模板.md)
- [AI Agent 速记](/md/面试准备/技术/AI%20Agent.md)
- [AI 应用岗位冲刺地图](/md/面试准备/技术/AI应用岗位冲刺地图.md)
- [流式渲染与 SSE](/md/Agent/流式渲染与SSE.md)
- [对话界面架构](/md/Agent/对话界面架构.md)
- [人机协同与主动式交互](/md/Agent/人机协同与主动式交互.md)
