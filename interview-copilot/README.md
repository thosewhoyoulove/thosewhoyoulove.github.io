# Interview Copilot

基于当前 Docsify 知识库的面试问答 Agent。Node.js 服务负责检索、工具执行与模型调用；React Widget 只消费 SSE 事件。现有 `docs/` 文章、侧栏生成和 GitHub Pages 工作流保持原样。

## 运行

要求 Node.js 22.13+（Cursor SDK 的最低要求）。

```bash
cd interview-copilot
npm install
cp .env.example .env
npm run dev
```

默认 `COPILOT_MODE=mock`，无需 Key。另开终端运行 `npm run dev:widget`，打开 Vite 显示的地址开发 Widget；运行 `npm run build` 会把 Widget 打包到 `docs/assets/interview-copilot/`。在本地用 `cd docs && npm run dev` 预览博客。服务健康检查：`GET http://127.0.0.1:8787/api/copilot/health`。完整验证：`npm run check`，随后在 `docs/` 执行 `npm run check`。

要调用真实模型，在服务端环境设 `COPILOT_MODE=openai`、`OPENAI_API_KEY` 和 `OPENAI_MODEL`。浏览器构建只允许使用 `VITE_COPILOT_API_URL` 指向公开 API 基址，绝不能把密钥放在 `VITE_` 变量中。若前后端跨域，服务端设置 `COPILOT_ORIGIN` 为博客的精确 Origin。GitHub Pages 只托管静态文件，真实模式需要另外部署持久运行的 Node 服务；公开部署前还需要加访问控制和请求限流。

本地打开 Docsify 页面时，Widget 会自动连接 `http://127.0.0.1:8787`；后端默认允许 Docsify 的 3000 端口和 Vite 的 5173 端口。若前后端分开部署，构建时设置 `VITE_COPILOT_API_URL` 为实际 API 地址，服务端设置 `COPILOT_ORIGIN` 为博客的精确 Origin。

现有 `https://thosewhoyoulove.github.io` 博客可继续使用同一助手：Widget 在该域名下默认连接 `https://omen-blog.vercel.app`，Vercel API 允许该博客 Origin 的跨域请求和 POST 预检。Vercel 博客仍使用同域 API。GitHub Pages 自身不能处理聊天 POST；若更换后端域名，应同步更新 Widget API 地址并重新构建发布。自定义跨域博客可通过 `COPILOT_ORIGIN` 配置其精确 Origin。

## 部署到 Vercel（博客和 Agent 同域）

仓库根目录的 `vercel.json` 会执行根目录 `npm run build`、发布 `docs/`，并把 `/api/copilot/chat` 和 `/api/copilot/health` 构建为 Vercel Functions。函数会读取随部署打包的 `docs/md/` 原始文章。原来的本地 `src/server.ts` 继续用于本地开发，线上无需启动常驻进程。

1. 在 Vercel 导入此 GitHub 仓库；**Root Directory 设为仓库根目录 `.`**，不要设成 `docs` 或 `interview-copilot`。框架设为 **Other**。仓库的 `vercel.json` 已指定 Build Command 和 Output Directory；若控制台有旧的项目级设置，检查它们是否与仓库配置冲突。
2. 在 Vercel Project Settings → Environment Variables 中为 Production（需要预览时也为 Preview）设置：`COPILOT_MODE=openai`、`OPENAI_API_KEY=你的服务端密钥`、`OPENAI_MODEL=gpt-4.1-mini`。API Key 不要写进代码、Git 或以 `VITE_` 开头的变量。未设置模式时 Vercel 也会选择真实模型模式，并在缺少 Key 或模型名时让健康检查返回 503。
3. `VITE_COPILOT_API_URL` **留空**，Widget 会请求同一 Vercel 域名下的 `/api/copilot/chat`，不需要配置跨域。设置完变量后重新部署。
4. 先访问 `https://你的域名/api/copilot/health`，确认 `ok: true`、`mode: openai` 和文章数，再在博客页面问一个需要检索的问题，观察 `search_articles`、`read_article` 事件及文章引用。

Vercel 项目必须从仓库根目录部署，否则读不到根目录的 `vercel.json` 和 `api/` 函数。GitHub Pages 仍可发布静态博客，但它不能运行这里的 API。公开开放真实模型前，请在 Vercel 配置访问控制或限流，避免匿名请求消耗 API 额度。

## 切换兼容模型服务

本地在 `interview-copilot/.env` 配置，线上在 Vercel 的 Environment Variables 配置：

```dotenv
COPILOT_MODE=openai
LLM_BASE_URL=https://你的服务商域名/接口前缀
LLM_API_KEY=该服务商的API密钥
LLM_MODEL=该服务商支持工具调用的模型名称
```

`openai` 在这里表示 OpenAI Chat Completions 兼容协议。`LLM_BASE_URL` 必须填写服务商官方文档中的 API 基址，程序自动追加 `/chat/completions`，不要填控制台网址或重复填写完整接口路径。模型需要支持 `tools`、指定函数的 `tool_choice`、`tool_calls` 和工具结果回填；只支持普通文本聊天的接口无法保证 Agent 闭环。Cursor 的 `crsr_` Key 不支持此适配器。

新变量优先；未填写 `LLM_BASE_URL` 时默认连接 OpenAI，并兼容原有 `OPENAI_API_KEY`、`OPENAI_MODEL`。配置第三方地址时必须填写 `LLM_API_KEY`，不会把旧 OpenAI Key 自动发送给第三方。修改本地配置后重启后端；修改 Vercel 变量后重新部署。密钥始终只放服务端。先检查 `/api/copilot/health`，再实际提问确认工具执行和回答；健康检查不会验证模型凭据。

