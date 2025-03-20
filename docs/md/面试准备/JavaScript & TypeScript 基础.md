# JavaScript & TypeScript 基础

## 1.你在项目中如何应用 ES6+ 特性？可以举个例子吗？

- 解构赋值
- 箭头函数
- 模板字符串
- Promise & async/await
- 扩展运算符 (...)

## 2.var、let 和 const 的区别是什么？它们的作用域和提升（Hoisting）机制有什么不同？

- var 是全局作用域，let 和 const 是块级作用域
- var 有变量提升，let 和 const 没有变量提升
- var 可以重复声明和重新赋值，let 和 const 不能重复声明和重新赋值

## 3.深拷贝和浅拷贝的区别？

### 3.1 浅拷贝 VS 深拷贝

| 类型 | 定义 | 影响 |
| --- | --- | --- |
| 浅拷贝 | 只拷贝对象的第一层，如果对象的属性是引用类型（如数组、对象），拷贝的只是引用，而不是实际数据。 | 修改拷贝后的对象，可能影响原对象。 |
| 深拷贝 | 递归拷贝对象的所有层级，生成一个完全独立的新对象。 | 修改拷贝后的对象不会影响原对象。 |

### 3.2 浅拷贝示例

浅拷贝方法：

- Object.assign()
- 展开运算符 { ...obj }
- Array.prototype.slice() / Array.prototype.concat()

```js
const obj1 = { a: 1, b: { c: 2 } };
const obj2 = { ...obj1 }; // 浅拷贝
obj2.b.c = 100;

console.log(obj1.b.c); // 100（原对象也被修改了！）

```

在 obj2 = { ...obj1 } 之后，obj1.b 和 obj2.b 仍然指向同一个对象，因此修改 obj2.b.c 也影响了 obj1.b.c。

### 3.3 深拷贝示例

深拷贝方法：

- JSON 方法（简单对象适用）: JSON.parse(JSON.stringify(obj))
- Lodash 的 cloneDeep()（推荐）
- 手写递归深拷贝函数
- structuredClone()（原生支持）

#### 3.3.1 JSON 深拷贝

```js
const obj1 = { a: 1, b: { c: 2 } };
const obj2 = JSON.parse(JSON.stringify(obj1));

obj2.b.c = 100;
console.log(obj1.b.c); // 2（原对象未被修改）

```

缺点：

- 不能拷贝 函数、undefined、Symbol、循环引用 等特殊值。
- Date 对象会变成字符串，Map/Set 会丢失。

#### 3.3.2 Lodash 的 cloneDeep()

推荐在 Vue/React 项目中使用：

```js
import _ from 'lodash';

const obj1 = { a: 1, b: { c: 2 } };
const obj2 = _.cloneDeep(obj1);

obj2.b.c = 100;
console.log(obj1.b.c); // 2（原对象未被修改）

```

✅ 优点：支持函数、Date、Set、Map、Symbol，不会丢失数据。

#### 3.3.3 手写递归深拷贝

```js
function deepClone(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;
  const result = Array.isArray(obj) ? [] : {};
  for (const key in obj) {
    result[key] = deepClone(obj[key]);
  }
  return result;
}
```

✅ 优点：支持函数、Date、Set、Map、Symbol，不会丢失数据。

#### 3.3.4 structuredClone()（原生方法，推荐）

在现代浏览器和 Node.js 17+ 版本中可用：

```js
const obj1 = { a: 1, b: { c: 2 }, d: new Date() };
const obj2 = structuredClone(obj1);

obj2.b.c = 100;
console.log(obj1.b.c); // 2（原对象未被修改）

```

✅优点： 支持 Date、Map、Set，比 JSON.stringify 更强大。

⚠️缺点：不支持函数和 Symbol。

### 4.在 Vue/React 项目中你遇到过对象拷贝的问题吗？你是怎么解决的？

#### 4.1 Vue 中响应式对象的拷贝问题

在 Vue 2/3 中，Vue 使用 Proxy（Vue 3） 和 Object.defineProperty（Vue 2） 实现响应式。如果使用 浅拷贝，响应式数据可能丢失。

❌ 错误示例

```js
const state = reactive({ user: { name: "Alice", age: 25 } });
const newUser = { ...state.user }; // 浅拷贝
newUser.age = 30;

console.log(state.user.age); // 30（原数据被修改了）

```

