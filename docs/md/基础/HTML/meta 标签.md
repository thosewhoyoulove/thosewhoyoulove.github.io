# meta 标签

## 面试定位

`meta` 标签常用于考察 HTML 基础、移动端适配、SEO 和安全策略。回答重点是：它不展示内容，而是给浏览器、搜索引擎或社交平台提供页面元信息。

## 核心原理

`meta` 放在 `head` 中，用于描述页面元数据，比如字符集、视口、描述、关键词、兼容模式、CSP、社交分享信息等。

## 常见 meta

### charset

声明文档编码。

```html
<meta charset="UTF-8" />
```

通常应放在 `head` 靠前位置，避免乱码。

### viewport

移动端适配核心配置。

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

含义：

- `width=device-width`：布局视口宽度等于设备宽度。
- `initial-scale=1.0`：初始缩放为 1。

不建议随意设置 `user-scalable=no`，会影响无障碍体验。

### description

页面描述，影响搜索结果摘要和分享展示。

```html
<meta name="description" content="前端面试知识库" />
```

### robots

控制搜索引擎抓取。

```html
<meta name="robots" content="index,follow" />
```

### Open Graph

用于社交平台分享预览。

```html
<meta property="og:title" content="标题" />
<meta property="og:description" content="描述" />
<meta property="og:image" content="https://example.com/cover.png" />
```

### CSP

可以通过响应头或 meta 配置内容安全策略。

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'" />
```

实际项目更推荐服务端响应头配置 CSP。

## 面试回答

可以这样答：

> `meta` 标签用于提供页面元信息，不直接渲染到页面。常见的有 `charset` 声明字符编码，`viewport` 控制移动端布局视口，`description` 提供 SEO 摘要，`robots` 控制搜索引擎抓取，Open Graph 标签用于社交分享预览，`http-equiv` 还能配置一些类似响应头的策略，比如 CSP。移动端最常见的是 viewport：`width=device-width, initial-scale=1.0`，让布局视口适配设备宽度。

## 高频追问

### viewport 为什么重要？

没有 viewport 时，移动浏览器可能用默认宽布局视口渲染页面，再整体缩放，导致页面看起来很小。设置 viewport 后，响应式布局才能按设备宽度生效。

### meta 可以替代 HTTP 响应头吗？

只能替代部分场景，且能力有限。安全策略、缓存等更推荐用 HTTP 响应头配置。

### description 会直接影响排名吗？

它主要影响搜索结果摘要和点击率，不是简单决定排名的唯一因素。

## 相关链接

- [Web 语义化](/md/基础/HTML/Web语义化.md)
- [XSS 的理解](/md/安全/XSS的理解.md)
