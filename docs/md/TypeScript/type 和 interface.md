# type 和 interface

## 面试回答

### 面试现场回答

> `type` 和 `interface`，我觉得没有必要特别绝对地区分。只是定义一个普通对象的话，两个都能写，比如组件的 props，或者后端返回的 User。
>
> 我一般主要看后面要不要做类型组合。结构比较稳定，而且可能会继续扩展，我比较习惯用 `interface`。它可以直接 `extends`，还有声明合并。比如给 `Window` 补一个全局字段，或者扩展第三方库暴露出来的 interface。
>
> 如果已经不只是一个对象，而是要做类型运算，我就用 `type`。最常见的是联合类型，比如 Status 分成 loading、success、error。按钮那种有时是 link 要 href，有时是 button 要 onClick，我也肯定写成 type，interface 没法直接表达。
>
> `extends` 和 `&` 正常加字段时看起来差不多，字段一冲突就不一样了，这个比较容易被接着问。
>
> 所以实际项目里，我不会纠结必须统一用哪一个。要继承或者要声明合并，用 interface；要做联合或者类型运算，用 type。团队有规范，就跟团队走。

**一句话总结：**

> 普通对象都能写 → 会扩展或要声明合并用 interface → 联合和类型运算用 type → `extends` 与 `&` 的冲突留到追问。

---

### 可追问展开

**那个按钮的联合，类型怎么写？**

```ts
type ButtonProps =
  | { type: "link"; href: string }
  | { type: "button"; onClick: () => void };
```

整个 props 是二选一，interface 写不出这种声明。某个字段写成 `"link" | "button"` 可以，那只是一个属性，不是两组字段互斥。

**`extends` 和 `&` 加字段时一样吗？冲突呢？**

给 User 加一个 permissions，两边差不多：

```ts
interface Admin extends User {
  permissions: string[];
}

type AdminUser = User & {
  permissions: string[];
};
```

字段冲突时，`extends` 会在继承的地方检查，子字段和父类型对不上就直接报错。`&` 是把两个类型叠在一起。一边要求 `value` 是 `string`，另一边要求是 `number`，这个属性会变成 `string & number`，也就是 `never`。类型声明往往还能过，等你赋值才会报错。

**声明合并具体怎么补？库导出的如果是 type 呢？**

补 `Window` 的全局字段，或者扩展第三方已经暴露出来的 interface，名字要对上。当前文件里如果已经有 import，补全局 `Window` 要写在 `declare global` 里，否则只是模块内部的接口。库要是导出的 type 别名，同名合并补不进去，只能在自己调用的地方再 `&` 一层。

**交叉、元组、条件类型、映射类型为什么也用 type？**

这些都不是再声明一个对象。元组要固定每一位的类型，条件类型和映射类型是在做变换，interface 没有对应语法。

---

## 核心原理

### 1. type 和 interface 是什么

两者都是「给类型起名字」的语法，名字只存在于编译期，编成 JavaScript 后会被擦掉。

`interface` 专门声明对象类型。函数在类型系统里也是对象，所以调用签名也可以写成 interface。它从设计上就是开放的：后面还可以 `extends`，同名声明还会合并进同一个接口。DOM 库里的 `Window` 就是这样被很多文件一起声明出来的。

`type` 是类型别名，右边可以是任何类型：原始类型、对象、联合、元组、交叉，以及 `keyof`、条件类型、映射类型这些运算结果。它把一个类型表达式绑到一个名字上，之后不能靠同名声明再打开这个别名往里加成员。

所以面试里不要先背「谁更好」。先问这个名字右边到底是对象形状，还是一个类型运算。

### 2. 整体选择链路

```text
需要一个类型名字
  → 右边是对象 / 函数 / 索引签名 / 泛型对象？
      → 是，而且以后要继承、或要跨文件合并：interface
      → 是，但只是局部别名：interface 或 type 都可以
  → 右边是原始类型、联合、元组、交叉、keyof、条件、映射？
      → 只能 type
  → 要把已有类型拼起来？
      → 父类型成员已知、希望冲突尽早报错：interface extends
      → 父类型是泛型参数、联合，或就是要做交集：type 的 &
```

