# 函数的 call、apply 和 bind 方法

## 面试定位

`call`、`apply`、`bind` 常用来考察 `this`、函数调用、参数处理和手写能力。面试中不仅要说区别，还要能解释实现思路。

## 核心原理

这三个方法都用于改变函数执行时的 `this`。

区别是：

- `call`：立即执行，参数逐个传入。
- `apply`：立即执行，参数以数组或类数组形式传入。
- `bind`：不立即执行，返回一个绑定了 `this` 和部分参数的新函数。

```javascript
function greet(city, job) {
    return `${this.name} from ${city}, ${job}`;
}

const user = { name: "omen" };

greet.call(user, "Shenzhen", "FE");
greet.apply(user, ["Shenzhen", "FE"]);

const bound = greet.bind(user, "Shenzhen");
bound("FE");
```

## call

`call` 会以指定对象作为 `this` 调用函数。

```javascript
function sayName() {
    console.log(this.name);
}

sayName.call({ name: "call" }); // "call"
```

适合参数数量明确的场景。

## apply

`apply` 和 `call` 类似，但第二个参数是数组或类数组。

```javascript
const nums = [1, 3, 2];
Math.max.apply(null, nums); // 3
```

现代代码中也可以用展开运算符：

```javascript
Math.max(...nums); // 3
```

## bind

`bind` 返回新函数，不会立即执行，并支持参数预置。

```javascript
function add(a, b) {
    return this.base + a + b;
}

const addFrom10 = add.bind({ base: 10 }, 1);
console.log(addFrom10(2)); // 13
```

常见场景：

- 事件回调中固定 `this`。
- 函数柯里化或参数预置。
- React class 组件中绑定事件方法。

## 手写 call

实现思路：把函数临时挂到目标对象上，用对象方法调用触发隐式绑定，调用后删除临时属性。

```javascript
Function.prototype.myCall = function (context, ...args) {
    context = context == null ? globalThis : Object(context);
    const key = Symbol("fn");

    context[key] = this;
    const result = context[key](...args);
    delete context[key];

    return result;
};
```

关键点：

- `null` 或 `undefined` 默认绑定到 `globalThis`。
- 用 `Symbol` 避免属性名冲突。
- 基本类型要通过 `Object(context)` 装箱。

## 手写 apply

```javascript
Function.prototype.myApply = function (context, args) {
    context = context == null ? globalThis : Object(context);
    const key = Symbol("fn");

    context[key] = this;
    const result = context[key](...(args || []));
    delete context[key];

    return result;
};
```

## 手写 bind

`bind` 的关键是返回一个新函数，并处理两件事：

- 普通调用时，使用绑定的 `this`。
- `new` 调用时，忽略绑定的 `this`，让 `this` 指向新实例。

```javascript
Function.prototype.myBind = function (context, ...presetArgs) {
    const fn = this;

    function boundFn(...laterArgs) {
        const isNew = this instanceof boundFn;
        const thisArg = isNew ? this : context;
        return fn.apply(thisArg, [...presetArgs, ...laterArgs]);
    }

    boundFn.prototype = Object.create(fn.prototype);
    return boundFn;
};
```

## 面试回答

可以这样答：

> `call`、`apply`、`bind` 都是用来改变函数执行时 `this` 的。`call` 和 `apply` 会立即执行函数，区别在于 `call` 接收参数列表，`apply` 接收参数数组；`bind` 不会立即执行，而是返回一个新的函数，并且可以提前绑定 `this` 和部分参数。手写 `call` 的核心思路是把函数临时挂到目标对象上，通过对象调用让 `this` 指向该对象，执行完再删除。手写 `bind` 还要注意构造函数场景，如果绑定后的函数被 `new` 调用，`this` 应该指向新实例，而不是原来绑定的对象。

## 高频追问

### `bind` 和箭头函数都能固定 `this`，有什么区别？

`bind` 是返回一个新函数，并显式绑定 `this`。箭头函数没有自己的 `this`，它捕获定义时外层的 `this`。箭头函数不能作为构造函数，也不能用 `bind` 改变 `this`。

### `call(null)` 时 `this` 指向哪里？

非严格模式下会指向全局对象。严格模式下传入什么就是什么，`null` 就是 `null`，`undefined` 就是 `undefined`。

### `apply` 现在是不是没用了？

不是。展开运算符能覆盖很多数组传参场景，但 `apply` 在处理类数组、动态调用、兼容旧环境时仍然有价值。

## 相关链接

- [This 的理解](/md/基础/JavaScript/This的理解.md)
- [闭包的理解](/md/基础/JavaScript/闭包的理解.md)
