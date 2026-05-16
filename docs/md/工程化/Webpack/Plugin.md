# Webpack 插件

## 面试定位

Webpack Plugin 题常用于区分“会配置”和“理解构建机制”。回答重点是：插件是什么、Tapable 钩子、Compiler/Compilation、同步异步钩子、能做哪些事。

## 核心原理

本质上，webpack 的插件是一个带有apply函数的对象。当 webpack 创建好 compiler 对象后，会执行注册插件的 apply 函数，同时将 compiler 对象作为参数传入。

在 apply 函数中，开发者可以通过 compiler 对象监听多个钩子函数的执行，不同的钩子函数对应 webpack 编译的不同阶段。当 webpack 进行到一定阶段后，会调用这些监听函数，同时将 compilation 对象传入。开发者可以使用 compilation 对象获取和改变 webpack 的各种信息，从而影响构建过程。

示例：

```js
class MyPlugin {
  apply(compiler) {
    // 注册同步钩子
    compiler.hooks.compile.tap('MyPlugin', (params) => {
      console.log('正在编译...');
    });

    // 注册异步钩子（回调方式）
    compiler.hooks.emit.tapAsync('MyPlugin', (compilation, callback) => {
      console.log('资源即将输出...');
      callback(); // 必须调用，否则构建卡住
    });

    // 注册异步钩子（Promise 方式）
    compiler.hooks.done.tapPromise('MyPlugin', (stats) => {
      return new Promise((resolve) => {
        console.log('构建完成 ✅');
        resolve();
      });
    });
  }
}
```

## Webpack 中常用的一些钩子（部分）

| 生命周期阶段 | 钩子名 | 类型 | 说明 |
| --- | --- | --- | --- |
| 初始化前 | beforeRun | AsyncSeriesHook | 构建前准备 |
| 开始编译 | compile | SyncHook | 开始创建 compilation |
| 编译过程 | thisCompilation / compilation | SyncHook | 初始化模块构建 |
| 构建模块 | buildModule / succeedModule | SyncHook | 模块编译中 |
| 输出前 | emit | AsyncSeriesHook | 生成文件并输出前 |
| 输出后 | afterEmit | AsyncSeriesHook | 输出完文件后 |
| 构建完成 | done | AsyncSeriesHook | 所有流程结束 |

钩子类型说明（由 Tapable 提供）（部分）

webpack 插件可以按照它所注册的事件分成不同的类型。每一个事件钩子都预先定义为同步、异步、瀑布或并行钩子，钩子在内部用 call/callAsync 方法调用。支持的钩子清单或可被绑定的钩子清单，通常在 this.hooks 属性指定。

| 类型 | 方法 | 说明 |
| --- | --- | --- |
| SyncHook | .tap(name, fn) | 同步串行执行 |
| SyncBailHook | .tap(name, fn) | 有返回值则中断 |
| AsyncSeriesHook | .tapAsync(name, fn) / .tapPromise(name, fn) | 异步串行执行 |
| AsyncParallelHook | .tapAsync(name, fn) / .tapPromise(name, fn) | 异步并行执行 |

## 自定义 Plugin：AutoOpenBrowserPlugin

### 1. 安装 open 库

```bash
npm install open
```

### 2. 自定义 Plugin

```js
// AutoOpenBrowserPlugin.js
const open = require('open'); // 需要安装 open 库

class AutoOpenBrowserPlugin {
  constructor(options = {}) {
    this.url = options.url || 'http://localhost:8080';
  }

  apply(compiler) {
    compiler.hooks.done.tapPromise('AutoOpenBrowserPlugin', async () => {
      console.log(`🚀 构建完成，打开浏览器：${this.url}`);
      await open(this.url);
    });
  }
}

module.exports = AutoOpenBrowserPlugin;
```

### 3. 使用 Plugin

```js
const AutoOpenBrowserPlugin = require('./AutoOpenBrowserPlugin');

module.exports = {
  // ...其他配置
  plugins: [
    new AutoOpenBrowserPlugin({
      url: 'http://localhost:3000' // 你开发服务器的地址
    })
  ]
}
```

## 4. 效果

执行 webpack 构建完后，它会自动打开浏览器访问你设定的 URL，适用于：

- Webpack 构建后的开发预览
- 自定义本地服务器地址（非 localhost:8080）

## 面试回答

可以这样答：

> Webpack Plugin 本质是一个带 `apply(compiler)` 方法的对象。Webpack 初始化 Compiler 后会调用每个插件的 apply，插件通过 `compiler.hooks` 或 `compilation.hooks` 注册回调，在构建不同阶段介入流程。Compiler 级钩子偏整个构建生命周期，比如 run、compile、done；Compilation 级钩子偏单次编译内部，比如模块构建、chunk 优化、资源生成。Webpack 的钩子由 Tapable 提供，有同步、异步串行、异步并行等类型。相比 Loader 只处理单个模块，Plugin 能修改构建流程、生成资源、压缩文件、注入 HTML、上传产物等。

## 高频追问

### tap、tapAsync、tapPromise 区别？

`tap` 用于同步钩子或同步回调；`tapAsync` 用回调通知异步完成；`tapPromise` 返回 Promise 通知异步完成。异步钩子如果不正确结束，构建会卡住。

### Plugin 能做 Loader 做不了的事吗？

能。比如生成 HTML、清理输出目录、分析 bundle、上传 CDN、修改 assets，这些都涉及构建全局生命周期，不适合 Loader。

### emit 阶段能做什么？

可以读取和修改即将输出的资源，例如压缩、增加文件、生成 manifest、上传前处理等。
