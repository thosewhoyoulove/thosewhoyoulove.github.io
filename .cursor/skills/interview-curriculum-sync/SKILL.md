---
name: interview-curriculum-sync
description: >-
  Keeps interview curriculum files consistent when adding topics: 面试总览,
  复习路线, 高频追问清单, README content map, and 面试准备/技术 速记 pages. Use after
  new knowledge articles or sidebar changes to update cross-links and self-test
  questions.
---

# 面试体系同步

新增或重组知识点后，除写文章与侧边栏外，还要更新**复习入口网**，避免「有深文、复习路径找不到」。

与 `docsify-knowledge-site` 分工：本 skill 管**内容与链路**，不管 Docsify 配置细节。深文怎么写（口述、原理、误区）以 `knowledge-article-author` 为准；本 skill 只保证复习网能指到深文，并抽出可自测的追问链。

## 何时使用

- 完成一篇新的原理深文或 Agent/全栈专题
- 新增 `面试准备/技术/` 速记或改 `generateSidebar.js` 大类
- 用户要求「纳入复习路线」「补追问」「更新总览」

## 核心文件（真相源优先级）

| 文件 | 作用 |
| --- | --- |
| `docs/md/面试准备/面试总览.md` | 整站怎么用、知识地图入口 |
| `docs/md/面试准备/复习路线.md` | 3 天 / 1 周阅读顺序 |
| `docs/md/面试准备/高频追问清单.md` | 自测题 + 链到深文 |
| `docs/README.md` | 站首页表格「内容地图」 |
| `docs/md/面试准备/技术/*.md` | 分方向速记（提纲，不重复深文） |

完整路径列表：[reference/curriculum-files.md](reference/curriculum-files.md)。

## 同步工作流

1. **定层级**
   - **深文**：`基础/` `框架/` `Agent/` 等 → 服从主编结构（面试回答 → 原理 → 常见误区 → 高频追问 → 延伸阅读）
   - **速记**：`面试准备/技术/` → 3～10 条 bullet + `[深文](链接)`；可用「关键词箭头」呼应深文一句话总结
   - **追问**：`高频追问清单.md` → 从深文「高频追问」提炼 2～5 条**链式**自测题（由浅到深）

2. **更新速记**（若主题属已有方向）
   - 例：新 HTTP/3 文 → 改 `网络与安全.md` 增加一行 + 链接
   - 例：新 Agent 文 → 新建速记或扩 `新技术.md`（避免堆太长则新建 `Agent 前端速记.md`）

3. **更新追问清单**
   - 优先复用深文追问链的骨架，而不是另造一套无关题
   - 文末「参考」区补链：`[标题](/md/...)`

4. **更新复习路线**
   - 仅当属于**高频**或用户明确要求纳入冲刺路线
   - 在对应「第 N 天」或表格中加 1 行链接，不重写整篇路线

5. **更新面试总览 + README**
   - 总览「知识地图」与 README 表格保持一致（列：方向、说明、入口链接）

6. **自检**
   - 从 `面试总览` → `复习路线` → 深文，链路 ≤3 次点击
   - 速记页无与大段深文重复的段落

## 追问编写格式

与现有清单一致，并尽量暗示追问链：

```markdown
- 问题句？（可含：↓ 追问下一层）
```

参考区：

```markdown
参考：[标题](/md/分类/文件.md)、[另一篇](/md/...).
```

## 复习标准（与主编对齐）

凡在总览/路线/清单中提到的复习标准，保持：

```text
能口述 2～3 分钟标准回答
→ 能解释口述里每个关键结论为什么成立
→ 能 Trace 一个最小例子
→ 能说出设计取舍与常见误区
→ 能沿追问链继续深入
```

不要再单独强调「必须有面试定位」——该章节已从深文规范中移除。

## 不要做的事

- 不要把深文全文复制进速记或清单
- 不要只改 `_sidebar.md` 而不改总览/清单（侧栏可见但复习网断开）
- 不要为了凑数加低频追问（清单质量 > 数量）
- 不要在本 skill 里重写深文结构（交回 `knowledge-article-author`）

## 与其他 skill 的关系

```text
knowledge-article-author  → 写出深文
technical-accuracy-review → 事实校对
docsify-knowledge-site    → 侧边栏 / 链接
interview-curriculum-sync → 本 skill：总览 / 路线 / 清单 / 速记
```

## 完成后清单

- [ ] 深文 `延伸阅读` 已指向相关速记/清单（双向更好）
- [ ] 至少一处：`高频追问清单` 或对应速记已更新
- [ ] 高频主题：`复习路线` 或 `面试总览` 已提及
- [ ] `docs/README.md` 内容地图已核对
- [ ] 侧边栏已由 `docsify-knowledge-site` 处理
