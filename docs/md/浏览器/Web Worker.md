# Web Worker

## 面试定位

Web Worker 常用于性能优化和项目深挖。面试官通常会问：它解决什么问题、为什么不能操作 DOM、主线程和 Worker 怎么通信、适合哪些场景、有什么代价。

## 核心原理

浏览器主线程负责执行 JavaScript、响应用户交互和渲染页面。如果把大量计算放在主线程，就会导致点击无响应、滚动卡顿、动画掉帧。

Web Worker 可以在主线程之外运行 JavaScript，把耗时计算移出主线程。

它的通信模型是消息传递：

- 主线程通过 `postMessage` 把数据发给 Worker。
- Worker 通过 `onmessage` 接收消息。
- Worker 处理完成后再用 `postMessage` 把结果发回主线程。

Worker 和主线程不共享普通对象内存，传递数据时通常会发生结构化克隆。对于大二进制数据，可以用 Transferable 转移所有权，减少拷贝成本。

## 基本使用

Worker 文件：

```javascript
// worker.js
self.onmessage = function (event) {
    const list = event.data;
    const result = list.map((item) => item * 2);

    self.postMessage(result);
};
```

主线程：

```javascript
const worker = new Worker("/worker.js");

worker.postMessage([1, 2, 3]);

worker.onmessage = function (event) {
    console.log(event.data); // [2, 4, 6]
};

worker.onerror = function (error) {
    console.error(error);
};
```

不用时要终止 Worker，避免资源浪费。

```javascript
worker.terminate();
```

## 在 Vite 中使用

```javascript
const worker = new Worker(new URL("./worker.js", import.meta.url), {
    type: "module",
});
```

这种方式更适合工程化项目，构建工具能正确处理路径和打包。

## 适合场景

适合放进 Worker 的任务：

- 大量数据过滤、排序、聚合。
- 图表数据预处理和降采样。
- 文件解析、压缩、解压。
- 加密、哈希计算。
- WebSocket 大量消息预处理。
- 复杂计算，例如路径规划、图像处理。

不适合的任务：

- 简单表单校验。
- 频繁 DOM 操作。
- 很小的计算任务。
- 依赖大量主线程上下文的逻辑。

Worker 有创建成本、通信成本和内存成本，不是所有任务都适合丢进去。

## 限制

Worker 不能直接访问：

- `window`
- `document`
- DOM 节点
- 部分浏览器 API

原因是 DOM 主要由主线程管理。如果 Worker 可以直接操作 DOM，就会带来复杂的线程同步和竞态问题。

Worker 可以使用：

- `fetch`
- `setTimeout`
- `setInterval`
- `WebSocket`
- `IndexedDB`

具体能力和浏览器支持有关。

## Transferable

传大数据时，普通 `postMessage` 可能复制数据，成本较高。`ArrayBuffer` 可以作为 Transferable 转移所有权。

```javascript
const buffer = new ArrayBuffer(1024);
worker.postMessage(buffer, [buffer]);
```

转移后，主线程里的 `buffer` 会不可用，所有权交给 Worker。这适合大文件、二进制数据处理。

## 面试回答

可以这样答：

> Web Worker 用来把耗时 JavaScript 计算放到主线程之外执行，避免阻塞页面渲染和用户交互。它和主线程通过 `postMessage` / `onmessage` 通信，数据通常通过结构化克隆传递，大二进制数据可以用 Transferable 转移所有权来减少拷贝。Worker 不能直接操作 DOM，因为 DOM 由主线程管理，跨线程直接修改会带来同步和竞态问题。实际项目里我会把大数据处理、图表数据预处理、文件解析、加密计算这类 CPU 密集任务放到 Worker，但不会把很小的任务放进去，因为 Worker 有创建、通信和内存成本。

## 高频追问

### Worker 能提升所有性能问题吗？

不能。它主要解决主线程 CPU 计算过重的问题。如果瓶颈是网络慢、接口慢、DOM 太复杂，Worker 不一定有效。

### Worker 和主线程共享变量吗？

普通对象不共享，通信靠消息传递。`SharedArrayBuffer` 可以共享内存，但有安全限制和更复杂的同步问题，普通业务较少使用。

### Worker 为什么不能操作 DOM？

为了避免多线程同时修改 DOM 导致竞态和同步成本。DOM 操作集中在主线程，Worker 只负责计算，再把结果发回主线程更新 UI。

## 相关链接

- [加快首屏加载速度](/md/浏览器/加快首屏加载速度.md)
- [浏览器的事件循环](/md/浏览器/浏览器的事件循环.md)
- [智慧大屏数据可视化](/md/面试准备/项目与架构/智慧大屏数据可视化.md)
