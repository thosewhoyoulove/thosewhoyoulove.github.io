# HTTP

## 面试定位

HTTP 是网络面试的主线题。面试官通常会从“HTTP 是什么”继续追问请求响应结构、常见方法、缓存、连接复用、HTTP/1.1/2/3 差异，以及 HTTPS、WebSocket、跨域这些关联问题。

## 核心原理

HTTP 是应用层协议，用来规定客户端和服务端如何交换请求与响应。它本身是无状态的：协议层不会记住上一次请求是谁、做过什么。业务里的登录态通常依赖 Cookie、Session、Token 等机制维护。

一次 HTTP 交互包含：

- 请求行：方法、路径、协议版本。
- 请求头：客户端能力、缓存、Cookie、内容类型等。
- 请求体：POST/PUT 等请求携带的数据。
- 响应行：协议版本、状态码、原因短语。
- 响应头：缓存、内容类型、Cookie、跨域等。
- 响应体：HTML、JSON、图片、文件等。

```http
GET /api/user HTTP/1.1
Host: example.com
Accept: application/json
Cookie: session=abc
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-cache

{"name":"omen"}
```

## 常见请求方法

- `GET`：获取资源，参数通常在 URL 上，适合查询。
- `POST`：提交数据，常用于创建资源或触发操作。
- `PUT`：整体更新资源。
- `PATCH`：局部更新资源。
- `DELETE`：删除资源。
- `HEAD`：只获取响应头，不返回响应体。
- `OPTIONS`：询问服务器支持的方法或用于 CORS 预检。

面试里要注意两个概念：

- 安全方法：不应该修改服务器资源，例如 `GET`、`HEAD`。
- 幂等方法：执行一次和多次效果一致，例如 `GET`、`PUT`、`DELETE` 通常应设计为幂等。

`POST` 通常不是幂等的，比如重复提交订单可能创建多个订单。

## GET 和 POST 区别

常见回答：

- 语义不同：GET 获取资源，POST 提交数据。
- 参数位置不同：GET 通常放 URL，POST 通常放 body。
- 缓存行为不同：GET 更容易被浏览器和代理缓存。
- 幂等性不同：GET 应该幂等，POST 通常不保证。
- 长度限制不是 HTTP 协议本身规定，更多来自浏览器、服务器和代理限制。

不要简单说“GET 安全、POST 不安全”。如果没有 HTTPS，二者都可能被监听；如果服务端把 GET 设计成删除数据，也会破坏安全语义。

## HTTP 版本演进

### HTTP/1.0

每次请求通常新建 TCP 连接，请求结束后关闭，连接成本高。

### HTTP/1.1

默认支持持久连接，可以复用 TCP 连接。

主要改进：

- `Connection: keep-alive`
- `Host` 头，支持虚拟主机
- 更完善的缓存控制
- 分块传输 `Transfer-Encoding: chunked`

问题：

- 同一个 TCP 连接上的请求响应仍然容易受队头阻塞影响。
- 浏览器通常会对同域连接数做限制。

### HTTP/2

HTTP/2 使用二进制分帧，并支持多路复用。

主要特点：

- 多个请求和响应可以在同一个连接上并发传输。
- 头部压缩 HPACK，减少重复头开销。
- 流优先级。
- Server Push 曾用于服务端主动推资源，但实践中收益有限，现代使用变少。

注意：HTTP/2 解决的是 HTTP 层队头阻塞，但它仍跑在 TCP 上，TCP 丢包仍可能影响整个连接。

### HTTP/3

HTTP/3 基于 QUIC，QUIC 基于 UDP 实现可靠传输和 TLS 1.3 加密。

主要特点：

- 改善 TCP 层队头阻塞。
- 握手延迟更低。
- 支持连接迁移，移动网络切换更友好。
- 默认加密。

不要说“HTTP/3 因为 UDP 不可靠所以快”。更准确是：QUIC 在 UDP 之上实现可靠传输、多路流、拥塞控制和加密。

## 面试回答

可以这样答：

> HTTP 是应用层协议，用来定义客户端和服务端的请求响应格式。它是无状态的，所以登录态通常要靠 Cookie、Session 或 Token 维护。HTTP 请求由请求行、请求头、请求体组成，响应由状态行、响应头、响应体组成。常见方法里 GET 用于获取资源，POST 用于提交数据，PUT/PATCH 用于更新，DELETE 用于删除，OPTIONS 常用于 CORS 预检。版本上，HTTP/1.1 引入持久连接和更完善缓存；HTTP/2 用二进制分帧、多路复用和头部压缩提升性能；HTTP/3 基于 QUIC，改善 TCP 队头阻塞和移动网络连接迁移问题。

## 高频追问

### HTTP 是无状态的，为什么网站能保持登录？

HTTP 协议本身不保存状态，登录态由上层机制维护。常见方式是服务端 Session + Cookie，或 Token/JWT。浏览器每次请求带上 Cookie 或 Authorization，服务端据此识别用户。

### HTTP/2 多路复用为什么还能有队头阻塞？

HTTP/2 在应用层可以多路复用，但底层仍是 TCP。TCP 保证有序可靠传输，如果一个 TCP 包丢失，后续数据即使到达也要等待重传，所以会有 TCP 层队头阻塞。

### GET 能不能有 body？

协议没有绝对禁止，但实际浏览器、服务器、代理对 GET body 支持不一致，语义也不清晰，业务中不建议依赖。

## 相关链接

- [HTTP 状态码](/md/网络/HTTP状态码.md)
- [HTTPS](/md/网络/HTTPS.md)
- [OPTIONS 预检请求](/md/网络/OPTIONS预检请求.md)
