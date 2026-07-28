---
title: 在线工具导航与页面迁移实现计划
description: 将 V2Ray 转 Clash 页面迁移到独立工具分类，并接入 VitePress 顶部导航。
---

# Online Tools Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增“在线工具”顶部下拉菜单，并将 V2Ray 转 Clash 订阅页迁移到 `/tools/v2ray-to-clash`，同时保留旧地址提示页。

**Architecture:** 沿用 VitePress 现有的静态导航与 `scanDir` 侧边栏方案。工具组件与业务逻辑不变，只调整 Markdown 页面归属、导航配置和分类入口。

**Tech Stack:** VitePress、Vue 3、TypeScript、Markdown、Vitest

## Global Constraints

- 所有新增或修改的 Markdown 文件必须在文件顶部包含至少带 `title` 的 YAML frontmatter。
- 不修改 `V2rayToMihomo` 组件、解析器或 Mihomo 配置生成逻辑。
- 原地址 `/other/v2ray-to-clash` 必须保留可访问的迁移提示。
- 不增加依赖，不提交构建产物。

---

### Task 1: 迁移工具页面并建立分类入口

**Files:**
- Create: `docs/tools/index.md`
- Create: `docs/tools/v2ray-to-clash.md`
- Modify: `docs/other/v2ray-to-clash.md`
- Modify: `docs/other/index.md`

**Interfaces:**
- Consumes: `docs/.vitepress/theme/v2ray-to-mihomo/V2rayToMihomo.vue` 默认导出组件。
- Produces: `/tools/` 分类入口、`/tools/v2ray-to-clash` 正式工具页、`/other/v2ray-to-clash` 迁移提示页。

- [x] **Step 1: 创建在线工具分类入口**

创建 `docs/tools/index.md`：

```md
---
title: 在线工具
description: 可直接在浏览器中使用的开发与网络工具。
---

# 在线工具

- [V2Ray 转 Clash 订阅](./v2ray-to-clash.md)：在浏览器本地把 V2Ray 订阅转换为 Clash Verge Rev 可用的 Mihomo YAML。
```

- [x] **Step 2: 将正式工具页迁移到新分类**

创建 `docs/tools/v2ray-to-clash.md`，保留现有 frontmatter、组件导入、标题、说明和 `<V2rayToMihomo />`，只将组件相对导入路径改为 `../.vitepress/theme/v2ray-to-mihomo/V2rayToMihomo.vue`。

- [x] **Step 3: 将旧页面改为迁移提示**

将 `docs/other/v2ray-to-clash.md` 改为：

```md
---
title: V2Ray 转 Clash 订阅页面已迁移
description: V2Ray 转 Clash 订阅工具的新页面入口。
---

# 页面已迁移

[前往 V2Ray 转 Clash 订阅工具](/tools/v2ray-to-clash)。
```

- [x] **Step 4: 清理知识碎片分类入口**

从 `docs/other/index.md` 删除“在线工具”标题及其 V2Ray 工具列表项，保留相邻“常用入口”和“零散工具”内容不变。

- [x] **Step 5: 运行页面与转换模块验证**

Run: `npm test -- tests/v2ray-to-mihomo`

Expected: 所有 V2Ray 转 Mihomo 测试通过。

### Task 2: 接入顶部导航与侧边栏

**Files:**
- Modify: `docs/.vitepress/config/nav.ts`
- Modify: `docs/.vitepress/config/sliderbar.ts`

**Interfaces:**
- Consumes: Task 1 生成的 `/tools/v2ray-to-clash` 页面。
- Produces: 顶部“在线工具”下拉菜单和 `/tools/` 路径侧边栏配置。

- [x] **Step 1: 添加顶部下拉菜单**

在 `docs/.vitepress/config/nav.ts` 的“基础设施”和“知识碎片”之间加入：

```ts
{
  text: '在线工具',
  items: [
    { text: 'V2Ray 转 Clash 订阅', link: '/tools/v2ray-to-clash' },
  ],
},
```

- [x] **Step 2: 添加工具分类侧边栏**

在 `docs/.vitepress/config/sliderbar.ts` 中加入：

```ts
'/tools/': scanDir('tools'),
```

- [x] **Step 3: 检查配置与页面引用**

Run: `rg -n "在线工具|v2ray-to-clash|'/tools/'" docs/.vitepress/config docs/tools docs/other/index.md docs/other/v2ray-to-clash.md`

Expected: 顶部菜单与分类入口只指向 `/tools/v2ray-to-clash`，旧页面只包含迁移链接，`docs/other/index.md` 不再包含工具入口。

- [x] **Step 4: 构建站点**

Run: `npm run docs:build`

Expected: VitePress 构建成功且没有死链或 Markdown 错误。

- [x] **Step 5: 提交实现**

```bash
git add docs/.vitepress/config/nav.ts docs/.vitepress/config/sliderbar.ts docs/tools docs/other/index.md docs/other/v2ray-to-clash.md docs/superpowers/plans/2026-07-28-online-tools-navigation.md
git commit -m "feat: add online tools navigation"
```