这条链路后面每一节都在回答同两个问题：这个能力解决什么，以及另一种写法为什么做不到。

### 3. 共同能力

下面四类两者都能写。差别不在「能不能描述」，而在后面还能不能继承、合并、做运算。

#### 对象

```ts
interface UserByInterface {
  id: number;
  name: string;
  role?: "admin" | "user";
  readonly createdAt: number;
}

type UserByType = {
  id: number;
  name: string;
  role?: "admin" | "user";
  readonly createdAt: number;
};
```

可选、只读、方法都可以写在两边。对象上的某个属性本来就可以是联合类型，例如 `role?: "admin" | "user"`。这不要求整个声明必须换成 `type`。

#### 函数

```ts
interface Search {
  (source: string, keyword: string): boolean;
}

type SearchFn = (source: string, keyword: string) => boolean;
```

需要「既能调用，又挂着自己的字段」时，两边都能写。interface 之后还可以靠声明合并继续加重载，这是 type 做不到的。

```ts
interface Logger {
  (message: string): void;
  prefix: string;
}
```

#### 索引签名

索引签名表示「还有一批名字现在写不全的属性」。字符串键、数字键两边都支持。

```ts
interface StringDict {
  [key: string]: string;
}

type StringDictAlias = {
  [key: string]: string;
};
```

这和映射类型不是一回事。索引签名是对象形状的一部分；映射类型是「根据已有键批量生成属性」，只能出现在 `type` 里。

#### 泛型

```ts
interface Box<T> {
  value: T;
}

type BoxAlias<T> = {
  value: T;
};
```

泛型参数两边一样。一旦泛型体变成条件类型、映射类型，或者要把一个未知的 `T` 再交上新字段，就进入 `type` 的范围。原因见第 7 节：`interface Foo<T extends object> extends T` 在类型参数还没具体化时站不住。

### 4. interface 更突出的能力

#### extends

`extends` 表示：新接口是父类型的一份扁平对象声明，并在声明当时做检查。子接口里出现的同名属性，必须能赋给父属性。

```ts
interface BaseUser {
  id: string | number;
}

interface AdminUser extends BaseUser {
  id: string;
  permissions: string[];
}
```

这里把 `id` 从 `string | number` 收窄成 `string` 是合法的，因为 `string` 可以赋给 `string | number`。把必选改成可选则不合法，因为缺省的 `undefined` 不能赋给父类型里那个必选属性。

检查发生在声明处，所以非法继承不会留下一个以后才爆炸的类型。

#### 多继承

一个 interface 可以同时继承多份对象类型，父类型之间用逗号分开。`extends` 后面不能直接写 `&`，那是语法错误。

```ts
interface Named {
  name: string;
}

interface Aged {
  age: number;
}

interface Person extends Named, Aged {
  id: string;
}
```

父类型没有同名属性时，结果就是把成员铺到一个接口上。同名属性的规则比单继承更严，第 6 节单独说：它们必须完全相同，不是「有公共部分就行」。

#### 声明合并

同名 interface 会合成一个接口。这是为了让类型定义分开放：DOM、全局变量、库的配置项，不可能在一个文件里写完，业务方还要能补字段。

非函数成员如果重复，类型必须相同，否则直接报错：

```ts
interface AppConfig {
  apiBase: string;
}

interface AppConfig {
  apiBase: string;
  timeout: number;
}
```

第二次把 `apiBase` 写成 `number`，编译器会报 subsequent property declarations must have the same type。调用签名则可以合并成重载。

合并是编译期把多份声明收成一个类型，不是运行时把对象 mixin 到一起。

全局对象要看当前文件是不是模块：

```ts
// 没有任何 import / export 的脚本文件里，这会并进 DOM 的 Window
interface Window {
  appVersion: string;
}
```

