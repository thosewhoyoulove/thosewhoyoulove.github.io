# 手写 Promise

## 面试定位

手写 Promise 主要考察三个能力：是否理解状态流转、是否理解 `then` 的链式调用、是否理解返回值解析。面试时不一定要完整背规范，但必须讲清核心实现思路。

## 核心原理

一个最小可用的 Promise 需要实现这些能力：

1. 管理三种状态：`pending`、`fulfilled`、`rejected`。
2. 状态只能改变一次。
3. `then` 可以注册成功和失败回调。
4. 异步完成时，需要保存回调队列，状态改变后再执行。
5. `then` 必须返回新的 Promise，支持链式调用。
6. `then` 回调的返回值决定新 Promise 的状态。
7. 异常要被捕获，并传递给下一个失败回调。

## 基础版本

先实现状态和回调队列：

```javascript
const PENDING = "pending";
const FULFILLED = "fulfilled";
const REJECTED = "rejected";

class MyPromise {
    constructor(executor) {
        this.state = PENDING;
        this.value = undefined;
        this.reason = undefined;
        this.onFulfilledCallbacks = [];
        this.onRejectedCallbacks = [];

        const resolve = (value) => {
            if (this.state !== PENDING) return;

            queueMicrotask(() => {
                if (this.state !== PENDING) return;
                this.state = FULFILLED;
                this.value = value;
                this.onFulfilledCallbacks.forEach((fn) => fn());
            });
        };

        const reject = (reason) => {
            if (this.state !== PENDING) return;

            queueMicrotask(() => {
                if (this.state !== PENDING) return;
                this.state = REJECTED;
                this.reason = reason;
                this.onRejectedCallbacks.forEach((fn) => fn());
            });
        };

        try {
            executor(resolve, reject);
        } catch (err) {
            reject(err);
        }
    }

    then(onFulfilled, onRejected) {
        onFulfilled = typeof onFulfilled === "function" ? onFulfilled : (value) => value;
        onRejected =
            typeof onRejected === "function"
                ? onRejected
                : (reason) => {
                      throw reason;
                  };

        const promise2 = new MyPromise((resolve, reject) => {
            const fulfilledTask = () => {
                queueMicrotask(() => {
                    try {
                        const x = onFulfilled(this.value);
                        resolvePromise(promise2, x, resolve, reject);
                    } catch (err) {
                        reject(err);
                    }
                });
            };

            const rejectedTask = () => {
                queueMicrotask(() => {
                    try {
                        const x = onRejected(this.reason);
                        resolvePromise(promise2, x, resolve, reject);
                    } catch (err) {
                        reject(err);
                    }
                });
            };

            if (this.state === FULFILLED) {
                fulfilledTask();
            } else if (this.state === REJECTED) {
                rejectedTask();
            } else {
                this.onFulfilledCallbacks.push(fulfilledTask);
                this.onRejectedCallbacks.push(rejectedTask);
            }
        });

        return promise2;
    }

    catch(onRejected) {
        return this.then(null, onRejected);
    }

    finally(callback) {
        return this.then(
            (value) => MyPromise.resolve(callback()).then(() => value),
            (reason) =>
                MyPromise.resolve(callback()).then(() => {
                    throw reason;
                })
        );
    }

    static resolve(value) {
        if (value instanceof MyPromise) return value;
        return new MyPromise((resolve) => resolve(value));
    }

    static reject(reason) {
        return new MyPromise((_, reject) => reject(reason));
    }
}
```

## Promise 解析过程

`resolvePromise` 是手写 Promise 的核心。它负责处理 `then` 回调返回的结果。

规则：

- 如果返回的是当前新 Promise 自己，要拒绝，避免循环引用。
- 如果返回的是 Promise，要等待它完成。
- 如果返回的是 thenable 对象，要采用它的结果。
- 如果返回普通值，直接成功。
- 如果过程中抛错，直接失败。

```javascript
function resolvePromise(promise2, x, resolve, reject) {
    if (promise2 === x) {
        return reject(new TypeError("Chaining cycle detected"));
    }

    if (x !== null && (typeof x === "object" || typeof x === "function")) {
        let called = false;

        try {
            const then = x.then;

            if (typeof then === "function") {
                then.call(
                    x,
                    (y) => {
                        if (called) return;
                        called = true;
                        resolvePromise(promise2, y, resolve, reject);
                    },
                    (r) => {
                        if (called) return;
                        called = true;
                        reject(r);
                    }
                );
            } else {
                resolve(x);
            }
        } catch (err) {
            if (called) return;
            called = true;
            reject(err);
        }
    } else {
        resolve(x);
    }
}
```

