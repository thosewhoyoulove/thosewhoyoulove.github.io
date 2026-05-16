# WebSocket

## 面试定位

WebSocket 常用于实时通信项目深挖。面试官通常会问：它和 HTTP 轮询区别、如何建立连接、为什么状态码是 101、如何做心跳、断线重连和鉴权。

## 核心原理

WebSocket 是一种基于 TCP 的全双工通信协议。连接建立后，客户端和服务端都可以主动发送消息，不需要像 HTTP 那样必须由客户端发起请求。

适合低延迟、服务端主动推送的场景：

- 即时聊天。
- 实时行情。
- 协同编辑。
- 在线游戏。
- WebRTC 信令。
- 设备状态推送。

## 建立连接

WebSocket 通过 HTTP Upgrade 完成握手。

客户端请求：

```http
GET /socket HTTP/1.1
Host: example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: xxx
Sec-WebSocket-Version: 13
```

服务端同意升级：

```http
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: xxx
```

状态码 `101` 表示协议切换成功。之后连接不再按普通 HTTP 请求响应模式通信，而是使用 WebSocket 帧传输数据。

## 基本使用

```javascript
const socket = new WebSocket("wss://example.com/socket");

socket.onopen = () => {
    socket.send(JSON.stringify({ type: "join", roomId: "1" }));
};

socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    console.log(message);
};

socket.onerror = (error) => {
    console.error(error);
};

socket.onclose = () => {
    console.log("closed");
};
```

线上建议使用 `wss://`，它相当于 WebSocket over TLS。

## 和 HTTP 轮询对比

| 维度 | WebSocket | HTTP 轮询 |
| --- | --- | --- |
| 通信模式 | 双向主动发送 | 客户端定时请求 |
| 延迟 | 低 | 受轮询间隔影响 |
| 连接 | 长连接 | 多次请求 |
| 服务端推送 | 原生支持 | 需要等待下一次轮询 |
| 复杂度 | 需要维护连接状态 | 实现简单 |

轮询适合低频更新，WebSocket 适合高频实时通信。

## 心跳和重连

长连接可能因为网络切换、代理超时、服务重启而断开，所以需要心跳和重连。

常见策略：

- 定时发送 ping 或业务心跳包。
- 超时未收到 pong，主动关闭连接。
- 断开后指数退避重连。
- 页面不可见时降低心跳频率。
- 服务端也要清理无效连接。

## 鉴权

常见方式：

- URL query 携带短期 token。
- 首条消息发送鉴权信息。
- 握手时通过 Cookie 鉴权。

注意不要长期暴露敏感 token。跨域和 Cookie 场景也要考虑安全策略。

## 面试回答

可以这样答：

> WebSocket 是基于 TCP 的全双工通信协议，适合聊天、行情、协同编辑这类服务端需要主动推送的实时场景。它通过 HTTP Upgrade 建立连接，客户端带 `Upgrade: websocket`，服务端返回 101 表示协议切换成功。连接建立后，双方通过 WebSocket 帧传输数据，不再是普通 HTTP 的一问一答。相比轮询，WebSocket 延迟更低、请求头开销更小，但需要维护长连接、心跳、断线重连、鉴权和服务端连接资源。

## 高频追问

### WebSocket 和 HTTP 是什么关系？

WebSocket 握手阶段借助 HTTP Upgrade，建立后使用 WebSocket 协议通信。它不是 HTTP 请求响应模型。

### 为什么需要心跳？

网络中断、代理超时或服务异常时，连接可能半开。心跳用于检测连接是否仍然可用，并及时重连或清理资源。

### WebSocket 能替代 HTTP 吗？

不能。普通 CRUD、缓存、无状态接口仍适合 HTTP。WebSocket 更适合实时双向通信。

## 相关链接

- [HTTP](/md/网络/HTTP.md)
- [HTTPS](/md/网络/HTTPS.md)
- [WebRTC 会议室项目](/md/面试准备/项目与架构/WebRTC%20会议室项目.md)
