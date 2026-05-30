# 常见技术误区（校对清单）

审查时逐项扫一眼，命中则改正或加版本限定。

## JavaScript / 浏览器

| 误区 | 更准确的说法 |
| --- | --- |
| 「宏任务一定先于微任务」 | 先清空微任务队列，再取一个宏任务；具体看 [事件循环](/md/浏览器/浏览器的事件循环.md) |
| 「闭包一定导致内存泄漏」 | 闭包本身不是泄漏；未释放的引用才是 |
| `typeof null === 'object'` 是 bug 未修复 | 历史兼容行为，面试可提但不写成「即将修复」 |

## React

| 误区 | 更准确的说法 |
| --- | --- |
| 「setState 立刻更新 DOM」 | 进入调度，render + commit 后 DOM 才变 |
| 「useEffect 在 DOM 更新前执行」 | DOM 更新后、paint 后（layout effect 在 paint 前） |
| 「Fiber 等于 Virtual DOM」 | Fiber 是工作单元；Element 是描述 |
| 「React 18 所有 setState 都批处理」 | 多数自动批处理；`flushSync` 可打破 |
| 「key 用 index 永远没问题」 | 列表重排/插入时易状态错位 |

## Vue

| 误区 | 更准确的说法 |
| --- | --- |
| 「Vue3 用 Object.defineProperty」 | Vue3 用 Proxy；Vue2 才是 defineProperty |
| 「Vue 没有虚拟 DOM」 | 有 VNode + patch，实现路径与 React 不同 |

## 网络 / 安全

| 误区 | 更准确的说法 |
| --- | --- |
| 「HTTPS 加密整个 URL」 | 路径/方法可见；内容加密 |
| 「JWT 内容加密」 | payload 仅编码；靠签名防篡改 |
| 「CORS 错误是后端 bug」 | 浏览器同源策略；需服务端头或代理 |
| 「CSRF 靠 CORS 防护」 | CSRF 用 Token、SameSite 等；CORS 不防 CSRF |

## Node / 全栈

| 误区 | 更准确的说法 |
| --- | --- |
| 「Node 完全单线程」 | JS 执行单线程；libuv 线程池处理部分 I/O/CPU 任务 |
| 「BFF 可以替代所有后端」 | 聚合与适配层，业务域仍在后端服务 |
| 「ORM 一定比 SQL 慢」 | 取决于查询方式；N+1 是常见问题 |

## 工程化

| 误区 | 更准确的说法 |
| --- | --- |
| 「Vite 生产也用 esbuild 打包所有」 | 生产默认 Rollup；开发用 esbuild 预构建 |
| 「Tree shaking 删除所有死代码」 | 受副作用标记、CommonJS 等限制 |

## Agent / 流式前端

| 误区 | 更准确的说法 |
| --- | --- |
| 「SSE 双向通信」 | SSE 服务端→客户端；上行需另接口 |
| 「流式等于 WebSocket」 | 协议、代理、重连策略不同 |
| 臆造 OpenAI/Cursor 字段名 | 以当前官方文档为准，或写抽象 event 类型 |

## 审查通过标准

- 绝对化表述已加边界或删除
- 版本敏感句已标明 React/Vue/Node 范围
- 代码示例与正文机制一致
- 无上述表格中的典型反例残留
