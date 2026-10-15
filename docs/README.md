# omen's interview notes

个人前端面试知识库，基于 [Docsify](https://docsify.js.org/) 搭建，部署在 GitHub Pages。

面向约 **3 年 Vue / React 前端** 候选人：按「一篇专题 → 项目口述」复习，不要从侧栏刷到最后一页。

## 怎么开始

| 入口 | 用途 |
| --- | --- |
| [复习路线](/md/面试准备/复习路线.md) | 3 天冲刺 / 7 天系统排期 |
| [高频追问清单](/md/面试准备/高频追问清单.md) | 自测薄弱点，再点进深文 |
| [面试总览](/md/面试准备/面试总览.md) | 三层内容怎么选 |
| [项目表达模板](/md/面试准备/项目表达模板.md) | 把项目压成 2 分钟 / 5 分钟版 |

## 内容地图（速查）

| 方向 | 说明 |
| --- | --- |
| [JavaScript](/md/基础/JavaScript/闭包的理解.md) | 闭包、this、原型与面向对象、Promise、事件循环、TS 建模 |
| [浏览器与性能](/md/浏览器/浏览器的进程模型.md) | 进程模型、渲染、缓存、[LCP/INP/CLS 与虚拟列表](/md/浏览器/性能监控与体验.md) |
| [网络与安全](/md/网络/HTTP.md) | HTTP/HTTPS/跨域/XSS/CSRF |
| [框架：Vue / React](/md/框架/React/Hooks.md) | Hooks/Fiber/Diff/SSR、Vue 响应式/Diff；[React 考点索引](/md/框架/React/React%20高频考点精讲.md) |
| [AI Agent](/md/Agent/LLM与PromptEngineering.md) | 加分项：LLM、Agent/MCP、对话与 SSE |
| [工程化与性能](/md/工程化/体系与实践/工程化体系.md) | Webpack/Vite、[大厂口述 10 题](/md/面试准备/技术/工程化大厂高频口述.md)、[架构与设计系统](/md/工程化/体系与实践/前端架构与设计系统.md)、[性能监控](/md/浏览器/性能监控与体验.md) |
| [项目与架构](/md/面试准备/项目与架构/你的项目经历（重点）.md) | 项目表达 + 重点项目口述 |
| [协作](/md/面试准备/综合/团队协作与主导能力.md) | 协作主导、Git 主链 |

## 答题方式

1. 一句话结论。
2. 核心原理（为什么）。
3. 项目中的使用场景（最好挂到 Vue / React 实践）。
4. 方案取舍和边界。

## 联系与交流

有疏漏、建议或希望交流，欢迎联系：[a18773507481@gmail.com](mailto:a18773507481@gmail.com)

## 本地维护

在 `docs` 目录执行：

```bash
npm run dev               # 本地预览
npm run generate-sidebar  # 根据唯一菜单配置生成 _sidebar.md
npm run check             # 检查菜单漂移、链接、标题、代码围栏和敏感信息
npm run audit:content     # 额外列出未进入主侧边栏的文章
```

提交前至少运行一次 `npm run check`。GitHub Actions 会在推送到 `master` 或创建 Pull Request 时执行同一套检查。

评论功能暂时关闭。若重新启用，需要使用可信 OAuth Proxy，不能把 OAuth Client Secret 写入浏览器代码。
