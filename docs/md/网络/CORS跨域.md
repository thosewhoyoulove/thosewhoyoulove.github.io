# 同源策略与 CORS

## 面试定位

跨域是前端高频必问题。要区分：**跨域请求能不能发出、响应能不能被 JS 读取、Cookie 会不会携带**是三个不同问题；代理和 CORS 也不是同一种解决方案。

## 面试回答

> 同源要求协议、主机和端口一致，它是浏览器限制页面脚本读取跨源资源的安全边界，并不代表跨域 HTTP 请求一定发不出去。CORS 是服务端通过响应头声明哪些 Origin 可以读取响应。满足简单请求条件时浏览器直接发送真实请求，再检查 CORS 响应头；使用 PUT、DELETE、`application/json` 或 Authorization 等非简单方法和 Header 时，通常先自动发送 OPTIONS 预检，询问允许的方法和 Header。携带 Cookie 还要在 fetch 设置 `credentials: 'include'`，服务端返回具体的 Allow-Origin 和 `Access-Control-Allow-Credentials: true`，不能把 Origin 写成 `*`。开发代理只是让浏览器请求同源 dev server，生产仍需网关/BFF 或正确的服务端 CORS 配置。

一句话总结：

> 同源策略决定浏览器能否把响应交给 JS；CORS 是服务端授予跨源读取权限的 HTTP 机制。

---

## 1. 同源与跨源

```text
origin = scheme + host + port
```

| 页面与接口 | 是否同源 |
| --- | --- |
| `https://a.com` → `https://a.com/api` | 是 |
| `https://a.com` → `http://a.com/api` | 否，协议不同 |
| `https://a.com` → `https://api.a.com` | 否，主机不同 |
| `https://a.com` → `https://a.com:8443` | 否，端口不同 |

跨源的 `<img>`、`<script>`、导航和表单在一定条件下可以发送请求，但脚本读取响应会受到限制。CORS 也不是 CSRF 防御：浏览器读不到响应，不代表带 Cookie 的写请求没有产生副作用。

## 2. 简单请求与预检

简单请求需要同时满足允许的方法、Header 和 Content-Type 等条件，例如普通 GET，或使用 `text/plain`、`application/x-www-form-urlencoded`、`multipart/form-data` 的合规 POST。

常见预检触发条件：

- `PUT`、`PATCH`、`DELETE` 等方法。
- `Content-Type: application/json`。
- 自定义 Header 或 `Authorization`。

```http
OPTIONS /orders HTTP/1.1
Origin: https://app.example.com
Access-Control-Request-Method: POST
Access-Control-Request-Headers: content-type,authorization
```

```http
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Methods: POST
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 600
Vary: Origin
```

预检由浏览器发起，业务代码通常不应手写。其缓存独立于普通 HTTP 缓存，可用 `Access-Control-Max-Age` 控制，但浏览器有自己的上限。

## 3. 携带凭证

```js
fetch('https://api.example.com/me', {
  credentials: 'include',
})
```

服务端需要返回：

```http
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Credentials: true
Vary: Origin
```

关键边界：

- 携带凭证时 `Access-Control-Allow-Origin` 不能是 `*`。
- OPTIONS 预检本身不携带 Cookie 等凭证，实际请求是否携带由预检结果和凭证策略决定。
- CORS 允许凭证不代表第三方 Cookie 一定可用，浏览器 Cookie 策略仍会独立生效。
- 动态回显 Origin 前必须检查允许列表，不能无条件反射任意 Origin。

## 4. 常见排障顺序

1. 看页面 Origin 与请求 URL 是否真正跨源。
2. 看是预检失败，还是实际响应缺少允许头。
3. 检查方法、请求 Header 是否包含在 Allow 列表。
4. 携带 Cookie 时检查前端 `credentials`、服务端 Credentials、具体 Origin 和 Cookie 属性。
5. 检查重定向、网关、CDN 是否吞掉或缓存错 CORS Header。

## 高频追问

### Postman 能调通，浏览器为什么报跨域？

同源策略是浏览器对页面脚本的限制，Postman 不受这套页面安全模型约束。接口能返回数据，不代表响应满足浏览器 CORS 校验。

### `no-cors` 能解决跨域吗？

不能。它会得到受限的 opaque response，JS 通常读不到状态、Header 和正文，不适合普通 API 调用。

### 前端代理为什么能解决开发跨域？

页面请求的是同源 dev server，再由 Node 代理转发；服务端之间不受浏览器同源策略限制。上线后 dev server 不存在，需要生产网关/BFF 或 CORS。

## 延伸阅读

- [OPTIONS 预检请求](/md/网络/OPTIONS预检请求.md)
- [CSRF](/md/安全/CSRF的理解.md)
- [HTTP](/md/网络/HTTP.md)

