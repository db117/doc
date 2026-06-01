# 学习记录
[![Build and Deploy](https://github.com/db117/doc/actions/workflows/main.yml/badge.svg)](https://github.com/db117/doc/actions/workflows/main.yml)

> 主要记录一些工作遇到的问题、学习到的东西
>
> 使用vitepress构建页面
>
> ~~使用 Travis  进行自动部署,并发布到GitHub pages~~(现已替换为github的actions)

## 仓库结构

这个仓库优先作为“素材池 + 发布仓库”使用。适合用来写技术文档、整理 AI 工具经验、维护个人网站，并让 Claude Code / Codex
协助整理和修改文档，最终发布到 `db117.site`。

```text
inbox/      # 临时记录，随手丢想法、链接、问题和待整理片段
raw/        # 原始材料，存放聊天记录、网页摘录、命令输出、参考资料等
drafts/     # AI 整理后的草稿，待人工确认和继续打磨
docs/       # 正式发布内容，VitePress 会从这里生成网站
```

### 使用规则

- `inbox/` 和 `raw/` 中的内容只是原始材料，不直接发布。
- `drafts/` 中的内容是待整理文章，不作为正式站点内容。
- 只有 `docs/` 下的内容会作为正式文档发布。
- AI 整理文章时，应先从 `inbox/`、`raw/`、`drafts/` 中提取信息，再输出到 `docs/`。
- 如果只是写技术文档、整理 AI 工具经验和维护个人网站，优先使用这套轻量结构；只有在需要大量私人碎片、移动端随手记、双链图谱、离线笔记或日记/交易复盘等本地库能力时，再考虑
  Obsidian。
