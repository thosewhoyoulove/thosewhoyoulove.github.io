# WebRtc项目

WebRTC（Web Real-Time Communication）会议室项目实现音视频通信的核心在于 WebRTC 提供的 API 和协议，它让浏览器或移动端设备之间能够直接建立点对点连接，实现实时音视频传输。下面从整体架构和关键技术点来讲解：

## 一、整体架构

一个典型的 WebRTC 会议室项目，通常由以下几个部分组成：

- 前端（客户端）：使用 JavaScript 调用 WebRTC API 采集音视频、建立连接、显示画面。

- 信令服务器（Signaling Server）：负责传递连接元信息（如 SDP、ICE 候选）给对端，通常使用 WebSocket 实现。

- STUN/TURN 服务器：辅助 NAT 穿透，帮助双方找到可以通信的网络路径。

- 媒体服务器（可选）：用于多方会议、录制、转码等场景（如使用 Janus、mediasoup、Jitsi 等）。

## 二、WebRTC 实现音视频通信的关键步骤

### 1. 获取媒体流（MediaStream）

客户端通过浏览器的 getUserMedia() 方法采集本地的音频和视频：

```js
navigator.mediaDevices.getUserMedia({ audio: true, video: true })
  .then(stream => {
    localVideo.srcObject = stream;
    // 把流添加到PeerConnection中
    peerConnection.addStream(stream);
  });

```

### 2. 创建 PeerConnection（RTCPeerConnection）

用于管理与其他客户端的连接：

```js
const peerConnection = new RTCPeerConnection({
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
});
```

### 3. 信令过程（Signaling）

这是 WebRTC 不直接规定的部分，但必须由你自己实现（通常通过 WebSocket）：

- A 创建 offer（createOffer()），通过信令发送给 B

- B 收到后，设置为 remote 描述，创建 answer，回传给 A

- A 收到 answer，设置为 remote 描述

```js
// A 端
peerConnection.createOffer()
  .then(offer => {
    peerConnection.setLocalDescription(offer);
    signalingServer.send({ type: 'offer', sdp: offer });
  });

```

```js
// B 端收到后
peerConnection.setRemoteDescription(offer);
peerConnection.createAnswer()
  .then(answer => {
    peerConnection.setLocalDescription(answer);
    signalingServer.send({ type: 'answer', sdp: answer });
  });

```

### 4. NAT 穿透（ICE 协议）

双方通过 ICE（Interactive Connectivity Establishment）交换候选地址，完成打洞：

```js
peerConnection.onicecandidate = (event) => {
  if (event.candidate) {
    signalingServer.send({ type: 'ice-candidate', candidate: event.candidate });
  }
};
```

### 5. 建立连接，传输媒体

一旦双方完成 SDP 和 ICE 交换，连接建立，媒体流通过点对点连接传输，几乎无延迟。

## 三、多人会议如何实现？

WebRTC 原生是点对点的（P2P），如果需要多人会议，有两种方式：

### 1. Mesh 模式（每人连接所有其他人）

- 优点：简单实现
- 缺点：参与者多时性能急剧下降（每个用户都要推流给其他人）

### 2. MCU/SFU 架构（使用媒体服务器）

- MCU（多点控制单元）：集中合并所有流，转码成一个下发

- SFU（选择性转发单元）：不转码，只转发需要的流（效率更高）

常用的媒体服务器：mediasoup、Janus、Jitsi、Kurento

## 四、总结关键点

|步骤|技术/协议|
|  --- | --- |
|获取媒体流| getUserMedia|
|点对点连接 |RTCPeerConnection|
|信令交换 |WebSocket、自定义协议|
|NAT 穿透 |STUN / TURN / ICE|
|多人会议| Mesh 或 SFU 架构|
