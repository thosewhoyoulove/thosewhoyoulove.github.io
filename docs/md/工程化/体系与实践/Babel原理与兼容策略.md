# Babel 原理与兼容策略

## 面试回答

> 我会从语法转换、运行时能力和兼容验证三个层面回答。
>
> 首先，**旧浏览器不认识新语法时，需要在交付前转换代码**。Babel 会把源码解析成抽象语法树，也就是保留代码结构的对象树，再由插件遍历和改写，最后生成 JavaScript。它理解作用域和表达式结构，所以比字符串替换可靠。JSX 也走类似链路；SWC、TypeScript 等工具也能承担相应转换，具体取决于构建配置。
>
> 第二，**语法能解析，不代表运行时 API 已经存在**。箭头函数属于语法问题，Promise、Array.prototype.includes 属于能力问题。语法转换负责改写表达方式，polyfill 用代码补上环境缺少的 API。Babel 可以通过配置引入第三方 polyfill，但转换工具和补丁的职责仍然不同。
>
> 第三，**兼容范围应由目标环境决定**。我会先确定浏览器或 WebView 版本，用 Browserslist 和 preset-env 选择转换范围，再检查业务源码、依赖和最终产物。补丁要早于业务代码执行，还要在目标环境验证。像 Proxy 这种依赖引擎底层支持的能力，无法只靠普通 JavaScript 完整补齐。
>
> **所以兼容不等于“装了 Babel 就都能运行”**，还取决于 API、依赖、宿主能力和实际测试。

**一句话总结：** 目标环境 → Parse / Transform / Generate → 补运行时 API → 检查依赖与最终产物。

## 核心原理

### 为什么语法转换和 polyfill 必须分开

假设一个旧引擎执行下面的代码：

```js
const contains = (items, target) => items.includes(target)
```

解析器遇到不支持的箭头函数时，可能直接报 SyntaxError，函数根本没有机会执行。把它转成普通函数后，解析可以通过，但调用时仍可能报 `items.includes is not a function`。第二个错误发生在运行阶段：引擎可以理解属性访问和函数调用，只是数组原型上没有这个方法。

```js
// 只展示无 this / arguments 捕获的这个例子的转换结果。
var contains = function (items, target) {
  return items.includes(target)
}
```

因此，“转成 ES5 语法”和“补全所需 API”是两项检查。箭头函数捕获外层 this，通用转换还要保持这种语义；直接替换成 function 并不总是等价。

### Babel 怎样处理一段代码

```text
源码文本
  → parser：识别词法和语法结构，生成 AST
  → traverse + plugins：访问节点，结合作用域改写 AST
  → generator：生成代码与可选的 source map
  → 打包器继续收集模块、分包与输出
```

AST 是抽象语法树。例如 `a + 1` 可以表示为一个 BinaryExpression，运算符为 `+`，左侧是 Identifier，右侧是 NumericLiteral。转换插件能区分字符串里的 `a` 与变量 `a`，也能查询变量在哪个作用域声明。source map 保存生成位置和源位置的映射，帮助把线上堆栈对应回源码。

跟踪一个插件的概念过程：输入 `const value = 2 ** 3`；解析后定位到运算符为 `**` 的 BinaryExpression；转换插件将该表达式替换为 `Math.pow(2, 3)`；生成器输出修改后的代码。这个例子描述转换机制，不固定不同 Babel 版本的完整输出格式。[parser](https://babeljs.io/docs/babel-parser)、[traverse](https://babeljs.io/docs/babel-traverse) 和 [generator](https://babeljs.io/docs/babel-generator) 分别承担这些职责。

### 目标环境怎样影响转换

`@babel/preset-env` 根据目标环境与兼容数据选择所需转换，避免把所有代码都降到最旧语法。preset 是一组转换配置；plugin 执行具体转换。Browserslist 负责表达支持哪些环境，两者不是同一个工具。

针对 Babel 7 项目的配置思路如下，升级大版本时应重新核对选项：

```json
{
  "presets": [
    ["@babel/preset-env", {
      "targets": { "chrome": "70" },
      "useBuiltIns": "usage",
      "corejs": "3.38"
    }]
  ]
}
```

这里的目标和版本仅用于解释配置，应与项目实际依赖和支持范围一致。`usage` 按被转换代码里的 API 使用情况及目标环境插入所需 core-js 模块；`entry` 从显式的补丁入口裁剪所需模块；关闭自动注入时由项目自行管理。它不会保证所有未经过 Babel 的依赖都兼容，也不会自动补齐 fetch 等所有浏览器 API。配置语义见 [preset-env 文档](https://babeljs.io/docs/babel-preset-env)。

### 为什么不直接全量补丁

全量引入通常更容易覆盖常见缺口，但会增加下载、解析和执行成本，修改全局对象还可能影响宿主或其他库。应用可以统一管理全局补丁；发布给多个宿主的库则更需要评估使用不修改全局的实现方式。兼容本质上是支持范围、包体积与维护成本之间的取舍。

验证时先把报错分成语法错误、API 缺失和宿主差异，再确认源码和依赖是否都经过对应处理。只在现代 Chrome 打开页面，无法证明旧 WebView 可用。

## 常见误区

### ❌ Babel 转译后不需要 polyfill

✅ 转译改变语法表达，polyfill 提供运行时实现。为什么：`includes` 调用即使保持原样也是合法旧语法，但 API 可能不存在。

### ❌ polyfill 能补所有新能力

✅ 部分能力依赖引擎或平台支持，无法完整模拟。为什么：普通函数不能拦截任意对象操作来完整实现 Proxy 语义。

### ❌ Babel 负责打包和类型检查

✅ Babel 可以转换模块语法、移除类型注解；依赖图打包和 TypeScript 类型检查需要对应工具。为什么：删除类型文本与证明类型正确是不同工作。参见 [Babel 概览](https://babeljs.io/docs/)。

## 高频追问

### AST 为什么比正则替换可靠？

它保存嵌套结构并能结合作用域分析，避免把字符串、注释和同名局部变量一起替换。

### parser 支持某语法就意味着目标浏览器支持吗？

不意味着。parser 只说明构建工具能读懂，还需要对应 transform 和运行时支持。

### 项目配置正确，第三方包为什么仍然报语法错？

依赖可能被排除在转换范围之外，或者包导出选择了现代产物。检查实际进入 bundle 的文件，而不是只看源码配置。

### core-js 是否能替代宿主权限？

不能。摄像头、文件等能力受平台 API、权限和安全上下文约束，补丁不能创造宿主没有提供的权限。

## 延伸阅读

- [Webpack 构建流程](/md/工程化/Webpack/构建流程.md)
- [Loader 与 Plugin](/md/工程化/Webpack/Loader与Plugin.md)
- [React 渲染原理](/md/框架/React/React%20渲染原理.md)
