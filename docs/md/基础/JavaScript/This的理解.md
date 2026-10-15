# JavaScript 中的 this 理解

## 面试回答

> 普通函数的 `this` 是调用时绑定的，不是定义时绑定的。判断时我会看调用方式：如果是 `new`，`this` 指向新实例；如果用了 `call`、`apply`、`bind`，指向显式传入的对象；如果是 `obj.fn()`，指向点号前面的对象；如果是独立调用，非严格模式指向全局对象，严格模式是 `undefined`。箭头函数比较特殊，它没有自己的 `this`，会捕获定义时外层作用域的 `this`，所以不能用 `bind` 改变，也不适合做对象方法或构造函数。

**一句话总结：**

> 先看函数种类，再看调用方式：普通函数由调用绑定 this，箭头函数沿外层词法环境读取 this。

---

## 核心原理

同一个方法写成 user.sayName() 能拿到名字，赋给 fn 再调用却不行。函数体没有变，变化的是调用表达式；先追踪这个差别，比记住“this 指向谁”更可靠。

普通函数的 `this` 不是在定义时决定的，而是在调用时决定的。可以按优先级记：

1. `new` 调用：`this` 指向新创建的实例。
2. 显式绑定：`call`、`apply`、`bind` 指定 `this`。
3. 隐式绑定：通过对象调用，`this` 指向调用它的对象。
4. 默认绑定：独立函数调用，非严格模式指向全局对象，严格模式是 `undefined`。

箭头函数没有自己的 `this`，它会捕获定义时外层作用域的 `this`，所以不能被 `call`、`apply`、`bind` 改变。

### 1. 从调用表达式判断普通函数

#### 默认绑定

```javascript
function show() {
    console.log(this);
}

show(); // 浏览器普通脚本的非严格函数：window；严格函数：undefined
```

#### 隐式绑定

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
fn(); // 浏览器非严格普通脚本中读取全局 name；严格模式中访问 this.name 会抛错
```

#### 显式绑定

```javascript
function sayName() {
    console.log(this.name);
}

sayName.call({ name: "call" }); // "call"
sayName.apply({ name: "apply" }); // "apply"

const bound = sayName.bind({ name: "bind" });
bound(); // "bind"
```

#### new 绑定

```javascript
function Person(name) {
    this.name = name;
}

const person = new Person("omen");
console.log(person.name); // "omen"
```

普通构造函数通过 new 调用时，函数体里的 this 是正在初始化的实例。构造函数若显式返回对象，最终表达式的结果可能是另一个对象。完整创建流程见 [原型链与继承](/md/基础/JavaScript/原型链与继承.md)。

### 2. 箭头函数为什么不接受重新绑定

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

user.sayName(); // 不会因为 user. 而绑定到 user；模块顶层 this 为 undefined 时会抛错
```

对象字面量没有建立 this 绑定。前一个例子的箭头函数创建在 normal 方法里，继承那次 user.normal() 的 this；这里直接创建在外层，因此读取哪个 this 取决于外层环境。浏览器普通脚本顶层和 ES 模块顶层的结果不同。

## 常见误区

- **方法定义在哪个对象上，this 就永远是谁**：普通函数的 this 看调用表达式；把方法取出后，原对象关系不会自动跟过去。
- **箭头函数的 this 指向最近的对象**：对象字面量不建立 this 绑定，它读取的是外层函数或模块环境的 this。
- **bind 后 new 仍使用绑定对象**：可构造的绑定目标被 new 调用时使用新实例；箭头函数即使 bind 后也不能构造。

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

#### 2. 箭头函数为什么不接受重新绑定能不能作为构造函数？

不能。箭头函数没有自己的 `this`，也没有 `prototype`，不能被 `new` 调用。

### `bind` 后还能再改变 `this` 吗？

普通调用不能再改变。`bind` 返回的新函数已经固定了 `this`。不过如果把绑定函数作为构造函数 `new` 调用，`new` 的实例绑定优先。

## 延伸阅读

- [函数的 call、apply 和 bind 方法](/md/基础/JavaScript/函数的call,apply和bind方法.md)
- [面向对象与原型](/md/基础/JavaScript/面向对象与原型.md)
- [闭包的理解](/md/基础/JavaScript/闭包的理解.md)
