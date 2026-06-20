# JavaScript & TypeScript 基础

## 面试定位

三年前端岗的 JS/TS 题，重点不是背八股清单，而是证明你**理解运行时机制、能设计类型边界、能把结论落到框架和项目里**。

高频路径：数据类型与拷贝 → 闭包与 this → Promise / async-await → 事件循环输出题 → TypeScript 类型建模（interface、泛型、工具类型、unknown 收窄）。原型链、手写 Promise 可能追问，但通常作为深度加分，不是开场题。

## 三年岗复习优先级

| 优先级 | 主题 | 为什么 |
| --- | --- | --- |
| P0 | 事件循环、Promise、async/await | 几乎每轮必考，常出输出顺序题 |
| P0 | 闭包、this、箭头函数 | 结合防抖节流、组件回调、内存泄漏追问 |
| P0 | TS：type vs interface、泛型、工具类型 | 业务代码和组件 props 设计日常在用 |
| P1 | 深浅拷贝、类型判断、隐式转换 | 状态不可变、接口数据处理 |
| P1 | unknown / never / 类型守卫 | 外部输入与穷尽检查 |
| P2 | 手写 Promise、V8 细节 | 答稳 P0 后再准备 |

## 核心原理

JavaScript 是动态类型语言，运行时才真正确定很多值的类型和行为。TypeScript 在 JavaScript 之上增加静态类型检查，把一部分错误提前到开发阶段暴露。

两者的关系可以这样理解：

```text
JavaScript 负责运行时行为。
TypeScript 负责开发阶段的类型约束。
```

所以面试回答要区分：哪些是 JS 运行时机制，哪些是 TS 编译期能力。

## var、let、const

`var` 是函数作用域，存在变量提升，可以重复声明。

`let` 和 `const` 是块级作用域，存在暂时性死区，不能在声明前访问，也不能重复声明。

`const` 限制的是变量绑定不能重新赋值，不代表对象内部属性不能修改。

```js
const user = { name: "Tom" };
user.name = "Jerry";
```

这里是允许的，因为对象引用没有变。

## 数据类型

JavaScript 数据类型分为基础类型和引用类型。

基础类型包括：`string`、`number`、`boolean`、`null`、`undefined`、`symbol`、`bigint`。

引用类型包括：对象、数组、函数、Date、Map、Set 等。

基础类型通常按值访问，引用类型变量保存的是对象引用。两个对象即使内容一样，只要引用不同，也不相等。

```js
{} === {}; // false
```

## 深拷贝和浅拷贝

浅拷贝只复制第一层。如果属性值是对象，复制的是引用。

```js
const a = { user: { name: "Tom" } };
const b = { ...a };
b.user.name = "Jerry";
console.log(a.user.name); // Jerry
```

深拷贝会递归复制内部对象，使新旧对象互不影响。

常见方式：

- `structuredClone`：现代环境原生支持，不支持函数。
- `JSON.parse(JSON.stringify(obj))`：简单对象可用，但会丢失函数、undefined、Symbol、Date、Map、Set。
- `lodash.cloneDeep`：项目中更稳妥。
- 手写递归：面试常考，但要注意循环引用、特殊对象。

在 React 里，状态更新要保持不可变，不能直接改原对象。在 Vue 里，也要注意响应式对象和原始对象之间的关系，必要时使用 `toRaw` 再拷贝。

## 闭包

闭包是函数可以访问其词法作用域中的变量，即使外层函数已经执行结束。

闭包的价值是保留私有状态，比如防抖、节流、缓存、模块私有变量。

风险是如果闭包长期持有大对象引用，可能导致这些对象无法被垃圾回收。

面试里不要只说“函数套函数”，要说清楚闭包保存的是词法作用域引用。

## this

`this` 的值由调用方式决定，不由函数定义位置决定。

常见规则：

- 默认调用：非严格模式指向全局对象，严格模式是 `undefined`。
- 隐式调用：谁调用，`this` 指向谁。
- 显式绑定：`call`、`apply`、`bind` 指定。
- new 调用：指向新创建的实例。
- 箭头函数：没有自己的 `this`，从外层词法作用域继承。

## Promise、async/await 与事件循环

Promise 有三种状态：pending、fulfilled、rejected；状态不可逆。

