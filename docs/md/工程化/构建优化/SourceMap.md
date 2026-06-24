# Source Map 原理

## 面试定位

Source Map 常和构建速度、线上错误定位、安全风险一起考。回答时要说清它是什么、为什么会影响构建、生产环境怎么取舍。

## 面试回答

> Source Map 是生成代码到源码之间的位置映射。因为生产代码通常经过转译、压缩、合并，浏览器报错的位置往往是 bundle 的行列号，Source Map 可以把它映射回原始的 TypeScript、Vue、React 源码。开发环境通常选择构建快、定位够用的 source map；生产环境如果需要错误定位，可以生成 `hidden-source-map` 并上传到 Sentry 这类平台，不直接暴露 `.map` 文件。Source Map 越精细，构建越慢、文件越大，也可能带来源码泄露风险。

一句话总结：

> Source Map 用来把压缩产物的错误位置映射回源码，生产环境要在定位能力和源码安全之间取舍。

## 核心原理

```text
bundle.min.js 第 1 行第 10240 列
  -> source map mappings
  -> src/pages/Home.tsx 第 42 行第 8 列
```

常见选择：

| 场景 | 选择 | 取舍 |
| --- | --- | --- |
| 本地开发 | `eval-cheap-module-source-map` | 构建快，定位到行 |
| 测试环境 | `source-map` | 定位准，构建慢 |
| 生产错误上报 | `hidden-source-map` | 产物不暴露 map URL，配合平台上传 |
| 高安全要求 | 不公开 map | 降低源码泄露风险 |

Webpack 示例：

```js
module.exports = {
  devtool:
    process.env.NODE_ENV === "development"
      ? "eval-cheap-module-source-map"
      : "hidden-source-map",
};
```

## 高频追问

### Source Map 为什么影响构建速度？

构建器需要记录和生成源码到产物的映射信息。映射越精细，生成、合并和写入成本越高。

### 生产环境为什么不直接公开 `.map`？

公开 `.map` 可能暴露源码、接口路径、业务逻辑和内部注释。更稳妥的做法是上传到错误监控平台，由平台内部解析堆栈。

### `hidden-source-map` 和普通 `source-map` 区别是什么？

普通 `source-map` 会在产物里带上 `sourceMappingURL`，浏览器能自动找到 map。`hidden-source-map` 会生成 map，但不在产物里暴露引用，适合上传监控平台。

## 延伸阅读

- [Webpack 常见优化手段](/md/工程化/Webpack/常见优化手段.md)
- [打包优化面试专题](/md/工程化/体系与实践/打包优化面试专题.md)