```ts
// 文件里已经有 import 或 export 时，顶层 interface Window 是模块私有的
export {};

declare global {
  interface Window {
    __APP_CONFIG__: {
      apiBase: string;
    };
  }
}
```

第二种才是业务代码里的常见写法。漏掉 `declare global` 时，`window.__APP_CONFIG__` 仍然不存在，因为你只声明了一个局部接口。

#### 扩展第三方类型

模块扩充解决的是：库的类型已经发布了，业务要加字段，但不能改 `node_modules`。

前提有两个。库导出的那个名字必须是 interface（或其他可合并声明），不能是 type 别名。当前文件要能解析到这个模块，扩充块里的名字要和库里的 interface 相同。

```ts
import "axios";

declare module "axios" {
  interface AxiosRequestConfig {
    skipAuth?: boolean;
  }
}
```

`AxiosRequestConfig` 在 axios 的类型里是 interface，所以可以这样补 `skipAuth`。如果作者写的是 `export type AxiosRequestConfig = { ... }`，这段同名声明不会把字段并进去。这时只能在业务侧自己包一层，例如 `AxiosRequestConfig & { skipAuth?: boolean }`，并且只在自己的调用点使用这个新别名，库内部已经写死的参数类型不会自动变。

因此公开、预期会被业务扩展的配置对象，库更适合导出 interface。应用自己的用户、订单模型则不要用合并来加字段，否则字段会从另一个文件静默出现。

### 5. type 更突出的能力

这些写法的右边都不是「一份可被同名打开的对象声明」，所以只能用别名接住。

#### 原始类型别名

```ts
type UserId = string;
type Cents = number;
```

interface 没有 `interface UserId = string` 这种语法。别名的价值是让参数位置写出意图：`function load(id: UserId)` 比到处写 `string` 更清楚。它不会在运行时阻止别人把普通字符串传进来，因为别名擦除后仍是 `string`。

#### 联合

```ts
type Status = "idle" | "loading" | "success" | "error";

type RequestState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; message: string };
```

联合表示值只居其中一种。可辨识联合再加一个公共字面量字段，收窄之后其余字段才安全。interface 可以让某个属性是联合，但不能把整个接口声明成 `A | B`。

#### 元组

```ts
type Pair = [id: string, version: number];
```

元组固定了长度和每一位的类型。interface 没有元组声明语法，不必用数字下标去模拟。

#### 交叉

```ts
type WithTimestamps = {
  createdAt: number;
  updatedAt: number;
};

type Admin = UserByInterface &
  WithTimestamps & {
    permissions: string[];
  };
```

交叉表示值要同时满足每一边。对象成员会按属性名叠到一起，所以它常被用来代替「再声明一个接口」。它和 `extends` 的差别在冲突和泛型上，不在这种简单加字段上。

#### keyof 和索引访问

```ts
type UserKey = keyof UserByInterface;
type UserName = UserByInterface["name"];
```

`keyof User` 是这个对象所有键组成的联合。`User["name"]` 是按这个键取出属性类型。它们描述的是类型之间的关系，不是一个新的对象声明，所以用 type 接住。

interface 的某个属性可以写成 `key: keyof User`，但整个 interface 不能等于 `keyof User`。

#### 条件类型

```ts
type ApiResult<T> = T extends { error: string } ? never : T;
```

`T extends U ? A : B` 里的 `extends` 是在问：`T` 能不能赋给 `U`。它不是接口继承。裸类型参数遇到联合时还会按成员分配，这是工具类型能把联合拆开再重组的原因。条件类型是类型运算，只能写在 type 里。

#### 映射类型

```ts
type ReadonlyUser<T> = {
  readonly [K in keyof T]: T[K];
};
```

`[K in keyof T]` 是在遍历键、批量生成属性。interface 的声明体里没有 `in` 这种语法。`Partial`、`Pick`、`Record` 本质都是映射类型或映射加条件，所以它们的定义都是 type。

