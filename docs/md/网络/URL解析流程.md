# URL解析流程

## 架构视角总结

```plaintext
用户输入 → URL解析 → DNS查询 → TCP/TLS握手 → HTTP请求 → 服务器处理 → 响应解析 → 构建DOM/CSSOM → 渲染树 → 布局绘制 → 资源加载/JS执行 → 完成
```

## 基础流程详解

### 1. URL解析与预处理

- 输入处理：检查地址合法性，浏览器自动补全协议（如http://）、检查非法字符（如空格转义为%20）。
- HSTS检查：若域名在HSTS预加载列表中，强制使用HTTPS（如首次访问Google会通过响应头Strict-Transport-Security缓存策略）。
- 协议处理：非HTTP协议直接触发其他应用（如mailto:调用邮件客户端）。
  
### 2. 检查缓存

在发起请求之前，浏览器会检查是否有本地缓存：

- 强缓存 (HTTP Cache-Control / Expires)：如果缓存未过期，直接从本地缓存读取页面，而不发送请求。
- 协商缓存 (ETag / Last-Modified)：如果强缓存失效，会向服务器发送请求，服务器根据 ETag 或 Last-Modified 判断是否返回 304 Not Modified。

### 3. DNS解析

如果缓存未命中，浏览器会进行 DNS 解析，将 `<www.example.com>` 转换为服务器的 IP 地址：

- 浏览器缓存：先检查浏览器自身的 DNS 缓存。
- 操作系统缓存：如果浏览器没有命中，会查询操作系统的 DNS 缓存（/etc/hosts）。
- 本地 DNS 服务器：如果操作系统没有缓存，会向本地 DNS 服务器（通常由 ISP 提供）查询。
- 递归查询：
  - 本地 DNS 服务器如果找不到，会向 根 DNS 服务器 请求。
  - 根服务器返回 .com 顶级域名服务器的地址。
  - .com 服务器返回 example.com 的权威 DNS 服务器。
  - 权威 DNS 服务器返回最终 IP 地址。

### 4. 建立TCP连接

DNS 解析后，浏览器获取到服务器 IP 地址，并与服务器建立 TCP 连接（如果是 HTTPS，还需要 TLS 连接）。

- 第一次握手：浏览器发送 SYN 请求。
- 第二次握手：服务器返回 SYN + ACK。
- 第三次握手：浏览器发送 ACK，连接建立。

### 5. TLS 连接（HTTPS 需要）

如果 URL 使用 https://，则会执行 TLS/SSL 握手：

- 浏览器请求服务器的 SSL 证书。
- 验证证书是否可信（检查是否被 CA 机构签发）。
- 协商加密算法，生成对称密钥。
- 建立安全连接，数据加密传输。

### 6. 发送HTTP请求

TCP 连接建立后，浏览器向服务器发送 HTTP 请求：

```text
GET /index.html HTTP/1.1
Host: www.example.com
User-Agent: Mozilla/5.0
Accept: text/html
```

### 7. 服务器处理请求

服务器（Nginx、Apache、Node.js 等）接收到请求后：

- 解析 HTTP 请求，检查权限、Cookies。
- 如果是动态资源（如 PHP、Node.js），执行服务器代码，查询数据库。
- 如果是静态资源（如 HTML、CSS、JS），直接返回文件内容。

### 8.  服务器返回 HTTP 响应

服务器返回响应：

```yaml
HTTP/1.1 200 OK
Content-Type: text/html
Content-Length: 1024
Cache-Control: max-age=3600

<html>...</html>
```

- 状态码（200 成功，301 重定向，404 未找到，500 服务器错误）
- 响应头（Content-Type、Cache-Control、Set-Cookie）
- 响应体（HTML、JSON、图片等）

### 9. 浏览器解析渲染

浏览器解析返回的 HTML 页面，并执行渲染：

- 解析 HTML，构建 DOM 树。
- 解析 CSS，构建 CSSOM 树。
- 合并 DOM + CSSOM，生成 Render Tree。
- 计算布局（Layout），确定元素位置。
- 绘制（Painting），渲染到屏幕。

### 10. 加载外部资源

浏览器解析 HTML 时，会

- 遇到 **\<script>** 阻塞解析（除非标记为 async/defer），下载并执行 JavaScript 代码。
- 遇到 **\<img>**、**\<link>** 发送 新的 HTTP 请求 加载资源。
- 如果 JS 修改了 DOM，浏览器会 重新计算布局（Reflow）并重绘（Repaint）。
