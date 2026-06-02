> Claude Code 的 status line 本质上是：**Claude Code 调用你配置的 shell 命令/脚本，把当前 session 的 JSON 数据通过 stdin
传给脚本，然后把脚本 stdout 输出显示到底部状态栏**。它适合显示模型名、当前目录、Git 分支、context 使用率、成本、耗时等信息。

## 使用方法

- 通过 Claude Code 使用
  直接在终端中使用

```
/statusline show model name and context percentage with a progress bar
```

Claude Code 会根据你的描述自动生成脚本，并更新 `~/.claude/settings.json`。

- 手动使用
  在`~/.claude/settings.json` 中添加

```
{
  "statusLine": {
    "type": "command",
    "command": "~/.claude/statusline.js",
    "padding": 2,
    "refreshInterval": 10
  }
}
```

编写脚本

``` javascript
const { execSync } = require("child_process");                                   let input = "";
try {                                                                              input = JSON.parse(require("fs").readFileSync("/dev/stdin", "utf8"));          
} catch {                                                                        
  process.exit(0);
}                                                                                                                                        
const cwd = input.workspace?.current_dir || process.cwd();
   
function fmtTokens(n) {                                                          
  n = Number(n);                                                                 
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";                   
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";                           
  return String(n);                                                              
}                                                                                                                                            
// --- Line 1: model | ctx | used% | changed ---                                                                                             
const parts = [];                                                                
const model = input.model?.display_name || input.model?.id;                      
if (model) parts.push(model);                                                    
const ctxTotal = input.context_window?.context_window_size;                      
if (ctxTotal) parts.push("ctx:" + Math.round(ctxTotal / 1000) + "K");            
const usedPct = input.context_window?.used_percentage;                           
if (usedPct != null) parts.push("used:" + Math.round(usedPct) + "%");            
try {                                                                              const stats = execSync("git --no-optional-locks diff --numstat HEAD", {             cwd,                                                                             encoding: "utf8",                                                                stdio: ["pipe", "pipe", "pipe"],                                            
  });                                                                                                                                        
  let added = 0,                                                                    deleted = 0;                                                                 
  for (const line of stats.trim().split("\n")) {                                 
    if (!line) continue;                                                             const [a, d] = line.split("\t");                                             
    added += Number(a) || 0;                                                     
    deleted += Number(d) || 0;                                                     }                                                                                if (added || deleted) parts.push(`+${added}/-${deleted}`);                     } catch {}                                                                       
const line1 = parts.join(" | ");                                                 
// --- Line 2: token usage ---                                                                                                               
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
// --- Line 3: session ID ---                                                    
let line3 = "";                                                                  
const sid = input.session_id;                                                    
if (sid && sid !== "null") {                                                       line3 = "session: " + sid.slice(-8);                                           }                                                                                                                                            
// --- Output ---                                                                
const lines = [line1, line2, line3].filter(Boolean);                             process.stdout.write(`\x1b[30m${lines.join("\n")}\x1b[0m`);
```

## 如何工作

Claude Code 运行你的脚本并通过 stdin 向其传输 。你的脚本读取 JSON，提取它需要的内容，并将文本打印到 stdout。Claude Code
显示你的脚本打印的任何内容。

- **何时更新**
  你的脚本在每条新的助手消息之后、`/compact`完成后、权限模式更改时或 vim 模式切换时运行。更新在 300ms
  处进行防抖，这意味着快速更改会批处理在一起，你的脚本在事情稳定后运行一次。如果在你的脚本仍在运行时触发新的更新，则会取消正在进行的执行。如果你编辑你的脚本，更改在
  Claude Code 的下一次交互触发更新之前不会出现。这些触发器在主会话空闲时可能会安静，例如当协调器等待后台子代理时。

- **你的脚本可以输出什么**
    - **多行**：每个`echo`或`print`语句显示为单独的行。
    - **颜色**：使用[ANSI 转义码](https://en.wikipedia.org/wiki/ANSI_escape_code#Colors)，如`\033[32m`表示绿色（终端必须支持它们）。
    - **链接**：使用[OSC 8 转义序列](https://en.wikipedia.org/wiki/ANSI_escape_code#OSC)使文本可点击（macOS 上为
      Cmd+click，Windows/Linux 上为 Ctrl+click）。需要支持超链接的终端，如 iTerm2、Kitty 或 WezTerm。

## 可用数据

| 字段                                                                               | 描述                                                                                                                                       |
|----------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------|
| `model.id`, `model.display_name`                                                 | 当前模型标识符和显示名称                                                                                                                             |
| `cwd`, `workspace.current_dir`                                                   | 当前工作目录。两个字段包含相同的值；为了与 `workspace.project_dir` 保持一致，首选 `workspace.current_dir`。                                                           |
| `workspace.project_dir`                                                          | 启动 Claude Code 的目录，如果在会话期间工作目录更改，可能与 `cwd` 不同                                                                                            |
| `workspace.added_dirs`                                                           | 通过 `/add-dir` 或 `--add-dir` 添加的其他目录。如果未添加任何目录，则为空数组                                                                                      |
| `workspace.git_worktree`                                                         | 当前目录在使用 `git worktree add` 创建的链接 worktree 内时的 Git worktree 名称。在主工作树中不存在。对于任何 git worktree 都会填充，不同于仅适用于 `--worktree` 会话的 `worktree.*`     |
| `workspace.repo.host`, `workspace.repo.owner`, `workspace.repo.name`             | 从 `origin` 远程解析的存储库标识，例如 `"github.com"`、`"anthropics"`、`"claude-code"`。在 git 存储库外或未配置 `origin` 远程时不存在                                    |
| `cost.total_cost_usd`                                                            | 以美元计的估计会话成本，在客户端计算。可能与你的实际账单不同                                                                                                           |
| `cost.total_duration_ms`                                                         | 自会话开始以来的总挂钟时间（毫秒）                                                                                                                        |
| `cost.total_api_duration_ms`                                                     | 等待 API 响应的总时间（毫秒）                                                                                                                        |
| `cost.total_lines_added`, `cost.total_lines_removed`                             | 更改的代码行数                                                                                                                                  |
| `context_window.total_input_tokens`, `context_window.total_output_tokens`        | 当前在上下文窗口中的令牌计数，来自最近的 API 响应。输入包括缓存读取和写入。在 v2.1.132 之前，这些是累积的会话总计                                                                         |
| `context_window.context_window_size`                                             | 最大上下文窗口大小（令牌）。默认为 200000，或对于具有扩展上下文的模型为 1000000。                                                                                         |
| `context_window.used_percentage`                                                 | 预计算的已使用上下文窗口百分比                                                                                                                          |
| `context_window.remaining_percentage`                                            | 预计算的剩余上下文窗口百分比                                                                                                                           |
| `context_window.current_usage`                                                   | 来自最后一次 API 调用的令牌计数，在[上下文窗口字段](https://code.claude.com/docs/zh-CN/statusline#context-window-fields)中描述                                    |
| `exceeds_200k_tokens`                                                            | 最近一次 API 响应中的总令牌计数（输入、缓存和输出令牌合并）是否超过 200k。这是一个固定阈值，与实际上下文窗口大小无关。                                                                         |
| `effort.level`                                                                   | 当前推理工作量（`low`、`medium`、`high`、`xhigh` 或 `max`）。反映实时会话值，包括中途 `/effort` 更改。Ultracode 不是一个独立的级别，报告为 `xhigh`。当当前模型不支持工作量参数时不存在               |
| `thinking.enabled`                                                               | 是否为会话启用了扩展思考                                                                                                                             |
| `rate_limits.five_hour.used_percentage`, `rate_limits.seven_day.used_percentage` | 消耗的 5 小时或 7 天速率限制的百分比，从 0 到 100                                                                                                          |
| `rate_limits.five_hour.resets_at`, `rate_limits.seven_day.resets_at`             | Unix 纪元秒，当 5 小时或 7 天速率限制窗口重置时                                                                                                            |
| `session_id`                                                                     | 唯一的会话标识符                                                                                                                                 |
| `session_name`                                                                   | 使用 `--name` 标志或 `/rename` 设置的自定义会话名称。如果未设置自定义名称，则不存在                                                                                     |
| `transcript_path`                                                                | 对话记录文件的路径                                                                                                                                |
| `version`                                                                        | Claude Code 版本                                                                                                                           |
| `output_style.name`                                                              | 当前输出样式的名称                                                                                                                                |
| `vim.mode`                                                                       | 启用 [vim 模式](https://code.claude.com/docs/zh-CN/interactive-mode#vim-editor-mode) 时的当前 vim 模式（`NORMAL`、`INSERT`、`VISUAL` 或 `VISUAL LINE`） |
| `agent.name`                                                                     | 使用 `--agent` 标志或配置的代理设置运行时的代理名称                                                                                                          |
| `pr.number`, `pr.url`                                                            | 当前分支的开放拉取请求。镜像底部状态栏中的 PR 徽章。在找到 PR 之前、不在 git 存储库中或 PR 合并或关闭后不存在                                                                          |
| `pr.review_state`                                                                | 开放 PR 的审查状态：`approved`、`pending`、`changes_requested` 或 `draft`。即使 `pr` 存在，也可能独立不存在                                                       |
| `worktree.name`                                                                  | 活跃 worktree 的名称。仅在 `--worktree` 会话期间出现                                                                                                   |
| `worktree.path`                                                                  | worktree 目录的绝对路径                                                                                                                         |
| `worktree.branch`                                                                | worktree 的 Git 分支名称（例如，`"worktree-my-feature"`）。对于基于钩子的 worktree 不存在                                                                     |
| `worktree.original_cwd`                                                          | Claude 进入 worktree 之前所在的目录                                                                                                               |
| `worktree.original_branch`                                                       | 进入 worktree 之前检出的 Git 分支。对于基于钩子的 worktree 不存在                                                                                            |