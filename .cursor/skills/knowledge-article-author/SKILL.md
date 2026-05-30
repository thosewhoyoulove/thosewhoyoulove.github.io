---
name: knowledge-article-author
description: >-
  Authors interview-oriented technical articles for the omen Docsify knowledge
  base (docs/md). Enforces 面试定位/面试回答/核心原理 structure, oral scripts, depth,
  project hooks, and cross-links. Use when creating or substantially editing
  knowledge articles, 面试准备 pages, 面经, or when the user asks to write 知识点/面试笔记.
---

# 知识库文章主编

为 [thosewhoyoulove.github.io](https://thosewhoyoulove.github.io/) 的 `docs/md/` 撰写或重写技术文章。产出须能直接用于**面试口述 + 原理追问 + 项目举证**。

## 何时使用

- 新建一篇知识点 / 专题 / 面经条目
- 把零散笔记整理成与仓库一致的正式文章
- 扩写「面试速记」为深文，或从深文提炼速记

## 工作流

1. **查重**：在 `docs/md/` 搜索同主题；若已有深文，只补缺口或写速记提纲，不另起炉灶。
2. **读标杆**：打开 [reference/golden-articles.md](reference/golden-articles.md) 中同类型 1 篇，对齐语气与深度。
3. **定类型**：见下方「文章类型」选结构变体。
4. **撰写**：按 [reference/article-template.md](reference/article-template.md) 填空；口述稿优先于长段原理。
5. **收尾**：补 `高频追问` / `延伸阅读`；需要导航时交给 `docsify-knowledge-site` skill。

## 文章类型

| 类型 | 路径特征 | 额外要求 |
| --- | --- | --- |
| 原理深文 | `基础/` `框架/` `浏览器/` `网络/` 等 | 链路图 + 对比表 + 与竞品/旧版差异 |
| 面试速记 | `面试准备/技术/` | 更短；每条可展开，文末链到深文 |
| 项目架构 | `面试准备/项目与架构/` | STAR 或「背景→方案→难点→结果→验证」 |
| 综合软技能 | `面试准备/综合/` | 强调流程、边界、风险；可含 checklist |
| 面经实录 | `面试准备/*面经*` | 保留原题；答案仍用五段式，标注公司/轮次 |

## 固定章节（原理深文 / 项目文）

```markdown
# 标题

## 面试定位
（3～6 句：考什么、面试官想听什么、和哪类题绑定）

## 面试回答

> （30～90 秒口述稿，第一人称，可背诵）

一句话总结：

> （单行结论，含关键词）

---

## 核心原理
（总览 + 主链路 text/mermaid/代码）

## 1. …
## 2. …
…

## 高频追问
### 问题？
（2～4 句答）

## 延伸阅读
- [标题](/md/分类/文件.md)
```

速记文可省略编号小节的部分细节，但**必须有** `面试定位` + 可口述段落 + 链到深文。

## 写作标准

### 口述稿（`## 面试回答`）

- 用 `> ` 引用块包裹主答，语气像现场说话，避免「本文将介绍」。
- 结构建议：**结论一句 → 分点机制 → 项目/验证一句 → 边界一句**。
- 「一句话总结」单独一行 `> `，便于考前速览。

### 原理节

- 先给**主链路**（`text` 或 `mermaid`，二选一即可），再拆小节。
- 每节至少包含其一：示意图、表格、短代码、与前一节的因果关系。
- 写**取舍**：为什么选 A 不选 B、什么场景不适用。
- 版本相关（React 18、Vue 3、Vite 5 等）写明适用范围，避免泛化到所有版本。

### 项目与验证

至少一处写清：

- 在什么业务里用过（可虚构为「典型 B 端/大屏/RTC」若用户未提供细节，但须标注为示例）
- 如何验证（指标、监控、单测、联调、Profile）

### 代码块

- 标注语言：`js` `ts` `jsx` `bash` `text`。
- 优先「最小可读片段」；完整配置放折叠或单独小节。
- 手写题（Promise、深拷贝等）与仓库现有 `手写Promise.md` 风格一致：分步实现 + 边界说明。

### 对比与追问

- 双框架/双方案：用 Markdown 表格（见标杆文 React vs Vue 小节）。
- `## 高频追问`：3～6 条，问答简短，覆盖「是什么 / 为什么 / 和 X 区别 / 坑」。

### 站内链接

- 延伸阅读用 Docsify 路径：`/md/分类/文件名.md`；空格写 `%20`。
- 链接到已有专题，避免孤儿页。

## 禁止

- 纯百科定义、无面试角度的长文
- 未经验证的 API 或「据说」类表述
- 与现有深文大段重复（应合并或互链）
- 英文标题正文（专有名词除外）

## 完成后自检

- [ ] 不读原理也能从「面试回答」答出一轮
- [ ] 每个核心结论能回答「为什么」和「什么时候不适用」
- [ ] 至少 1 个表格或链路图
- [ ] 延伸阅读 / 速记互链已检查
- [ ] 需要侧边栏时已触发 `docsify-knowledge-site`

## 参考

- 模板：[reference/article-template.md](reference/article-template.md)
- 标杆索引：[reference/golden-articles.md](reference/golden-articles.md)
- 站点导航：`docsify-knowledge-site`
- 领域扩写：`fullstack-knowledge-expansion`、`agent-frontend-knowledge`
- 定稿校对：`technical-accuracy-review`
- 复习网同步：`interview-curriculum-sync`
