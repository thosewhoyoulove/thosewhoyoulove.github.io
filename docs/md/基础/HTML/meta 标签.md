# meta 标签

## 什么是 meta 标签

\<meta> 标签用于提供页面的元信息，通常放在 \<head> 标签中，对 SEO、页面行为和显示效果有重要作用。

## 常见的 meta 标签

- viewport 标签（移动端适配）：

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

作用：控制页面在移动设备上的显示效果，指定视口的宽度和缩放比例。

常见配置：

- width=device-width：视口宽度等于设备宽度。
- initial-scale=1.0：初始缩放比例为 1。
- maximum-scale=1.0：禁止用户手动缩放。

- SEO 优化相关

```html
<meta name="description" content="这是一段描述信息" />
<meta name="keywords" content="HTML, CSS, JavaScript" />
<meta name="author" content="Your Name" />
```

作用：提供页面描述，帮助搜索引擎理解页面内容。

常见配置：

- description：提供页面的简要描述，搜索引擎会优先抓取。
- keywords：定义页面的关键词（已不被大多数搜索引擎重视）。
- author：声明页面的作者。

## 字符编码

```html
<meta charset="UTF-8" />
```

作用：声明页面的字符编码，UTF-8 支持大部分语言文字。

## 刷新或重定向页面

```html
<meta http-equiv="refresh" content="5; url=https://example.com" />
```

作用：实现页面自动刷新或重定向。

示例：5 秒后跳转到指定 URL。
