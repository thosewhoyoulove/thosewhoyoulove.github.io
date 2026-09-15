# HTTP/1.1、HTTP/2 与 HTTP/3

## 面试定位

大厂常从“HTTP/2 做了什么优化”继续追问多路复用、队头阻塞，以及 HTTP/3 为什么改用 QUIC。回答重点不是背版本发布时间，而是说清：**HTTP 语义基本不变，变化主要发生在报文编码、连接复用和传输层。**

## 面试回答

> HTTP/1.1 默认使用持久 TCP 连接，但同一连接上的响应顺序受到限制，浏览器通常通过多开连接提高并发。HTTP/2 把报文改成二进制帧，在一条 TCP 连接上用多个 Stream 多路复用，并通过 HPACK 压缩请求头，解决了 HTTP/1.1 应用层的队头阻塞。不过所有 Stream 仍共享一条 TCP 连接，一旦 TCP 丢包，后续字节必须等待重传，因此还存在传输层队头阻塞。HTTP/3 保留 HTTP 方法、状态码和 Header 等语义，把传输改为基于 UDP 的 QUIC；不同 Stream 独立进行丢包恢复，一个流丢包不会阻塞其他流，同时 QUIC 集成 TLS 1.3，并通过 Connection ID 改善网络切换。工程上不是版本越高就一定越快，还要看 CDN、服务端、UDP 网络质量和回退链路。

一句话总结：

> HTTP/2 用二进制分帧和多路复用解决应用层并发问题；HTTP/3 用 QUIC 进一步缓解 TCP 层队头阻塞和建连成本。

---

## 核心对比

| 维度 | HTTP/1.1 | HTTP/2 | HTTP/3 |
| --- | --- | --- | --- |
| 传输 | TCP | TCP | QUIC（基于 UDP） |
| 报文 | 文本起始行和 Header | 二进制帧 | QUIC Stream 上的二进制帧 |
| 并发 | 常依赖多条 TCP 连接 | 单连接多 Stream | 单连接多 Stream |
| Header 压缩 | 无协议级压缩 | HPACK | QPACK |
| 队头阻塞 | HTTP 层和 TCP 层 | HTTP 层缓解，TCP 层仍有 | Stream 间不因单个丢包互相阻塞 |
| 网络切换 | 四元组变化通常需要重连 | 同左 | Connection ID 支持连接迁移 |

## 1. 为什么 HTTP/2 多路复用仍会卡

HTTP/2 把一条连接拆成多个逻辑 Stream，帧可以交错传输：

```text
TCP connection
  ├── stream 1：HTML
  ├── stream 3：CSS
  └── stream 5：JS
```

但 TCP 向上层提供的是有序字节流。某个 TCP segment 丢失时，即使后面的 segment 已经到达，也要等缺失数据重传后才能按序交付；于是同一连接上的多个 HTTP/2 Stream 都可能暂停。

注意两个易错点：

- HTTP/2 并不是“彻底没有队头阻塞”，它缓解的是 HTTP/1.1 层面的阻塞。
- 多路复用不等于所有资源同时完成，带宽、服务端优先级和主线程处理仍会影响加载。

## 2. QUIC 为什么可以改善

QUIC 在用户态实现可靠传输，并让每个 Stream 独立维护有序交付。一个 Stream 的数据丢失，只阻塞该 Stream，不阻塞已经完整到达的其他 Stream。

此外：

- QUIC 把 TLS 1.3 握手纳入连接建立，减少重复往返。
- Connection ID 不直接绑定 IP；手机从 Wi-Fi 切到蜂窝网络时，有机会迁移现有连接。
- UDP 被部分网络限制时，客户端通常需要回退到 HTTP/2 或 HTTP/1.1。

## 3. 前端工程影响

- HTTP/1.1 时代的域名分片在 HTTP/2/3 下可能适得其反，因为会增加 DNS、TCP/TLS 连接成本。
- 合并所有 JS/CSS 也不再是绝对正确；仍应按路由和执行时机合理分包。
- Server Push 并不是 HTTP/2 的核心优化答案，实际应用有限；优先掌握多路复用、Header 压缩和队头阻塞。
- 用 DevTools 的 Protocol、Connection ID、Timing 验证真实协商结果，不要根据 URL 猜版本。

## 高频追问

### HTTP/3 是不是不可靠，因为 UDP 不可靠？

不是。UDP 本身不提供可靠性，但 QUIC 在 UDP 之上实现确认、重传、拥塞控制和加密，为 HTTP/3 提供可靠传输。

### HTTP/2 为什么通常只用一条连接？

一条连接已经可以承载多个并发 Stream，减少了重复握手和慢启动成本。实际连接数量仍受域名、代理与浏览器实现影响。

### HTTP/3 会改变 GET、POST 和状态码吗？

不会。HTTP 的方法、状态码、Header 和缓存等语义保持一致，主要变化在底层传输与编码。

## 延伸阅读

- [HTTP](/md/网络/HTTP.md)
- [HTTPS](/md/网络/HTTPS.md)
- [从输入 URL 到页面展示](/md/网络/URL解析流程.md)

