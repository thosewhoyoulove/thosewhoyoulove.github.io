# Promise 的理解与应用

## 面试回答

> Promise 是 JavaScript 处理异步结果的对象，它有 `pending`、`fulfilled`、`rejected` 三种状态，状态只能从 `pending` 变成成功或失败，并且一旦确定就不可逆。Promise 解决了回调嵌套和异步流程组合的问题。`then` 会返回一个新的 Promise，所以支持链式调用；如果回调返回普通值，下一个 `then` 接收这个值，如果返回 Promise，下一个 `then` 会等待它完成，如果抛错则进入后续 `catch`。Promise 确定结果后，相应处理器通过微任务执行；不能只看源码里 then 和 setTimeout 的先后，还要看 Promise 什么时候得到结果。实际开发里，并发请求用 `Promise.all`，超时竞争用 `Promise.race`，需要收集全部结果用 `allSettled`。

**一句话总结：**

> executor 同步启动 → then 注册后续处理 → 每一段返回值决定新 Promise 的结果 → 已确定结果的处理器以微任务执行。

---

## 核心原理

异步接口最难维护的部分，往往不是等待本身，而是上一步的结果交给谁、失败后在哪处理。Promise 把结果和后续处理分开：先拿到一个代表结果的对象，再用 then 组合下一步。

Promise 是一个表示异步操作最终结果的对象。它解决的是回调嵌套、错误处理分散、异步流程难组合的问题。

Promise 有三种状态：

- `pending`：初始状态，等待结果。
- `fulfilled`：操作成功。
- `rejected`：操作失败。

状态一旦从 `pending` 变成 `fulfilled` 或 `rejected`，就不能再改变。

```javascript
const p = new Promise((resolve, reject) => {
    resolve("success");
    reject("error"); // 无效
});

p.then(console.log); // "success"
```

构造函数里的 executor 会立即同步执行。then 先登记处理器：Promise 尚未确定结果时等待，已有结果时才安排相应处理器以微任务执行。

```javascript
console.log("start");

new Promise((resolve) => {
    console.log("executor");
    resolve();
}).then(() => {
    console.log("then");
});

console.log("end");

// start
// executor
// end
// then
```

### then 的链式调用

`then` 会返回一个新的 Promise，所以可以链式调用。

```javascript
Promise.resolve(1)
    .then((value) => value + 1)
    .then((value) => {
        console.log(value); // 2
    });
```

链式调用的关键规则：

- 如果 `then` 回调返回普通值，下一个 `then` 接收这个值。
- 如果返回 Promise，下一个 `then` 会等待这个 Promise 完成。
- 如果回调抛出异常，下一个 `catch` 会捕获。
- 如果没有传回调，会发生值穿透或错误穿透。

```javascript
Promise.resolve(1)
    .then()
    .then((value) => {
        console.log(value); // 1
    });

Promise.reject("error")
    .then()
    .catch((reason) => {
        console.log(reason); // "error"
    });
```

### 错误处理

Promise 的错误会沿着链向后传递，直到被 `catch` 捕获。

```javascript
Promise.resolve()
    .then(() => {
        throw new Error("fail");
    })
    .then(() => {
        console.log("不会执行");
    })
    .catch((err) => {
        console.log(err.message); // "fail"
    });
```

`catch` 本质上是 `then(null, onRejected)`。

```javascript
promise.catch(onRejected);
promise.then(null, onRejected);
```

`finally` 不接收前面的成功值或失败原因，它适合做清理逻辑。`finally` 默认不改变链路结果，除非它抛错或返回 rejected Promise。

```javascript
Promise.resolve("ok")
    .finally(() => {
        console.log("cleanup");
    })
    .then((value) => {
        console.log(value); // "ok"
    });
```

### 常用静态方法

#### Promise.resolve

普通值会得到 fulfilled Promise；传入 Promise 或 thenable 时会采用其最终结果，所以返回值未必已经 fulfilled。对于同一构造器的原生 Promise，Promise.resolve 可以直接返回原对象。

```javascript
Promise.resolve(1).then(console.log);
```

#### Promise.reject

返回 rejected Promise。

```javascript
Promise.reject(new Error("fail")).catch(console.error);
```

#### Promise.all

