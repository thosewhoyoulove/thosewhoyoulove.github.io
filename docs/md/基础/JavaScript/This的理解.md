# JavaScript 中的 this 理解

## 面试定位

`this` 是 JavaScript 高频基础题，常和箭头函数、事件回调、类、`call` / `apply` / `bind` 一起考。回答重点不是背“指向谁”，而是讲清楚：`this` 在普通函数里由调用方式决定，箭头函数没有自己的 `this`。

## 核心原理

普通函数的 `this` 不是在定义时决定的，而是在调用时决定的。可以按优先级记：

1. `new` 调用：`this` 指向新创建的实例。
2. 显式绑定：`call`、`apply`、`bind` 指定 `this`。
3. 隐式绑定：通过对象调用，`this` 指向调用它的对象。
4. 默认绑定：独立函数调用，非严格模式指向全局对象，严格模式是 `undefined`。

箭头函数没有自己的 `this`，它会捕获定义时外层作用域的 `this`，所以不能被 `call`、`apply`、`bind` 改变。

## 调用规则

### 默认绑定

```javascript
function show() {
    console.log(this);
}

show(); // 非严格模式：window；严格模式：undefined
```

### 隐式绑定

```javascript
const user = {
    name: "omen",
    sayName() {
        console.log(this.name);
    },
};

user.sayName(); // "omen"
```

注意：看调用点，不看定义位置。

```javascript
const fn = user.sayName;
fn(); // this 丢失，非严格模式下 this 指向 window
```

### 显式绑定

```javascript
function sayName() {
    console.log(this.name);
}

sayName.call({ name: "call" }); // "call"
sayName.apply({ name: "apply" }); // "apply"

const bound = sayName.bind({ name: "bind" });
bound(); // "bind"
```

### new 绑定

```javascript
function Person(name) {
    this.name = name;
}

const person = new Person("omen");
console.log(person.name); // "omen"
```

`new` 调用大致做了四件事：

1. 创建一个新对象。
2. 将新对象的原型指向构造函数的 `prototype`。
3. 用新对象作为 `this` 执行构造函数。
4. 如果构造函数没有返回对象，则返回这个新对象。

## 箭头函数

箭头函数的 `this` 取自定义时的外层作用域。

```javascript
const user = {
    name: "omen",
    normal() {
        return () => this.name;
    },
};

const fn = user.normal();
console.log(fn()); // "omen"
```

但下面这种写法不会让 `this` 指向 `user`：

```javascript
const user = {
    name: "omen",
    sayName: () => {
        console.log(this.name);
    },
};

user.sayName(); // 通常不是 "omen"
```

因为对象字面量不会形成自己的 `this` 作用域，箭头函数捕获的是外层作用域。

## 面试回答

可以这样答：

> 普通函数的 `this` 是调用时绑定的，不是定义时绑定的。判断时我会看调用方式：如果是 `new`，`this` 指向新实例；如果用了 `call`、`apply`、`bind`，指向显式传入的对象；如果是 `obj.fn()`，指向点号前面的对象；如果是独立调用，非严格模式指向全局对象，严格模式是 `undefined`。箭头函数比较特殊，它没有自己的 `this`，会捕获定义时外层作用域的 `this`，所以不能用 `bind` 改变，也不适合做对象方法或构造函数。

## 高频追问

### `this` 丢失是什么？

当对象方法被单独赋值、作为回调传入时，调用点不再是原对象，`this` 就可能丢失。

```javascript
const obj = {
    name: "omen",
    say() {
        console.log(this.name);
    },
};

setTimeout(obj.say, 0); // this 丢失
setTimeout(() => obj.say(), 0); // 保留调用关系
setTimeout(obj.say.bind(obj), 0); // 显式绑定
```

### 箭头函数能不能作为构造函数？

不能。箭头函数没有自己的 `this`，也没有 `prototype`，不能被 `new` 调用。

### `bind` 后还能再改变 `this` 吗？

普通调用不能再改变。`bind` 返回的新函数已经固定了 `this`。不过如果把绑定函数作为构造函数 `new` 调用，`new` 的实例绑定优先。

## 相关链接

- [函数的 call、apply 和 bind 方法](/md/基础/JavaScript/函数的call,apply和bind方法.md)
- [闭包的理解](/md/基础/JavaScript/闭包的理解.md)