`async/await` 是 Promise 语法糖：`await` 之后的代码进入微任务，等价于 `.then`。

事件循环里，同步代码先执行。一次宏任务结束后，会清空当前所有微任务，再进入下一轮宏任务。

常见微任务：Promise then/catch/finally、queueMicrotask、MutationObserver。

常见宏任务：setTimeout、setInterval、I/O、UI 事件。

浏览器与渲染、缓存、Core Web Vitals 见 [浏览器与性能速记](/md/面试准备/技术/浏览器面试速记.md)。

## TypeScript 基础

TypeScript 的核心价值是静态类型检查和更清晰的接口约束。

常见高频点：

- `any` 是放弃类型检查。
- `unknown` 是安全的未知类型，使用前必须收窄。
- `never` 表示不可能出现的值，适合穷尽检查。
- 泛型保留输入和输出之间的类型关系。
- 类型守卫用于把宽泛类型收窄成具体类型。
- 工具类型可以基于已有类型生成新类型。

项目里 TypeScript 最适合用于接口响应、组件 props、业务状态、工具函数、第三方库类型补充。

## 面试回答

> 三年岗我会把 JS 和 TS 分开说。JS 侧核心是作用域、闭包、this、Promise 和事件循环——比如闭包保留词法作用域引用，this 由调用方式决定，Promise 回调是微任务，会在当前宏任务清空后、下一个宏任务前执行。
>
> TS 侧核心是静态类型约束：interface 描述对象形状，type 更灵活可联合/交叉；外部数据用 unknown 再收窄，而不是 any；泛型和 Pick/Omit 这类工具类型用来从 API 类型推导 UI 状态，减少重复定义。
>
> 这些不是孤立知识点，会直接影响 React 不可变更新、异步请求错误处理、组件 props 设计和接口层类型安全。

一句话总结：

> JS 讲运行时机制，TS 讲编译期约束；三年岗要能串到框架和项目验证。

## 高频追问

### var、let、const 最大区别是什么？

作用域和提升机制不同。

`var` 是函数作用域，有变量提升，可以重复声明。`let` 和 `const` 是块级作用域，有暂时性死区，不能重复声明。`const` 不能重新赋值变量绑定，但对象内部属性仍然可以修改。

### 深拷贝一定好吗？

不一定。

深拷贝成本更高，而且可能破坏响应式引用或类实例结构。项目里要先判断是否真的需要深拷贝，很多 React 状态更新只需要浅拷贝受影响层级。

### Promise.then 为什么比 setTimeout 先执行？

因为 Promise.then 是微任务，setTimeout 是宏任务。

当前同步代码执行完后，会先清空微任务队列，再进入下一轮宏任务。

### TypeScript 和 JavaScript 的关系是什么？

TypeScript 是 JavaScript 的超集，增加了类型系统和编译期检查。

最终运行的仍然是 JavaScript，类型在编译后会被擦除，所以 TypeScript 不能替代运行时校验。

### any 和 unknown 有什么区别？

`any` 是放弃类型检查，`unknown` 是安全的未知类型。

`unknown` 使用前必须先判断类型，更适合接口返回、外部输入、第三方数据这类不确定来源。

### async/await 和 Promise.then 在事件循环里一样吗？

本质一样，`await` 之后的代码相当于放进 `.then`，都是微任务。

### type 和 interface 怎么选？

对象形状两者都可；需要联合类型、映射类型、条件类型时用 type；需要声明合并（如扩展第三方）时用 interface。

## 相关链接

- [浏览器与性能速记](/md/面试准备/技术/浏览器面试速记.md)
- [数据类型](/md/基础/JavaScript/数据类型.md)
- [This 的理解](/md/基础/JavaScript/This的理解.md)
- [闭包的理解](/md/基础/JavaScript/闭包的理解.md)
- [Promise](/md/基础/ES6/Promise.md)
- [浏览器事件循环](/md/浏览器/浏览器的事件循环.md)
- [TypeScript 基础类型](/md/TypeScript/基础类型.md)
- [TypeScript 泛型](/md/TypeScript/泛型.md)
- [类型守卫与类型收窄](/md/TypeScript/类型守卫与类型收窄.md)
