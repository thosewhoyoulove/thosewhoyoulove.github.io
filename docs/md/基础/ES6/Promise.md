# Promise 的理解与应用

## 面试定位

Promise 是前端异步编程的核心题。面试通常会从“Promise 是什么”继续追问到状态流转、链式调用、错误冒泡、微任务、`Promise.all`、`async/await` 和手写实现。

## 核心原理

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

构造函数里的 `executor` 会立即同步执行，但 `then` 注册的回调会进入微任务队列。

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

## then 的链式调用

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

## 错误处理

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

## 常用静态方法

### Promise.resolve

把一个值包装成 fulfilled Promise。如果传入的本身是 Promise，会直接采用它的状态。

```javascript
Promise.resolve(1).then(console.log);
```

### Promise.reject

返回 rejected Promise。

```javascript
Promise.reject(new Error("fail")).catch(console.error);
```

### Promise.all

并发执行多个 Promise，全部成功才成功，只要有一个失败就立即失败。

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

### Promise.race

谁最先完成就采用谁的结果，无论成功还是失败。

```javascript
Promise.race([request(), timeout(3000)]);
```

常用于请求超时控制。

### Promise.allSettled

等待所有 Promise 都结束，不管成功失败，返回每一项的状态。

```javascript
Promise.allSettled([p1, p2]).then((results) => {
    results.forEach((item) => {
        console.log(item.status);
    });
});
```

适合批量任务统计结果，不希望一个失败影响整体收集。

### Promise.any

只要有一个成功就成功；如果全部失败，才返回 `AggregateError`。

```javascript
Promise.any([cdn1(), cdn2(), cdn3()]).then((result) => {
    // 第一个成功结果
});
```

适合多个备选资源，只关心最快成功的一个。

## Promise 和 async/await

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

// 并行，耗时取最大值
const [user, config] = await Promise.all([getUser(), getConfig()]);
```

## 微任务与执行顺序

Promise 的 `then`、`catch`、`finally` 回调属于微任务。同步代码先执行，当前宏任务结束后，事件循环会清空微任务队列，再进入下一个宏任务。

```javascript
console.log(1);

setTimeout(() => console.log(2), 0);

Promise.resolve().then(() => console.log(3));

console.log(4);

// 1 4 3 2
```

面试时可以说：Promise 回调不是立刻同步执行，而是在当前同步代码执行完后，以微任务形式执行，优先级高于 `setTimeout` 这类宏任务。

## 面试回答

可以这样答：

> Promise 是 JavaScript 处理异步结果的对象，它有 `pending`、`fulfilled`、`rejected` 三种状态，状态只能从 `pending` 变成成功或失败，并且一旦确定就不可逆。Promise 解决了回调嵌套和异步流程组合的问题。`then` 会返回一个新的 Promise，所以支持链式调用；如果回调返回普通值，下一个 `then` 接收这个值，如果返回 Promise，下一个 `then` 会等待它完成，如果抛错则进入后续 `catch`。Promise 的回调会进入微任务队列，所以执行顺序上同步代码先执行，Promise 回调再执行，最后才是 `setTimeout` 这类宏任务。实际开发里，并发请求用 `Promise.all`，超时竞争用 `Promise.race`，需要收集全部结果用 `allSettled`。

## 高频追问

### Promise 构造函数是同步还是异步？

`executor` 是同步执行的，`then` 回调是异步微任务。

### `then` 为什么要返回新的 Promise？

为了支持链式调用和异步结果扁平化。每个 `then` 的返回值会决定下一个 Promise 的状态和值。

### `Promise.all` 和 `Promise.allSettled` 的区别？

`all` 只要一个失败就整体失败，适合强依赖任务。`allSettled` 会等所有任务结束，适合批量任务结果统计。

### async/await 会阻塞线程吗？

不会阻塞整个线程。`await` 会暂停当前 async 函数后续代码的执行，把后续逻辑放到 Promise 微任务里，线程仍然可以继续执行其他任务。

## 相关链接

- [手写 Promise](/md/基础/ES6/手写Promise.md)
- [浏览器的事件循环](/md/浏览器/浏览器的事件循环.md)
- [闭包的理解](/md/基础/JavaScript/闭包的理解.md)
