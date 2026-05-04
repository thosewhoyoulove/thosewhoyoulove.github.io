# TCP三次握手过程

TCP（传输控制协议）使用三次握手（也称为 TCP 握手、三消息握手或 SYN-SYN-ACK）在基于 IP 的网络上建立 TCP/IP 连接。类似地，使用四次挥手来终止连接。

TCP 通过三个消息来协商和启动 TCP 会话，这三个消息分别被称为 SYN、SYN-ACK 和 ACK，分别代表 **SYN**（synchronize 同步）、**SYN**-**ACK**（synchronize-acknowledge 同步-确认）和 **ACK**（acknowledge 确认）。这三消息机制的设计是为了让两台想要互相传递信息的计算机在传输数据（例如 HTTP 浏览器请求）之前协商连接的参数。

1. 发起方（通常是浏览器）向另一台主机（通常是服务器）发送一个 TCP **SYN**（synchronize 同步）报文，表示请求建立连接。
   - 该报文包含：
     - SYN = 1（表示请求建立连接）。
     - 初始序列号（Seq = X），用于标识后续通信中的数据包顺序。
   - 发送后，发起方进入 **SYN_SENT** 状态。
2. 服务器接收到 SYN 报文后，发送一个 SYN-ACK（synchronize-acknowledge 同步-确认）报文。
   - 该报文包含：
     - SYN = 1（服务器同样发起同步）。
     - ACK = 1（确认收到客户端的 SYN）。
     - 确认号 ack = X + 1（表示收到了客户端的 SYN）。
     - 服务器自己的初始序列号（Seq = Y）。
   - 发送后，服务器进入 **SYN_RCVD** 状态。
3. 发起方接收到服务器的 SYN-ACK 报文后，发送一个 ACK（Acknowledgment）确认报文，表示确认连接。
   - 该报文包含：
     - ACK = 1（表示确认收到服务器的 SYN-ACK 报文）。
     - 确认号 ack = Y + 1（表示发起方已经收到了服务器的 SYN-ACK 报文）。
     - 发起方自己的初始序列号（Seq = X + 1）。
   - 发送后，发起方进入 **ESTABLISHED** 状态。

这个握手步骤发生在 DNS 查询之后，TLS 握手（用于创建安全连接）之前。

三次握手示意图：

```pgsql
  Client                             Server
    | --- SYN (Seq=X) --------------> |
    |                                 |
    | <--- SYN-ACK (Seq=Y, Ack=X+1) -- |
    |                                 |
    | --- ACK (Seq=X+1, Ack=Y+1) ---> |
    |                                 |
  [连接建立成功]                 [连接建立成功]
```

```plaintext
tips:

ACK 是 TCP 头部中的一个 标志位（Flag）。标识包的类型，还有其他标志位，如 SYN、FIN、RST、PSH、URG 等。
ack 是 TCP 头部中的一个 确认号（Acknowledgment Number）。表示期望收到的下一个序列号。
```
