# 生成式 UI 与动态组件协议

## 面试定位

Accio 类 Agent 岗位常问：后端返回的不是固定页面，而是**随推理变化的结构**时，前端如何渲染。重点是 **组件协议（schema）+ 白名单渲染器 + 流式半成品如何收敛成确定性 UI**，不是堆卡片样式。

## 面试回答

可以这样答：

> 生成式 UI 的核心不是让模型直接生成 HTML，而是让它在有限的 UI DSL 中表达意图。事件进入状态层前先按版本化 schema 校验和迁移，渲染层只接受 discriminated union，并通过白名单注册表映射到真实 React 组件。流式数据按稳定 `blockId` 和递增 revision patch；半成品只能展示骨架，不触发昂贵组件或业务副作用。用户 action 也必须来自注册表中的允许集合，参数由已校验的组件状态生成，带 `actionId` 和幂等键回传，不能执行模型塞进 props 的任意 URL、命令或组件名。未知类型和不兼容版本降级为安全占位。这样生成是开放的，协议、渲染和交互边界仍然确定、可测、可审计。

一句话总结：

> 生成式 UI = 白名单组件协议 + 流式 partial 渲染 + 非法/未知类型安全降级。

---

## 核心原理

```text
Agent 推理 / 工具结果
  → 产出 UI Intent（结构化，非任意 HTML）
  → 校验 schema（类型、版本、必填）
  → Renderer 查注册表 → 真实组件
  → 用户操作回传 action（再进入 Agent 循环）
```

示意协议（概念级，非某厂商 API）：

```ts
type UIBlock = {
  id: string
  type: 'ProductCompare' | 'SupplierCard' | 'MetricPanel' | 'Markdown'
  version: 1
  status: 'partial' | 'ready' | 'error'
  props: Record<string, unknown>
  actions?: Array<{ id: string; label: string; intent: string }>
}
```

生产代码更适合为每种 `type` 定义独立 props，而不是长期使用 `Record<string, unknown>`；后者只是概念示意。协议在网络事件入口校验一次，在执行 action 前还要校验一次语义与权限。

---

## 1. 为什么不能直接渲染模型 HTML

| 做法 | 问题 |
| --- | --- |
| 模型输出 HTML/JSX 字符串 | XSS、样式失控、无法类型约束 |
| 纯 Markdown | 复杂 B2B 对比/筛选交互不够 |
| 白名单组件协议 | 可控、可测、可国际化、可埋点 |

**要点**：模型负责“选什么积木、填什么数据”；前端负责“积木怎么安全落地”。

---

## 2. 流式与非结构化如何变成稳健 UI

常见事件序：

```text
ui_block_open { id, type }
  → ui_block_patch { 增量 props }
  → ui_block_ready | ui_block_error
```

策略：

- **partial**：骨架 + 已知字段；禁止在半截 JSON 上初始化重型图表。
- **ready**：再做完整校验与最终布局。
- **未知 type**：降级为 `Markdown` 或“暂不支持的视图”占位，上报 `unknown_ui_type`。
- **版本不兼容**：按 `version` 走兼容层或提示刷新客户端。

与纯文本流式的差别：文本是 append；生成式 UI 常常是 **patch 同一 block**。

---

## 3. 组件注册表与回传 action

```ts
const registry = {
  SupplierCard: SupplierCardView,
  ProductCompare: ProductCompareView,
  // 未注册 → FallbackView
}
```

用户点击“对比这三家供应商”：

```text
UI action → 前端发 run 事件（blockId + actionId + 表单值）
  → 后端继续 Agent
  → 可能 patch 旧卡或新增结果卡
```

每次 action 应包含当前 `revision`，服务端据此拒绝过期卡片上的操作；创建订单、发信等动作再加 idempotency key，避免双击或重连导致重复执行。导航与外链同样走允许列表，不能因为“只是 UI”就绕过安全边界。

**场景（示例）**：跨境寻源 Agent 流式吐出供应商卡；字段陆续补全评分与交期；用户点“加入短名单”触发 HITL 确认后再写业务系统。

**验证**：协议契约测试（合法/非法 schema）、未知类型降级用例、流式 patch 不闪烁的视觉回归。

---

## 高频追问

### 生成式 UI 和工具调用卡片有什么关系？

工具卡片是生成式 UI 的一种特化；生成式 UI 更泛，可覆盖对比表、筛选器、看板。工具态仍建议复用同一 block 协议。

### 如何保证体验“确定”？

协议校验失败不进业务组件；用户操作有明确 pending；同一 `blockId` 更新可预测。随机性留在模型侧，渲染侧走确定性状态机（见不确定性状态机文）。

### 要不要让模型直接选任意 antd 组件名？

不建议。类型集合应由产品定义并版本化；模型只在枚举内选择。

---

## 延伸阅读

- [不确定性下的前端状态机](/md/Agent/不确定性下的前端状态机.md)
- [对话界面架构](/md/Agent/对话界面架构.md)
- [工具调用与结果展示](/md/Agent/工具调用与结果展示.md)
- [人机协同与主动式交互](/md/Agent/人机协同与主动式交互.md)
