# WebRTC 会议室项目

## 面试定位

这个项目适合展示实时通信、网络、音视频和复杂状态管理能力。面试官常问：WebRTC 建连流程、为什么选 SFU、弱网怎么处理、屏幕共享怎么做、音视频状态如何同步。

回答时重点不是背 API，而是讲清楚 WebRTC 的连接链路和你在项目里做的工程处理。

## 核心原理

WebRTC 会议项目可以拆成四层：

1. 媒体采集：`getUserMedia`、`getDisplayMedia`。
2. 连接协商：SDP、ICE、STUN/TURN、信令服务器。
3. 媒体传输：P2P、SFU、音视频 track。
4. 业务状态：房间、成员、静音、摄像头、屏幕共享、布局。

多人会议的关键取舍是网络拓扑。Mesh 简单但人数一多上行压力爆炸，MCU 服务器压力大且延迟高，SFU 只做转发，更适合中小型多人会议。

---

## 问题：这个项目是做什么的？业务背景是什么？

这是一个基于 WebRTC 的多人音视频会议室项目，支持浏览器端直接发起和加入会议，不需要安装任何客户端。主要用于团队内部的远程协作场景——开会、屏幕共享、协同讨论。

技术栈是 React + WebRTC + WebSocket（信令）+ SFU 媒体服务器（mediasoup），支持最多 8-10 人同时在线的小型会议。

---

## 问题：整体架构是怎么设计的？

```
┌──────────────────────────────────────────────────────┐
│                      客户端（浏览器）                   │
│  getUserMedia → RTCPeerConnection → 远端视频渲染      │
└────────────────────────┬─────────────────────────────┘
                         │ WebSocket（信令）
                         ▼
┌──────────────────────────────────────────────────────┐
│                   信令服务器（Node.js）                 │
│  房间管理 / SDP 转发 / ICE 候选转发 / 成员状态同步      │
└────────────────────────┬─────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────┐
│              SFU 媒体服务器（mediasoup）                │
│  接收每个人的上行流 → 选择性转发给其他参会者             │
└──────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────┐
│              STUN / TURN 服务器                        │
│  辅助 NAT 穿透，保证复杂网络环境下也能连通             │
└──────────────────────────────────────────────────────┘
```

### 为什么选 SFU 而不是 Mesh 或 MCU

| 架构 | 原理 | 优缺点 |
| --- | --- | --- |
| **Mesh** | 每个人和其他所有人建立 P2P 连接 | 简单但不可扩展，4 人以上性能急剧下降 |
| **MCU** | 服务器把所有流合并转码成一路下发 | 服务器压力大，延迟高 |
| **SFU** | 服务器只做转发，不转码 | 服务器压力小，延迟低，适合中小型会议 |

我们的场景是 8-10 人的小型会议，SFU 是最合适的——每个人只需要上行一路流，服务器按需转发给其他人，不做转码，延迟和服务器成本都可控。

---

## 问题：WebRTC 建立连接的完整流程是什么？

### 第一步：获取本地媒体流

```js
const localStream = await navigator.mediaDevices.getUserMedia({
  audio: true,
  video: { width: 1280, height: 720 }
})
localVideo.srcObject = localStream
```

### 第二步：创建 PeerConnection

```js
const pc = new RTCPeerConnection({
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'turn:turn.example.com', username: 'user', credential: 'pass' }
  ]
})

// 把本地流的每个 track 加到连接里
localStream.getTracks().forEach(track => {
  pc.addTrack(track, localStream)
})
```

### 第三步：信令交换（通过 WebSocket）

**发起方（Offer）：**

```js
const offer = await pc.createOffer()
await pc.setLocalDescription(offer)
ws.send(JSON.stringify({ type: 'offer', sdp: offer, roomId, targetId }))
```

**接收方（Answer）：**

```js
await pc.setRemoteDescription(new RTCSessionDescription(offer))
const answer = await pc.createAnswer()
await pc.setLocalDescription(answer)
ws.send(JSON.stringify({ type: 'answer', sdp: answer, roomId, targetId }))
```

