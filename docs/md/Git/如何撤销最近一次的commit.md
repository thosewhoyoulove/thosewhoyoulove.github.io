# 如何撤销最近一次 commit

## 面试定位

这题考察 Git 风险意识。重点不是背命令，而是知道本地提交和已推送提交应该用不同方式处理。

## 核心原理

撤销 commit 有两类思路：

- `reset`：移动分支指针，可能改写历史。
- `revert`：新增一个反向提交，不改写历史。

是否已经推送到远程，是选择命令的关键。

## 未推送：reset

撤销最近一次 commit，但保留修改在工作区：

```bash
git reset HEAD~1
```

撤销 commit，保留修改在暂存区：

```bash
git reset --soft HEAD~1
```

撤销 commit，并丢弃修改：

```bash
git reset --hard HEAD~1
```

`--hard` 会丢失工作区修改，使用前要非常确认。

## 已推送：revert

如果 commit 已经推送到共享分支，更推荐：

```bash
git revert HEAD
```

它会创建一个新提交，用来抵消上一个提交的改动。历史仍然完整，适合团队协作。

## 面试回答

可以这样答：

> 撤销最近一次 commit 要先看是否已经推送。如果只是本地提交，我可以用 `git reset HEAD~1` 撤销 commit 并保留修改，或者 `git reset --soft HEAD~1` 保留在暂存区。如果确定不要这些改动，才会用 `git reset --hard HEAD~1`，但这个命令有丢数据风险。若提交已经推送到远程共享分支，我更倾向用 `git revert HEAD`，它会新增一个反向提交，不改写公共历史，更安全。

## 高频追问

### reset --soft、mixed、hard 区别？

`--soft` 只移动 HEAD，保留暂存区和工作区；默认 mixed 会清空暂存区但保留工作区；`--hard` 会同时重置暂存区和工作区。

### 已推送能不能 reset 后强推？

技术上可以，但会重写远程历史，影响其他人。除非团队明确允许并已沟通，否则不要这么做。

### revert 会删除历史吗？

不会。revert 是新增一个提交来反向修改，原提交仍然保留在历史中。

## 相关链接

- [解决冲突](/md/Git/解决冲突.md)
- [rebase 和 merge 的区别](/md/Git/rebase和merge的区别.md)
