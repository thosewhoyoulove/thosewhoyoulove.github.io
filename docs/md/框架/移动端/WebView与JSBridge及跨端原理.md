# WebView、JSBridge 与跨端原理

## 面试回答

> 我会分成页面容器、双向通信和跨端渲染三个层面。
>
> 首先，**WebView 是 App 内承载网页的原生控件**。App 创建容器并加载 URL 或本地资源，网页仍然经过 HTML、CSS、JavaScript 的加载和渲染流程。宿主负责导航、权限和生命周期，所以同一份 H5 在 App 中还要处理登录态、返回键、安全区和前后台切换。
>
> 第二，**JSBridge 把网页请求转换成宿主能够执行的消息**。H5 发送方法名、参数和请求 ID，Native 校验来源与权限后调用相机、分享等能力，再把同一个 ID 和结果送回 JavaScript。JS 用待处理请求表找到对应回调或 Promise。Android 可以提供注入接口，iOS WebKit 可以接收脚本消息，具体通道由宿主实现。
>
> 第三，**React Native 与 WebView H5 的主要差异在渲染目标**。H5 输出 DOM，由网页引擎排版；React Native 的核心组件最终对应原生视图。它也运行 JavaScript，但新架构使用 JSI、Fabric、TurboModules 等机制，不能把历史 Bridge 的序列化通信模型当成所有版本的固定实现。
>
> **跨端不等于没有平台差异**。选择方案仍要结合交互性能、Web 复用、原生接入和升级成本。

**一句话总结：** WebView 承载网页 → Bridge 传消息并关联结果 → Native 执行能力；React Native 主要渲染原生视图。

## 核心原理

### H5 进入 App 时发生了什么

```text
用户进入 App 页面
  → Native 创建或复用 WebView
  → 配置导航策略、脚本与消息通道
  → 加载远程 URL 或本地 HTML
  → 网页引擎解析资源并布局、绘制
  → H5 与宿主协商 Bridge 版本及可用能力
  → 页面可交互，随后处理关闭与前后台切换
```

网页的内容通常不是被“编译成原生页面”。WebView 仍然是网页运行环境，不过它没有义务提供完整浏览器的地址栏、标签页和扩展。Android 的 WebView 与 iOS 的 WKWebView 也不等于桌面 Chrome：引擎版本、存储策略、媒体限制和生命周期都可能不同。

