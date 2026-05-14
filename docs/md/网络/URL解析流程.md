# 从输入 URL 到页面渲染的全流程

面试经典题，考察浏览器架构、网络、渲染的综合理解。

---

## 一句话总览

```
用户输入 → URL解析 → 缓存检查 → DNS解析 → TCP/TLS握手 → HTTP请求 → 服务器处理 → 响应解析 → 构建DOM/CSSOM → 渲染树 → 布局绘制 → 资源加载/JS执行 → 完成
```

---

## 浏览器多进程视角

浏览器不是单进程，而是**多进程协作**：

| 进程 | 职责 |
| --- | --- |
| 浏览器主进程 | 界面显示、用户交互、子进程管理 |
| 网络进程 | 网络请求、DNS、TCP/TLS、HTTP |
| 渲染进程 | HTML/CSS/JS 解析、布局、绘制（每个标签页一个，沙箱隔离） |
| GPU 进程 | 3D 绘制、合成 |
| 插件进程 | Flash 等插件（已逐步淘汰） |

**流程对应**：

- 用户输入、URL 解析 → 浏览器主进程
- 缓存检查、DNS、TCP/TLS、HTTP → 网络进程
- HTML 解析、渲染 → 渲染进程

---

## 分步详解

### 1. URL 解析与预处理

**浏览器主进程**处理用户输入：

- **合法性检查**：是否是合法 URL，非法字符转义（空格 → `%20`）。
- **协议补全**：用户输入 `example.com` → 自动补 `https://`。
- **HSTS 检查**：如果域名在 HSTS 预加载列表中，强制 HTTPS（即使用户输入 `http://`）。
- **非 HTTP 协议**：`mailto:` 调邮件客户端、`file:` 读取本地文件。

### 2. 缓存检查（网络进程）

发起请求前，先检查**该 URL 对应的响应缓存**：

```
Service Worker 缓存 → HTTP 缓存（强缓存/协商缓存）→ 命中？
  ├─ 命中：直接返回缓存内容，跳过后续网络步骤
  └─ 未命中：继续 DNS 解析
```

#### 强缓存

- `Cache-Control: max-age=3600` —— 相对时间，优先级更高。
- `Expires: Wed, 21 Oct 2026 07:28:00 GMT` —— 绝对时间，受本地时钟影响。

**命中条件**：缓存未过期 → 直接用，**不发送请求**。

#### 协商缓存

强缓存失效后，发请求问服务器「资源变了吗」：

- `If-None-Match` / `ETag` —— 资源内容的哈希。
- `If-Modified-Since` / `Last-Modified` —— 资源修改时间。

**结果**：

- `304 Not Modified` → 用缓存。
- `200 OK` → 返回新资源，更新缓存。

### 3. DNS 解析（网络进程）

缓存未命中，需要把域名解析成 IP：

```
浏览器 DNS 缓存 → 操作系统 DNS 缓存（/etc/hosts）→ 本地 DNS 服务器 → 递归查询
```

#### 递归查询过程

```
本地 DNS 服务器
  → 根 DNS 服务器（返回 .com TLD 地址）
  → .com 顶级域名服务器（返回 example.com 权威 DNS 地址）
  → 权威 DNS 服务器（返回最终 IP）
```

**优化点**：DNS 预解析 `<link rel="dns-prefetch" href="//example.com">` 提前解析。

### 4. 建立 TCP 连接（网络进程）

拿到 IP 后，建立 TCP 连接（三次握手）：

```
客户端 → SYN → 服务器
客户端 ← SYN + ACK ← 服务器
客户端 → ACK → 服务器（连接建立）
```

### 5. TLS 握手（HTTPS，网络进程）

如果是 `https://`，TCP 建立后还要 TLS 握手：

1. 客户端发送支持的加密算法列表。
2. 服务器返回证书 + 选定的加密算法。
3. 客户端验证证书（CA 签名、域名匹配、有效期）。
4. 双方协商生成对称密钥（非对称加密交换密钥，后续用对称加密传输）。

**加密方式**：

| 加密类型 | 使用阶段 | 原因 |
| --- | --- | --- |
| 非对称加密 | 握手阶段 | 安全地交换对称密钥，公钥加密、私钥解密 |
| 对称加密 | 数据传输阶段 | 加解密速度快，适合大量数据 |

**结果**：建立加密通道，后续 HTTP 请求加密传输。

详见 [HTTPS](/md/网络/HTTPS.md)。

### 6. 发送 HTTP 请求（网络进程）

TCP/TLS 连接就绪，发送请求：

```http
GET /index.html HTTP/1.1
Host: www.example.com
User-Agent: Mozilla/5.0
Accept: text/html,application/xhtml+xml
Cookie: session=abc123
```

**请求行 + 请求头 + 请求体**（POST/PUT 有 body）。

### 7. 服务器处理请求

服务器（Nginx、Node.js、Java 等）：

