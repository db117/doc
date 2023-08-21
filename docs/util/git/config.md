---
title: 常见的配置
---

## 配置文件

> 可以使用 `git config` 进行设置，也可以直接修改配置文件
>
> 使用命令行时可以指定作用域 `worktree, local, global, system, command`

```
# 系统配置(当前计算机)
/etc/gitconfig
# 全局配置(当前登录用户)
~/.gitconfig
# 工作区 (当前工作目录)
.git/config

# 查看已有配置信息
git config -l
git config -list
```



## 基本信息

```
# 用户信息的配置
user.name 
user.email
# 文本编辑器，默认 vi 或者 vim。可以修改为 emacs 等
core.editor 
# 差异分析工具 可选 kdiff3、tkdiff、meld、xxdiff、emerge、vimdiff、gvimdiff、ecmerge、opendiff 等
merge.tool
# diff颜色配置
color.diff true 
# 记住密码
credential.helper cache
# 记住密码（有过期时间）
credential.helper 'cache --timeout=10000'
```



### 别名

> 主要是简化操作，把一串很长的命令缩短

```
# 列出所有的别名
git config -l | grep alias | sed 's/^alias\.//g'

# 简化并美化日志
git config --global alias.lg “log --color --graph --pretty=format:'%C(bold red)%h%C(reset) - %C(bold green)(%cr)%C(bold blue)<%an>%C(reset) -%C(bold yellow)%d%C(reset) %s' --abbrev-commit”
```