收集多个输入的结果：全部成功才成功，结果数组按输入顺序排列；任意输入拒绝，聚合结果就拒绝。示例里的请求由 getUser() 等函数调用启动，all 本身不负责启动或取消任务。

```javascript
Promise.all([getUser(), getRoles(), getConfig()])
    .then(([user, roles, config]) => {
        // 三个都成功
    })
    .catch((err) => {
        // 任意一个失败
    });
```

适合多个互不依赖的请求并发加载。

#### Promise.race

谁最先完成就采用谁的结果，无论成功还是失败。

```javascript
Promise.race([request(), timeout(3000)]);
```

可用来选择请求与超时信号中先到的结果，但请求落败后仍可能继续执行。需要真正中止 fetch 时，应配合 AbortController。

#### Promise.allSettled

等待所有 Promise 都结束，不管成功失败，返回每一项的状态。

```javascript
Promise.allSettled([p1, p2]).then((results) => {
    results.forEach((item) => {
        console.log(item.status);
    });
});
```

适合批量任务统计结果，不希望一个失败影响整体收集。

#### Promise.any

只要有一个成功就成功；如果全部失败，才返回 `AggregateError`。

```javascript
Promise.any([cdn1(), cdn2(), cdn3()]).then((result) => {
    // 第一个成功结果
});
```

适合多个备选资源，只关心最快成功的一个。

### Promise 和 async/await

`async/await` 是 Promise 的语法糖。`async` 函数一定返回 Promise，`await` 后面可以接 Promise 或普通值。

```javascript
async function getUserInfo() {
    const user = await getUser();
    const roles = await getRoles(user.id);
    return { user, roles };
}
```

上面代码等价于 Promise 链式调用，但更接近同步写法。

需要注意：多个互不依赖的异步任务不要无意义串行。

```javascript
// 串行，耗时相加
const user = await getUser();
const config = await getConfig();

// 并发启动，成功时等待最慢的一项；实际耗时还受资源调度影响
const [userResult, configResult] = await Promise.all([getUser(), getConfig()]);
```

### 微任务与执行顺序

Promise 处理器以微任务执行。在下面这个普通脚本例子中，同步部分结束后先处理已排入的 Promise 回调，再运行定时器。浏览器还会在合适的时机渲染；详细检查点和渲染关系见 [浏览器的事件循环](/md/浏览器/浏览器的事件循环.md)。

```javascript
console.log(1);

setTimeout(() => console.log(2), 0);

Promise.resolve().then(() => console.log(3));

console.log(4);

// 1 4 3 2
```

面试时可以说：Promise 回调不是立刻同步执行，而是在当前同步代码执行完后，以微任务形式执行，在这个例子中先于定时器执行；这来自微任务检查点的规则，不是所有异步 API 共用的一张优先级表。

## 常见误区

- **Promise 会自动把同步计算挪到后台**：executor 仍同步运行，昂贵循环照样占住线程。
- **调用 resolve 就一定立刻 fulfilled**：传入另一个 Promise 或 thenable 时会采用它的结果，可能仍处于 pending。
- **all 或 race 结束会取消其余请求**：组合方法只决定聚合结果；取消底层操作需由相应 API（例如 AbortController）实现。

## 高频追问

### Promise 构造函数是同步还是异步？

`executor` 是同步执行的，`then` 回调是异步微任务。

### `then` 为什么要返回新的 Promise？

为了支持链式调用和异步结果扁平化。每个 `then` 的返回值会决定下一个 Promise 的状态和值。

### `Promise.all` 和 `Promise.allSettled` 的区别？

`all` 只要一个失败就整体失败，适合强依赖任务。`allSettled` 会等所有任务结束，适合批量任务结果统计。

### async/await 会阻塞线程吗？

不会阻塞整个线程。`await` 会暂停当前 async 函数后续代码的执行，把后续逻辑放到 Promise 微任务里，线程仍然可以继续执行其他任务。

## 延伸阅读

- [手写 Promise](/md/基础/ES6/手写Promise.md)
- [浏览器的事件循环](/md/浏览器/浏览器的事件循环.md)
- [闭包的理解](/md/基础/JavaScript/闭包的理解.md)

核查参考：[Promise.then 的处理器登记与返回值](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/then)。
