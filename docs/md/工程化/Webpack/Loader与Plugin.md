# Loader 与 Plugin 的区别

## 面试回答

> Loader 处理**单个模块**：输入源码（或上一个 loader 的结果），输出 Webpack 继续能解析的内容，比如 TS→JS、Less→CSS、图片变模块。多个 loader 组成链，配置时右到左/下到上执行。Plugin 处理**整次构建**：实现 `apply(compiler)`，在 Tapable 钩子上读取或修改 `compilation`，适合生成 HTML、压缩、清目录、分析包体、上传 CDN。一句话：loader 管「这类文件怎么变成模块」，plugin 管「构建流程在哪些阶段做额外事」。两者一般不互相替代。

**一句话总结：**

> Loader=模块转换链；Plugin=生命周期钩子扩展。

---

## 核心原理

### 1. 在流水线中的位置

```text
resolve 到文件
  → loader-runner 跑 loader 链
  → parser 分析依赖，继续建图
  → … chunk / assets …
  → plugin 在各钩子介入（emit 前压缩、写 HTML 等）
```

| | Loader | Plugin |
| --- | --- | --- |
| 粒度 | 单模块 | 构建全局 |
| I/O | 源码 → 源码/内容 | 读写 compiler/compilation |
| 写法 | 导出函数 | `apply(compiler)` |
| 例子 | babel-loader、css-loader | HtmlWebpackPlugin、MiniCssExtractPlugin |

---

### 2. 为何 CSS 常要一串 loader

职责拆分：`less-loader` 编译 → `postcss-loader` 兼容 → `css-loader` 解析 `@import`/url → `style-loader` 或提取插件注入/落盘。链上顺序反了会直接挂。详见 [Loader 执行顺序](/md/工程化/Webpack/Loader执行顺序.md)。

---

### 3. 设计取舍

Loader 保持纯转换、可组合；全局副作用进 Plugin，避免在 loader 里扫整个 chunk。

---

## 常见误区

### ❌ Plugin 能完全代替 Loader

### ✅ 更准确的说法

能碰很多阶段，但不适合当默认的单文件转换模型；loader-runner 才是模块转换正路。

---

### ❌ Loader 里改 output 目录、删别人的 chunk 很正常

### ✅ 更准确的说法

那是 plugin 职责；loader 应聚焦当前模块。

---

### ❌ 「babel 是 plugin」和「babel-loader」混为一谈

### ✅ 更准确的说法

Babel 生态里也有 plugin；在 Webpack 里接入通常经 **babel-loader** 这条 loader。

---

## 高频追问

### 一句话区别？

模块转换 vs 构建生命周期扩展。

### Loader 顺序？

配置数组从右到左执行（先匹配的靠近源文件的那端先谈清）。

### MiniCssExtract 是 loader 还是 plugin？

常两者配合：loader 抽 CSS 模块，plugin 生成 CSS 文件。

### 什么必须用 plugin？

面向 assets/全局的：HTML 注入、压缩汇总、拷贝静态目录、包分析。

---

## 延伸阅读

- [Webpack 构建流程](/md/工程化/Webpack/构建流程.md)
- [Loader 执行顺序](/md/工程化/Webpack/Loader执行顺序.md)
- [Tapable](/md/工程化/Webpack/Tapable.md)
- [Plugin](/md/工程化/Webpack/Plugin.md)
