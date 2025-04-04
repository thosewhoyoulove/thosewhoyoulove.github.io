# git stash 的作用是什么？在什么场景下使用？

`git stash` 是一个 Git 命令，用于临时保存当前工作目录和暂存区的修改，以便在之后恢复。它的主要作用是让开发者在不提交当前更改的情况下，切换到其他分支或进行其他操作。

## 使用场景

1. **切换分支**：当你在一个分支上工作，但需要切换到另一个分支进行紧急修复时，可以使用 `git stash` 保存当前的修改。

2. **清理工作区**：在进行代码审查或测试之前，可能需要清理工作区的修改，`git stash` 可以帮助你临时保存这些修改。

3. **处理合并冲突**：在合并分支时，如果遇到冲突，可以先使用 `git stash` 保存当前的修改，解决冲突后再恢复这些修改。

## 如何使用

- **保存修改**：使用 `git stash` 命令将当前修改保存到栈中。
- **查看存储的修改**：使用 `git stash list` 查看所有存储的修改。
- **恢复修改**：使用 `git stash apply` 或 `git stash pop` 恢复最近的修改。

## 注意事项

- `git stash` 只会保存未提交的修改，已提交的修改不会受到影响。
- 使用 `git stash pop` 会在恢复修改后将其从栈中删除，而 `git stash apply` 则会保留在栈中。
