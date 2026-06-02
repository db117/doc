---
title: Claude Code status line 配置
---

# Claude Code status line 配置

Claude Code 的 status line 是底部状态栏配置。它会运行你配置的 shell 命令或脚本，把当前 session 的 JSON 数据通过 `stdin`
传给脚本，再把脚本输出的 `stdout` 显示在状态栏中。

适合显示这些信息：

- 当前模型
- 当前目录
- Git 变更
- context 使用率
- token 使用量
- session 标识

官方文档：[Custom status line](https://code.claude.com/docs/zh-CN/statusline)

## 使用 `/statusline` 自动生成

可以直接在 Claude Code 中输入：

```text
/statusline show model name and context percentage with a progress bar
```

Claude Code 会根据描述生成脚本，并更新 `~/.claude/settings.json`。

## 手动配置

在 `~/.claude/settings.json` 中添加：

```json
{
  "statusLine": {
    "type": "command",
    "command": "~/.claude/statusline.js",
    "padding": 2,
    "refreshInterval": 10
  }
}
```

字段说明：

- `type`：设置为 `command`，表示运行一个命令。
- `command`：脚本路径或内联 shell 命令。
- `padding`：状态栏内容的水平内边距。
- `refreshInterval`：按秒定时刷新，适合显示时间或后台变化的状态。

## 示例脚本

创建 `~/.claude/statusline.js`：

```js
const { execSync } = require("child_process");
const fs = require("fs");

let input;

try {
  input = JSON.parse(fs.readFileSync("/dev/stdin", "utf8"));
} catch {
  process.exit(0);
}

const cwd = input.workspace?.current_dir || input.cwd || process.cwd();

function fmtTokens(n) {
  n = Number(n) || 0;

  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;

  return String(n);
}

const parts = [];
const model = input.model?.display_name || input.model?.id;

if (model) parts.push(model);

const ctxTotal = input.context_window?.context_window_size;
if (ctxTotal) parts.push(`ctx:${Math.round(ctxTotal / 1000)}K`);

const usedPct = input.context_window?.used_percentage;
if (usedPct != null) parts.push(`used:${Math.round(usedPct)}%`);

try {
  const stats = execSync("git --no-optional-locks diff --numstat HEAD", {
    cwd,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });

  let added = 0;
  let deleted = 0;

  for (const line of stats.trim().split("\n")) {
    if (!line) continue;

    const [a, d] = line.split("\t");

    added += Number(a) || 0;
    deleted += Number(d) || 0;
  }

  if (added || deleted) parts.push(`+${added}/-${deleted}`);
} catch {}

const line1 = parts.join(" | ");

const cw = input.context_window || {};
const cur = cw.current_usage || {};
const inputTk = cw.total_input_tokens || 0;
const outputTk = cw.total_output_tokens || 0;
const cacheRead = cur.cache_read_input_tokens || 0;
const cacheCreate = cur.cache_creation_input_tokens || 0;
const totalTk = inputTk + outputTk + cacheRead + cacheCreate;

let line2 = "";

if (totalTk > 0) {
  line2 = `tokens: in=${fmtTokens(inputTk)} out=${fmtTokens(outputTk)}`;

  if (cacheRead > 0) line2 += ` cache_r=${fmtTokens(cacheRead)}`;
  if (cacheCreate > 0) line2 += ` cache_w=${fmtTokens(cacheCreate)}`;

  line2 += ` total=${fmtTokens(totalTk)}`;
}

let line3 = "";
const sid = input.session_id;

if (sid && sid !== "null") {
  line3 = `session: ${sid.slice(-8)}`;
}

const lines = [line1, line2, line3].filter(Boolean);

process.stdout.write(`\x1b[30m${lines.join("\n")}\x1b[0m`);
```

给脚本增加可执行权限：

```bash
chmod +x ~/.claude/statusline.js
```

## 工作机制

Claude Code 会运行 status line 命令，并通过 `stdin` 传入 JSON session 数据。脚本读取 JSON、提取字段，再把要展示的内容打印到
`stdout`。

状态栏通常会在这些场景更新：

- 新的助手消息之后
- `/compact` 完成后
- 权限模式变化时
- Vim 模式变化时
- 配置了 `refreshInterval` 后按固定间隔更新

脚本输出支持：

- 多行文本
- ANSI 颜色
- OSC 8 终端超链接

## 常用字段

| 字段                                                                 | 说明                            |
|--------------------------------------------------------------------|-------------------------------|
| `model.id`、`model.display_name`                                    | 当前模型标识和显示名称                   |
| `cwd`、`workspace.current_dir`                                      | 当前工作目录                        |
| `workspace.project_dir`                                            | 启动 Claude Code 的项目目录          |
| `workspace.added_dirs`                                             | 通过 `/add-dir` 添加的目录           |
| `workspace.git_worktree`                                           | 当前 Git worktree 名称            |
| `workspace.repo.host`、`workspace.repo.owner`、`workspace.repo.name` | 当前仓库来源信息                      |
| `cost.total_cost_usd`                                              | 当前 session 估算成本               |
| `cost.total_duration_ms`                                           | 当前 session 总耗时                |
| `cost.total_api_duration_ms`                                       | API 响应耗时                      |
| `cost.total_lines_added`、`cost.total_lines_removed`                | 当前 session 修改的代码行数            |
| `context_window.total_input_tokens`                                | 当前上下文输入 token                 |
| `context_window.total_output_tokens`                               | 当前上下文输出 token                 |
| `context_window.context_window_size`                               | 最大上下文窗口大小                     |
| `context_window.used_percentage`                                   | 上下文已使用百分比                     |
| `context_window.remaining_percentage`                              | 上下文剩余百分比                      |
| `context_window.current_usage`                                     | 当前上下文 token 明细                |
| `exceeds_200k_tokens`                                              | 最近一次响应是否超过 200k token         |
| `effort.level`                                                     | 当前推理强度                        |
| `thinking.enabled`                                                 | 是否启用 extended thinking        |
| `rate_limits.five_hour.used_percentage`                            | 5 小时限额使用比例                    |
| `rate_limits.seven_day.used_percentage`                            | 7 天限额使用比例                     |
| `session_id`                                                       | 当前 session ID                 |
| `session_name`                                                     | 自定义 session 名称                |
| `transcript_path`                                                  | 会话记录文件路径                      |
| `version`                                                          | Claude Code 版本                |
| `output_style.name`                                                | 当前输出样式                        |
| `vim.mode`                                                         | Vim 模式状态                      |
| `agent.name`                                                       | 当前 agent 名称                   |
| `pr.number`、`pr.url`、`pr.review_state`                             | 当前分支关联的 PR 信息                 |
| `worktree.name`、`worktree.path`、`worktree.branch`                  | `--worktree` 会话中的 worktree 信息 |

## 注意事项

- 字段可能不存在或为 `null`，脚本里要使用可选链或默认值。
- 如果脚本执行时间太长，新状态触发时可能会取消上一轮执行。
- 修改脚本后，通常要等 Claude Code 下一次交互触发更新才会显示新结果。
- 状态栏脚本在本地运行，不消耗 API token。
