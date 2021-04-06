---
title: Homebrew相关
---



### 安装 Homebrew

> 软件包的管理器

#### [Homebrew](https://brew.sh/)
> 标准安装
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install.sh)"
```
> 国内不翻墙安装
```bash
/bin/zsh -c "$(curl -fsSL https://gitee.com/cunkai/HomebrewCN/raw/master/Homebrew.sh)"
```
### 基本使用

- 安装任意包
```bash
brew install <packageName>
```

- 卸载任意包

```bash
brew uninstall <packageName>
```

- 查询可用包

```bash
brew search <packageName>
```

- 查看已安装包列表

```bash
brew list
```

- 升级所有包

```bash
brew upgrade
```

- 查看任意包信息
```bash
brew info <packageName>
```

- 更新Homebrew

```bash
brew update
```

- 查看Homebrew版本

```bash
brew -v
```

- Homebrew帮助信息

```bash
brew -h
```
- 安装为app

> 其他大部分操作添加cask都可以操作app

```bash
brew install <packageName> cask
```

### 服务管理

#### 基本操作

下面的操作以nginx为例

- 安装

```bash
brew install nginx
```

- 卸载

```bash
brew uninstall nginx
```

- 更新

```bash
brew upgrade nginx
```

- 重新安装

```bash
brew reinstall nginx
```

- 列出当前所有的服务

```bash
brew services list
```

- 运行服务而不设置开机自启动

```bash
brew services run nginx
```

- 启动服务并注册开机自启动

```bash
brew services start nginx
```

- 停止，并取消开机自启动

```bash
brew services stop nginx
```

- 重启，并且注册开机自启

```bash
brew services restart nginx
```

- 清理残留的旧版本及相关日志

```bash
brew services cleanup
```

#### 注册服务

> 注册开机自启后，会创建.plist文件，该文件包含版本信息、编码、安装路径、启动位置、日志路径等信息，取消自启动后会自动删除，执行 brew services list 可以看到各个服务该文件的存放位置

- 开机自启存放目录

```bash
/Library/LaunchDaemons/
```

- 用户登录后自启存放目录

```bash
~/Library/LaunchDaemons/
```