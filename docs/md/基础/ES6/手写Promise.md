# 手写Promise

## 思路分析

### Promise 基本特性

- Promise 是处理异步操作的一种方式
- 有三种状态:pending、fulfilled和rejected
- 状态一旦改变就不能再变
- then方法用于添加回调,支持链式调用
- 每个then应该返回一个新的Promise

### 构造函数设计

- 接收executor函数作为参数
- 需要初始化状态(state)、值(value)和原因(reason)
- 状态初始为pending
- resolve和reject函数会改变状态
- resolve可能传入Promise,需要等待它解决

### resolve和reject方法实现

- 改变Promise状态
- 处理回调队列
- 需要保存then添加的回调
- 状态改变时执行回调
- 已解决的Promise,then方法立即执行回调

### then方法实现

- 接收onFulfilled和onRejected两个回调参数
- 处理参数默认值
- 返回新Promise实现链式调用
- 处理回调执行结果
- 实现resolvePromise处理不同返回值情况

### 异步处理

- 回调需要异步执行
- 可用setTimeout模拟(简化版)
- 理想情况应使用微任务

### 错误处理

- 捕获executor执行错误
- 捕获then回调错误
- 错误传递给下一个Promise的reject

### 其他方法

- catch方法 (then的特殊形式)
- finally方法(可选)

### 实现要点

1. 定义MyPromise类
2. 初始化状态和回调队列
3. 实现状态转换
4. 异步执行回调
5. 处理链式调用
6. 实现值穿透
7. 错误传递机制

### 处理特殊情况

- 返回值是Promise实例
- thenable对象处理
- 循环引用问题
- 异常处理机制

```javascript
class MyPromise {
  constructor(executor) {
    this.state = 'pending';  // 初始状态
    this.value = null;       // 成功值
    this.reason = null;      // 失败原因
    this.onFulfilledCallbacks = []; // 成功回调队列
    this.onRejectedCallbacks = [];  // 失败回调队列

    const resolve = (value) => {
      if (this.state !== 'pending') return;
      
      // 处理值为 Promise 的情况
      if (value instanceof MyPromise) {
        value.then(resolve, reject);
        return;
      }

      // 异步执行
      setTimeout(() => {
        this.state = 'fulfilled';
        this.value = value;
        // 执行所有成功回调
        this.onFulfilledCallbacks.forEach(fn => fn());
      });
    };

    const reject = (reason) => {
      if (this.state !== 'pending') return;

      // 异步执行
      setTimeout(() => {
        this.state = 'rejected';
        this.reason = reason;
        // 执行所有失败回调
        this.onRejectedCallbacks.forEach(fn => fn());
      });
    };

    try {
      executor(resolve, reject);
    } catch (err) {
      reject(err);
    }
  }

  then(onFulfilled, onRejected) {
    // 值穿透处理
    onFulfilled = typeof onFulfilled === 'function' 
      ? onFulfilled 
      : value => value;
    
    onRejected = typeof onRejected === 'function'
      ? onRejected
      : reason => { throw reason; };

    const promise2 = new MyPromise((resolve, reject) => {
      const handleCallback = (callback, value) => {
        setTimeout(() => {
          try {
            const x = callback(value);
            resolvePromise(promise2, x, resolve, reject);
          } catch (err) {
            reject(err);
          }
        });
      };

      if (this.state === 'fulfilled') {
        handleCallback(onFulfilled, this.value);
      } else if (this.state === 'rejected') {
        handleCallback(onRejected, this.reason);
      } else {
        this.onFulfilledCallbacks.push(() => 
          handleCallback(onFulfilled, this.value));
        this.onRejectedCallbacks.push(() => 
          handleCallback(onRejected, this.reason));
      }
    });

    return promise2;
  }

  catch(onRejected) {
    return this.then(null, onRejected);
  }

  static resolve(value) {
    return new MyPromise(resolve => resolve(value));
  }

  static reject(reason) {
    return new MyPromise((_, reject) => reject(reason));
  }
}

// Promise 解决过程（简化版）
function resolvePromise(promise2, x, resolve, reject) {
  if (promise2 === x) {
    return reject(new TypeError('Chaining cycle detected'));
  }

  if (x instanceof MyPromise) {
    x.then(
      y => resolvePromise(promise2, y, resolve, reject),
      reject
    );
  } else {
    resolve(x);
  }
}


```
