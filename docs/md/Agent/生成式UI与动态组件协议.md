# 生成式 UI 与动态组件协议

## 面试定位

Accio 类 Agent 岗位常问：后端返回的不是固定页面，而是**随推理变化的结构**时，前端如何渲染。重点是 **组件协议（schema）+ 白名单渲染器 + 流式半成品如何收敛成确定性 UI**，不是堆卡片样式。

## 面试回答

可以这样答：

> 生成式 UI 的核心不是让模型直接吐 HTML，而是约定一套组件协议：模型或编排层输出结构化描述，例如卡片类型、字段、操作按钮、数据绑定，前端用白名单注册表把它映射成真实 React 组件。流式场景下协议可能先到类型、再到字段、最后到完整 payload，渲染器要支持 partial → complete，非法类型降级为安全占位，而不是执行任意代码。状态上每个 UI 块有稳定 id，与 run/message 关联，修订事件可以替换同一块而不是无限追加。这样用户感知是流畅的动态工作台，工程上仍是可控、可测、可审计的确定性渲染。B2B 寻源、匹配结果这类高密度信息，更适合协议驱动的表格/对比卡，而不是纯 Markdown。

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