- 解析请求路径、参数、Cookie。
- 权限校验、Session 验证。
- 动态资源：执行后端代码、查数据库。
- 静态资源：直接读取文件。

### 8. 返回 HTTP 响应

```http
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Content-Length: 1024
Cache-Control: max-age=3600
Set-Cookie: session=xyz789

<!DOCTYPE html>
<html>...</html>
```

**常见状态码**：

| 状态码 | 含义 |
| --- | --- |
| 200 | 成功 |
| 301/302 | 永久/临时重定向 |
| 304 | 协商缓存命中 |
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

详见 [HTTP 状态码](/md/网络/HTTP状态码.md)。

### 9. 浏览器解析渲染（渲染进程）

**关键点**：渲染进程是独立沙箱，和主进程、网络进程通过 IPC 通信。

网络进程把响应体传给渲染进程，开始解析：

#### 9.1 构建 DOM 树

解析 HTML → Token → Node → DOM Tree。

**阻塞因素**：

- 遇到 `<script>` → 同步下载并执行，阻塞 HTML 解析（除非 `async` / `defer`）。
- 遇到 `<link rel="stylesheet">` → 不阻塞解析，但阻塞渲染（需等 CSSOM）。

#### 9.2 构建 CSSOM 树

解析 CSS → CSSOM Tree。

**注意**：CSS 不会阻塞 DOM 解析，但会阻塞渲染——渲染树需要 DOM + CSSOM。

#### 9.3 执行 JavaScript

- 同步脚本：立即执行，阻塞后续解析。
- `defer`：HTML 解析完、`DOMContentLoaded` 前按顺序执行。
- `async`：下载完立即执行，不保证顺序。
- `type="module"`：ES Module，自动 defer。

#### 9.4 构建渲染树

DOM Tree + CSSOM Tree → Render Tree。

**渲染树只包含可见节点**：`display: none` 的元素不在渲染树中（`visibility: hidden` 在）。

#### 9.5 布局（Layout / Reflow）

计算每个节点的**几何信息**：位置、大小。

**触发 Reflow 的情况**：

- 窗口大小变化。
- 字体大小变化。
- DOM 结构变化（增删节点）。
- 读取某些属性：`offsetWidth`、`scrollTop`、`clientHeight` 等。

#### 9.6 绘制（Paint）

把渲染树绘制到位图，每个节点转换成像素。

**触发 Repaint 的情况**：

- 颜色、背景、边框等样式变化。
- `visibility` 变化。

**优化**：浏览器会将多个回流/重绘合并，但**读取几何属性会强制同步布局**，导致性能问题。

#### 9.7 合成（Composite）

把多个图层合成最终画面：

- 有 `transform`、`opacity`、`will-change` 的元素会提升为独立图层。
- 图层变化只触发合成，不触发布局和绘制 → 性能最优。

详见 [浏览器的渲染原理](/md/浏览器/浏览器的渲染原理.md)。

### 10. 资源加载

HTML 解析过程中，遇到外部资源会触发新的网络请求：

| 资源 | 行为 |
| --- | --- |
| `<script>` | 阻塞解析，除非 `async`/`defer` |
| `<link rel="stylesheet">` | 异步加载，阻塞渲染 |
| `<img>` | 异步加载，不阻塞 |
| `<link rel="preload">` | 预加载，提前下载 |
| `<link rel="prefetch">` | 预获取，空闲时下载 |

### 11. 事件触发

- `DOMContentLoaded`：DOM 构建完成（不等图片等资源）。
- `load`：所有资源加载完成。

---

## 面试口述版（1 分钟）

> 用户输入 URL，浏览器主进程先解析 URL、检查 HSTS，然后把请求交给网络进程。网络进程先查缓存——Service Worker、HTTP 强缓存、协商缓存，命中就直接返回。没命中就走 DNS 解析，把域名转成 IP；然后建立 TCP 连接（三次握手），如果是 HTTPS 还要 TLS 握手验证证书、协商密钥。之后发 HTTP 请求，服务器处理后返回响应。响应体交给渲染进程：解析 HTML 构建 DOM 树，解析 CSS 构建 CSSOM 树，遇到 script 会阻塞解析。DOM 和 CSSOM 合并成渲染树，然后布局计算位置大小，绘制生成像素，最后合成到屏幕。过程中遇到外部资源会触发新的网络请求，async/defer 的脚本不影响主流程。

---

## 追问方向

| 追问 | 关联文档 |
| --- | --- |
| TCP 三次握手为什么是三次？ | [TCP 三次握手](/md/网络/TCP三次握手.md) |
| HTTPS 如何保证安全？ | [HTTPS](/md/网络/HTTPS.md) |
| 浏览器如何渲染页面？ | [浏览器的渲染原理](/md/浏览器/浏览器的渲染原理.md) |
| 缓存策略怎么设计？ | [浏览器的缓存机制](/md/浏览器/浏览器的缓存机制.md) |
| 事件循环如何工作？ | [浏览器的事件循环](/md/浏览器/浏览器的事件循环.md) |
