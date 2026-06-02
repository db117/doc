---
name: vitepress-doc-curator
description: 整理 VitePress 个人文档站素材池中的 Markdown 文档。用户要求从 inbox/、raw/、drafts/ 提取临时笔记、原始材料或草稿，改写成可发布的 docs/ 正式文档、补齐 frontmatter、更新分类入口、构建验证，并在发布后归档原始材料时使用。
---

# VitePress Doc Curator

Use this skill when curating unpublished Markdown materials into a VitePress docs site.

## Workflow

1. Read the repository `AGENTS.md` first and follow its project rules.
2. Inspect candidate files under `inbox/`, `raw/`, and `drafts/`.
3. Choose the target category by topic:
    - AI: `docs/ai/`
    - Java: `docs/java/`
    - Database: `docs/database/`
    - Ops: `docs/ops/`
    - OS: `docs/os/`
    - Other tools or uncategorized notes: `docs/other/`
4. Create or update a concise Markdown document under `docs/<category>/`.
5. Add YAML frontmatter at the top. At minimum include `title`, preferably in Chinese.
6. Preserve useful original links, commands, config snippets, environment details, and caveats.
7. Rewrite temporary notes into reproducible technical documentation:
    - remove chatty scratch wording and duplicates
    - keep commands in fenced code blocks
    - wrap paths, options, fields, and code identifiers in backticks
    - keep heading levels orderly
8. Update the category `index.md` only when adding a new published document that should appear in the entry list.
9. Run `npm run docs:build` after changes.
10. After the build passes, archive source materials instead of deleting them.

## Source Archiving

Archive only materials that have been fully or mostly published.

- Move `inbox/<file>` to `inbox/processed/YYYY-MM/<file>`.
- Move `drafts/<file>` to `drafts/processed/YYYY-MM/<file>`.
- Move `raw/<file>` to `raw/processed/YYYY-MM/<file>` when the raw item is no longer needed in the active pool.
- If a source was only partially used, keep it in place and add a short note at the top pointing to the published
  `docs/...` file.
- Do not delete source files unless the user explicitly asks.
- Keep `.gitkeep` files in empty material directories.

## Publishing Checks

Before finishing:

- Confirm every modified Markdown document has frontmatter with `title`.
- Confirm new filenames are short, lowercase when practical, and match nearby naming style.
- Confirm links to local docs use relative paths from the category index.
- Confirm no build artifacts or temporary files were added.
- Report the published file path, archived source path, and build result.
