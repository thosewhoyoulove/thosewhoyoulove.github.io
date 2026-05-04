# git stash 的作用是什么？在什么场景下使用？

`git stash` 是一个 Git 命令，用于临时保存当前工作目录和暂存区的修改，以便在之后恢复。它的主要作用是让开发者在不提交当前更改的情况下，切换到其他分支或进行其他操作。

## 使用场景

1. **切换分支**：当你在一个分支上工作，但需要切换到另一个分支进行紧急修复时，可以使用 `git stash` 保存当前的修改。

2. **清理工作区**：在进行代码审查或测试之前，可能需要清理工作区的修改，`git stash` 可以帮助你临时保存这些修改。

3. **处理合并冲突**：在合并分支时，如果遇到冲突，可以先使用 `git stash` 保存当前的修改，解决冲突后再恢复这些修改。

## 如何使用

- **保存修改**：`git stash` 或 `git stash push -m "说明"`，默认包含已跟踪文件的变更。
- **包含未跟踪文件**：`git stash -u`（`--include-untracked`），避免新文件被落下。
- **查看列表**：`git stash list`。
- **恢复**：`git stash apply stash@{n}` 保留栈记录；`git stash pop` 相当于 apply 后再 drop 最新一条。
- **丢弃某条**：`git stash drop stash@{n}`；清空 `git stash clear`（慎用）。

## 注意事项

- `git stash` 只会保存未提交的修改，已提交的修改不会受到影响。
- 使用 `git stash pop` 会在恢复修改后将其从栈中删除，而 `git stash apply` 则会保留在栈中。
