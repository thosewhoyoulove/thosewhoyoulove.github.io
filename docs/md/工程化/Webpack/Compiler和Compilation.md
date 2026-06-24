# Compiler 和 Compilation 区别

## 面试定位

这是 Webpack 源码级高频题。它用来区分你是只会配置，还是理解 Webpack 内部对象模型。

## 面试回答

> `Compiler` 代表一次 Webpack 运行环境，包含配置、插件、文件系统、resolver 和全局生命周期钩子。`Compilation` 代表一次具体编译过程，里面保存模块、依赖、chunk、asset、错误和 warning。普通构建中通常一个 Compiler 对应一次 Compilation；watch 或 dev server 模式下，一个 Compiler 会因为文件变化产生多次 Compilation。简单说，Compiler 是构建器本身，Compilation 是某一次构建的上下文和产物集合。

一句话总结：

> Compiler 管全局运行环境，Compilation 管单次编译过程。

## 核心原理

```text
webpack(config)
  -> 创建 Compiler
  -> 注册 plugin
  -> run / watch
  -> 每次构建创建 Compilation
  -> 构建 ModuleGraph / ChunkGraph
  -> 生成 assets
  -> emit
```

| 对象 | 保存内容 | 常见钩子 | 粒度 |
| --- | --- | --- | --- |
| `Compiler` | 配置、插件、输入输出文件系统、全局状态 | `run`、`compile`、`thisCompilation`、`done` | 整个 Webpack 进程 |
| `Compilation` | module、dependency、chunk、asset、error、warning | `buildModule`、`seal`、`processAssets` | 一次编译 |

watch 模式可以这样理解：

```text
Compiler
  -> Compilation #1
  -> 文件变化
  -> Compilation #2
  -> 文件变化
  -> Compilation #3
```

## 高频追问

### Plugin 什么时候用 Compiler，什么时候用 Compilation？

如果处理构建全局生命周期，比如启动、结束、监听文件，用 `compiler`。如果处理本次编译里的模块、chunk、asset，用 `compilation`。

### 为什么 watch 模式下要区分二者？

因为 watch 模式的配置和插件环境不需要每次重建，但模块图和产物会随着文件变化重新生成。`Compiler` 复用，`Compilation` 更新。

### `thisCompilation` 和 `compilation` 钩子有什么区别？

二者都能拿到本次 `compilation`。实际开发中更推荐在较新的资源处理流程里使用 `thisCompilation` 后再挂 `compilation.hooks.processAssets` 等更细的钩子。

## 延伸阅读

- [Webpack 构建流程](/md/工程化/Webpack/构建流程.md)
- [Webpack Tapable 是什么](/md/工程化/Webpack/Tapable.md)
