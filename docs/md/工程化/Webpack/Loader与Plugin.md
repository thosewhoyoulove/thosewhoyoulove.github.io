# Loader 与 Plugin 的区别

## 面试定位

这题考察你是否理解 Webpack 的扩展模型。面试官不只想听“loader 转换文件、plugin 扩展功能”，还会追问它们分别发生在构建流程的哪个阶段、能不能互相替代。

## 面试回答

> Loader 负责处理单个模块，它接收源码并返回转换后的源码，比如把 TypeScript 转成 JavaScript，把 Less 转成 CSS。Plugin 负责扩展整个构建生命周期，它通过 `apply(compiler)` 注册到 Webpack 的 Tapable 钩子上，可以在 run、compile、emit、done 等阶段读取或修改构建结果。简单说，loader 是模块级转换器，plugin 是构建流程级扩展点。像语法转换、资源内联适合 loader；生成 HTML、压缩资源、分析包体积、上传 CDN 这类全局任务适合 plugin。

一句话总结：

> Loader 管“某类文件怎么变成模块”，Plugin 管“构建流程在哪些阶段做额外事情”。

## 核心原理

```text
源文件
  -> loader 链处理
  -> Webpack parser 分析依赖
  -> 形成 ModuleGraph / ChunkGraph
  -> plugin 在生命周期中介入优化、生成、输出
```

| 对比项 | Loader | Plugin |
| --- | --- | --- |
| 作用粒度 | 单个模块 | 整个构建过程 |
| 输入输出 | 输入源码，输出源码或模块内容 | 读取或修改 compiler / compilation |
| 执行阶段 | 模块构建阶段 | 初始化、编译、优化、输出等阶段 |
| 典型场景 | Babel、CSS、图片、字体 | HTML 注入、压缩、清理目录、产物分析 |
| 编写方式 | 导出函数 | 带 `apply` 方法的对象 |

## 高频追问

### Loader 能做 Plugin 的事吗？

通常不适合。Loader 只应该处理当前模块，不应该关心全局 chunk、assets 或输出目录。涉及全局构建结果时应该用 Plugin。

### Plugin 能替代 Loader 吗？

理论上 Plugin 可以干预很多阶段，但不适合做单文件转换。Webpack 已经为模块转换提供了 loader-runner，用 loader 更符合职责边界。

### 为什么 CSS 需要多个 loader？

因为每个 loader 只做一类转换，比如 `less-loader` 编译 Less，`postcss-loader` 做兼容转换，`css-loader` 解析依赖，`style-loader` 注入页面。职责拆开后更容易组合。

## 延伸阅读

- [Webpack 构建流程](/md/工程化/Webpack/构建流程.md)
- [Webpack Tapable 是什么](/md/工程化/Webpack/Tapable.md)
- [Loader 执行顺序](/md/工程化/Webpack/Loader执行顺序.md)
