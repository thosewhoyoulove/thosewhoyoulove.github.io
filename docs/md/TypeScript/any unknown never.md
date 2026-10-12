# any、unknown、never

## 面试回答

> `any`、`unknown`、`never` 不是三个「越来越严的 any」。它们在类型系统里的方向不一样。
>
> `any` 是把检查关掉。任何值都能赋给 `any`，`any` 也能赋给 `string` 这样的普通类型。所以一个函数只要返回 `any`，调用方后面写的类型标注就拦不住，点一个不存在的字段也能编译过，错误留到运行时。我只在边界上暂时用它，比如某个第三方声明实在补不上，而且不会让它成为公共函数的返回类型。`any` 不能赋给 `never`，这是少数它过不去的地方。
>
> `unknown` 才是安全的未知。JSON、`catch` 上来的错误、本地缓存，我都先标 `unknown`。任何值都能放进 `unknown`，但 `unknown` 不能赋给 `string`，也不能直接点属性。要用，就先 `typeof`、`instanceof`，或者写一个 `value is User` 的守卫，收窄之后才使用。
>
> `never` 表示没有任何值属于这个类型。它自己可以赋给别的类型，因为「不可能出现的值」不会破坏 `string` 变量；反过来，正常类型不能赋给 `never`。函数只会抛错、或者根本不会返回时，返回类型写 `never`，不要写成 `void`。`void` 是返回值被忽略，函数还是返回了。
>
> 我真正会在业务里写的 `never`，是联合类型的穷尽检查。`switch` 的 `default` 里调用 `assertNever`，以后给状态加一种，漏掉的分支会在编译期报错。把值断言成 `never` 会把这个检查跳过。标成 `any` 不会悄悄放过，当前 TypeScript 里 `any` 也不能赋给 `never`。

**一句话总结：**

> `any` 对普通类型双向放行并传染 → 它不能赋给 `never` → `unknown` 只进不出、用之前要收窄 → `never` 只出不进、用来卡住漏掉的分支。

---

## 核心原理

### 1. 为什么要分这三个

外部数据在编译期根本不知道形状，业务状态又要求每个分支的字段不同。用一个类型表达这两件事，要么到处能点、错误延后，要么把「不可能」和「还不知道」说成同一个东西。

这三个类型回答的是不同问题：

| 类型 | 问题 | 不负责什么 |
| --- | --- | --- |
| `any` | 这一处先不要检查 | 不表示「我确认它安全」 |
| `unknown` | 这个值存在，但形状还没被证明 | 不让你直接当 `string` 用 |
| `never` | 这个位置不应该有值 | 不是一种可以存数据的空状态 |

---

### 2. 赋值方向

先记方向，再记口诀。下面「可以」指这段赋值能通过检查。

| 赋值 | 结果 | 为什么 |
| --- | --- | --- |
| `string` → `any` | 可以 | `any` 接收任何值 |
| `any` → `string` | 可以 | 检查被关掉，不是 `any` 真的是 `string` |
| `string` → `unknown` | 可以 | 已知值可以放进未知 |
| `unknown` → `string` | 不行 | 还没证明它是字符串 |
| `unknown` → `any` | 可以 | `any` 连检查都不要 |
| `never` → `string` | 可以 | 不会真的有值流进这个变量 |
| `string` → `never` | 不行 | 字符串是一个实际存在的值 |
| `any` → `never` | 不行 | 当前 TypeScript 不让 `any` 赋给 `never`。要跳过穷尽检查，得写成 `as never` |

`string | never` 还是 `string`，因为多出来的分支没有值。`string & never` 是 `never`，因为没有值能同时满足两边。过滤完的联合如果什么都不剩，结果也是 `never`，比如把 `"a" | "b"` 里的两个成员都排除掉。

---

### 3. `any` 怎么把后面的检查一起关掉

```ts
function readId(input: any) {
  return input.id;
}

const id: string = readId({});
id.toUpperCase();
```

| 步骤 | 编译器看到的类型 | 实际值 |
| --- | --- | --- |
| `readId({})` | 参数是 `any`，访问 `.id` 不报错 | `{}` 上没有 `id` |
| `return input.id` | 返回类型被推断成 `any` | `undefined` |
| `const id: string = ...` | `any` 可以赋给 `string` | 运行时不是字符串 |
| `id.toUpperCase()` | 当成字符串方法 | 运行时抛错 |

所以风险不在写下一个 `any`，而在它会从参数流到返回值，再流到 state 和 props。公共函数的返回类型不要写 `any`。暂时绕不过时，把 `any` 留在那一个第三方调用点，马上收成具体类型再返回。

---

### 4. `unknown` 必须先收窄

```ts
function readId(input: unknown) {
  if (typeof input === "object" && input !== null && "id" in input && typeof input.id === "string") {
    return input.id;
  }
  return "";
}
```

`typeof input === "object"` 之后，`null` 仍可能通过，因为 `typeof null` 也是 `"object"`。所以要先排除 `null`，再用 `in` 看有没有 `id`，最后确认 `id` 本身是字符串。收窄之前，`input.id` 不能写。

