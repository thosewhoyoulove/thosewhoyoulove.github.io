---
name: knowledge-article-author
description: >-
  Authors interview-oriented technical articles for the omen Docsify knowledge
  base (docs/md). Enforces 面试回答-first structure, 2–3 min oral scripts, main
  chain + Trace + Why, 常见误区, and follow-up chains. Use when creating or
  substantially editing knowledge articles, 面试准备 pages, 面经, or when the
  user asks to write 知识点/面试笔记.
---

# 知识库文章主编

为 thosewhoyoulove.github.io 的 `docs/md/` 撰写或重写面向前端面试的技术文章。

文章服务于三个目标：

1. 打开文章后，可以第一时间找到并背诵标准面试回答。
2. 不理解口述稿中的某句话时，可以继续向下阅读原理并真正理解。
3. 面试官继续追问时，可以沿着正文逐层深入到算法、数据结构和源码实现。

优先级：

技术准确性 > 面试可表达性 > 可理解性 > 原理深度 > 源码细节 > 篇幅。

---

# 核心输出结构

原理深文默认使用：

# 标题

## 面试回答

> 2～3 分钟标准口述稿。

**一句话总结：**

> 一句话压缩核心机制和关键词。

---

## 核心原理

### 1. 为什么需要这个机制

### 2. 整体执行链路

### 3. 核心机制一

### 4. 核心机制二

...

## 常见误区

## 高频追问

## 延伸阅读

不再生成 `面试定位`。

除非主题非常复杂，否则不要同时生成 30 秒、2 分钟、5 分钟多个重复版本的回答。

---

# 面试回答

`## 面试回答` 必须是文章标题之后的第一个章节。

目标不是展示最多知识，而是生成一份候选人真正可以在面试现场说出来的答案。

推荐结构：

结论
→ 为什么
→ 核心机制
→ 关键流程
→ 关键例子
→ 设计取舍/边界

要求：

- 默认控制在正常语速 2～3 分钟。
- 第一人称自然口语表达。
- 不使用“本文主要介绍”“下面分几点介绍”等文章语言。
- 不为了体现深度而堆源码函数名。
- 每句话都应该是候选人理解后能够解释的。
- 后文必须能够解释口述稿中出现的所有重要概念。
- 口述稿不能出现正文完全没有解释的术语。
- 重要源码名只在确实能体现理解时出现。
- 回答必须有明显主线，而不是知识点列表。

文章虽然先展示面试回答，但生成时必须先确保底层原理正确，再将原理压缩为口述稿。

也就是说：

“展示顺序”是：

面试回答 → 核心原理 → 源码/追问

但“知识组织逻辑”必须是：

理解机制 → 验证例子 → 确认边界 → 压缩成面试回答

---

# 一句话总结

紧跟在面试回答之后。

不是重新解释概念，而是用于考前快速回忆整条知识链。

例如 React Diff：

> 同层比较 → key/type 判断 Fiber 复用 → 数组顺序扫描 → Map 匹配剩余节点 → lastPlacedIndex 判断移动 → Placement → Commit 操作 DOM。

优先使用“关键词 + 因果/流程箭头”，让读者看到这一句话就能回忆完整回答。

---

# 核心原理

正文的任务是：

> 解释清楚上面的面试回答为什么成立。

禁止正文变成与口述稿无关的百科扩写。

面试回答里每一个可能被追问的重要结论，都应该能在正文找到对应解释。

例如面试回答出现：

> React 使用 lastPlacedIndex 判断节点是否需要移动。

正文必须继续回答：

- lastPlacedIndex 是什么？
- 为什么需要它？
- 初始值是什么？
- 什么时候更新？
- oldIndex < lastPlacedIndex 为什么代表需要移动？
- Placement 是什么？
- Placement 最后如何变成真实 DOM 移动？

---

# 三层精度

涉及框架原理时区分：

## 直觉模型

第一次学习时用于建立心智模型。

允许简化，但不能制造错误认知。

## 工程模型

面试回答应该采用的准确描述。

