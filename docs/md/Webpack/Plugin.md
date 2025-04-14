# Webpack 插件

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
