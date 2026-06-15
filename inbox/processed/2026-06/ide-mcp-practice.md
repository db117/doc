# IDEA MCP 与 Index MCP 技术实践对比

## 背景

当前环境同时接入了两类 IntelliJ 相关 MCP：

- `idea`：偏 IDE 操作能力，适合构建、运行、调试、运行配置等。
- `index-mcp`：偏代码索引与语义理解，适合查找、导航、引用分析、层级分析、重构等。

两者不是替代关系。实践上应按任务类型路由，避免重复保留能力。

## 官方资料

### Index MCP

- Marketplace：[IDE Index MCP Server](https://plugins.jetbrains.com/plugin/29174-ide-index-mcp-server)
- GitHub：[hechtcarmel/jetbrains-index-mcp-plugin](https://github.com/hechtcarmel/jetbrains-index-mcp-plugin)

插件定位：运行在 JetBrains IDE 内部，把 IDE 的索引、AST、引用解析、层级关系和重构能力暴露给外部 AI Agent。

官方说明中强调的能力包括：

- Find References / Go to Definition。
- Code Diagnostics。
- Index Status / Sync Files。
- Find Class / Find File / Symbol Search。
- Type Hierarchy / Call Hierarchy / Find Implementations / Find Super Methods。
- Rename Refactoring / Reformat Code / Safe Delete。
- 多语言支持，具体能力依赖当前 JetBrains IDE 和已安装语言插件。

注意：部分工具默认关闭，需要在 `Settings > Tools > Index MCP Server` 中启用，例如 `ide_find_symbol`、`ide_read_file`、`ide_reformat_code`、`ide_build_project` 等。

### JetBrains 官方 MCP Server

- Marketplace：[MCP Server](https://plugins.jetbrains.com/plugin/26071-mcp-server)
- IDEA 文档：[MCP Server | IntelliJ IDEA Documentation](https://www.jetbrains.com/help/idea/mcp-server.html)
- GitHub：[JetBrains/mcp-jetbrains](https://github.com/JetBrains/mcp-jetbrains)

JetBrains 官方文档说明：从 IntelliJ IDEA `2025.2` 开始，IDE 内置 MCP Server，可供 Claude Desktop、Cursor、Codex、VS Code 等外部客户端访问 IDE 工具。

官方 MCP Server 更偏 IDE 控制面：

- 构建项目。
- 获取文件问题和模块信息。
- Quick Documentation 风格的符号信息。
- 运行配置。
- 终端/命令执行。
- 调试器工具。
- 打开文件、格式化文件、目录树等 IDE 操作。

`JetBrains/mcp-jetbrains` 仓库当前已标记为 deprecated：旧的 NPM proxy 不再是首选路径，核心功能已经集成到 2025.2 之后的 IntelliJ 系列 IDE 中。

## 能力对比

| 场景 | 推荐工具 | 说明 |
|---|---|---|
| 查找类 | `index-mcp` | 使用 `ide_find_class`，支持类名、模糊、驼峰匹配，并返回分页信息 |
| 查找文件 | `index-mcp` | 使用 `ide_find_file`，适合项目文件定位 |
| 查找符号 | `index-mcp` | 使用 `ide_find_symbol`，适合类、方法、字段等符号搜索 |
| 跳转定义 | `index-mcp` | 使用 `ide_find_definition`，可解析 import、泛型、依赖源码 |
| 查找引用 | `index-mcp` | 使用 `ide_find_references`，比文本搜索更可靠 |
| 查找实现 | `index-mcp` | 使用 `ide_find_implementations`，适合接口、抽象类、抽象方法 |
| 类型层级 | `index-mcp` | 使用 `ide_type_hierarchy`，查看父类、接口、子类 |
| 调用链 | `index-mcp` | 使用 `ide_call_hierarchy`，支持 callers / callees |
| 父方法/接口方法 | `index-mcp` | 使用 `ide_find_super_methods` |
| 诊断问题 | `index-mcp` | 使用 `ide_diagnostics`，可读取文件问题和最近构建错误 |
| 语义重命名 | `index-mcp` | 使用 `ide_refactor_rename`，避免普通替换破坏引用 |
| 移动文件 | `index-mcp` | 使用 `ide_move_file`，让 IDE 处理包名、命名空间、引用更新 |
| 安全删除 | `index-mcp` | 使用 `ide_refactor_safe_delete`，先检查外部引用 |
| 格式化代码 | `index-mcp` | 使用 `ide_reformat_code`，如果该能力已启用 |
| 启动应用 | `idea` | 使用 `get_run_configurations` / `execute_run_configuration` |
| 调试应用 | `idea` | 使用 `xdebug_start_debugger_session` 和 `xdebug_*` |
| 主动构建 | `idea` | 使用 `build_project`；`index-mcp` 主要读取最近构建诊断 |

## 定位差异

`index-mcp` 解决的是“代码语义理解与安全修改”：

- 依赖 IDE 索引和语言插件。
- 适合回答“这个符号是什么、在哪里用、谁调用、有哪些实现、改名会影响谁”。
- 适合替代 grep/sed 类文本操作。

JetBrains 官方 `idea` MCP 解决的是“IDE 执行与运行时控制”：

- 依赖 IDE 的项目模型、运行配置、构建系统和调试器。
- 适合回答“怎么构建、怎么启动、当前断点变量是什么、怎么单步调试”。
- 适合替代人工点击 Run/Debug/Build。

## 实测结论

`index-mcp` 更适合作为主力读代码工具。

实测中，`index-mcp` 能稳定完成以下任务：

- `ide_find_class("User")` 返回大量类结果，并带分页与总数。
- `ide_find_symbol("UserService")` 返回类、字段、测试字段等符号。
- `ide_find_implementations` 能从 `UserService` 找到 `UserServiceImpl`。
- `ide_find_references` 能统计 `UserService` 的引用，并区分 `IMPORT` 与 `REFERENCE`。
- `ide_type_hierarchy` 能展示 `UserService` 的父接口与实现类。
- `ide_diagnostics` 能返回文件 warning，并读取最近 build/test 状态。

`idea` 的优势集中在运行时能力：

- 获取 IDEA Run Configuration。
- 启动 Spring Boot 应用。
- 开启 Debug Session。
- 查看线程、栈帧、变量、表达式求值。
- 单步调试、继续运行、断点控制。

## 推荐保留策略

如果目标是精简 `idea` 的重复能力，可以按下面拆分：

### 保留 `index-mcp`

用于代码智能与重构：

- `ide_find_class`
- `ide_find_file`
- `ide_find_symbol`
- `ide_find_definition`
- `ide_find_references`
- `ide_find_implementations`
- `ide_type_hierarchy`
- `ide_call_hierarchy`
- `ide_find_super_methods`
- `ide_diagnostics`
- `ide_sync_files`
- `ide_refactor_rename`
- `ide_move_file`
- `ide_refactor_safe_delete`
- `ide_reformat_code`

### 最小保留 `idea`

用于运行与调试：

- `get_run_configurations`
- `execute_run_configuration`
- `build_project`
- `xdebug_start_debugger_session`
- `xdebug_get_debugger_status`
- `xdebug_set_breakpoint`
- `xdebug_list_breakpoints`
- `xdebug_control_session`
- `xdebug_get_stack`
- `xdebug_get_frame_values`
- `xdebug_evaluate_expression`
- `xdebug_get_value_by_path`
- `xdebug_set_variable`

## 使用规则

如果当前环境没有安装或启用 `index-mcp` / `idea` MCP，请忽略本规则，使用当前可用工具完成任务。

如果已安装 `index-mcp`，优先使用它处理语义级代码智能：

- 查找类、文件、符号。
- 跳转定义。
- 查找引用。
- 查找实现。
- 查看类型层级。
- 查看调用层级。
- 文件诊断。
- 重命名、移动、安全删除、格式化。

仅在需要运行配置、启动应用、调试，以及主动构建时使用 `idea`。

对于项目内文件，传给 `index-mcp` 的路径应使用相对路径。多项目工作区中，始终传入 `project_path`。

如果 `index-mcp` 的结果看起来过期或不完整：

1. 调用 `ide_index_status`。
2. 如索引完成但结果仍异常，调用 `ide_sync_files`。
3. 重试原工具调用。

不要用 `grep` / `sed` 替代语义级引用查找或重命名。

## 实践建议

日常理解代码时：

1. 用 `ide_find_class` / `ide_find_symbol` 定位入口。
2. 用 `ide_find_definition` 阅读定义。
3. 用 `ide_find_references` 看影响面。
4. 用 `ide_call_hierarchy` 看调用链。
5. 用 `ide_type_hierarchy` / `ide_find_implementations` 看抽象关系。

改代码前：

1. 先用 `index-mcp` 查引用和实现。
2. 涉及重命名、移动、删除时，优先使用 IDE 语义重构。
3. 外部工具修改文件后，必要时调用 `ide_sync_files`。

改代码后：

1. 用 `ide_diagnostics` 看文件问题。
2. 用 `idea.build_project` 或项目测试命令做最终验证。
3. 需要运行服务或调试时，再切到 `idea` 的 run/debug 能力。

## 简化版路由规则

```md
# IDE MCP 路由规则

如果当前环境没有安装或启用 index-mcp / idea MCP，请忽略本规则，使用当前可用的工具继续完成任务。

如果已安装 index-mcp，优先使用它处理语义级代码智能：
查找类/文件/符号、跳转定义、查找引用、查找实现、类型层级、
调用层级、诊断、重命名、移动文件、安全删除、代码格式化。

仅在需要运行配置、启动应用、调试，以及主动构建时使用 idea。

对于项目内文件，传给 index-mcp 的路径应使用相对路径。多项目工作区中，
始终传入 project_path。

如果 index-mcp 的结果看起来过期或不完整，先调用 ide_index_status，
再调用 ide_sync_files，然后重试。

不要用 grep/sed 来替代语义级引用查找或重命名。
```
