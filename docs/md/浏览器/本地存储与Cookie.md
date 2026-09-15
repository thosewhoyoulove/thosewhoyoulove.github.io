# 本地存储与 Cookie

## 面试回答

> 前端常见的浏览器端存储我按「给谁看、多大、是否自动带上请求」来分。Cookie 设计初衷是让浏览器在同源请求时自动带上小段状态，适合会话标识；它有过期、Domain、Path、Secure、HttpOnly、SameSite 等约束，容量大约每条几 KB。localStorage 是同源持久键值，关页还在，约 5MB 量级，JS 可读写，不会自动跟请求走。sessionStorage 也是同源键值，但以标签页会话为界，关 tab 就没。
>
> 如果是较大、结构化、需要索引或事务的数据，应选异步的 IndexedDB，而不是把大 JSON 塞进同步的 localStorage。Web Storage 会同步阻塞主线程，而且容量只是实现相关的配额，不能把“5MB”当跨浏览器保证。
>
> 社招三年岗常追安全：token 放 localStorage 方便但怕 XSS 读取；放 Cookie 且 HttpOnly 能让 JS 读不到，但仍要防 CSRF 和 XSS“借用户身份发请求”。敏感信息不要因为“存在浏览器本地”就当成安全；跨站 iframe 还要考虑第三方 Cookie 限制和分区存储。

**一句话总结：**

> Cookie 自动随请求且可 HttpOnly → localStorage 持久且仅 JS → sessionStorage 按 tab → 选型看是否带请求与 XSS/CSRF 威胁模型。

---

## 核心原理

### 1. 为什么需要

HTTP 本身偏无状态。需要在多次请求或多次打开页面之间记住「谁登录了、主题偏好、草稿」等。浏览器提供了几类存储，约束不同。

### 2. 对比表

| 维度 | Cookie | localStorage | sessionStorage |
| --- | --- | --- | --- |
| 容量 | 通常约几 KB/条 | 实现相关、通常 MB 级 | 实现相关、通常 MB 级 |
| 生命周期 | 过期时间 / 会话 Cookie | 永久直到删 | 当前 tab |
| 是否随请求发送 | 符合条件就自动带 | 否 | 否 |
| JS 访问 | 无 HttpOnly 时可读写 | 是 | 是 |
| 典型用途 | 会话、CSRF 双 Cookie | 主题、非敏感缓存 | 单页向导草稿 |

| IndexedDB | 特点 |
| --- | --- |
| 数据模型 | 异步对象数据库，支持 object store、索引、事务 |
| 容量 | 通常远大于 Web Storage，但仍受站点配额和清理策略影响 |
| 适合 | 离线数据、大量结构化记录、文件 Blob、搜索索引 |
| 代价 | API 和版本迁移更复杂，不会自动随 HTTP 请求发送 |

### 3. Cookie 关键属性

```text
Set-Cookie: id=...; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=...
```

| 属性 | 作用 |
| --- | --- |
| HttpOnly | JS 不可读，降低 XSS 偷 Cookie |
| Secure | 仅 HTTPS |
| SameSite | 限制跨站携带，缓解 CSRF |
| Domain / Path | 哪些 URL 会带上 |
| `Partitioned` | 第三方上下文按顶级站点分区存储（CHIPS） |

Cookie 的 Domain/Path 主要控制发送范围，不是可靠的前端数据隔离或权限边界。`SameSite=None` 必须配合 `Secure`；跨站登录和嵌入场景不能再假设所有浏览器都允许传统第三方 Cookie。

### 4. 选型 Trace（登录 token）

| 方案 | XSS | CSRF | 备注 |
| --- | --- | --- | --- |
| access token 进 localStorage | 风险高 | 不自动跟请求，CSRF 面小 | 须严格防 XSS |
| 会话 Cookie + HttpOnly | JS 偷不走 | 要 SameSite/CSRF 防护 | 传统 Web 常见 |
| 短 access + 长 refresh 分策略 | 折中 | 看放哪 | 要有轮换与吊销 |

没有银弹：威胁模型决定存储位置。

### 5. 和框架

- 改主题色：localStorage 即可。
- 鉴权：优先跟后端规范；Axios/fetch 拦截器读 token 时，想清楚来源。
- 退出登录：清存储 + 失效服务端会话。

---

## 常见误区

### ❌ Cookie 和 localStorage 都能存，随便选

### ✅ 更准确的说法

Cookie 会进请求头、有大小和安全属性；localStorage 不进请求、怕 XSS。

### 为什么？

选错会要么请求头膨胀，要么 token 被脚本读走。

---

### ❌ 有 HttpOnly 就绝对安全

### ✅ 更准确的说法

HttpOnly 防的是 JS 读 Cookie，不防 CSRF，也不防所有 XSS 造成的「替你发请求」。

### 为什么？

安全要多层：SameSite、CSRF Token、CSP、输入转义等。

---

## 高频追问

### 三者区别？

容量、生命周期、是否自动带请求、能否被 JS 读。

如果把 IndexedDB 算进来，还要补充：它是异步、事务型、适合大量结构化数据；Web Storage 是同步字符串键值。

### token 放哪？

看 XSS vs CSRF 权衡，和后端方案一致；面试讲清利弊比给「标准答案」重要。

### SameSite 是什么？

控制跨站请求是否带 Cookie，常用 Lax/Strict/None（None 要 Secure）。

### 如何删除？

Cookie 要用相同的 Domain/Path 范围把过期时间设到过去；Storage 用 `removeItem` / `clear`。只写同名 Cookie 但 Path 不同，可能删不到原来的那一条。

### 为什么不建议把大 JSON 放 localStorage？

它只能存字符串，读写和序列化都在主线程同步执行，数据大时会造成卡顿；大量结构化或离线数据更适合 IndexedDB。

---

## 延伸阅读

- [XSS 的理解](/md/安全/XSS的理解.md)
- [CSRF 的理解](/md/安全/CSRF的理解.md)
- [HTTPS](/md/网络/HTTPS.md)
- [网络与安全速记](/md/面试准备/技术/网络与安全.md)