已经算完、成员又是静态可知的对象类型，可以被 interface 继承，例如 `interface Draft extends Partial<User>`。被继承的是运算结果，映射语法本身仍然属于 type。

### 6. extends 和 &

这里比较的是「接口继承」和「交叉类型」。泛型约束 `T extends U`、条件类型 `T extends U ? A : B` 只用了同一个单词，机制不同，不要混进这张表。

#### 正常扩展

父类型加新字段、没有同名冲突时，两种写法都得到「父成员 + 新成员」。

```ts
interface Base {
  id: string;
}

interface ByExtends extends Base {
  role: string;
}

type ByIntersection = Base & {
  role: string;
};
```

`ByExtends` 和 `ByIntersection` 在使用上都可以当成 `{ id: string; role: string }`。

继承的好处是报错指向接口声明，编辑器里也是一个名字。交叉的好处是不用为每一次组合再起一个 interface，泛型里写 `T & { extra: true }` 很直接。

TypeScript 官方性能说明里有一条编译期建议：对象形状在两种都能表达时，可以优先 interface。接口会被收成单一对象类型并缓存；复杂交叉要按成员递归合并，类型变大以后检查更慢，报错也更难读。这是编译成本，不是运行时谁更快，更不是因此禁止联合和映射类型。

#### 属性冲突

用同一对输入看两种写法。父类型的 `id` 是 `string`，新类型想把 `id` 写成 `number`。

| 步骤 | `interface B extends A { id: number }` | `type C = A & { id: number }` |
| --- | --- | --- |
| 输入 | `A.id` 是 `string`，子声明写成 `number` | 左右两边的 `id` 分别是 `string` 和 `number` |
| 声明时 | 报错：`number` 不能赋给 `string`，`B` 不成立 | 声明可以通过 |
| 属性结果 | 没有可用的 `B` | `id` 变成 `string & number`，也就是 `never` |
| 赋值 `{ id: 1 }` | 走不到这一步 | 报错：`number` 不能赋给 `never` |

单继承时，子属性只要能赋给父属性就允许，所以把 `string | number` 收窄成 `string` 可以通过。完全不相容的类型在声明处就被拒绝。

交叉类型不做这次「子声明是否合法」的检查。它始终算出一个新类型，冲突被留在属性上。

#### 为什么冲突属性会变成 never

`never` 表示没有任何值属于这个类型。

`A & B` 的值必须同时是 `A` 和 `B`。那么 `id` 必须同时是 `string` 和 `number`。不存在这样的值，所以这个属性的类型是 `never`。` "a" & "b" ` 同样是 `never`，因为一个字面量不能同时是两个不同的字面量。

它什么时候出现：写完交叉、编译器化简属性的时候，不是运行的时候。它什么时候被读到：你去构造这个对象，或把一个普通值赋给该属性的时候。变化带来的影响是这个类型实际上造不出来。硬写 `as never` 可以骗过检查，也说明这里的类型已经不能指导正常赋值。

`extends` 选择在声明时失败，是为了不要产出这种无法使用的对象类型。`&` 保留 `never`，是因为它是类型运算：泛型两边具体是什么，写别名时往往还不知道，不能一律当成笔误删掉。

可相容的属性不会变成 `never`，交集是更窄的那个类型。

| 左边 | 右边 | `&` 之后 |
| --- | --- | --- |
| `id: string \| number` | `id: string` | `string` |
| `x?: number` | `x: number` | `number` |
| `id: string` | `id: number` | `never` |

可选和必选叠在一起时，结果仍是必选的 `number`：值必须满足必选的那一边，所以属性必须存在。

#### 多继承要求同名属性完全相同

单继承看的是「子属性能不能赋给父属性」。同时 `extends` 两个父类型时，编译器要把它们收成一个扁平接口，同名属性必须 identical。

```ts
interface Wide {
  id: string | number;
}

interface Narrow {
  id: string;
}

interface Both extends Wide, Narrow {}
```