## 源码模型

真实数据结构、函数、变量和执行阶段。

如果常见教学说法并不完全准确，必须明确：

> 为了方便理解，可以先认为……；更准确地说……

例如：

> 通常会说 React Diff 是“比较两棵虚拟 DOM 树”。为了理解可以这样认为；但在 Fiber 架构下，更准确地说，reconciliation 会根据旧 Fiber 和本次产生的 children 构建新的 workInProgress Fiber。

---

# 主链路优先

复杂原理进入细节之前，必须先画出整体链路。

例如 React 更新：

setState
↓
调度更新
↓
Render
↓
beginWork
↓
reconcileChildren
↓
Child Reconciliation
↓
生成/复用 Fiber
↓
标记 Flags
↓
Commit
↓
DOM Mutation

后面的每个知识点必须能够定位到这条链路。

读者应该始终知道：

- 当前在哪个阶段？
- 输入是什么？
- 正在处理什么？
- 输出是什么？
- 下一步是什么？

---

# 机制必须 Trace

涉及算法、状态流转、调度、生命周期、响应式、编译等机制时，至少提供一个最小例子逐步执行。

禁止：

输入
→ 直接给最终结果

必须展示：

输入
→ 第一次判断
→ 状态变化
→ 第二次判断
→ 状态变化
→ 最终结果

对于关键变量，尽可能使用表格。

例如：

| 当前节点 | oldIndex | lastPlacedIndex | 判断 | 结果 |
| --- | ---: | ---: | --- | --- |
| A | 0 | 0 | 0 >= 0 | 复用 |
| C | 2 | 0 | 2 >= 0 | 不移动，lastPlacedIndex = 2 |
| B | 1 | 2 | 1 < 2 | Placement |

表格之后必须用自然语言解释：

> 为什么这个比较能够得到这个结论？

---

# 关键变量解释规则

对于：

- lastPlacedIndex
- Lane
- memoizedState
- updateQueue
- flags
- deps
- pending
- baseQueue
- alternate

等关键变量，禁止只解释定义。

必须回答：

1. 它是什么？
2. 为什么需要它？
3. 没有它无法解决什么问题？
4. 它什么时候读取？
5. 它什么时候变化？
6. 变化以后影响什么？
7. 用一个具体例子跑一次。

---

# 术语首次出现规则

禁止使用术语解释术语。

第一次出现重要术语时：

术语
→ 白话解释
→ 解决什么问题
→ 在当前链路的位置
→ 技术定义
→ 必要时源码名称

例如：

### bailout 是什么？

先说：

> bailout 可以先理解成“React 发现这里没有必要继续计算，于是提前退出并复用已有工作”。

再解释源码机制。

禁止直接写：

> React 通过 bailout 优化 reconciliation。

然后默认读者已经理解 bailout。

---

# 区分不同对象

框架原理文章必须避免“节点”“更新”“树”等模糊表达。

React 相关内容尤其需要严格区分：

React Element
→ 描述 UI

Fiber
→ React 内部工作单元和运行时数据结构

DOM Node
→ 浏览器真实节点

以及：

Trigger / Schedule
Render / Reconciliation
Commit
Browser Layout / Paint

如果上下文可能产生歧义，直接说明：

> 这里的“节点”指 Fiber，不是 DOM。

---

# Why 原则

任何核心结论至少继续追问一次“为什么”。

例如：

> React 列表需要 key。

不能停在：

> key 可以提升 Diff 性能。

必须继续解释：

- React 在什么阶段读取 key？
- key 用来识别什么？
- 为什么稳定 key 才有意义？
- 没有 key 时如何退化？
- index key 为什么可能导致状态错位？
- key 是否直接决定 DOM 是否移动？

同样适用于：

- 为什么 Hooks 不能写在条件语句中？
- 为什么需要 Fiber？
- 为什么 useEffect 在 Commit 后处理？
- 为什么 Vue 3 使用 Proxy？
- 为什么 Scheduler 需要优先级？

---

# 源码规则

