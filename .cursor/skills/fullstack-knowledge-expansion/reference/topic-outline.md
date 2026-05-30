# 全栈扩写专题提纲

每篇按 `knowledge-article-author` 五段式撰写。标题供规划用，非必须全部覆盖。

## Node.js 运行时

- [ ] 事件循环与 libuv（深化 `Node.js/事件循环.md`）
- [ ] Worker Threads / 子进程 vs 主线程
- [ ] Stream 与大文件上传
- [ ] 进程管理：PM2 / 容器内单进程注意事项（浅）

## 接口与 BFF

- [ ] BFF 分层与错误码统一
- [ ] REST 设计 + 版本演进（/v1）
- [ ] GraphQL 何时值得（对比 REST，前端视角）
- [ ] 接口幂等与重复提交
- [ ] 文件上传：预签名 OSS vs 直传

## 鉴权与安全协作

- [ ] Session + Cookie vs JWT（表格对比）
- [ ] OAuth2 / 第三方登录流程（前端 redirect 链）
- [ ] RBAC 在前端的体现（路由、按钮权限）
- [ ] 与 [CSRF](/md/安全/CSRF的理解.md)、[XSS](/md/安全/XSS的理解.md) 的衔接

## 数据层（浅）

- [ ] Prisma / TypeORM 选型一句话
- [ ] Redis 缓存：穿透、击穿、雪崩（面试级）
- [ ] 事务：什么操作必须事务

## SSR 与部署

- [ ] Next.js / Nuxt SSR 与 CSR 取舍（若扩框架）
- [ ] 环境变量、配置分环境
- [ ] 日志、traceId、前后端联调

## 面试速记（可选）

在 `面试准备/技术/NodeJs & 全栈开发.md` 增补条目即可，勿重复深文段落。
