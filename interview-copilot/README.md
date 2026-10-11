# Interview Copilot

基于当前 Docsify 知识库的面试问答 Agent。Node.js 服务负责检索、工具执行与模型调用；React Widget 只消费 SSE 事件。现有 `docs/` 文章、侧栏生成和 GitHub Pages 工作流保持原样。

## 运行

要求 Node.js 22+。

```bash
cd interview-copilot
npm install
cp .env.example .env
npm run dev
```

默认 `COPILOT_MODE=mock`，无需 Key。另开终端运行 `npm run dev:widget`，打开 Vite 显示的地址开发 Widget；运行 `npm run build` 会把 Widget 打包到 `docs/assets/interview-copilot/`。在本地用 `cd docs && npm run dev` 预览博客。服务健康检查：`GET http://127.0.0.1:8787/api/copilot/health`。完整验证：`npm run check`，随后在 `docs/` 执行 `npm run check`。

要调用真实模型，在服务端环境设 `COPILOT_MODE=openai`、`OPENAI_API_KEY` 和 `OPENAI_MODEL`。浏览器构建只允许使用 `VITE_COPILOT_API_URL` 指向公开 API 基址，绝不能把密钥放在 `VITE_` 变量中。若前后端跨域，服务端设置 `COPILOT_ORIGIN` 为博客的精确 Origin。GitHub Pages 只托管静态文件，真实模式需要另外部署持久运行的 Node 服务；公开部署前还需要加访问控制和请求限流。

本地打开 Docsify 页面时，Widget 会自动连接 `http://127.0.0.1:8787`；后端默认允许 Docsify 的 3000 端口和 Vite 的 5173 端口。若前后端分开部署，构建时设置 `VITE_COPILOT_API_URL` 为实际 API 地址，服务端设置 `COPILOT_ORIGIN` 为博客的精确 Origin。

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
