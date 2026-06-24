# Tree Shaking 原理

## 面试定位

Tree Shaking 是打包优化高频题。重点不是背“删除无用代码”，而是讲清它为什么依赖 ES Module、为什么会失效、和代码压缩有什么区别。

## 面试回答

> Tree Shaking 是在构建阶段移除没有被使用的导出。它主要依赖 ES Module 的静态结构，因为 `import` 和 `export` 在编译阶段就能分析出引用关系。打包器会先标记哪些导出被使用，再配合压缩器删除未使用代码。它容易因为 CommonJS、动态导入方式、模块副作用、Babel 把 ESM 转成 CJS 等原因失效。Tree Shaking 不等于压缩，Tree Shaking 是删除没用的代码，压缩是缩短和简化剩下的代码。

一句话总结：

> Tree Shaking 靠 ESM 静态分析标记未使用导出，再由优化和压缩阶段删除无效代码。

## 核心原理

```js
// utils.js
export function used() {}
export function unused() {}

// index.js
import { used } from "./utils";
used();
```

构建器可以在编译阶段知道 `unused` 没有被引用，于是在生产优化阶段删除它。

常见生效条件：

| 条件 | 说明 |
| --- | --- |
| 使用 ESM | `import` / `export` 静态可分析 |
| 生产模式 | Webpack production 默认开启相关优化 |
| 正确处理副作用 | `package.json` 的 `sideEffects` 需要准确 |
| 保留 ESM | Babel 不要提前转成 CommonJS |

`sideEffects` 示例：

```json
{
  "sideEffects": ["*.css", "*.scss"]
}
```

## 高频追问

### 为什么 CommonJS 不利于 Tree Shaking？

CommonJS 的 `require` 可以放在条件语句、函数或动态表达式里，很多依赖关系要运行时才知道，静态分析难度更高。

### `sideEffects: false` 能随便配吗？

不能。如果模块导入时会修改全局状态、注册 polyfill、注入样式，就有副作用。错误配置会导致代码被误删。

### Tree Shaking 和压缩是什么关系？

Tree Shaking 负责标记和删除未使用导出，压缩器负责删掉不可达代码、简化表达式、缩短变量名。二者经常配合出现，但不是一回事。

## 延伸阅读

- [打包优化面试专题](/md/工程化/体系与实践/打包优化面试专题.md)
- [Webpack 常见优化手段](/md/工程化/Webpack/常见优化手段.md)