`Both` 会报错：Named property `id` of types `Wide` and `Narrow` are not identical。尽管 `string` 可以赋给 `string | number`，多继承仍然不接受。`id?: string` 和 `id: string` 也不算相同。

两边都是 `id: string` 时可以通过。完全不同的 `string` 和 `number` 同样报错。

交叉类型没有这道「必须相同」的门槛：

```ts
type Narrowed = Wide & Narrow;
```

`Narrowed["id"]` 是 `string`。声明成功，结果取交集。

为什么多继承更严：接口合并要决定扁平对象上这个属性最终写成哪一个声明。两个声明不完全一样时，接口无法选定其中一个又保持「我就是这两个父类型」的意义。交叉类型不用做这个选择，它把运算结果留在属性上，不相交就留 `never`。

### 7. interface 和 type 能否互相组合

可以，但只有对象类型这条通道是通的。

| 组合 | 结果 |
| --- | --- |
| interface `extends` 另一个 interface | 可以 |
| interface `extends` 对象 type、具体的交叉、已经算完的 `Partial<User>` | 可以，成员需要静态可知 |
| type `&` interface | 可以 |
| `class implements` interface 或对象 type | 可以 |
| interface `extends` 联合、原始类型、`keyof` 的结果 | 不行 |
| `class implements` 联合 | 不行 |
| `interface Foo<T extends { id: string }> extends T` | 不行 |

最后一行即使函数体是空的也会报错：`T` 只受约束，调用时还可能传入带更多字段的子类型，接口没法在声明时把它收成一份已知成员。所以「给未知对象加字段」写成：

```ts
type WithExtra<T> = T & {
  extra: true;
};
```

如果 `T` 里本来就有 `extra`，交叉仍按第 6 节的规则取交集，可能得到 `never`。这是 `&` 的行为，不是语法把字段覆盖掉。

联合两边都是对象时也同样不能被继承：

```ts
type Account =
  | { kind: "user"; id: string }
  | { kind: "guest" };

// interface GuestAccount extends Account {}
// 报错：interface 只能继承对象类型，或成员静态可知的对象交叉
```

要加公共字段，就对整个联合做交叉，或拆开每个成员再分别写。

### 8. React 里怎么选

按 props 的形状选，不按「React 官方用哪个」选。

扩展 DOM 属性时，父类型成员是已知的，适合 interface。冲突会在组件声明处暴露。

```tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost";
}
```

`type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" }` 也能用。自定义字段如果和原生属性同名且类型不相容，交叉会把该属性收成 `never`，按钮上这个属性就很难正常赋值。

变体互斥必须是联合。interface 表达不了「整组 props 二选一」。

```tsx
type ButtonProps =
  | { variant: "link"; href: string }
  | { variant: "button"; onClick: () => void };

function Button(props: ButtonProps) {
  if (props.variant === "link") {
    return <a href={props.href} />;
  }
  return <button onClick={props.onClick} />;
}
```

`variant === "link"` 之后才能读 `href`。如果把两个变体合成一个 interface，所有字段都变成可选，非法组合要到运行时才出现。

组件函数直接给参数标注 props 即可。`React.FC` 不是更标准的写法；`@types/react` 18 起它也不再默认带上 `children`。需要 children 就写进自己的 props。简单泛型 props 用 interface 或 type 都可以；条件类型、返回值推断、上面的互斥联合，用 type。

### 9. 项目规范

规范要能帮人选择，而不是制造第二套语法争论。

- 会被继承、会被 `implements`、预期被外部合并的对象形状，用 interface。
- 原始类型别名、联合、元组、条件类型、映射类型、工具类型组合，用 type。
- 局部的纯对象别名跟团队现有文件走。同一个模型不要一会儿 interface、一会儿 type。
- 声明合并只用于全局补充和第三方 interface 扩充，集中放在 `types` 或 `*.d.ts`，并注明补的是哪一个库类型。
- 用户、订单、接口响应不要靠同名 interface 跨文件加字段。要扩展就 `extends` 或显式交叉，让依赖出现在文件头部。
- 不为了「统一成一种」把联合类型塞进 interface，也不为了少打一个名字把深层对象全部交成巨大交叉。
- 类型擦除后没有运行时校验。外部 JSON 仍要在边界解析，不能因为有 interface 就默认数据符合形状。

