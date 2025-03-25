# Web Worker介绍

## 1. 什么是 Web Worker？

Web Worker 是一种在浏览器中运行 JavaScript 的"后台线程"。

浏览器默认只有一个线程，也就是主线程，它负责：

- 渲染页面
- 执行 JS 脚本
- 响应用户交互（点击、滚动等）

这就意味着，如果你在主线程里做一些计算量大的任务（比如处理 10 万条数据），就会出现：

- 页面卡顿
- 滚动不流畅
- 动画掉帧
- 浏览器无响应甚至崩溃

所以，**Web Worker 出现了**，它的作用是：

在主线程之外开一个线程来处理耗时任务。

## 2. Web Worker 的核心机制

Web Worker 是“消息传递模型”：

- 你把任务和数据通过 postMessage() 发给 Worker；
- Worker 处理完后，再用 postMessage() 把结果发回主线程；
- 双方通过 onmessage 接收对方消息。

它是异步的，不会阻塞 UI 渲染。

## 3.  基础用法示例

1️⃣ 创建 Worker 文件：myWorker.js

```js
// myWorker.js

onmessage = function (e) {
  console.log('主线程发来的数据：', e.data);
  
  // 模拟耗时任务，比如处理10万条数据
  const result = e.data.map(num => num * 2);

  postMessage(result); // 返回结果给主线程
};
```

2️⃣ 主线程代码（Vue / 原生都行）

```js
const worker = new Worker('myWorker.js'); // 加载 Worker

const largeData = Array.from({ length: 100000 }, (_, i) => i);

worker.postMessage(largeData); // 发送数据

worker.onmessage = (event) => {
  console.log('Worker 返回的结果：', event.data);
};
```

## 4.在 Vue 项目中使用 Web Worker（推荐方式）

使用模块化的方式导入 Worker（推荐 Vite / Vue3）

1️⃣ 创建 Worker 文件：myWorker.js

```js
// src/workers/worker.js
self.onmessage = function (e) {
  const result = e.data.map(x => x * 2);
  self.postMessage(result);
};
```

2️⃣ Vue 中使用（支持模块方式）

```js
const worker = new Worker(new URL('@/workers/worker.js', import.meta.url), { type: 'module' });

worker.postMessage([1, 2, 3, 4, 5]);

worker.onmessage = (e) => {
  console.log('处理后的数据：', e.data); // 输出 [2, 4, 6, 8, 10]
};
```

## 5. Web Worker 可以做什么？

| 用途 | 说明 |
| --- | --- |
| 大数据预处理 | 数据聚合、降采样、格式转换等 |
| 实时流数据处理 | WebSocket 接收后数据过滤 / 合并 |
| 图表数据准备 | 在后台计算图表所需格式 |
| 加密/解密 | 如 AES、RSA、哈希计算 |
| 模拟计算 | 物理模拟、复杂动画的坐标计算 |
| 压缩/解压 | 大文件传输前的处理 |

## 6. Web Worker 不可以做什么？

- 不能访问 DOM，不能操作页面元素
- 不能访问 window、document 等浏览器对象
- 不支持 alert、confirm 等弹窗
- 不能跨域加载文件（必须同源）

## 7. 多个 Worker / 多线程？

可以开多个 Worker 实例（比如处理不同数据片段），但注意：

- 每个 Worker 是独立线程，占用内存；
- 开太多会适得其反（浏览器线程调度压力大）；
- 一般建议不要超过 CPU 核心数。

## 8. 使用 Web Worker 的最佳时机

| 场景 | 是否适合 |
| --- | --- |
| 页面卡顿，数据量很大 | ✅ 很适合，用来处理数据 |
| 图表加载慢 | ✅ 把数据处理放进 Worker |
| UI 动画需要高帧率 | ✅ 防止掉帧，计算任务移出主线程 |
| 简单表单处理 | ❌ 不适合，没必要开线程 |
| DOM 操作频繁 | ❌ Worker 无法直接操作 DOM |

## 9. 工具和库推荐

- 🧵 [comlink](<https://github.com/GoogleChrome/comlink>)：让 Worker 像函数一样用，超方便！
- 📦 [workerize-loader](<https://github.com/developit/workerize-loader>)：Webpack 下更简单地管理 Worker。
- 🎯 Vite 直接支持 new URL(..., import.meta.url)，无须 loader。

## 10. 总结

Web Worker 是前端性能优化的利器，把耗时任务甩给它，你的页面就能“飞”起来！🚀
