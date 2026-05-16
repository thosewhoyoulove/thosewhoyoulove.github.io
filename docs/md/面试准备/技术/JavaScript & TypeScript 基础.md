# JavaScript & TypeScript 基础

## 面试定位

JavaScript 和 TypeScript 基础是前端面试的第一层筛选。它主要判断你是否理解语言机制，而不是只会使用框架。

这类问题通常会从变量、类型、作用域、闭包、事件循环、Promise 进入，再延伸到 TypeScript 的类型系统、泛型和项目实践。

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

## Promise 和事件循环

Promise 有三种状态：

- pending。
- fulfilled。
- rejected。

状态一旦从 pending 变成 fulfilled 或 rejected，就不能再改变。

事件循环里，同步代码先执行。一次宏任务执行结束后，会清空当前所有微任务，再进入下一轮宏任务。

常见微任务：

- Promise then/catch/finally。
- queueMicrotask。
- MutationObserver。

常见宏任务：

- setTimeout。
- setInterval。
- I/O。
- UI 事件。

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

JavaScript 基础我会从运行时机制回答，TypeScript 我会从开发期类型约束回答。

JavaScript 里比较核心的是作用域、闭包、this、Promise 和事件循环。比如 `let` 和 `const` 是块级作用域，有暂时性死区；闭包本质是函数保留对词法作用域的引用；`this` 由调用方式决定；Promise 的回调属于微任务，会在当前宏任务结束后执行。

TypeScript 则是在 JavaScript 之上增加静态类型系统。它不会改变运行时行为，但可以在开发阶段发现类型错误。实际项目里，我会用它约束接口返回、组件 props、业务状态和工具函数。对于外部不可信数据，我更倾向于先用 `unknown`，再通过类型守卫或运行时校验收窄，而不是直接用 `any`。

所以这部分基础不是孤立知识点，它们会影响框架状态更新、异步处理、组件设计和项目类型安全。

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

## 相关链接

- [数据类型](/md/基础/JavaScript/数据类型.md)
- [This 的理解](/md/基础/JavaScript/This的理解.md)
- [闭包的理解](/md/基础/JavaScript/闭包的理解.md)
- [Promise](/md/基础/ES6/Promise.md)
- [浏览器事件循环](/md/浏览器/浏览器的事件循环.md)
- [TypeScript 基础类型](/md/TypeScript/基础类型.md)
- [TypeScript 泛型](/md/TypeScript/泛型.md)
- [类型守卫与类型收窄](/md/TypeScript/类型守卫与类型收窄.md)