### 第四步：ICE 候选交换（NAT 穿透）

```js
pc.onicecandidate = (event) => {
  if (event.candidate) {
    ws.send(JSON.stringify({ type: 'ice-candidate', candidate: event.candidate, targetId }))
  }
}

// 收到对方的 ICE 候选
ws.onmessage = (msg) => {
  if (msg.type === 'ice-candidate') {
    pc.addIceCandidate(new RTCIceCandidate(msg.candidate))
  }
}
```

### 第五步：连接建立，接收远端流

```js
pc.ontrack = (event) => {
  remoteVideo.srcObject = event.streams[0]
}
```

整个过程：采集本地流 → 创建连接 → 交换 SDP → 交换 ICE → 连接建立 → 媒体传输。

---

## 问题：信令服务器具体做了什么？

信令服务器是用 Node.js + WebSocket 实现的，职责包括：

### 1. 房间管理

- 用户加入房间时注册到房间成员列表
- 用户离开时从列表移除，并通知其他成员
- 维护每个房间的在线人数，超过上限拒绝加入

### 2. SDP 和 ICE 转发

信令服务器**不解析** SDP 和 ICE 的内容，只负责按 `targetId` 转发给目标用户。它是一个纯粹的消息中转站。

### 3. 成员状态同步

- 有人加入/离开时广播 `user-joined` / `user-left` 事件
- 有人开关麦克风/摄像头时广播状态变更
- 前端收到事件后更新 UI（比如显示/隐藏某人的视频框）

### 4. 心跳检测

WebSocket 连接可能因为网络问题静默断开，服务端每 10 秒发一次 ping，客户端回 pong，超过 3 次没回应就判定离线，清理资源并通知其他人。

---

## 问题：NAT 穿透是怎么处理的？STUN 和 TURN 的区别？

### 为什么需要 NAT 穿透

大部分用户都在 NAT（路由器）后面，没有公网 IP，两个 NAT 后面的设备直接通信是不通的。ICE 协议就是用来解决这个问题的。

### STUN

STUN 服务器帮助客户端发现自己的公网 IP 和端口。客户端向 STUN 服务器发一个请求，STUN 回复"你的公网地址是 x.x.x.x:port"，客户端把这个地址作为 ICE 候选发给对方。

**适用场景**：双方的 NAT 类型比较友好（锥形 NAT），能直接打洞成功。

### TURN

如果 STUN 打洞失败（比如对称型 NAT），就需要 TURN 服务器做中继——所有媒体流都经过 TURN 服务器转发。

**代价**：延迟增加，服务器带宽成本高。所以 TURN 是最后的兜底方案。

### 实际配置

```js
iceServers: [
  { urls: 'stun:stun.l.google.com:19302' },           // 免费 STUN
  { urls: 'turn:turn.myserver.com:3478',               // 自建 TURN
    username: 'user',
    credential: 'password'
  }
]
```

ICE 协议会自动按优先级尝试：先 host（局域网直连）→ 再 srflx（STUN 打洞）→ 最后 relay（TURN 中继），选择能通的最优路径。

---

## 问题：多人会议场景下，前端是怎么管理多个连接的？

### 连接管理

每个参会者加入时，前端会为 ta 创建一个独立的 PeerConnection 实例，用一个 Map 管理：

```js
const peerConnections = new Map()  // key: peerId, value: RTCPeerConnection

function handleUserJoined(peerId) {
  const pc = createPeerConnection(peerId)
  peerConnections.set(peerId, pc)
  // 发起 offer...
}

function handleUserLeft(peerId) {
  const pc = peerConnections.get(peerId)
  pc.close()
  peerConnections.delete(peerId)
  // 移除对应的视频元素
}
```

### 视频布局

根据参会人数动态切换布局：

- 1 人：全屏
- 2 人：左右分屏
- 3-4 人：2×2 网格
- 5-9 人：3×3 网格 + 主讲人大画面

