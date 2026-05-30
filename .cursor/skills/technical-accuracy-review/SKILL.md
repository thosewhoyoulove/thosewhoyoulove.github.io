---
name: technical-accuracy-review
description: >-
  Reviews knowledge-base articles for technical accuracy before publish: React,
  Vue, browser, network, security, Node, TypeScript, build tools, and common LLM
  hallucinations. Use after drafting or when user asks to fact-check 知识点/面试笔记.
---

# 技术事实校验

在文章定稿或 PR 前做**第二遍审查**，专门消灭模型常见幻觉与版本错配。不替代 `knowledge-article-author` 的写作流程。

## 何时使用

- 新文/大改写完，准备提交或发布前
- 用户说「校对」「核实」「有没有错」
- 涉及版本敏感 API（React 18、Vue 3.4+、Vite 5、Node LTS）

## 审查流程

1. **标出高风险句**：凡含版本号、执行顺序、「一定/永远/所有」的绝对化表述。
2. **按领域对照** [reference/common-pitfalls.md](reference/common-pitfalls.md)。
3. **输出审查表**（见下方模板），只改事实错误，不顺手改文风。
4. 无法确认的结论：改为「需对照官方文档」或删除，**不编造**。

## 输出模板

```markdown
## 技术审查结果

| 位置 | 原表述 | 问题 | 建议修改 |
| --- | --- | --- | --- |
| §x / 口述稿 | … | 版本/顺序/概念错误 | … |

**通过项**：（无问题时写「未发现事实性错误，建议仍对照官方文档发布」）

**待用户确认**：（需查官方或依赖具体版本时列出）
```

## 审查维度

### 概念与术语

- Fiber / VNode / Proxy 等是否张冠李戴
- 微任务/宏任务、渲染流水线、缓存层级是否混淆
- CSRF / XSS / CORS 机制是否写反

### 版本与行为

- React 17 vs 18 批处理、`useEffect` 时机
- Vue 2 Options API vs Vue 3 Composition 响应式
- `useLayoutEffect` vs `useEffect` 与 paint 顺序
- Service Worker 缓存策略名称

### 代码与 API

- 示例代码是否能在所述版本运行
- 是否把提案/实验 API 写成已稳定
- 手写题边界（Promise.finally、async 并行）是否遗漏

### 网络与全栈

- TCP 握手/挥手序号、TLS 步骤
- JWT「加密」误称（应为签名）
- Node「单线程」是否补充 libuv 线程池

### Agent / AI 前端

- SSE 事件格式、OpenAI 风格 delta 是否过度具体化
- 未读文档的 SDK 方法名不写入正文

## 与写作 skill 的关系

| 阶段 | Skill |
| --- | --- |
| 撰写 | `knowledge-article-author` |
| 校对 | `technical-accuracy-review`（本 skill） |
| 入库导航 | `docsify-knowledge-site` + `interview-curriculum-sync` |

## 禁止

- 因「听起来更高级」而添加未经核实的优化技巧
- 用审查结果大段重写口述稿风格（除非事实绑定在口述句上）

## 参考

常见误区清单：[reference/common-pitfalls.md](reference/common-pitfalls.md)
