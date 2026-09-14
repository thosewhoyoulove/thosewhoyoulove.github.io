# Tree Shaking 原理

## 面试回答

> Tree Shaking 是构建时去掉**没有被用到的导出**，不是简单的「压缩文件变小」。它主要吃 ES Module 的静态结构：`import`/`export` 在编译期就能分析引用关系，打包器标记 used/unused，再在优化和 minify 阶段删掉死代码。CommonJS、乱写副作用、把 ESM 提前编译成 CJS、或 `sideEffects` 标错，都会让摇树失效或误删。和压缩的区别：摇树决定「哪段可以没」；压缩是把剩下的写短、写扁。

**一句话总结：**

> ESM 静态分析标记未用导出 → 优化删除 → 压缩收尾；副作用与 CJS 是大敌。

---

## 核心原理

### 1. 为什么需要它

库常导出一堆 API，业务只用几个；不摇树就会把整模块推进包体。

---

### 2. 最小例子

```js
// utils.js
export function used() {}
export function unused() {}

// index.js
import { used } from './utils'
used()
```

生产构建应能去掉 `unused`（在无副作用、可分析的前提下）。

---

### 3. 生效条件

| 条件 | 说明 |
| --- | --- |
| ESM | 静态可分析 |
| 生产优化开启 | 开发常为了速度保留更多代码 |
| 副作用信息正确 | `package.json` `sideEffects` |
| 别过早变 CJS | Babel 保留 ES modules 给打包器 |

```json
{ "sideEffects": ["*.css", "*.scss"] }
```

表示：多数 JS 无副作用可裁；样式文件有副作用不能当纯模块乱删。

---

### 4. 和压缩、分包的关系

| 手段 | 解决 |
| --- | --- |
| Tree Shaking | 删未引用导出 |
| Minify | 缩短/折叠剩余代码 |
| 分包 | 何时加载哪一段 |

---

### 5. 设计取舍

静态分析换体积；对「有副作用的模块」必须诚实声明，否则正确性优先于体积。

---

## 常见误区

### ❌ Tree Shaking = Uglify 压缩

### ✅ 更准确的说法

压缩≠摇树；二者常配合但职责不同。

---

### ❌ `sideEffects: false` 可以一律给所有包

### ✅ 更准确的说法

有 CSS 注入、polyfill、改全局的模块不能瞎标，会误删。

---

### ❌ 用了 Babel 就一定能摇树

### ✅ 更准确的说法

若 Babel 把 import 转成 require，打包器更难点静态摇树。

---

## 高频追问

### 为什么依赖 ESM？

编译期可见依赖边；CJS 的 `require` 太动态。

### 如何排查摇不动？

看是否 CJS、是否有副作用、分析产物里还在的导出从哪进来。

### 和 dead code elimination 关系？

摇树偏「模块导出级」；压缩器还能删函数内不可达代码。常连着做。

---

## 延伸阅读

- [打包优化面试专题](/md/工程化/体系与实践/打包优化面试专题.md)
- [分包策略](/md/工程化/构建优化/分包策略.md)
- [Webpack 常见优化手段](/md/工程化/Webpack/常见优化手段.md)
