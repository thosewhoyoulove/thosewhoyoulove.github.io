# NodeJs & 全栈开发

以下问题偏后端与全栈协作，回答时建议：**先说结论 → 关键机制 → 项目里怎么落地的**。可与 [Node.js 事件循环](/md/Node.js/事件循环.md) 对照复习。

---

## 你在 Nest.js 里用过哪些装饰器？你能手写一个 Nest.js 的 `@Middleware()` 吗？

**常考点**：`@Controller` `@Get`/`@Post`、`@Injectable`、`@Module`、`Guard`、`Interceptor`、`Pipe` 等分工。  
**手写 Middleware（口述思路）**：实现 Nest 中间件接口，在 `use(req, res, next)` 里做逻辑，模块里 `configure` 里 `consumer.apply(Mw).forRoutes(...)`；或与 Express 中间件桥接。重点在**执行顺序**、错误传递到 `next(err)`。

---

## RESTful API 设计有哪些规范？如何设计一个好的 API？

**规范简述**：资源名词（复数路径）、HTTP 动词表意（GET 安全幂等、POST 创建、PUT/PATCH 更新、DELETE 删除）、合适的状态码、版本化、`idempotent` 设计、分页过滤排序、统一错误体、HATEOAS（可选）。  
**好的 API**：一致命名、可读文档（OpenAPI）、限流与鉴权、可演进（兼容字段）、监控与日志。

---

## 你在项目里用过 JWT 认证吗？JWT 有哪些安全隐患？

**JWT 结构**：`header.payload.signature`，服务端用密钥校验签名，**无状态**可水平扩展。  
**风险**：泄露即长期有效（需**短有效期 + refresh**）、无法在服务端随意作废单 token（除非黑名单/版本号）、payload 勿存敏感明文、`alg=none`/密钥太弱、存在 XSS 时存 `localStorage` 易被窃取（更常见是 **HttpOnly Cookie** 存会话或双令牌策略）。  
**实践**：HTTPS、校验 `iss`/`aud`/`exp`、旋转密钥、关键操作用步进式验证。

---

## 你如何优化数据库查询？在 Nest.js 里有没有用过 ORM，比如 Prisma 或 TypeORM？

**优化**：合适索引、避免 N+1（`include`/join）、分页、只 select 必要字段、读主从/缓存热点、慢查询日志。  
**ORM**：TypeORM/Prisma 迁移、事务边界、避免在循环里逐条 IO；可提连接池与 TypeScript 类型体验。

---

## Node.js 单线程是如何处理高并发的？为什么可以做到异步非阻塞？

**模型**：单线程跑 **JavaScript**，I/O 由 **libuv** 线程池/系统异步接口处理，完成回调进入**事件循环**队列；CPU 密集任务会阻塞需 Worker/子进程。  
**要点**：非阻塞指 I/O 不傻等；高并发指大量连接通过事件驱动 + 异步回调/async 协作，而不是为每个请求开一个线程。

更多：[Node.js 事件循环](/md/Node.js/事件循环.md)。
