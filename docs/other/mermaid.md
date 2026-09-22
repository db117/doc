---
title: Mermaid 图美化配置
---

# Mermaid 图美化配置

本站通过 `docs/.vitepress/theme/index.ts` 统一初始化 Mermaid，并根据 VitePress 当前的明暗主题切换配色。图本身继续使用标准的
`mermaid` 代码块，不需要在每篇文档里重复初始化。

## 默认配置

当前默认配置关注留白、层级和可读性：

```ts
{
  theme: 'base',
  flowchart: {
    curve: 'basis',
    nodeSpacing: 45,
    rankSpacing: 60,
    padding: 15,
    htmlLabels: true,
    useMaxWidth: true,
  },
}
```

- `curve: 'basis'`：让流程图连线更平滑。
- `nodeSpacing`：控制同一层节点之间的距离。
- `rankSpacing`：控制不同层级之间的距离。
- `padding`：控制图形内容与边界的留白。
- `useMaxWidth`：让图在文档容器中自适应宽度。

## 明暗主题

Mermaid 固定使用 `base` 主题，颜色随 VitePress 当前主题切换：

| 项目          | Light     | Dark      |
|---------------|-----------|-----------|
| 页面背景      | `#ffffff` | `#1e1e1e` |
| 节点背景      | `#f7f7f8` | `#2a2a2e` |
| 节点文字      | `#202123` | `#ececf1` |
| 节点边框      | `#d9d9e3` | `#4a4a52` |
| 连线          | `#8e8ea0` | `#8e8e9f` |
| Subgraph 背景 | `#fafafa` | `#232323` |

浅色主题使用低对比度灰阶，深色主题避免纯黑背景，适合长时间阅读技术文档。

## 编写建议

- 一张图只表达一个问题，避免把多个流程堆在同一张图里。
- 节点文字保持简短；较长的说明移到图下方。
- 调用链、Pipeline 和数据流优先使用 `LR`。
- 流程和生命周期优先使用 `TD`。
- 复杂关系用 `subgraph` 分组，并控制颜色数量。
- 优先调整节点间距和层级间距，再调整颜色。

## 实际使用的 CSS

以下样式与 `docs/.vitepress/theme/style.css` 中的 Mermaid 样式保持一致：

```css
.mermaid {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
  line-height: 1.5;
}

.mermaid .node rect,
.mermaid .node polygon,
.mermaid .node path {
  rx: 8px;
  ry: 8px;
  stroke-width: 1px;
}

.mermaid .nodeLabel {
  font-size: 14px;
  line-height: 1.5;
}

.mermaid .flowchart-link {
  stroke-width: 1.4px;
}

.mermaid marker path {
  stroke-width: 1px;
}

.mermaid .cluster rect {
  rx: 10px;
  ry: 10px;
  stroke-width: 1px;
}

.mermaid .cluster-label text,
.mermaid .cluster-label span {
  font-size: 14px;
  font-weight: 600;
}

.mermaid .edgeLabel {
  font-size: 13px;
}

.mermaid .edgeLabel rect {
  opacity: 0.95;
  rx: 4px;
  ry: 4px;
}
```

## 维护位置

- Mermaid 初始化参数和明暗主题：`docs/.vitepress/theme/index.ts`。
- 节点圆角、字号、连线和 Subgraph 样式：`docs/.vitepress/theme/style.css`。
- 现有文档只需编写标准的 `mermaid` 代码块即可复用这套样式。
