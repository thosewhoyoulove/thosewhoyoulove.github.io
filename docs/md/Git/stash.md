# git stash

## 面试定位

`git stash` 常用于考察日常协作熟练度。重点是：临时保存未提交修改、切分支处理紧急任务、恢复时区分 apply 和 pop。

## 核心原理

`git stash` 会把当前工作区和暂存区的修改临时保存到一个栈里，让工作区恢复干净。

它适合“不想提交半成品，但需要切换上下文”的场景。

## 常用命令

保存修改：

```bash
git stash push -m "work in progress"
```

包含未跟踪文件：

```bash
git stash -u
```

查看列表：

```bash
git stash list
```

恢复但保留 stash 记录：

```bash
git stash apply stash@{0}
```

恢复并删除 stash 记录：

```bash
git stash pop
```

删除某条：

```bash
git stash drop stash@{0}
```

## apply 和 pop 区别

- `apply`：恢复修改，但 stash 记录还在。
- `pop`：恢复修改，并删除这条 stash。

如果担心恢复时冲突，优先用 `apply`，确认没问题后再 `drop`。

## 面试回答

可以这样答：

> `git stash` 用来临时保存未提交的工作区和暂存区修改，让工作区变干净，方便切分支或拉取代码。常见场景是手头功能没做完，但需要紧急修 bug。我会用 `git stash push -m "说明"` 保存，如果有未跟踪文件加 `-u`。恢复时 `git stash apply` 会保留 stash 记录，`git stash pop` 会恢复后删除记录。如果担心冲突，我会先 apply，确认没问题再 drop。

## 高频追问

### stash 会保存 untracked 文件吗？

默认不会。需要用 `git stash -u` 或 `--include-untracked`。

### stash pop 冲突怎么办？

手动解决冲突并 `git add`。如果 pop 没完全成功，Git 通常会保留 stash 记录，避免丢失。

### stash 适合长期保存工作吗？

不适合。长期工作应该提交到临时分支，stash 更适合短期上下文切换。

## 相关链接

- [解决冲突](/md/Git/解决冲突.md)
