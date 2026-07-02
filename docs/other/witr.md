---
title: witr：追踪进程为何运行
---

# witr：追踪进程为何运行

[witr](https://github.com/pranshuparmar/witr) 是一个用于排查进程来源的命令行工具，名称来自 “Why is this running?”。它不仅展示系统中正在运行的进程，还会整理进程、服务、端口、容器和父进程之间的关系，帮助回答“它是怎样启动的、为什么还在运行”。

相比手动组合 `ps`、`lsof`、`ss`、`systemctl` 和 `docker ps` 的结果，witr 可以直接给出一条较容易阅读的因果链。它还提供交互式 TUI，可集中查看进程、监听端口、容器和文件锁。

## 安装

macOS 或 Linux 可以使用 Homebrew：

```bash
brew install witr
```

也可以运行官方安装脚本：

```bash
curl -fsSL https://raw.githubusercontent.com/pranshuparmar/witr/main/install.sh | bash
```

Windows 可以使用 Winget：

```powershell
winget install -e --id PranshuParmar.witr
```

## 常用示例

```bash
# 查询名称中包含 node 的进程
witr node

# 查询占用 8080 端口的进程
witr --port 8080

# 根据 PID 追踪进程来源
witr --pid 1234

# 查询容器
witr --container my-container

# 打开交互式界面
witr
```

witr 支持 Linux、macOS、FreeBSD 和 Windows。不同平台能够获取的进程上下文有所差异，具体安装方式、参数和平台限制以[项目 README](https://github.com/pranshuparmar/witr#readme)为准。