---

## 常见误区

### ❌ interface 只能写对象，type 只能写联合

### ✅ 更准确的说法

对象、函数、索引签名、泛型对象，两者都能写。原始类型、联合、元组以及各种类型运算，要用 type 来命名。interface 的某个属性也可以是联合类型。

### 为什么？

「对象用 interface、联合用 type」说的是默认分工，不是语法能力互斥。把分工说成能力互斥，后面会解释不了为什么 props 两边都常见，也会误以为函数类型必须用 type。

### ❌ extends 就是 &，属性冲突都会在声明时报错

### ✅ 更准确的说法

正常加字段时结果接近。子属性不能赋给父属性时，`extends` 让接口声明失败。`&` 仍会生成类型，并把该属性收成交集；`string` 和 `number` 的交集是 `never`，通常到赋值才报错。

### 为什么？

继承在生成扁平对象之前做覆盖检查，目的是不要留下无法构造的接口。交叉是类型运算，写泛型时两边的具体成员还未知，所以先算出交集，哪怕结果是 `never`。

### ❌ 多继承时，同名属性只要互相兼容就可以

### ✅ 更准确的说法

同时 `extends` 多个父类型时，同名属性必须完全相同。`string` 相对 `string | number` 虽然可赋值，多继承仍然报 not identical。同样的两份类型用 `&` 连接，`id` 会变成 `string`。

### 为什么？

多继承要把多个声明收成一个扁平属性，两个不完全相同的声明无法选定留哪一个。交叉类型不做这个选择，只保留交集。

### ❌ 声明合并可以给任何第三方类型加字段

### ✅ 更准确的说法

只能合并可合并的声明，公开配置里通常就是 interface。type 别名不能被同名声明打开。模块文件里的 `interface Window` 也不会自动变成全局 `Window`，需要 `declare global`。

### 为什么？

合并依赖「同名声明是同一份开放接口」。别名是一个已经绑定的类型表达式，没有第二次打开的语法。模块里的顶层名字默认是模块作用域，这是模块隔离，不是合并失败。

### ❌ 三个 extends 是一回事；并且项目应该只留 interface 或只留 type

### ✅ 更准确的说法

`interface B extends A` 是继承检查。`T extends U` 是泛型约束，表示类型参数必须能赋给 `U`。`T extends U ? A : B` 是条件类型里的可赋值判断。对象形状可以优先 interface，那是编译期缓存和报错可读性的取舍；联合和映射类型仍然只能用 type。运行时两者都会被擦除。

### 为什么？

同一个关键字在三个位置的输入输出都不同。把官方「接口比复杂交叉更利于编译」理解成「禁用 type」，会让状态、元组、工具类型失去对应语法。

---

## 高频追问

### 两者都能做什么？什么时候必须用 type？

对象、函数、索引签名、泛型对象都能做。必须用 type 的是原始类型别名、联合、元组、交叉结果、`keyof`、索引访问、条件类型和映射类型。interface 表达不了「整个类型是 `A | B`」。

### 声明合并能不能扩展所有第三方类型？

不能。对方导出的要是 interface，扩充时的名字要相同，当前文件还要真的解析到那个模块。导出如果是 type 别名，只能在业务侧用 `&` 包一层，库函数已经标注的参数类型不会跟着变。扩展全局时，模块文件里要写 `declare global`。

### extends 和 & 冲突时有什么不同？never 从哪来？

`extends` 要求新属性能赋给父属性，否则声明失败。`&` 要求值同时满足两边，属性类型取交集。`string & number` 没有值，所以是 `never`。`never` 出现在类型化简时；普通赋值读到它就会报错。