App 与 H5 的登录态不会因为运行在同一个手机就自动一致。原生请求使用的凭证、WebView Cookie 和页面存储之间需要明确的会话方案。桥接时应传递短期、限定用途的凭证或由宿主完成请求，避免把长期密钥交给页面。Android 的 [WebView 文档](https://developer.android.com/develop/ui/views/layout/webapps/webview) 说明了加载网页和 JavaScript 接口的基本模型。

### JS 为什么不能直接调用任意 Native 函数

JavaScript 运行在网页引擎提供的环境里，原生相机服务并不是一个天然存在的 JS 函数。宿主要先暴露受控入口，双方再约定消息格式和方法语义。JSBridge 是这层通信机制与协议的统称，并不是一种所有 App 共同实现的标准 API。

常见通道包括 Android 的注入接口、WebKit 脚本消息处理器，以及历史上的自定义 URL scheme 拦截。URL scheme 容易受导航语义、长度和编码限制影响，不适合搬运大数据。平台接口只是传输入口；超时、版本协商、请求对应和错误码仍要由业务协议补齐。iOS 接口参见 [WKScriptMessageHandler](https://developer.apple.com/documentation/webkit/wkscriptmessagehandler)。

请求和响应可以约定为：

```json
{
  "id": "req-17",
  "version": 1,
  "method": "chooseImage",
  "params": { "count": 1 }
}
```

```json
{
  "id": "req-17",
  "ok": true,
  "result": { "assetId": "asset-demo" }
}
```

不要把方法名直接当任意代码执行。Native 应按白名单分发，校验来源页面、参数和当前用户权限。即使页面 URL 在白名单里，XSS 仍可能借已暴露的接口调用能力，因此还要最小化能力范围。

### 请求 ID 为什么不可省略

用户先选择图片，紧接着打开分享面板，分享可能先结束。若只保存一个全局 callback，后返回的图片结果就可能交给错误的调用者。

以下是与平台无关的教学实现，`send` 由宿主适配器提供；消息通道的建立不包含在这段代码中。

```js
export function createBridge(send, timeoutMs = 5000) {
  let sequence = 0
  const pending = new Map()

  function call(method, params) {
    const id = `req-${++sequence}`
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(id)
        reject(new Error('Bridge timeout'))
      }, timeoutMs)
      pending.set(id, { resolve, reject, timer })
      try {
        send({ id, version: 1, method, params })
      } catch (error) {
        clearTimeout(timer)
        pending.delete(id)
        reject(error)
      }
    })
  }

  function receive(message) {
    const entry = pending.get(message.id)
    if (!entry) return
    pending.delete(message.id)
    clearTimeout(entry.timer)
    if (message.ok) entry.resolve(message.result)
    else entry.reject(new Error(message.error?.message || 'Native error'))
  }

  function dispose() {
    for (const entry of pending.values()) {
      clearTimeout(entry.timer)
      entry.reject(new Error('Bridge disposed'))
    }
    pending.clear()
  }

  return { call, receive, dispose }
}
```

| 步骤 | pending 中的 ID | 发生的事 |
| --- | --- | --- |
| 选择图片 | req-1 | 先登记 Promise，再发消息，避免同步返回时找不到请求 |
| 打开分享 | req-1、req-2 | 两个请求独立等待 |
| 分享返回 | req-1 | 按 req-2 兑现 Promise，并删除记录 |
| 图片超时 | 空 | 拒绝 req-1，清除等待记录 |
| 图片迟到 | 空 | 查不到请求，忽略该消息 |

超时只代表 JS 不再等待，不保证 Native 已取消操作。需要取消时应设计单独的取消协议，并区分“已请求取消”和“已取消”。生产协议还要校验消息结构、限制大小，并处理重载后的会话隔离，防止旧页面结果误投给新页面。

### React Native 为什么不是另一种 WebView

| 方案 | 主要渲染目标 | 复用方式 | 主要代价 |
| --- | --- | --- | --- |
| WebView H5 | DOM / CSS | 网页代码与 Web 生态 | 页面加载、WebView 差异、桥接协议 |
| React Native | 原生宿主视图 | React 思想与部分 JS 逻辑 | 平台模块、原生依赖、布局与版本适配 |
| Flutter | 自有渲染体系绘制界面，亦可嵌原生视图 | Dart 与 Widget 体系 | Web 代码复用有限、平台接入与包体积 |

React Native 历史架构常通过异步批量 Bridge 在 JS 与 Native 间交换序列化消息。新架构中的 JSI 为 JS 与 C++ 互操作提供基础；Fabric 负责渲染体系；TurboModules 组织原生模块；Codegen 从类型规格生成接口代码。它们分别解决互操作、渲染和接口契约问题，不意味着所有调用都必须同步，也不意味着可以忽略线程安全。这里按官方 [新架构说明](https://reactnative.dev/architecture/landing-page) 区分架构，不固定某个项目的启用版本。

Web 页面复用率高、内容迭代快时，WebView 往往更容易接入；需要较深原生交互时再评估 React Native 等方案。动画卡顿要分清 JS 计算、布局、图像处理和跨边界数据传输，不能仅凭“原生”二字判断性能。

## 常见误区

### ❌ H5 放进 App 就自动拥有原生权限

✅ 宿主提供接口、系统授权、业务鉴权缺一不可。为什么：网页环境和原生服务之间有明确能力边界。

### ❌ Native 回调只是调用一个固定全局函数

✅ 全局入口可以接收消息，但仍需请求 ID、待处理表和生命周期清理。为什么：并发调用会乱序完成。

### ❌ React Native 永远通过 JSON Bridge 操作原生视图

✅ 这是历史架构的概括，新架构需要结合 JSI、Fabric 等机制解释。为什么：通信和渲染架构已经演进。

## 高频追问

### Bridge 何时可用？

由宿主和页面约定 ready 握手或能力探测，不能只假定 DOMContentLoaded 就代表原生通道完成初始化。

### 大图能直接通过 Bridge 传 Base64 吗？

可以设计这种传输，但体积膨胀和内存复制成本高。通常传资源句柄、受控路径或上传后的 ID，并明确访问权限和有效期。

### 页面关闭时如何处理未结束请求？

移除监听并拒绝等待 Promise；Native 能取消则通知取消。页面关闭后到达的结果不能继续更新旧页面状态。

### App 升级慢，H5 升级快，怎样兼容？

握手返回协议版本和能力清单，按能力调用并提供降级；新增能力不能只依赖 H5 已发版。

## 延伸阅读

- [浏览器渲染原理](/md/浏览器/浏览器的渲染原理.md)
- [React 渲染原理](/md/框架/React/React%20渲染原理.md)
- [XSS 的理解](/md/安全/XSS的理解.md)
