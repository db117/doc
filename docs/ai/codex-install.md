---
title: Codex 安装与快速开始
description: 使用官方桌面端或 Codex CLI 安装、登录并开始第一个本地项目任务。
---

# Codex 安装与快速开始

Codex 可以通过桌面端或命令行使用，两种方式都建议使用同一个 ChatGPT 账号登录。如果刚开始使用，任选一种即可；桌面端和 CLI 可以共用项目目录与账号，不需要重复配置一套工作流。

> 安装入口和可用性会随地区、系统和账号类型变化。桌面端优先保留下面的 Windows 安装工具；其他系统可按 [Codex 官方入门页](https://openai.com/codex/get-started/) 的当前提示安装。

## 选择使用方式

| 方式 | 适合场景 | 安装入口 |
| --- | --- | --- |
| 桌面端 | 管理多个项目、查看变更、处理持续任务 | Windows 使用 [codex-app-mirror](https://github.com/Wangnov/codex-app-mirror)，其他系统见 [官方入门页](https://openai.com/codex/get-started/) |
| Codex CLI | 在终端、编辑器终端或脚本中工作 | [Codex CLI 文档](https://learn.chatgpt.com/docs/codex/cli) |

## 前置准备

- 一个可登录 Codex 的 ChatGPT 账号，或官方界面提供的其他登录方式。
- 如果需要通过非大陆 App Store 获取应用或使用 Apple 内购，准备一个对应地区的 Apple ID；建议只在“媒体与购买项目”中登录，不替换主力 iCloud 账号。
- 使用 CLI 时，准备好终端和项目目录；采用 npm 安装时还需要可用的 Node.js 与 npm。

## 安装桌面端

### Windows：使用 `codex-app-mirror`

Windows Store 无法正常安装或更新时，使用 [Wangnov/codex-app-mirror](https://github.com/Wangnov/codex-app-mirror) 提供的桌面端安装工具。该工具是 Windows 安装的首选入口；按仓库 README 的步骤下载、安装或更新即可。

### macOS 与其他可用系统：官方入口

打开 [Codex 官方入门页](https://openai.com/codex/get-started/) 并按页面提示下载适用于当前系统的桌面端。

### Apple ID 与 App Store

若安装渠道或订阅流程需要使用非大陆 App Store，可准备相应地区的 Apple ID。Apple ID 用于 App Store 下载和内购；进入 Codex 后，仍使用自己的 ChatGPT 账号登录，两者不是同一个账号。

建议单独准备一个仅用于 App Store 的 Apple ID，并只在设备的“媒体与购买项目”中切换，避免影响主力 iCloud 的同步、照片和设备查找。土耳其区 Apple ID 的注册、转区、礼品卡与 ChatGPT Plus 订阅流程见：[注册土耳其区 Apple ID 订阅 ChatGPT Plus 教程](./chatgpt-plus-turkey-apple-id.md)。

## 安装 Codex CLI

### macOS 与 Linux：官方安装器

官方 CLI 文档提供独立安装器：

```bash
curl -fsSL https://chatgpt.com/codex/install.sh | sh
```

### 使用 npm 安装

如果已经安装 Node.js 和 npm，也可以使用 npm 安装：

```bash
npm install -g @openai/codex
```

Windows 用户可优先按 [Codex CLI 官方文档](https://learn.chatgpt.com/docs/codex/cli) 中的当前说明选择安装方式；通过 npm 安装时，使用 PowerShell、Windows Terminal 或编辑器内置终端即可。

安装后确认命令可用：

```bash
codex --version
```

如果终端提示找不到 `codex`，先重新打开终端；仍无法使用时，检查 npm 全局 bin 目录是否已加入 `PATH`。

## Skill 与插件建议

Skill 是可复用的任务流程，插件可以额外带来 Skill、工具或外部服务连接。它们会改变 Codex 可执行的能力范围，因此只从可信来源安装，并在安装前阅读说明、权限和依赖。

- [ponytail](https://github.com/DietrichGebert/ponytail)：面向代码任务的“少做一点”工作流，适合希望减少不必要抽象和样板代码时使用。
- [superpowers](https://github.com/obra/superpowers)：提供一组可复用的软件开发工作流，可按项目需要挑选使用。

建议一次只安装并验证一个扩展；在工作账号或企业工作区中，插件是否可用还可能受工作区策略和管理员权限限制。

## MCP 推荐：JetBrains IDE 索引

[hechtcarmel/jetbrains-index-mcp-plugin](https://github.com/hechtcarmel/jetbrains-index-mcp-plugin)（IDE Index MCP Server）将 JetBrains IDE 的代码索引、跳转定义、查找引用、诊断和重构能力通过 MCP 暴露给 Codex。适合 Java、Kotlin、Python、JavaScript / TypeScript 等项目，希望 Codex 能直接使用 IntelliJ IDEA、PyCharm 或 WebStorm 的语义索引时使用。

### 安装与连接

1. 在 JetBrains IDE 中打开 `Settings / Preferences` → `Plugins` → `Marketplace`，搜索 **IDE Index MCP Server** 并安装；重启 IDE 后打开目标项目。
2. 在底部的 **Index MCP Server** 工具窗口中，点击 **Install on Coding Agents**，选择 Codex CLI 自动写入配置。
3. 如果需要手动配置，在启动了项目的终端中执行以下命令。端口和服务名必须与当前 IDE 保持一致：

```bash
# IntelliJ IDEA 默认配置
codex mcp add intellij-index --url http://127.0.0.1:29170/index-mcp/streamable-http
```

安装完成后重新启动 Codex，在任务中要求它优先使用 JetBrains MCP 查询定义、引用或 IDE 诊断即可。更多 IDE 的默认端口、工具开关和安装说明以 [项目 README](https://github.com/hechtcarmel/jetbrains-index-mcp-plugin) 为准。

> 插件默认也提供重命名、移动文件、格式化等写操作。首次使用时先用只读索引功能；启用或调用修改类工具前，确认当前项目和变更范围。

## 参考资料

- [Codex 官方入门页](https://openai.com/codex/get-started/)
- [Codex CLI 文档](https://learn.chatgpt.com/docs/codex/cli)
- [使用 ChatGPT 账号开始使用 Codex](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
