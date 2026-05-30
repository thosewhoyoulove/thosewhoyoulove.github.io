---
name: docsify-knowledge-site
description: >-
  Maintains the Docsify knowledge site under docs/: paths, sidebar generation,
  _sidebar.md, generateSidebar.js, local preview, and internal link conventions.
  Use when adding articles, changing navigation, updating README map, or fixing
  broken Docsify links in this repository.
---

# Docsify 知识库站点维护

本仓库站点根目录为 **`docs/`**（不是仓库根）。Docsify 配置在 `docs/index.html`，侧边栏源数据在 `docs/scripts/generateSidebar.js`。

## 何时使用

- 新增或重命名 `docs/md/**/*.md`
- 调整左侧面试导向目录
- 修复站内链接、预览站点
- 更新 `docs/README.md` 内容地图

## 目录约定

```text
docs/
├── index.html          # Docsify 入口（慎改密钥配置）
├── README.md           # 首页与内容地图
├── _sidebar.md         # 生成产物，勿手改长期结构
├── _coverpage.md
├── scripts/
│   └── generateSidebar.js   # 侧边栏唯一真相源
└── md/
    ├── 基础/
    ├── 框架/
    ├── 浏览器/
    ├── 网络/
    ├── 安全/
    ├── 工程化/
    ├── 面试准备/
    └── …
```

新文章放在 `docs/md/<已有或新建分类>/`，文件名用中文或英文与现有一致，避免随意空格（已有空格的路径在链接里用 `%20`）。

## 更新侧边栏（必做）

新增文章且需要在左侧展示时：

1. 编辑 `docs/scripts/generateSidebar.js` 中的 `SIDEBAR` 数组：
   - 条目格式：`["显示名", "/md/分类/文件名.md"]`
   - 嵌套分组：`{ title: "分组名", children: [...] }`
   - 保持**面试导向**顺序（总览 → JS/浏览器 → 网络 → 框架 → 工程化 → 项目 → 协作）
2. 在 `docs/` 目录执行：

```bash
pnpm run generate-sidebar
```

若无 pnpm：`npm run generate-sidebar`。

3. 确认 `docs/_sidebar.md` 已更新；提交时 **同时提交** `generateSidebar.js` 与 `_sidebar.md`（若用户要求提交）。

仅改文章正文、且该文已在 `SIDEBAR` 中：可只改 md，不必动脚本。

## 站内链接规则

| 场景 | 写法 |
| --- | --- |
| 延伸阅读 / 文内链接 | `[标题](/md/分类/文件.md)` |
| 路径含空格 | `React%20渲染原理.md` 或对整个 path 编码 |
| 不要用 | 仓库相对路径 `../../`、绝对磁盘路径、未带 `/md/` 前缀的随意 href |

本地预览时 Docsify 以 `docs/` 为根，`/md/...` 才能正确解析。

## 本地预览

```bash
cd docs
pnpm dev
```

等价：`docsify serve .`（见 `docs/package.json`）。

改 md 后刷新浏览器即可；改 `index.html` 或插件脚本需硬刷新。

## README 与面试入口

重大栏目变更时，同步检查：

- `docs/README.md` — 「面试优先入口」「内容地图」表格是否与 `SIDEBAR` 一致
- `docs/md/面试准备/面试总览.md`、`复习路线.md`、`高频追问清单.md` — 是否需加链接或自测项（大改时用 `interview-curriculum-sync`）

## 不要做的事

- **不要长期手改** `_sidebar.md`（下次 generate 会覆盖）
- **不要**在未授权时修改 `index.html` 的 Gitalk `clientSecret` 等凭证
- **不要**把 `docs/` 外无关文件链进侧边栏

## 与写文章 skill 的分工

| 任务 | Skill |
| --- | --- |
| 写什么、怎么写 | `knowledge-article-author` |
| 放哪、如何进导航、如何预览 | `docsify-knowledge-site`（本 skill） |
| 复习路线/追问清单同步 | `interview-curriculum-sync` |

## 快速检查清单

- [ ] 新 md 路径在 `docs/md/` 下且可被 Docsify 访问
- [ ] 需要展示的文章已写入 `SIDEBAR` 并重新 generate
- [ ] 文内 `延伸阅读` 链接在浏览器预览可点开
- [ ] 未提交密钥或内网信息