`called` 的作用是防止 thenable 同时调用成功和失败回调，保证状态只改变一次。

## 实现 Promise.all

`Promise.all` 的特点是：全部成功才成功，一个失败就失败，并且结果顺序和输入顺序一致。

```javascript
MyPromise.all = function (promises) {
    return new MyPromise((resolve, reject) => {
        const results = [];
        let count = 0;

        if (promises.length === 0) {
            resolve([]);
            return;
        }

        promises.forEach((promise, index) => {
            MyPromise.resolve(promise).then(
                (value) => {
                    results[index] = value;
                    count++;

                    if (count === promises.length) {
                        resolve(results);
                    }
                },
                reject
            );
        });
    });
};
```

## 实现 Promise.race

谁最先改变状态，结果就跟随谁。

```javascript
MyPromise.race = function (promises) {
    return new MyPromise((resolve, reject) => {
        promises.forEach((promise) => {
            MyPromise.resolve(promise).then(resolve, reject);
        });
    });
};
```

## 实现 Promise.allSettled

等待所有任务结束，每一项都返回状态。

```javascript
MyPromise.allSettled = function (promises) {
    return new MyPromise((resolve) => {
        const results = [];
        let count = 0;

        if (promises.length === 0) {
            resolve([]);
            return;
        }

        promises.forEach((promise, index) => {
            MyPromise.resolve(promise).then(
                (value) => {
                    results[index] = { status: "fulfilled", value };
                    count++;
                    if (count === promises.length) resolve(results);
                },
                (reason) => {
                    results[index] = { status: "rejected", reason };
                    count++;
                    if (count === promises.length) resolve(results);
                }
            );
        });
    });
};
```

## 实现 Promise.any

只要有一个成功就成功，全部失败才失败。

```javascript
MyPromise.any = function (promises) {
    return new MyPromise((resolve, reject) => {
        const errors = [];
        let count = 0;

        if (promises.length === 0) {
            reject(new AggregateError([], "All promises were rejected"));
            return;
        }

        promises.forEach((promise, index) => {
            MyPromise.resolve(promise).then(
                resolve,
                (reason) => {
                    errors[index] = reason;
                    count++;

                    if (count === promises.length) {
                        reject(new AggregateError(errors, "All promises were rejected"));
                    }
                }
            );
        });
    });
};
```

## 面试回答

可以这样答：

> 手写 Promise 的核心是状态机和链式调用。Promise 初始是 `pending`，只能变成 `fulfilled` 或 `rejected`，并且只能变一次。`then` 注册成功和失败回调，如果当前还是 `pending`，就把回调放进队列，等状态改变后执行；如果状态已经确定，就异步执行对应回调。`then` 必须返回一个新的 Promise，这样才能链式调用。新 Promise 的状态由上一个 `then` 回调的返回值决定：返回普通值就成功，返回 Promise 就等待它，抛异常就失败。实现时还要处理 thenable、循环引用和值穿透。`Promise.all` 的实现重点是并发收集结果、保持顺序、任意失败就 reject。

## 高频追问

### 为什么 `then` 要异步执行？

规范要求 Promise 回调在当前同步代码执行完之后执行，实际环境中属于微任务。这样能保证执行顺序一致，也避免同步调用导致状态和回调时机混乱。

### 为什么 `then` 返回的是新的 Promise？

因为链式调用中每一步都可能返回普通值、Promise 或抛出异常。返回新的 Promise 可以承接当前回调的执行结果，并把结果传给下一步。

### 什么是 thenable？

只要一个对象或函数有 `then` 方法，就可以被当作 thenable。Promise 解析过程会调用它的 `then`，并采用它最终的状态。

### `Promise.all` 为什么结果要按输入顺序返回？

因为并发任务完成顺序不稳定，但调用方通常需要结果和输入一一对应。所以实现时要用输入的 `index` 存储结果，而不是按完成顺序 `push`。

### 手写时用 `setTimeout` 可以吗？

面试中可以用 `setTimeout` 简化模拟异步，但要主动说明真实 Promise 回调是微任务，`setTimeout` 是宏任务，执行顺序不完全一致。现代环境可以用 `queueMicrotask` 更贴近真实行为。

## 相关链接

- [Promise 的理解与应用](/md/基础/ES6/Promise.md)
- [浏览器的事件循环](/md/浏览器/浏览器的事件循环.md)
- [函数的 call、apply 和 bind 方法](/md/基础/JavaScript/函数的call,apply和bind方法.md)