✅ 正确做法

```js
import { reactive, toRaw } from "vue";
import { cloneDeep } from "lodash";

const state = reactive({ user: { name: "Alice", age: 25 } });

const newUser = cloneDeep(toRaw(state.user)); // 深拷贝
newUser.age = 30;

console.log(state.user.age); // 25（原数据未被修改）

```

#### 4.2 React 中状态管理的拷贝问题

在 React 中，状态不可变（Immutability）是核心原则。如果直接修改 state，可能导致组件不会重新渲染。

❌ 错误示例

```js
const [user, setUser] = useState({ name: "Alice", age: 25 });

const updateUser = () => {
    user.age = 30; // ❌ 直接修改 state（错误）
    setUser(user);
};

```

React 不会检测到 user 的变化，因为 user 变量的引用没有变。

✅ 正确做法
使用 浅拷贝 + 深拷贝（取决于需求）：

```js
const updateUser = () => {
    setUser(prevUser => ({ ...prevUser, age: 30 })); // ✅ 浅拷贝
};
```

对于深层对象，推荐使用 lodash.cloneDeep()：

```js
const updateUser = () => {
    setUser(prevUser => {
        const newUser = cloneDeep(prevUser);
        newUser.profile.age = 30;
        return newUser;
    });
};

```

✅ 优点： 组件会重新渲染，因为 state 的引用变了。

## 5.事件循环（Event Loop）的执行机制是什么？你能描述一下微任务（Microtask）和宏任务（Macrotask）的执行顺序吗？

详情请看 [浏览器的事件循环](/md/Web/浏览器的事件循环.md)

## 6.TypeScript 里 interface 和 type 有什么区别？什么时候适合用 type，什么时候适合用 interface？

### 6.1 interface 和 type 的主要区别

| 对比点 | interface | type |
| --- | --- | --- |
| 是否可扩展 | ✅ 可继承 (extends) 和合并 | ✅ 不可合并，但可以交叉（&） |
| 用于对象类型 | ✅ 推荐 | ✅ 适用，但不如 interface 直观 |

- 用于基本类型 ❌ 不能定义基本类型 ✅ 适用于 string、number、联合类型等
- 是否支持映射 ✅ 支持 readonly / 可选属性 ✅ 也支持
- 能否用于类 ✅ 可用于 implements ❌ 不能 implements

### 6.2 interface 适用于对象和类

✅ interface 适合定义对象的结构

```ts
interface Person {
  name: string;
  age: number;
}

const user: Person = {
  name: "Alice",
  age: 25,
};
```

✅ interface 可以继承

```ts
interface Employee extends Person {
  position: string;
}
```

✅ interface 可以用于类

```ts
class Developer implements Employee {
  name: string;
  age: number;
  position: string;

  constructor(name: string, age: number, position: string) {
    this.name = name;
    this.age = age;
    this.position = position;
  }
}

```

✅ interface 可以自动合并

```ts
interface User {
  name: string;
}

interface User {
  age: number;
}

const user: User = { name: "Alice", age: 25 }; // ✅ 自动合并

```

### 6.3 type 适用于基本类型和联合类型

✅ type 适合定义基本类型

```ts
type Name = string;

const name: Name = "Alice";
```

✅ type 适合定义联合类型

```ts
type Status = "pending" | "fulfilled" | "rejected";

const status: Status = "pending"; // ✅ 合法

```

✅ type 可以交叉

```ts
type Admin = { role: "admin" };

type User = { name: string };

type AdminUser = Admin & User;

const adminUser: AdminUser = { role: "admin", name: "Alice" };

```

### 6.4 什么时候适合用 type，什么时候适合用 interface

| 场景 | 推荐使用 | 原因 |
| --- | --- | --- |
| 定义对象 | interface ✅ | 可继承，可合并，支持类 |
| 定义基本类型 | type ✅ | 适用于 `string`、`number`、`boolean` 等基本类型 |
| 复杂联合类型 | type ✅ | type 支持联合和交叉类型 |
| 类的结构 | interface ✅ | 可 implements，支持继承 |
| 只读对象 | interface ✅ | readonly 更直观 |

### 6.5 总结

- 优先使用 interface 定义对象，因为它支持继承、自动合并。
- 使用 type 处理基本类型、联合类型、交叉类型。
- 如果需要 extends 和 implements，优先选择 interface。