源码是解释机制的工具，不是展示深度的装饰。

源码部分遵循：

问题
→ 数据结构
→ 核心变量
→ 核心函数
→ 执行过程
→ 最终结果

第一次出现源码函数必须说明职责。

例如：

`placeChild`
→ 判断当前 Fiber 是保持位置、首次插入还是需要移动，并设置 Placement。

而不是只列：

ChildReconciler
reconcileChildrenArray
updateSlot
updateFromMap
placeChild
commitPlacement

禁止连续罗列源码函数而不解释它们之间的调用和数据变化。

---

# 设计取舍

原理深文必须回答：

- 为什么 React 采用这种方案？
- 有没有更简单的方案？
- 有没有理论上更优的方案？
- 当前方案优化的主要目标是什么？
- 为此牺牲了什么？
- 哪些场景下表现不好？

例如 Diff：

> React 的列表 Diff 不是为了求理论上的最少 DOM 移动，而是在控制 reconciliation 成本的前提下，通过启发式和贪心策略处理常见 UI 更新。

---

# 常见误区

原理深文必须包含：

## 常见误区

至少列出 2～5 个真正容易在面试中说错的点。

格式：

### ❌ React 每次 setState 都一定重新执行整个子树

### ✅ 更准确的说法

...

### 为什么？

...

优先检查：

- 把“通常”说成“一定”
- 把教学模型说成源码事实
- Element / Fiber / DOM 混淆
- Render / Commit 混淆
- 创建 Fiber / 创建 DOM 混淆
- “异步”“同步”等模糊表述
- 算法方向错误
- 把启发式算法描述成理论最优

---

# 高频追问

默认 4～8 个。

按照真实面试追问链组织，而不是随机罗列。

例如 React Diff：

React Diff 的核心思想是什么？
↓
为什么需要 key？
↓
数组 Diff 怎么处理？
↓
lastPlacedIndex 是什么？
↓
为什么 [A,B,C] → [A,C,B] 移动的是 B？
↓
Placement 是不是立即移动 DOM？
↓
Commit 阶段怎么移动？
↓
React 和 Vue 3 Diff 有什么区别？

回答控制在能够继续口述展开的程度。

---

# 完成后自检

- [ ] 标题之后第一个章节是否为「面试回答」？
- [ ] 是否删除无必要的「面试定位」？
- [ ] 面试回答是否适合 2～3 分钟口述？
- [ ] 一句话总结能否唤起整条回答链？
- [ ] 面试回答里的重要术语是否都能在正文找到解释？
- [ ] 是否先给主链路，再进入源码细节？
- [ ] 机制类知识是否至少有一个逐步 Trace？
- [ ] 是否解释关键变量为什么存在？
- [ ] 是否避免术语解释术语？
- [ ] 是否区分 Element / Fiber / DOM 等不同层级？
- [ ] 是否区分 Render / Commit 等不同阶段？
- [ ] 每个核心结论是否至少回答一次 Why？
- [ ] 是否解释设计取舍，而不是只描述“怎么做”？
- [ ] 示例是否真的符合实现？
- [ ] 是否检查绝对化、方向性和版本相关错误？
- [ ] 是否包含「常见误区」？
- [ ] 高频追问是否形成由浅到深的追问链？

---

# 参考与生态协作

- 模板：[reference/article-template.md](reference/article-template.md)
- 标杆索引：[reference/golden-articles.md](reference/golden-articles.md)

写完深文后按需接力（本 skill 定义「写什么」；下列 skill 不改写作结构）：

| 下一步 | Skill |
| --- | --- |
| 事实校对 | `technical-accuracy-review` |
| 路径 / 侧边栏 / 预览 | `docsify-knowledge-site` |
| 总览 / 路线 / 追问清单 / 速记 | `interview-curriculum-sync` |
| 全栈领域边界 | `fullstack-knowledge-expansion` |
| Agent 前端领域边界 | `agent-frontend-knowledge` |

仓库规则底线：`.cursor/rules/knowledge-base.mdc`（与本文结构保持一致）。