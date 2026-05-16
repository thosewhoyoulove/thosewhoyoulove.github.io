# type 和 interface

## 面试定位

这道题主要考察你是否理解 TypeScript 类型声明的表达能力，而不是背诵“type 和 interface 的区别”。

面试回答要讲清楚两点：`interface` 更偏对象结构声明，`type` 更偏类型组合和类型运算。

## 核心原理

`interface` 和 `type` 都可以描述对象结构。

```ts
interface UserByInterface {
  id: number;
  name: string;
}

type UserByType = {
  id: number;
  name: string;
};
```

它们真正的差异在于扩展能力和表达范围。

## interface 的特点

### 适合描述对象结构

`interface` 天然适合声明对象、类、组件 props、接口返回结构。

```ts
interface User {
  id: number;
  name: string;
}
```

### 支持继承

```ts
interface BaseUser {
  id: number;
}

interface AdminUser extends BaseUser {
  permissions: string[];
}
```

这种写法适合表达对象结构之间的层级关系。

### 支持同名合并

```ts
interface Window {
  appVersion: string;
}

interface Window {
  userId: string;
}
```

同名 `interface` 会被自动合并。这个能力常用于扩展第三方库类型或全局类型。

## type 的特点

### 可以声明联合类型

```ts
type Status = "loading" | "success" | "error";
```

`interface` 不能直接表达这种联合关系。

### 可以声明交叉类型

```ts
type User = {
  id: number;
} & {
  name: string;
};
```

交叉类型适合组合多个能力。

### 可以配合条件类型和映射类型

```ts
type Nullable<T> = T | null;

type ReadonlyUser<T> = {
  readonly [K in keyof T]: T[K];
};
```

这类类型运算通常只能用 `type` 表达。

## 如何选择

如果只是描述对象结构，尤其是公共对象、类实现、组件 props，用 `interface` 和 `type` 都可以。

如果需要联合类型、条件类型、映射类型、工具类型组合，优先使用 `type`。

在团队项目里，更重要的是保持风格一致。比如约定对象结构用 `interface`，复杂类型组合用 `type`。

## 面试回答

`type` 和 `interface` 都能描述对象结构，但它们的侧重点不一样。

`interface` 更适合描述对象形状，比如接口返回、组件 props、类的约束。它支持 `extends` 继承，也支持同名声明合并，所以扩展第三方库类型或全局类型时比较常用。

`type` 表达能力更强，它不只可以描述对象，还可以描述联合类型、交叉类型、条件类型、映射类型。像 `Status = "loading" | "success" | "error"` 这种状态枚举，或者基于泛型做类型转换，一般都用 `type`。

实际项目里我不会绝对区分谁更好。如果是简单对象结构，团队规范用哪个就跟哪个；如果涉及类型组合和类型运算，我会优先用 `type`。

## 高频追问

### interface 能不能完全替代 type？

不能。`interface` 不能直接表达联合类型、条件类型、映射类型这些类型运算。

比如 `type Status = "success" | "error"` 这种场景就更适合 `type`。

### type 能不能完全替代 interface？

大多数对象声明可以替代，但 `type` 不支持同名自动合并。

如果需要扩展第三方库声明、全局对象声明，`interface` 的声明合并能力更合适。

### extends 和 & 有什么区别？

`extends` 更像对象结构继承，语义更清楚；`&` 是交叉类型，把多个类型合并。

对象结构扩展时，两者很多情况下都能用。但如果属性冲突，它们的表现和可读性会不同，项目里应避免制造冲突类型。

### 组件 props 用 type 还是 interface？

都可以。简单 props 用 `interface` 可读性较好；如果 props 涉及联合类型、条件类型、泛型组合，用 `type` 更灵活。

关键不是固定答案，而是保持团队一致。

## 相关链接

- [TypeScript 基础类型](/md/TypeScript/基础类型.md)
- [泛型](/md/TypeScript/泛型.md)
- [工具类型.md](/md/TypeScript/工具类型.md)
