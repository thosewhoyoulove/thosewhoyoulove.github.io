# Vite Dev Server 怎么拦截 Import

## 面试定位

这题是 Vite 原理追问。面试官想听的不是“Vite 使用 ESM”这一句，而是浏览器为什么不能直接加载裸模块导入，以及 Vite dev server 在请求链路里做了什么转换。

## 面试回答

> 浏览器原生 ESM 只能识别相对路径、绝对路径或完整 URL，不能直接识别 `import React from "react"` 这种裸模块导入。Vite dev server 会在 HTTP 请求阶段接住浏览器对源码模块的请求，读取文件后经过插件转换和 import analysis，把裸模块导入重写成浏览器能请求的地址，比如 `/node_modules/.vite/deps/react.js?v=hash`。所以它不是修改浏览器的 import 行为，而是在返回源码前把 import 语句转换成浏览器可执行的 ESM URL。

一句话总结：

> Vite 通过 dev server 中间件读取并转换源码，把裸模块 import 重写成浏览器能访问的 URL。

## 核心原理

源码里写的是：

```js
import React from "react";
import App from "./App.jsx";
```

Vite 返回给浏览器前会重写成类似：

```js
import React from "/node_modules/.vite/deps/react.js?v=hash";
import App from "/src/App.jsx";
```

请求链路：

```text
浏览器请求 /src/main.jsx
  -> Vite dev server 中间件接住请求
  -> resolve 找到真实文件
  -> pluginContainer.transform 执行插件转换
  -> import analysis 分析 import 语句
  -> 重写裸模块路径和资源路径
  -> 返回浏览器可执行的 ESM
```

## 高频追问

### 什么是裸模块导入？

不是以 `./`、`../`、`/` 或 URL 开头的导入，比如 `import vue from "vue"`。浏览器不知道该去哪里找这个包，需要构建工具转换。

### 为什么 Webpack 开发态不需要这样做？

Webpack dev server 通常先把模块打进 bundle，由 Webpack runtime 管理模块加载。Vite 开发态直接让浏览器按 ESM 请求模块，所以必须把源码里的导入路径改成浏览器可访问的 URL。

### CSS、Vue、TSX 这类文件也能直接给浏览器吗？

不能直接给。Vite 会通过插件转换，把这些文件转成浏览器可执行的 JavaScript 或 CSS 请求，再返回给浏览器。

## 延伸阅读

- [为什么 Vite 快](/md/工程化/Vite/为什么Vite快.md)
- [Vite 依赖预构建](/md/工程化/Vite/依赖预构建.md)
