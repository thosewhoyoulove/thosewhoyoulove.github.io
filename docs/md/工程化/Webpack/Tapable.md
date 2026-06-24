# Webpack Tapable 是什么

## 面试定位

Tapable 是 Webpack Plugin 机制的基础。面试官问它，通常是想确认你是否理解 plugin 为什么能介入构建流程，而不是只会写配置。

## 面试回答

> Tapable 是 Webpack 使用的钩子库，作用是把构建流程拆成一系列可订阅的生命周期。Webpack 的 `compiler.hooks` 和 `compilation.hooks` 里有很多钩子，插件通过 `tap`、`tapAsync`、`tapPromise` 注册回调，在对应阶段执行逻辑。比如在 `emit` 或 `processAssets` 阶段生成文件、压缩资源、统计产物。Tapable 的价值是让 Webpack 核心流程保持稳定，同时把扩展能力交给插件生态。

一句话总结：

> Tapable 是 Webpack 的生命周期事件系统，Plugin 通过它注册钩子来扩展构建流程。

## 核心原理

```js
class AssetListPlugin {
  apply(compiler) {
    compiler.hooks.thisCompilation.tap("AssetListPlugin", (compilation) => {
      compilation.hooks.processAssets.tap("AssetListPlugin", () => {
        const names = Object.keys(compilation.assets).join("\n");
        compilation.emitAsset(
          "assets-list.txt",
          new compiler.webpack.sources.RawSource(names)
        );
      });
    });
  }
}
```

常见钩子类型：

| 钩子 | 特点 | 场景 |
| --- | --- | --- |
| `SyncHook` | 同步串行执行 | 普通生命周期通知 |
| `SyncBailHook` | 有返回值则中断后续执行 | 条件拦截 |
| `AsyncSeriesHook` | 异步串行执行 | emit、done 等阶段 |
| `AsyncParallelHook` | 异步并行执行 | 多个异步任务互不依赖 |

注册方式：

| 方法 | 适用 |
| --- | --- |
| `tap` | 同步回调 |
| `tapAsync` | callback 风格异步回调 |
| `tapPromise` | Promise 风格异步回调 |

## 高频追问

### Tapable 和 Node EventEmitter 有什么区别？

EventEmitter 更像普通事件发布订阅。Tapable 面向编译流程，提供同步、异步、串行、并行、熔断、瀑布等更细的钩子语义，更适合构建管线。

### 插件为什么要写 `apply(compiler)`？

Webpack 初始化插件时会调用插件实例的 `apply` 方法，并把 `compiler` 传进去。插件通过 `compiler` 注册全局钩子，再进入具体 `compilation` 阶段处理模块、chunk、asset。

### 异步钩子不结束会怎样？

构建会卡住。使用 `tapAsync` 时必须调用 callback，使用 `tapPromise` 时必须 resolve 或 reject。

## 延伸阅读

- [Webpack 插件](/md/工程化/Webpack/Plugin.md)
- [Compiler 和 Compilation 区别](/md/工程化/Webpack/Compiler和Compilation.md)