### 多继承为什么要求同名属性完全相同？

因为多个父接口要收成一个扁平属性，编译器要求这份属性的声明 identical。可赋值但写法不同也不行，例如 `string` 和 `string | number`。交叉类型会改成取交集，所以同样两份类型，`&` 可以得到 `id: string`。

### interface 和 type 能互相扩展吗？

对象 type 可以被 interface extends，interface 也可以被 `&` 接进 type。联合、原始类型不能被 interface 继承，类也不能 `implements` 一个联合。`interface Foo<T extends object> extends T` 不成立，未知对象上加字段用 `T & { ... }`。

### class implements 是不是只能接 interface？

不是。对象形状的 type 也可以被 `implements`。联合不行，报错和 interface 不能继承联合是同一类限制：实现目标必须是对象类型，或成员静态可知的对象交叉。

### React 的 props 用哪个？React.FC 呢？

扩展已知的 DOM props，用 interface extends，冲突在声明处暴露。互斥变体用联合 type，收窄之后才能访问该变体独有的字段。参数上直接标注 props。`React.FC` 不是默认选择，`@types/react` 18 起也不再隐含 `children`。

### 泛型约束的 extends 和接口继承一样吗？

不一样。泛型约束限制的是类型参数的上界。条件类型里的 `extends` 是一次可赋值判断，并可能按联合分配。接口 `extends` 才会生成新的对象类型，并在声明时检查属性覆盖。

---

## 小练习

先自己判断，再看参考答案。

### 1. 哪些行只能用 type 来命名？

```ts
type UserId = string;

type Status = "idle" | "loading";

interface User {
  id: UserId;
  status: Status;
}

type Pair = [string, number];
```

### 2. 下面两份声明，哪一份在声明时失败，哪一份要到赋值才失败？失败那一侧的 `id` 是什么？

```ts
interface A {
  id: string;
}

interface B extends A {
  id: number;
}

type C = A & {
  id: number;
};

const value: C = { id: 1 };
```

### 3. `Both` 能不能声明成功？`Merged["id"]` 是什么？

```ts
interface Wide {
  id: string | number;
}

interface Narrow {
  id: string;
}

interface Both extends Wide, Narrow {}

type Merged = Wide & Narrow;
```

### 4. 这个文件已经 `import` 了业务模块。为什么 `window.__APP_CONFIG__` 仍然是不存在的属性？应该怎么写？

```ts
import { createApp } from "./app";

interface Window {
  __APP_CONFIG__: {
    apiBase: string;
  };
}

createApp(window.__APP_CONFIG__.apiBase);
```

### 参考答案

1. `UserId`、`Status`、`Pair` 只能用 type。`User` 是对象形状，interface 和 type 都可以。`status` 这个属性使用了联合，不代表 `User` 本身必须改成 type。

2. `B` 在声明时失败，因为 `number` 不能赋给父属性 `string`。`C` 的声明可以通过，`C["id"]` 是 `never`。`const value` 赋值失败，因为 `1` 不能赋给 `never`。

3. `Both` 失败，同名 `id` 不是 identical。`Merged["id"]` 是 `string`。

4. 有 import 的文件是模块，顶层 `interface Window` 不会并进全局。把接口放进 `declare global` 后再使用 `window.__APP_CONFIG__`。

---

## 延伸阅读

- [TypeScript 基础类型](/md/TypeScript/基础类型.md)
- [泛型](/md/TypeScript/泛型.md)
- [工具类型](/md/TypeScript/工具类型.md)
- [类型守卫与类型收窄](/md/TypeScript/类型守卫与类型收窄.md)
- [TypeScript 项目实践](/md/TypeScript/项目实践.md)
- [JS & TS 速记](/md/面试准备/技术/JavaScript%20&%20TypeScript%20基础.md)
- [高频追问清单](/md/面试准备/高频追问清单.md)