`catch (error)` 在 `strict` 下默认是 `unknown`，不是 `Error`。要读 `error.message`，先判断 `error instanceof Error`。这和接口 JSON 是同一条规则：编译期的类型盖不住运行时的值。类型守卫的写法见 [类型守卫与类型收窄](/md/TypeScript/类型守卫与类型收窄.md)。

---

### 5. `never` 用来证明分支写全了

```ts
type Status = "idle" | "loading" | "success";

function assertNever(value: never): never {
  throw new Error(`未处理的状态: ${String(value)}`);
}

function label(status: Status) {
  switch (status) {
    case "idle":
      return "未开始";
    case "loading":
      return "加载中";
    case "success":
      return "完成";
    default:
      return assertNever(status);
  }
}
```

三个 `case` 都写了时，`default` 里的 `status` 被收成 `never`，传给 `assertNever` 合法。如果以后加上 `"error"` 却没有新的 `case`，`default` 里的 `status` 变成 `"error"`，不能赋给 `never`，编译失败。

| 联合里有什么 | `default` 里的类型 | `assertNever` |
| --- | --- | --- |
| 三个 case 都覆盖了 | `never` | 通过 |
| 漏了 `"error"` | `"error"` | 报错，提醒补分支 |
| 参数本身是 `any` | `any` | 仍然报错。`any` 不能赋给 `never` |
| `status as never` | 被断言成 `never` | 通过，检查被跳过 |

抛错函数写成 `never`，是因为调用方可以认为这行之后没有返回值。写成 `void` 的话，调用方仍可能把返回值当普通函数结果接下去写。

---

### 6. 设计取舍

| 选择 | 得到 | 代价 |
| --- | --- | --- |
| 外部入口用 `unknown` | 不合法的访问会在编译期失败 | 每个入口都要写收窄或校验 |
| 边界内部立刻收成具体类型 | `any` 不会流进组件和 state | 第三方类型要补声明 |
| `default` 用 `assertNever` | 新状态漏分支时编译失败 | 联合必须有可判别字段，见 [项目里的类型设计](/md/TypeScript/项目实践.md) |
| 用 `any` 赶进度 | 当场能编译 | 返回值把检查一起关掉 |

---

## 常见误区

### ❌ `unknown` 就是更安全的 `any`，两者都能随便点属性

### ✅ 更准确的说法

`unknown` 不能直接点属性，也不能赋给具体类型。`any` 两头都放行，而且会传染到返回值。

### 为什么？

把它们说成程度差别，追问「为什么 `const name: string = result` 能过」时，就解释不了 `any` 的赋值方向。

---

### ❌ `never` 表示空值，和 `null`、`void` 一样

### ✅ 更准确的说法

`null` 是一个真实的空值。`void` 是返回值被忽略，函数仍然返回。`never` 表示这个类型里没有任何值，适合抛错函数和已经写全的分支。

### 为什么？

接口字段「没有数据」应该是 `null` 或缺省，不是 `never`。把状态写成 `never`，正常数据无法赋进去。

---

### ❌ 穷尽检查写成 `default: return value as never` 就安全了

### ✅ 更准确的说法

断言会强行通过。漏掉的成员要报错，传进 `assertNever` 的值必须是收窄之后剩下的类型，不能先 `as never`。

### 为什么？

`as never` 是开发者告诉编译器「这里没有别的可能」，编译器就不再核对分支。把值标成 `any` 并不能达到同样效果：`any` 不能赋给 `never`，`assertNever` 仍然报错。

---

## 高频追问

### `any` 和 `unknown` 赋值有什么不同？

两者都能接收 `string`。`any` 可以再赋给 `string`，`unknown` 不可以。`any` 的返回值还会把后面的变量一起变成 `any`。

### 为什么 `catch` 的错误不直接标成 `Error`？

运行时抛出的可能是字符串、对象或任意值。标成 `Error` 是断言，不是证明。先用 `unknown`，再 `instanceof Error`。

### `assertNever` 为什么能发现新状态？

写全的 `switch` 里，`default` 的值被收成 `never`。漏掉的字面量成员不是 `never`，传进去就报错。

### `string | never` 和 `string & never` 分别是什么？

联合里的 `never` 会被消掉，结果还是 `string`。交叉里只要有一边是 `never`，整体就是 `never`。

### 类型擦除之后它们还在吗？

不在。这三个都只存在于编译期。`unknown` 不能代替接口返回的运行时校验。

---

## 延伸阅读

- [类型守卫与类型收窄](/md/TypeScript/类型守卫与类型收窄.md)
- [type 和 interface](/md/TypeScript/type%20和%20interface.md)
- [项目里的类型设计](/md/TypeScript/项目实践.md)
- [TypeScript 基础类型](/md/TypeScript/基础类型.md)
- [面试速记：JS & TS](/md/面试准备/技术/JavaScript%20&%20TypeScript%20基础.md)
