---
title: 在线工具导航与 V2Ray 转 Clash 页面迁移设计
description: 为 VitePress 顶部导航增加在线工具菜单，并迁移 V2Ray 转 Clash 订阅页面。
---

# 在线工具导航与 V2Ray 转 Clash 页面迁移设计

## 目标

在站点顶部增加“在线工具”下拉菜单，将现有 V2Ray 转 Clash 订阅转换工具从“知识碎片”分类迁移到独立的在线工具分类，并保持旧链接可用。

## 页面与导航

- 新建 `docs/tools/index.md`，作为在线工具分类入口。
- 将正式工具页迁移到 `docs/tools/v2ray-to-clash.md`，新地址为 `/tools/v2ray-to-clash`。
- 顶部导航新增“在线工具”下拉菜单，菜单项“V2Ray 转 Clash 订阅”直接指向新地址。
- 侧边栏增加 `/tools/` 分类扫描，使在线工具页面沿用站点现有导航方式。
- 从 `docs/other/index.md` 移除“在线工具”小节，避免同一工具归属两个分类。

## 旧地址兼容

原页面 `docs/other/v2ray-to-clash.md` 改为迁移提示页，保留必要的 `title` frontmatter，并提供新页面链接。旧链接 `/other/v2ray-to-clash` 因此不会直接失效，转换组件只在新页面加载。

## 页面内容

迁移后的页面保留现有标题、说明、页面样式类和 `V2rayToMihomo` 组件，不修改转换逻辑、交互或配置生成行为。在线工具分类入口以简短列表展示工具名称与用途。

## 验证

- 运行现有 V2Ray 转 Mihomo 测试，确认页面迁移未影响转换模块。
- 运行 `npm run docs:build`，确认新旧路径、导航与 Markdown 均能正常构建。
- 检查顶部“在线工具”下拉项指向 `/tools/v2ray-to-clash`。

