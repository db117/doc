---
title: Git 子模块变更忽略
---

# Git submodule 总是显示变更，如何忽略？

## 快速结论

如果只想在当前机器、当前仓库中隐藏某个子模块的所有变化：

```bash
git config --local submodule.<子模块路径>.ignore all
```

例如：

```bash
git config --local submodule.developer/pj_autoax_campaign.ignore all
```

该配置只写入当前仓库的 `.git/config`，不会修改项目文件，也不会提交给其他成员。

如果不需要保留子模块的本地切换，而是希望主仓库恢复干净，可以让子模块回到主仓库记录的提交：

```bash
git submodule update --checkout
```

执行前请确认子模块中的本地分支、提交和未提交文件都不需要保留。

## 问题原因

子模块不是普通目录，主仓库通过 Gitlink 记录它当前对应的提交 ID，而不是直接记录目录中的所有文件。例如：

```text
主仓库记录：abc1234
本地子模块：def5678
```

只要两者不一致，主仓库就会显示子模块发生变更，即使子模块工作区没有未提交文件。

可以先确认是否为子模块提交指针变化：

```bash
git submodule status
git diff --submodule=short
```

输出中常见的 `+` 表示本地子模块当前指向的提交与主仓库记录不同。

## 为什么 `.gitignore` 不生效？

`.gitignore` 用于忽略尚未被 Git 跟踪的文件和目录。子模块已经被主仓库作为特殊的 Gitlink 条目跟踪，因此不能通过在 `.gitignore` 中添加子模块路径来隐藏提交指针变化。

## 按需忽略子模块变化

Git submodule 的 `ignore` 配置支持以下取值：

| 配置值 | 忽略内容 |
| --- | --- |
| `none` | 不忽略任何变化，默认值 |
| `untracked` | 忽略子模块中的未跟踪文件 |
| `dirty` | 忽略子模块工作区中的未提交文件，但仍关注提交指针变化 |
| `all` | 忽略所有变化，包括提交指针变化 |

如果本地子模块会切换分支或跟随最新代码，而主仓库不需要关注其提交指针，使用 `all`：

```bash
git config --local submodule.<子模块路径>.ignore all
```

如果只想隐藏编译产物、临时文件等未跟踪内容，优先使用 `untracked` 或 `dirty`，不要直接使用 `all`。

多个子模块需要分别配置：

```bash
git config --local submodule.<子模块路径 1>.ignore all
git config --local submodule.<子模块路径 2>.ignore all
```

## 查看和取消配置

查看当前仓库中所有子模块的忽略配置：

```bash
git config --local --show-origin --get-regexp '^submodule\..*\.ignore$'
```

查看某个子模块的配置：

```bash
git config --local --get submodule.<子模块路径>.ignore
```

取消某个子模块的忽略配置，恢复默认行为：

```bash
git config --local --unset-all submodule.<子模块路径>.ignore
```

也可以显式设置为不忽略：

```bash
git config --local submodule.<子模块路径>.ignore none
```

## 不想忽略时，如何恢复主仓库干净

如果本地没有需要保留的子模块修改，执行：

```bash
git submodule update --checkout
```

该命令会将子模块切回主仓库记录的提交。它不会删除子模块代码，但可能改变子模块当前检出的提交；如果子模块工作区有本地修改，命令也可能失败。

## 注意事项

`ignore = all` 只是让主仓库不再报告子模块变化，并不会删除、回退或同步子模块代码。需要检查子模块真实状态时，进入对应目录执行：

```bash
git status
git log --oneline -n 5
```

如果团队希望所有成员采用相同的忽略规则，可以将配置写入 `.gitmodules`，但这会影响项目协作行为。仅为个人本地习惯设置时，建议使用 `--local`，不要修改共享配置。
