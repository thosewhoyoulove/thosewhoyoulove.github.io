# WebSocket

WebSocket 是一种在单个 TCP 连接上进行全双工通信的协议。它允许浏览器和服务器之间进行双向通信，并且可以随时发送和接收消息。

## 特点

- 全双工通信：客户端和服务器可以随时互相发送消息，而不需要客户端主动请求。
- 低延迟：相比轮询，WebSocket 省去了 HTTP 请求头的开销，数据传输更快。
- 长连接：连接建立后可一直保持，不需要频繁创建新连接。
- 基于 TCP：WebSocket 运行在 TCP 之上，默认使用端口 80（HTTP）或 443（HTTPS），因此通常不会被防火墙拦截。

## WebSocket 工作流程

### 1. 握手阶段（HTTP Upgrade）

- 客户端发送 Upgrade: websocket 请求，要求升级到 WebSocket 连接。

- 服务器同意升级，并返回 101 Switching Protocols 状态码，连接建立。

### 2. 数据传输阶段

- 连接建立后，双方可以**随时**发送消息，而无需等待对方的请求。

- 消息格式为二进制或文本，可以是任意长度。

- 消息类型包括文本、二进制数据、ping/pong 心跳消息等。

### 3. 关闭连接

- 任何一方都可以主动关闭连接，或在发生异常时自动断开。

- 关闭连接时，双方会发送关闭帧，并等待对方确认。

- 关闭连接后，连接状态变为 closed。

## WebSocket 示例代码

### 前端（javascript）

```javascript
// 创建 WebSocket 连接
const socket = new WebSocket("ws://localhost:8080");

// 监听连接成功
socket.onopen = function () {
    console.log("WebSocket 连接已建立");
    socket.send("你好，服务器！");
};

// 监听服务器消息
socket.onmessage = function (event) {
    console.log("收到消息：" + event.data);
};

// 监听错误
socket.onerror = function (error) {
    console.log("WebSocket 发生错误", error);
};

// 监听关闭事件
socket.onclose = function () {
    console.log("WebSocket 连接已关闭");
};

```

### 后端（nodejs+ws）

```javascript
const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8080 });

wss.on("connection", function connection(ws) {
    console.log("客户端已连接");

    ws.on("message", function incoming(message) {
        console.log("收到消息:", message);
        ws.send("服务器收到：" + message);
    });

    ws.on("close", function () {
        console.log("客户端断开连接");
    });
});

```

## WebSocket 与 HTTP 轮询的对比

| 特性 | WebSocket | HTTP 轮询 |
| ---- | --------- | --------- |
| 连接方式 | 一次握手，持久化 | 每次请求新建连接 |
| 通信模式 | 双向 | 客户端主动请求，服务器响应 |
| 延迟 | 低 | 高（受请求间隔影响） |
| 适用场景 | 实时应用，如聊天、游戏、股票行情 | 适用于不太频繁的更新，如新闻轮询 |

## WebSocket 适用场景

- 即时聊天（如 QQ、微信网页版）
- 在线游戏（如多人对战游戏）
- 股票行情（实时更新股市数据）
- 协同编辑（如 Google Docs 共享编辑）
- 物联网（IoT）（设备与服务器的实时数据同步）