用 CSS Grid 实现自适应布局，人数变化时自动调整。

### 资源清理

用户离开或会议结束时，必须完整清理：

```js
function cleanup() {
  localStream.getTracks().forEach(track => track.stop())  // 关闭摄像头/麦克风
  peerConnections.forEach(pc => pc.close())               // 关闭所有连接
  peerConnections.clear()
  ws.close()                                              // 关闭 WebSocket
}
```

不清理的话摄像头指示灯会一直亮着，而且 PeerConnection 不关闭会导致内存泄漏。

---

## 问题：遇到过什么技术难点？

### 1. ICE 连接失败的排查

线上有用户反馈进入会议后看不到对方画面。排查发现是公司网络的防火墙把 UDP 端口全封了，STUN 打洞失败，而我们当时没配 TURN 服务器。

**解决**：部署了自建的 TURN 服务器（coturn），作为兜底中继。同时在前端加了连接状态监听：

```js
pc.oniceconnectionstatechange = () => {
  if (pc.iceConnectionState === 'failed') {
    // 尝试 ICE restart
    pc.restartIce()
    // 如果还是失败，提示用户检查网络
  }
}
```

### 2. 设备切换

用户在通话中切换摄像头或麦克风（比如从内置摄像头切到外接摄像头），需要：

1. 停止旧 track
2. 获取新设备的 stream
3. 用 `sender.replaceTrack(newTrack)` 替换，而不是重新建连接

```js
async function switchCamera(deviceId) {
  const newStream = await navigator.mediaDevices.getUserMedia({
    video: { deviceId: { exact: deviceId } }
  })
  const newTrack = newStream.getVideoTracks()[0]
  const sender = pc.getSenders().find(s => s.track.kind === 'video')
  await sender.replaceTrack(newTrack)
}
```

`replaceTrack` 的好处是不需要重新协商 SDP，切换是无缝的。

### 3. 弱网环境下的体验优化

网络差的时候视频会卡顿甚至黑屏。做了几个优化：

- **自适应码率**：监听 `getStats()` 的丢包率和带宽估计，动态调整视频分辨率和帧率
- **优先保音频**：网络极差时主动降低视频质量甚至关闭视频，保证音频通话不断
- **重连机制**：检测到 `iceConnectionState` 变成 `disconnected` 后，等待 3 秒，如果没恢复就自动 ICE restart

### 4. 回声消除

多人会议时如果有人用外放，容易产生回声。浏览器的 `getUserMedia` 有内置的回声消除：

```js
navigator.mediaDevices.getUserMedia({
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true
  }
})
```

但某些设备（特别是 Android 低端机）内置的回声消除效果不好，我们在 UI 上加了提示引导用户戴耳机。

---

## 问题：屏幕共享是怎么实现的？

### 获取屏幕流

```js
const screenStream = await navigator.mediaDevices.getDisplayMedia({
  video: { cursor: 'always' },
  audio: true  // 可选，共享系统音频
})
```

### 替换视频轨道

共享屏幕时不需要断开重连，直接替换视频 track：

```js
const screenTrack = screenStream.getVideoTracks()[0]
const sender = pc.getSenders().find(s => s.track.kind === 'video')
await sender.replaceTrack(screenTrack)

// 用户点击浏览器的"停止共享"按钮时
screenTrack.onended = () => {
  // 切回摄像头
  const cameraTrack = localStream.getVideoTracks()[0]
  sender.replaceTrack(cameraTrack)
}
```

### 共享时的 UI 处理

- 共享者本地显示一个小的摄像头画中画 + 大的屏幕预览
- 其他参会者看到的是共享者的屏幕内容，布局自动切换为"主讲人模式"（屏幕大画面 + 其他人小画面）

---

## 问题：音视频的开关（静音/关闭摄像头）是怎么做的？

不需要断开连接，直接操作 track 的 `enabled` 属性：

