# Loader 执行顺序

## 面试定位

这题看似是记忆题，实际考察你是否理解 loader 链路。只答“从右到左”不够完整，最好补上 pitch 阶段和 `enforce` 分类顺序。

## 面试回答

> Webpack loader 分为 pitch 阶段和 normal 阶段。pitch 阶段从左到右执行，normal 阶段从右到左执行。我们平时说的“loader 从右到左、从下到上”，指的是 normal 转换阶段。比如 `use: ["style-loader", "css-loader", "postcss-loader"]`，normal 阶段会先执行 `postcss-loader`，再执行 `css-loader`，最后执行 `style-loader`。如果配置了 `enforce`，还要考虑 pre、normal、inline、post 这些分类；pitch 阶段和 normal 阶段的分类顺序是相反的。

一句话总结：

> Loader normal 阶段从右到左，pitch 阶段从左到右；面试要补充 pitch 和 `enforce` 才完整。

## 核心原理

```text
use: ["style-loader", "css-loader", "postcss-loader"]

pitch 阶段：
style-loader -> css-loader -> postcss-loader

normal 阶段：
postcss-loader -> css-loader -> style-loader
```

`enforce` 会影响 loader 分类顺序：

```text
pitch 阶段：post -> inline -> normal -> pre
normal 阶段：pre -> normal -> inline -> post
```

CSS 常见处理链路：

```text
less-loader      Less -> CSS
postcss-loader   CSS 兼容性转换
css-loader       解析 @import 和 url()
style-loader     注入 style 标签
```

## 高频追问

### 为什么要有 pitch 阶段？

Pitch 给 loader 一个提前拦截的机会。某些 loader 可以在 pitch 阶段直接返回结果，跳过后续 normal loader，用于缓存、代理或特殊资源处理。

### 为什么 loader normal 阶段要反向执行？

因为 loader 链像函数组合，右侧 loader 的输出会作为左侧 loader 的输入。这样配置顺序更接近最终产物的处理方向。

### `style-loader` 为什么写在 `css-loader` 前面？

因为 normal 阶段反向执行。先由 `css-loader` 解析 CSS 依赖，再由 `style-loader` 把结果注入页面。

## 延伸阅读

- [Loader 与 Plugin 的区别](/md/工程化/Webpack/Loader与Plugin.md)
- [Webpack 构建流程](/md/工程化/Webpack/构建流程.md)
