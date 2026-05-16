# OPTIONS 预检请求

## 面试定位

OPTIONS 预检请求是 CORS 高频追问题。面试官通常会问：为什么有些 POST 前会多一个 OPTIONS、什么请求会触发预检、服务端需要返回哪些头、如何减少预检请求。

## 核心原理

预检请求是浏览器在跨域请求前发出的安全检查。它使用 `OPTIONS` 方法，先问服务端：当前来源、方法和请求头是否被允许。

只有服务端明确允许后，浏览器才会发送真正的业务请求。

注意：预检请求是浏览器的 CORS 行为，不是 JavaScript 手动发的，也不是所有 POST 都会触发。

## 什么请求会触发预检

跨域请求如果不是“简单请求”，通常会触发预检。

简单请求需要同时满足：

- 方法是 `GET`、`HEAD`、`POST` 之一。
- 请求头只包含 CORS 允许的简单头。
- `Content-Type` 只能是：
  - `application/x-www-form-urlencoded`
  - `multipart/form-data`
  - `text/plain`

会触发预检的常见情况：

- 使用 `PUT`、`DELETE`、`PATCH`。
- `Content-Type: application/json`。
- 携带自定义请求头，比如 `Authorization`、`X-Token`。
- 跨域请求携带某些非简单头。

## 预检请求示例

```http
OPTIONS /api/user HTTP/1.1
Origin: https://www.example.com
Access-Control-Request-Method: POST
Access-Control-Request-Headers: content-type, authorization
```

含义：

- `Origin`：实际请求来自哪个源。
- `Access-Control-Request-Method`：实际请求要使用的方法。
- `Access-Control-Request-Headers`：实际请求要携带的非简单头。

## 服务端响应示例

```http
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://www.example.com
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: content-type, authorization
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 86400
```

关键响应头：

- `Access-Control-Allow-Origin`：允许的来源。
- `Access-Control-Allow-Methods`：允许的方法。
- `Access-Control-Allow-Headers`：允许的请求头。
- `Access-Control-Allow-Credentials`：是否允许携带 Cookie。
- `Access-Control-Max-Age`：预检结果缓存时间。

## 携带 Cookie 的注意点

如果跨域请求要携带 Cookie：

前端需要：

```javascript
fetch(url, {
    credentials: "include",
});
```

服务端需要：

```http
Access-Control-Allow-Credentials: true
Access-Control-Allow-Origin: https://www.example.com
```

此时 `Access-Control-Allow-Origin` 不能是 `*`，必须是明确的 origin。

## 如何减少预检

- 合理设置 `Access-Control-Max-Age`，缓存预检结果。
- 避免不必要的自定义请求头。
- 如果能接受语义，使用简单请求允许的 `Content-Type`。
- 合并接口时谨慎评估，不要为了减少预检破坏接口设计。

不要为了绕过预检牺牲安全性。预检是浏览器保护用户的一部分。

## 面试回答

可以这样答：

> OPTIONS 预检请求是 CORS 机制的一部分。浏览器发现跨域请求不是简单请求时，会先发 OPTIONS，携带 Origin、实际请求方法和实际请求头，询问服务端是否允许。服务端通过 `Access-Control-Allow-Origin`、`Access-Control-Allow-Methods`、`Access-Control-Allow-Headers` 等响应头告诉浏览器是否放行。如果需要携带 Cookie，还要设置 `Access-Control-Allow-Credentials: true`，并且 Allow-Origin 不能是 `*`。常见触发场景有 `Content-Type: application/json`、Authorization 头、PUT/DELETE 请求等。

## 高频追问

### 为什么 `application/json` 会触发预检？

因为它不属于 CORS 简单请求允许的三种 `Content-Type`，浏览器会先预检确认服务端允许。

### OPTIONS 请求失败，真正请求会发出去吗？

不会。预检失败时，浏览器会拦截后续实际请求。

### 预检请求能不能被缓存？

可以。服务端通过 `Access-Control-Max-Age` 指定预检结果缓存时间，减少重复预检。

## 相关链接

- [HTTP](/md/网络/HTTP.md)
- [网络与安全](/md/面试准备/技术/网络与安全.md)