```js
// 静音
function toggleMute() {
  const audioTrack = localStream.getAudioTracks()[0]
  audioTrack.enabled = !audioTrack.enabled
  // 通过信令通知其他人我的静音状态
  ws.send(JSON.stringify({ type: 'mute-status', muted: !audioTrack.enabled }))
}

// 关闭摄像头
function toggleCamera() {
  const videoTrack = localStream.getVideoTracks()[0]
  videoTrack.enabled = !videoTrack.enabled
  ws.send(JSON.stringify({ type: 'camera-status', cameraOff: !videoTrack.enabled }))
}
```

`enabled = false` 时，track 还在传输但内容是静默/黑帧，对方会收到空数据。前端根据信令通知的状态来显示"已静音"图标或头像占位。

---

## 问题：这个项目和你在探迹做的云呼 SDK 有什么关联？

两个项目都涉及 WebRTC，但侧重点不同：

| 维度 | 会议室项目 | 云呼 SDK |
| --- | --- | --- |
| 场景 | 多人音视频会议 | 一对一电话呼叫 |
| 媒体类型 | 音频 + 视频 + 屏幕共享 | 纯音频 |
| 连接方式 | SFU 多方转发 | 点对点 SIP 协议 |
| 核心挑战 | 多路流管理、布局、弱网适配 | 跨 tab 单例、状态机、多呼叫类型 |
| WebRTC 使用深度 | 原生 API 直接调用 | 基于 sip.js 封装，做了 mDNS 和代理注入的定制 |

会议室项目让我对 WebRTC 的底层原理（ICE、SDP、媒体协商）有了深入理解，这些经验在后来做云呼 SDK 时直接复用了——比如 RTCPeerConnection 代理注入做质量监控、mDNS 地址替换这些，都是基于对 WebRTC 协议栈的理解才能做出来的。

## 面试回答

这个项目是一个浏览器端多人音视频会议室，核心技术是 React、WebRTC、WebSocket 信令和 SFU 媒体服务器。

整体链路是：客户端先通过 `getUserMedia` 获取本地音视频流，然后创建 `RTCPeerConnection`，通过 WebSocket 信令交换 SDP 和 ICE Candidate，再借助 STUN/TURN 做 NAT 穿透，最终由 SFU 负责接收每个人的上行流并转发给其他参会者。

我们选择 SFU 而不是 Mesh，是因为 Mesh 在多人场景下每个人都要给其他人发一路流，上行带宽和连接数增长太快。SFU 只让每个人上传一路，服务器按需转发，延迟和成本都比较可控，适合 8 到 10 人的小型会议。

项目里的难点主要是连接状态、弱网处理、媒体 track 管理和屏幕共享。比如屏幕共享不需要重连，只需要用 `replaceTrack` 替换视频轨道；静音和关闭摄像头直接控制 track 的 `enabled`，再通过信令同步 UI 状态。

## 高频追问

### WebRTC 建连流程是什么？

采集本地媒体流，创建 PeerConnection，添加 track，通过信令交换 SDP 和 ICE Candidate，借助 STUN/TURN 完成 NAT 穿透，连接成功后开始传输媒体流。

### 为什么选 SFU？

Mesh 简单但多人时上行压力大，MCU 服务器转码成本高、延迟大。

SFU 不转码，只做选择性转发，比较适合多人会议的实时性和成本要求。

### 屏幕共享为什么不用重连？

因为可以通过 `RTCRtpSender.replaceTrack` 替换正在发送的视频轨道。

连接保持不变，只是把摄像头 track 替换成屏幕 track，停止共享时再切回摄像头。

### 弱网怎么优化？

可以从降低分辨率和码率、监听连接状态、统计 RTT 和丢包、TURN 兜底、首帧占位、异常重连、UI 提示等方向处理。

## 相关链接

- [WebSocket](/md/网络/WebSocket.md)
- [HTTPS](/md/网络/HTTPS.md)
- [云呼 SDK](/md/面试准备/项目与架构/云呼SDK.md)
- [网络与安全](/md/面试准备/技术/网络与安全.md)
