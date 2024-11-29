---
title: Mac
---
### Mac系统下的环境变量

```swift
# 系统级
/etc/profile 
/etc/paths 
# 用户级,优先级从大到小
~/.bash_profile 
~/.bash_login 
~/.profile 
~/.bashrc 

# 编辑环境变量
vim ~/.bash_profile
# 生效
source ~/.bash_profile
```

#### mac上启动springboot项目很慢

- 查看本机的hostname

  `hostname`

- 添加到hosts

  `vim /etc/hosts`

  把查询到的hostname添加到127.0.0.1 后面

#### 隐藏文件

> 快捷键,切换隐藏显示

```
Command + Shift +.
```

> 命令行,需要重启finder

```bash
# 显示隐藏
defaults write com.apple.finder AppleShowAllFiles -bool true
# 恢复隐藏
defaults write com.apple.finder AppleShowAllFiles -bool false
```
