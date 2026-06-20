const fs = require("fs");
const path = require("path");

/**
 * 面试导向侧边栏。
 *
 * 文章仍保留在原目录，侧边栏按面试复习场景重新编排，避免为一次导航优化大规模移动文件。
 */
const SIDEBAR = [
    {
        title: "JavaScript 与浏览器",
        children: [
            ["速记：JS & TS 基础", "/md/面试准备/技术/JavaScript%20&%20TypeScript%20基础.md"],
            ["速记：浏览器与性能", "/md/面试准备/技术/浏览器面试速记.md"],
            {
                title: "JavaScript 语言",
                children: [
                    ["数据类型", "/md/基础/JavaScript/数据类型.md"],
                    ["闭包", "/md/基础/JavaScript/闭包的理解.md"],
                    ["This", "/md/基础/JavaScript/This的理解.md"],
                    ["call / apply / bind", "/md/基础/JavaScript/函数的call,apply和bind方法.md"],
                    ["编程范式", "/md/基础/JavaScript/编程范式.md"],
                ],
            },
            {
                title: "异步与事件循环",
                children: [
                    ["Promise", "/md/基础/ES6/Promise.md"],
                    ["手写 Promise", "/md/基础/ES6/手写Promise.md"],
                    ["浏览器事件循环", "/md/浏览器/浏览器的事件循环.md"],
                ],
            },
            {
                title: "TypeScript",
                children: [
                    ["基础类型", "/md/TypeScript/基础类型.md"],
                    ["type 和 interface", "/md/TypeScript/type%20和%20interface.md"],
                    ["泛型", "/md/TypeScript/泛型.md"],
                    ["类型守卫与收窄", "/md/TypeScript/类型守卫与类型收窄.md"],
                    ["工具类型", "/md/TypeScript/工具类型.md"],
                ],
            },
            {
                title: "浏览器原理",
                children: [
                    ["渲染原理", "/md/浏览器/浏览器的渲染原理.md"],
                    ["缓存机制", "/md/浏览器/浏览器的缓存机制.md"],
                    ["浏览器高阶（进程 / V8）", "/md/浏览器/高阶知识点.md"],
                ],
            },
            {
                title: "性能与 Web API",
                children: [
                    ["首屏优化", "/md/浏览器/加快首屏加载速度.md"],
                    ["Web Worker", "/md/浏览器/Web%20Worker.md"],
                ],
            },
        ],
    },
    {
        title: "网络与安全",
        children: [
            ["速记：三年岗复习路线", "/md/面试准备/技术/网络与安全.md"],
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
                    ["浏览器缓存机制", "/md/浏览器/浏览器的缓存机制.md"],
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
                title: "开放性题目",
                children: [
                    ["响应式 vs 不可变（第 1 题）", "/md/框架/框架开放性面试题.md"],
                ],
            },
            ["Vue 高频考点", "/md/框架/Vue/Vue%20高频考点精讲.md"],
            ["Vue 2 和 Vue 3 区别", "/md/框架/Vue/vue2和3的区别.md"],
            ["Vue 3 响应式原理", "/md/框架/Vue/vue3响应式原理.md"],
            ["Vue 渲染原理", "/md/框架/Vue/Vue%20渲染原理.md"],
            ["Vue Diff 算法", "/md/框架/Vue/Vue%20Diff算法.md"],
            ["React 高频考点", "/md/框架/React/React%20高频考点精讲.md"],
            ["React 进阶高频考点", "/md/框架/React/React%20进阶高频考点精讲.md"],
            ["React 渲染原理", "/md/框架/React/React%20渲染原理.md"],
            ["React Hooks", "/md/框架/React/Hooks.md"],
            ["Vue vs React", "/md/框架/Vue%20vs%20React.md"],
            ["前端框架原理对比", "/md/框架/前端框架原理对比.md"],
        ],
    },
    {
        title: "工程化与性能",
        children: [
            ["面试速记：前端工程化", "/md/面试准备/技术/前端工程化.md"],
            ["面试速记：性能优化", "/md/面试准备/技术/前端性能优化.md"],
            ["工程化体系", "/md/工程化/体系与实践/工程化体系.md"],
            ["前端工程化", "/md/工程化/体系与实践/前端工程化.md"],
            ["CI/CD", "/md/工程化/体系与实践/CI&CD.md"],
            ["Monorepo", "/md/工程化/体系与实践/Monorepo.md"],
            ["Vite 为什么快", "/md/工程化/Vite/为什么Vite快.md"],
            ["Vite 依赖预构建", "/md/工程化/Vite/依赖预构建.md"],
            ["Webpack 构建流程", "/md/工程化/Webpack/构建流程.md"],
            ["Webpack 常见优化", "/md/工程化/Webpack/常见优化手段.md"],
            ["首屏优化与代码分包", "/md/面试准备/技术/首屏优化以及代码分包.md"],
        ],
    },
    {
        title: "项目与架构",
        children: [
            ["项目经历表达", "/md/面试准备/项目与架构/你的项目经历（重点）.md"],
            ["架构升级方案", "/md/面试准备/项目与架构/项目架构的整体升级方案.md"],
            ["高级筛选系统", "/md/面试准备/项目与架构/高级筛选系统.md"],
            ["智慧大屏数据可视化", "/md/面试准备/项目与架构/智慧大屏数据可视化.md"],
            ["WebRTC 会议室项目", "/md/面试准备/项目与架构/WebRTC%20会议室项目.md"],
            ["云呼 SDK", "/md/面试准备/项目与架构/云呼SDK.md"],
            ["Node.js 与全栈", "/md/面试准备/技术/NodeJs%20&%20全栈开发.md"],
            ["可视化：SVG vs Canvas", "/md/可视化/Svg%20Vs%20Canvas.md"],
            ["可视化：ZRender", "/md/可视化/Z-render.md"],
        ],
    },
    {
        title: "协作与加分项",
        children: [
            ["团队协作与主导能力", "/md/面试准备/综合/团队协作与主导能力.md"],
            ["综合能力与团队合作", "/md/面试准备/综合/综合能力%20&%20团队合作.md"],
            ["平时工作怎么使用 AI", "/md/面试准备/综合/平时工作怎么使用AI.md"],
            ["Git 解决冲突", "/md/Git/解决冲突.md"],
            ["Git Rebase 和 Merge", "/md/Git/rebase和merge的区别.md"],
            ["Pull Request", "/md/Git/Pull%20Request.md"],
            ["算法：Trie", "/md/算法/trie.md"],
            ["新技术", "/md/面试准备/技术/新技术.md"],
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
