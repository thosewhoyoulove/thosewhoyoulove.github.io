# git rebase 和 git merge 的区别

## 面试定位

这题考察 Git 协作经验。回答重点是：merge 保留分叉历史，rebase 重写提交历史；共享分支不要随意 rebase。

## 核心原理

`git merge` 和 `git rebase` 都用于整合分支，但处理提交历史的方式不同。

## merge

`merge` 会把两个分支合并，并通常生成一个 merge commit。

```bash
git checkout feature
git merge main
```

特点：

- 保留真实分支历史。
- 不重写已有 commit。
- 适合共享分支和团队协作。
- 历史可能出现较多分叉和 merge commit。

## rebase

`rebase` 会把当前分支的提交“搬到”目标分支最新提交之后，相当于重新应用一遍提交。

```bash
git checkout feature
git rebase main
```

特点：

- 历史更线性。
- 会重写 commit hash。
- 适合整理个人功能分支。
- 不应随意对已推送且被他人基于开发的分支 rebase。

## 怎么选择

- 想保留真实协作历史：用 merge。
- 想让个人 feature 分支基于最新 main，并保持线性：用 rebase。
- 主干合并策略看团队规范，例如 squash merge、rebase merge、merge commit。

## 面试回答

可以这样答：

> `merge` 和 `rebase` 都能整合分支。`merge` 会保留两个分支的历史，并生成一个合并提交，不会改写已有提交，适合团队共享分支。`rebase` 会把当前分支的提交重新应用到目标分支之后，历史更线性，但会重写 commit hash，所以适合整理自己的本地 feature 分支，不适合对已经共享给别人的分支随意 rebase。实际协作里，我会按团队规范选择，个人分支同步主干可以 rebase，合并到公共分支时更谨慎。

## 高频追问

### 为什么公共分支不要随便 rebase？

因为 rebase 会重写提交历史，其他人基于旧提交开发时会产生重复提交、冲突和历史混乱。

### rebase 冲突怎么处理？

解决冲突后执行 `git add`，再 `git rebase --continue`。如果不想继续，执行 `git rebase --abort`。

### squash merge 是什么？

把一个 PR 里的多个提交压成一个提交合入目标分支，适合保持主干历史简洁。

## 相关链接

- [解决冲突](/md/Git/解决冲突.md)
- [Pull Request](/md/Git/Pull%20Request.md)
