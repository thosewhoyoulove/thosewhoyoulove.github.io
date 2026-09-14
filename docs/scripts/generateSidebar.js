const fs = require("fs");
const path = require("path");

/**
 * 面试导向侧边栏（目标：约 3 年 Vue / React 前端）。
 *
 * 默背：速记 → 专题深文。手写 Promise、V8 高阶、call/apply 专文等移出默认导航（文件保留）。
 */
const SIDEBAR = [
    {
        title: "JavaScript 与浏览器",
        children: [
            ["速记：JS & TS", "/md/面试准备/技术/JavaScript%20&%20TypeScript%20基础.md"],
            ["速记：浏览器与性能", "/md/面试准备/技术/浏览器面试速记.md"],
            {
                title: "JavaScript 运行时",
                children: [
                    ["闭包", "/md/基础/JavaScript/闭包的理解.md"],
                    ["This", "/md/基础/JavaScript/This的理解.md"],
                    ["数据类型与拷贝", "/md/基础/JavaScript/数据类型.md"],
                ],
            },
            {
                title: "异步与事件循环",
                children: [
                    ["Promise", "/md/基础/ES6/Promise.md"],
                    ["浏览器事件循环", "/md/浏览器/浏览器的事件循环.md"],
                ],
            },
            {
                title: "TypeScript",
                children: [
                    ["type 和 interface", "/md/TypeScript/type%20和%20interface.md"],
                    ["泛型", "/md/TypeScript/泛型.md"],
                    ["工具类型", "/md/TypeScript/工具类型.md"],
                    ["类型守卫与收窄", "/md/TypeScript/类型守卫与类型收窄.md"],
                ],
            },
            {
                title: "浏览器与性能",
                children: [
                    ["渲染原理", "/md/浏览器/浏览器的渲染原理.md"],
                    ["缓存机制", "/md/浏览器/浏览器的缓存机制.md"],
                    ["首屏优化", "/md/浏览器/加快首屏加载速度.md"],
                ],
            },
        ],
    },
    {
        title: "网络与安全",
        children: [
            ["速记：网络与安全", "/md/面试准备/技术/网络与安全.md"],
            {
                title: "全链路与加密",
                children: [
                    ["从输入 URL 到页面展示", "/md/网络/URL解析流程.md"],
                    ["HTTPS", "/md/网络/HTTPS.md"],
                    ["TCP 三次握手", "/md/网络/TCP三次握手.md"],
                    ["TCP 四次挥手", "/md/网络/TCP四次挥手.md"],
                ],
            },
            {
                title: "HTTP 协议",
                children: [
                    ["HTTP", "/md/网络/HTTP.md"],
                    ["HTTP 状态码", "/md/网络/HTTP状态码.md"],
                ],
            },
            {
                title: "跨域与 CORS",
                children: [
                    ["OPTIONS 预检请求", "/md/网络/OPTIONS预检请求.md"],
                ],
            },
            {
                title: "实时通信",
                children: [
                    ["WebSocket", "/md/网络/WebSocket.md"],
                ],
            },
            {
                title: "Web 安全",
                children: [
                    ["XSS", "/md/安全/XSS的理解.md"],
                    ["CSRF", "/md/安全/CSRF的理解.md"],
                ],
            },
        ],
    },
    {
        title: "框架：Vue / React",
        children: [
            ["面试速记：React & Vue", "/md/面试准备/技术/React%20&%20Vue.md"],
            {
                title: "框架对比",
                children: [
                    ["Vue vs React", "/md/框架/Vue%20vs%20React.md"],
                ],
            },
            {
                title: "React 专题",
                children: [
                    ["React 考点索引", "/md/框架/React/React%20高频考点精讲.md"],
                    ["Hooks 原理", "/md/框架/React/Hooks.md"],
                    ["Fiber 架构", "/md/框架/React/Fiber架构.md"],
                    ["React Diff 算法", "/md/框架/React/React%20Diff算法.md"],
                    ["React 渲染原理", "/md/框架/React/React%20渲染原理.md"],
                    ["SSR 与 Hydration", "/md/框架/React/SSR与Hydration.md"],
                    ["状态管理", "/md/框架/React/状态管理.md"],
                    ["组件设计能力", "/md/框架/React/组件设计能力.md"],
                ],
            },
            {
                title: "Vue 专题",
                children: [
                    ["Vue 考点索引", "/md/框架/Vue/Vue%20高频考点精讲.md"],
                    ["Vue 2 和 Vue 3 区别", "/md/框架/Vue/vue2和3的区别.md"],
                    ["响应式原理（Proxy）", "/md/框架/Vue/vue3响应式原理.md"],
                    ["模板编译流程", "/md/框架/Vue/模板编译流程.md"],
                    ["nextTick 与虚拟 DOM", "/md/框架/Vue/nextTick与虚拟DOM.md"],
                    ["Vue 渲染原理", "/md/框架/Vue/Vue%20渲染原理.md"],
                    ["Vue Diff 算法", "/md/框架/Vue/Vue%20Diff算法.md"],
                ],
            },
            {
                title: "开放性题目",
                children: [
                    ["响应式 vs 不可变", "/md/框架/框架开放性面试题.md"],
                ],
            },
        ],
    },
    {
        title: "AI Agent",
        children: [
            ["面试速记：AI Agent", "/md/面试准备/技术/AI%20Agent.md"],
            ["LLM 与 Prompt Engineering", "/md/Agent/LLM与PromptEngineering.md"],
            ["Agent 与 Skill 体系", "/md/Agent/Agent与Skill体系.md"],
            ["MCP 与工具调用概念", "/md/Agent/MCP与工具调用概念.md"],
            ["对话界面架构", "/md/Agent/对话界面架构.md"],
            ["流式渲染与 SSE", "/md/Agent/流式渲染与SSE.md"],
            ["工具调用与结果展示", "/md/Agent/工具调用与结果展示.md"],
            ["平时工作怎么使用 AI", "/md/面试准备/综合/平时工作怎么使用AI.md"],
        ],
    },
    {
        title: "工程化与性能",
        children: [
            {
                title: "面试速记",
                children: [
                    ["前端工程化速记", "/md/面试准备/技术/前端工程化.md"],
                    ["前端性能优化速记", "/md/面试准备/技术/前端性能优化.md"],
                ],
            },
            {
                title: "工程化主线",
                children: [
                    ["工程化体系", "/md/工程化/体系与实践/工程化体系.md"],
                    ["打包优化面试专题", "/md/工程化/体系与实践/打包优化面试专题.md"],
                    ["CI/CD", "/md/工程化/体系与实践/CI&CD.md"],
                    ["Monorepo", "/md/工程化/体系与实践/Monorepo.md"],
                ],
            },
            {
                title: "Webpack",
                children: [
                    ["构建流程", "/md/工程化/Webpack/构建流程.md"],
                    ["Loader 与 Plugin", "/md/工程化/Webpack/Loader与Plugin.md"],
                    ["常见优化手段", "/md/工程化/Webpack/常见优化手段.md"],
                ],
            },
            {
                title: "Vite",
                children: [
                    ["为什么 Vite 快", "/md/工程化/Vite/为什么Vite快.md"],
                    ["依赖预构建", "/md/工程化/Vite/依赖预构建.md"],
                    ["开发与生产打包差异", "/md/工程化/Vite/开发环境与生产环境打包差异.md"],
                ],
            },
            {
                title: "产物与构建优化",
                children: [
                    ["Tree Shaking 原理", "/md/工程化/构建优化/TreeShaking原理.md"],
                    ["HMR 热更新原理", "/md/工程化/构建优化/HMR热更新原理.md"],
                    ["分包策略", "/md/工程化/构建优化/分包策略.md"],
                ],
            },
        ],
    },
    {
        title: "项目与架构",
        children: [
            ["项目经历表达", "/md/面试准备/项目与架构/你的项目经历（重点）.md"],
            ["探迹多产品 Agent 前端", "/md/面试准备/项目与架构/探迹多产品Agent前端.md"],
            ["云呼 SDK", "/md/面试准备/项目与架构/云呼SDK.md"],
            ["Node.js 与全栈", "/md/面试准备/技术/NodeJs%20&%20全栈开发.md"],
        ],
    },
    {
        title: "协作与加分项",
        children: [
            ["团队协作与主导能力", "/md/面试准备/综合/团队协作与主导能力.md"],
            ["Git 解决冲突", "/md/Git/解决冲突.md"],
            ["Git Rebase 和 Merge", "/md/Git/rebase和merge的区别.md"],
            ["Pull Request", "/md/Git/Pull%20Request.md"],
        ],
    },
];

function renderItem(item, depth) {
    const indent = "  ".repeat(depth);
    if (typeof item === "string") {
        return `${indent}- ${item}\n`;
    }
    if (Array.isArray(item)) {
        return `${indent}- [${item[0]}](${item[1]})\n`;
    }
    let output = `${indent}- ${item.title}\n`;
    item.children.forEach((child) => {
        output += renderItem(child, depth + 1);
    });
    return output;
}

function main() {
    const sidebarPath = path.join(__dirname, "../_sidebar.md");
    const sidebarContent = SIDEBAR.map((item) => renderItem(item, 1)).join("");
    fs.writeFileSync(sidebarPath, sidebarContent, "utf-8");
    console.log(sidebarPath);
    console.log("面试导向侧边栏已更新！");
}

main();