架构上，这属于决策层的 Provider Adapter：统一配置由本地服务器和 Vercel 共用，Runtime、工具、检索和 React 无需随服务商变化。取舍是先支持一种兼容协议；原生 Anthropic、Cursor Agent 等协议需要独立 Adapter。面试追问：兼容接口的工具格式差异如何处理？如何评测工具选择、控制成本、进行模型降级？当前不会静默降级到 Mock，也不会自动重试付费请求。

## Cursor Composer 模式

要求 Node.js 22.13+。在服务端 `.env` 配置：

```dotenv
COPILOT_MODE=cursor
CURSOR_API_KEY=你的Cursor用户API密钥
CURSOR_MODEL=composer-2.5
```

在 `interview-copilot` 执行 `npm run cursor:models` 查询该 Key 可访问的 Composer 模型，确认模型 ID 后重启 `npm run dev`。浏览器仍打开 Docsify 的 3000 端口。Vercel 使用相同的服务端变量；保存后重新部署。不要把 Cursor Key 填进 `LLM_API_KEY` 或任何 `VITE_` 变量。SDK 使用账户的模型权限和额度，并非免费 Mock。

`CursorRuntime` 是独立的运行时适配器：Cursor SDK 执行规划和推理循环，项目负责工具参数校验、工具执行、引用及 SSE。`search_articles` 和 `read_article` 通过 SDK 的 `local.customTools` 注册到 `custom-user-tools` MCP 服务，仍然读取本仓库的真实 Markdown。UI 回答下方会明确显示 Cursor 和模型名；Mock 演示与自研 `AgentRuntime` 继续保留。

每次请求创建独立 SDK Agent 和临时工作目录，只开放 MCP 工具，关闭环境配置加载和 SDK 自动重试；不开放 shell、文件写入、网络搜索或子 Agent。历史通过客户端的最近 12 条消息回放，访客之间不共享 SDK 会话。最多执行 4 次文章工具，SDK 包括发现工具在内最多观察到 16 个工具步骤；请求总超时 45 秒，可取消并清理 SDK 和临时存储。调用预算在回调执行前检查，因此不会执行第 5 次文章工具。

Vercel 配置显式打包 SDK 的动态模块和 Linux 平台资源，临时存储位于系统临时目录。健康检查只验证配置和文章加载，不验证 Key、Composer 权限或网络；上线需另做真实问答验证。若 SDK 启动或模型耗时超过函数限制，应把同一个 `src/server.ts` 部署为常驻 Node 服务，Widget 通过 `VITE_COPILOT_API_URL` 连接该服务。

面试时应说明取舍：此模式展示第三方 Agent 集成与 MCP 工具边界，规划循环由 Cursor 提供；自研循环的代码和测试位于 `AgentRuntime`。可能追问：为什么不把 SDK 当成 Chat Completions 模型 Adapter？如何取消迟到的启动、隔离并发会话、限制工具权限、验证文章引用？

2026-10-12 已用 Composer 2.5 在本机 Node 和 Vercel 预览完成真实 React Hooks 问答，均执行 `search_articles` → `read_article` → 回答及文章引用。自动测试使用模拟 SDK，不消耗账户额度；真实模型的权限、额度和时延仍依赖部署时的账户及网络。

## API 与事件

`POST /api/copilot/chat`，Body：

```json
{"messages":[{"role":"user","content":"React Hooks 为什么不能写在条件里？"}]}
```

响应为 `text/event-stream`，事件名和数据中的 `type` 一致：`message`、`tool_start`、`tool_result`、`error`、`done`。`message` 含 `text`、`demo`、`citations`；引用给出文章标题、`md/` 路径和 Docsify `/#/md/...` 路由。历史消息由客户端带上，最多 12 条；服务端不持久化对话。取消请求会中止服务端循环；默认总超时 30 秒、最多 4 次工具调用。

## 关键模块与面试追问

| 模块 | 为什么需要、Agent 概念与架构选择 | 取舍与可能追问 |
| --- | --- | --- |
| `ArticleIndex` | 从当前仓库 137 篇 Markdown 建内存索引，按标题、路径、章节内容排序，提供可追溯引用；对应检索增强。 | 本地词法检索零外部依赖、可离线演示，但不是向量检索。追问：中文分词、召回率、增量更新、混合检索如何做？ |
| `ToolRegistry` | 统一注册工具并在执行前用 Zod 校验；对应 Function Calling 的执行边界。 | 手写 JSON Schema 供模型理解，Zod 负责真正校验；新增工具需保持两者同步。追问：恶意参数和路径穿越如何防护？ |
| `AgentRuntime` | 模型返回工具意图、执行、回填结果、继续推理，直到回答或达到上限；对应 Agent Loop。 | 串行工具调用便于展示和限额，吞吐较低。追问：超时、失败重试、并行调用与幂等如何处理？ |
| `ModelAdapter` | 把 Mock 和真实模型与运行时分开；对应决策层。 | Mock 是确定性规则演示，不能代表模型推理或回答质量。追问：如何评测模型的工具选择与答案依据？ |
| SSE + Widget | 按统一事件协议展示每步执行；对应可观测性与人机交互。 | SSE 单向且简单；客户端取消用 HTTP Abort。追问：断线重连、背压、长任务恢复如何设计？ |

当前检索采用词法排序，不声称已实现向量 RAG。真实模式的模型调用、模型输出质量和线上部署均需在有服务端凭证及部署环境时单独验证。
