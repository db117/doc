# AGENTS.md

本文件用于约束 AI 助手和协作者在本仓库中的修改方式。请优先遵循这里的项目约定。

## 项目概况

- 这是一个使用 VitePress 构建的个人技术文档站点。
- 主要文档位于 `docs/` 目录。
- 站点入口和导航相关内容位于 `docs/index.md` 及各级 `index.md`。
- 静态资源放在对应文档目录或 `docs/public/` 中。

## 常用命令

- 本地开发：`npm run docs:dev`
- 构建检查：`npm run docs:build`
- 本地预览：`npm run docs:preview`

## 文档 Frontmatter 规范

所有新增或修改的 Markdown 文档都必须在文件顶部维护 YAML frontmatter，并至少包含 `title`。

示例：

```md
---
title: chatchat 本地部署
---
```

如果页面需要额外配置，可以在 frontmatter 中继续添加字段，例如：

```md
---
title: 技术导航
description: 大兵的技术导航，收录常用工具、AI、Java、数据库、运维、学习资源与开发文档。
pageClass: nav-page
outline: false
---
```

Frontmatter 规则：

- `title` 必须能准确表达页面主题，优先使用中文。
- `---` 必须位于文件最开头，frontmatter 结束后空一行再写正文。
- 不要删除已有的 `description`、`pageClass`、`outline` 等 VitePress 页面配置，除非明确需要调整。
- 修改旧文档时，如果发现缺少 `title` frontmatter，应顺手补齐。

## Markdown 写作约定

- 标题层级从 `#` 或 `##` 开始，避免跳级。
- 命令、路径、配置项和代码标识使用反引号包裹。
- 命令示例使用 fenced code block。
- 外部资料优先保留原始链接，并用简短说明描述用途。
- 技术记录以可复现为目标，尽量写清环境、命令、配置和注意事项。

## 文件组织

- 仓库根目录中的 `inbox/`、`raw/`、`drafts/` 用作素材池和草稿区：
  - `inbox/` 用于临时记录，不直接发布。
  - `raw/` 用于原始材料，不直接发布。
  - `drafts/` 用于待整理文章，不作为正式站点内容。
  - 只有 `docs/` 下的内容会作为正式文档发布。
  - AI 整理文章时，应先从 `inbox/`、`raw/`、`drafts/` 中提取信息，再输出到 `docs/`。
  - 素材整理并发布到 `docs/` 后，原始文件不要直接删除，应移动到对应目录的 `processed/YYYY-MM/` 下归档，例如
    `inbox/processed/2026-06/`。
  - 如果原始文件只被部分采用，应保留在原位置，并在文件顶部简要注明已部分整理到哪个 `docs/` 页面。
  - `raw/` 中有溯源价值的原始资料可以长期保留；只有确认不再需要作为活跃素材时才移动到 `raw/processed/YYYY-MM/`。
- 新文档按主题放入现有目录，例如：
    - AI 相关：`docs/ai/`
    - Java 相关：`docs/java/`
    - 数据库相关：`docs/database/`
    - 运维相关：`docs/ops/`
    - 操作系统相关：`docs/os/`
    - 其他工具或杂项：`docs/other/`
- 每个主题目录的 `index.md` 用作该分类入口。
- 文件名尽量保持简短、清晰，并与现有命名风格一致。

## 修改原则

- 优先延续现有文档风格，不做无关的大规模重排。
- 修改内容时保持范围聚焦，避免顺手改动无关页面。
- 涉及站点配置、导航、样式或构建行为时，修改后运行 `npm run docs:build` 验证。
- 不要提交构建产物、临时文件或本地环境文件。
