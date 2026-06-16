---
title: OKF 开放知识格式
---

# OKF 开放知识格式

OKF（Open Knowledge Format）是一种用于表示知识资产的开放格式。它使用一组普通的 Markdown 文件，加上 YAML frontmatter，描述数据、系统、指标、API、业务概念、Playbook、外部参考文档等知识对象。

官方资料：[GoogleCloudPlatform/knowledge-catalog - okf](https://github.com/GoogleCloudPlatform/knowledge-catalog/tree/main/okf)

OKF 的重点不是提供新的数据库、知识图谱引擎或 RAG 平台，而是定义一种轻量、可读、可版本管理、可被人和 AI Agent 同时消费的知识文件格式。

可以把 OKF 理解为面向人类和 Agent 的 Metadata / Knowledge as Code 格式。它适合把企业里的数据目录、业务术语、表结构、指标定义、文档引用、系统依赖关系等内容组织为文件，放入 Git、文档站、Obsidian、搜索索引、RAG 系统或 Agent 上下文中使用。

## 设计目标

OKF 的主要目标包括：

- **让知识可读**：普通 Markdown 文件可以直接打开阅读，不依赖专用 SDK、数据库或服务端。
- **让知识可被 Agent 消费**：Markdown 正文适合 LLM 读取，YAML frontmatter 适合机器解析、过滤、索引和路由。
- **让知识可版本管理**：Bundle 可以放在 Git 中，天然支持 diff、review、blame 和 pull request。
- **让知识可迁移**：不绑定特定厂商、模型、Agent 框架、存储系统或 UI。
- **让知识可渐进加载**：通过目录结构和 `index.md`，Agent 可以先看目录，再按需读取具体文件。
- **让知识可以表达关系**：Concept 之间通过 Markdown 链接形成图结构，而不仅是目录树。

## 不解决的问题

OKF 的定位很轻，它不是：

- 数据库；
- 向量数据库；
- RAG 框架；
- 数据目录产品本身；
- 查询引擎；
- 固定 ontology / taxonomy；
- OpenAPI、Protobuf、Avro、JSON Schema 这类领域 Schema 的替代品；
- 某个 Agent 框架的 Skill 格式。

它更像是这些系统之间的开放中间层：

```text
数据目录 / 数据库 / API / 文档 / 业务知识
        ↓
      OKF Bundle
        ↓
Obsidian / MkDocs / Git / Agent / RAG / 搜索索引 / 图谱可视化
```

## 核心术语

### Knowledge Bundle

Knowledge Bundle 是一个完整的 OKF 知识包，本质上是一个目录树。

```text
my_bundle/
├── index.md
├── log.md
├── datasets/
│   ├── index.md
│   └── sales.md
├── tables/
│   ├── index.md
│   ├── orders.md
│   └── customers.md
├── metrics/
│   └── revenue.md
└── playbooks/
    └── freshness-alert.md
```

Bundle 是 OKF 的分发单位，可以是 Git 仓库、压缩包、大仓库中的子目录，或挂载到文件系统中的目录。实践中推荐使用 Git，因为可以获得版本历史、审查和变更追踪能力。

### Concept

Concept 是 OKF 中的最小知识单元，对应一个 Markdown 文件。Concept 可以表示数据库表、数据集、API Endpoint、业务指标、业务流程、故障处理 Playbook、外部参考文档或抽象业务概念。

### Concept ID

Concept ID 是 Concept 文件在 Bundle 内的路径，去掉 `.md` 后缀。

```text
tables/orders.md
```

对应的 Concept ID 是：

```text
tables/orders
```

### Frontmatter

Frontmatter 是 Markdown 文件开头的 YAML 元数据块，用 `---` 包裹。

```yaml
---
type: BigQuery Table
title: Orders
description: One row per completed customer order.
resource: https://console.cloud.google.com/bigquery?p=acme&d=sales&t=orders
tags: [sales, orders]
timestamp: 2026-05-28T00:00:00Z
---
```

### Body

Body 是 frontmatter 后面的 Markdown 正文，用来放详细说明、Schema、示例、SQL、引用、业务规则等内容。

## Bundle 目录结构

一个 OKF Bundle 是一个 Markdown 目录树：

```text
path/to/bundle/
├── index.md                      # 可选：当前目录索引
├── log.md                        # 可选：当前目录变更日志
├── <concept>.md                  # Concept 文件
└── <subdirectory>/
    ├── index.md
    ├── <concept>.md
    └── ...
```

OKF 中有两个保留文件名：

| 文件名 | 作用 |
| --- | --- |
| `index.md` | 当前目录的索引文件，用于渐进式浏览 |
| `log.md` | 当前目录范围内的更新日志 |

除了这两个保留文件，其他 `.md` 文件都被视为 Concept 文件。

## Concept 文件标准

每个 Concept 文件必须是 UTF-8 Markdown 文件，并由两部分组成：

```md
---
YAML frontmatter
---

Markdown body
```

OKF 对 Concept 的硬性要求很少，只有 `type` 是必填字段。

| 字段 | 是否必填 | 说明 |
| --- | --- | --- |
| `type` | 是 | Concept 类型，例如 `BigQuery Table`、`Metric`、`API Endpoint`、`Playbook` |

`type` 没有中央注册表。生产者可以自行定义类型，消费者遇到未知类型时应该宽容处理，通常把它当作通用 Concept。

推荐字段如下：

| 字段 | 是否必填 | 说明 |
| --- | --- | --- |
| `title` | 否，推荐 | 人类可读标题 |
| `description` | 否，推荐 | 一句话摘要，可用于索引、搜索结果、预览 |
| `resource` | 否，推荐 | 该 Concept 对应底层资源的规范 URI |
| `tags` | 否 | 标签列表，用于跨目录分类 |
| `timestamp` | 否 | 最后一次有意义变更的 ISO 8601 时间 |
| 其他字段 | 否 | 生产者自定义扩展字段 |

消费者不应该因为未知字段而拒绝读取文档，并且在 round-trip 时最好保留这些字段。

## 合规性

一个 Bundle 符合 OKF v0.1，只需要满足：

1. 每个非保留 `.md` 文件都有可解析的 YAML frontmatter。
2. 每个 frontmatter 都包含非空 `type` 字段。
3. 如果存在 `index.md` 和 `log.md`，它们遵循对应结构约定。

其他约束都是软约束。消费者不应该因为缺少可选字段、出现未知 `type`、出现未知 frontmatter key、存在 broken link 或缺少 `index.md` 而拒绝读取 Bundle。

## 与其他工具和格式对比

### OKF vs Obsidian / Notion

| 对比项 | OKF | Obsidian / Notion |
| --- | --- | --- |
| 核心定位 | 知识交换格式 | 知识管理工具 / UI |
| 存储形态 | Markdown 文件 + YAML frontmatter | Obsidian 偏 Markdown；Notion 偏平台数据库 |
| 是否规定最小结构 | 是，规定 `type`、Concept、Bundle、`index.md`、`log.md` 等 | 不强调跨系统互操作标准 |
| 是否适合 Agent | 很适合，文件可直接读 | Obsidian 可以；Notion 需要 API 或导出 |
| 是否工具绑定 | 不绑定 | 绑定具体产品体验 |

OKF 更像是给 Obsidian、Notion、文档站和 Agent 共同使用的底层知识格式，而不是替代这些工具的 UI。

### OKF vs RAG / 向量数据库

| 对比项 | OKF | RAG / 向量数据库 |
| --- | --- | --- |
| 核心定位 | 原始知识格式 / 中间格式 | 检索与问答架构 |
| 数据形态 | Markdown 文件 | Chunk、embedding、metadata |
| 是否直接回答问题 | 不负责 | 负责检索增强生成 |
| 是否需要索引 | 不强制 | 通常需要 |
| 优势 | 可读、可审查、可版本管理 | 语义检索、规模化问答 |

OKF 不是 RAG 的替代品，而是 RAG 的上游内容格式。可以先用 OKF 管理知识，再把 OKF 文件切 chunk、生成 embedding、入向量库。

```text
OKF Bundle
   ↓
Chunking / Metadata extraction
   ↓
Embedding / Search Index
   ↓
RAG / Agent QA
```

### OKF vs 数据目录平台

| 对比项 | OKF | Dataplex / Unity Catalog / Collibra |
| --- | --- | --- |
| 核心定位 | 开放文件格式 | 企业级数据目录 / 治理平台 |
| 存储方式 | 文件系统 / Git | 服务端平台 |
| 访问方式 | 读文件即可 | API / UI / 权限系统 |
| 治理能力 | 很轻 | 通常更强，例如权限、血缘、审计、策略 |
| 可移植性 | 高 | 依赖平台 |
| 适合场景 | 交换、导出、Agent 上下文、文档化 | 企业治理、权限、血缘、资产管理 |

OKF 不替代企业数据目录，而是可以作为数据目录的导出格式、补充文档层或 Agent 可读副本。

### OKF vs OpenAPI / Protobuf / Avro / JSON Schema

| 对比项 | OKF | OpenAPI / Protobuf / Avro / JSON Schema |
| --- | --- | --- |
| 核心定位 | 知识上下文描述 | 领域 Schema / 接口契约 / 数据结构定义 |
| 机器严格性 | 较弱，宽松 | 较强，通常有严格校验 |
| 人类说明 | 强，Markdown 正文 | 有，但不是主要目标 |
| Agent 上下文 | 很适合 | 适合结构信息，但缺少业务上下文 |
| 是否替代 | 不替代 | 被 OKF 引用或解释 |

OKF 不替代 OpenAPI、Protobuf 或 Avro。OKF 可以引用这些 Schema，并补充业务含义、使用示例、注意事项和文档引用。

### OKF vs RDF / OWL / 知识图谱

| 对比项 | OKF | RDF / OWL / 知识图谱 |
| --- | --- | --- |
| 核心定位 | 轻量知识文件格式 | 严格语义建模 / 图数据 |
| 关系表达 | Markdown 链接 + 上下文语义 | 三元组、ontology、边类型 |
| 学习成本 | 低 | 高 |
| 机器推理 | 弱 | 强 |
| 人类可读性 | 高 | 取决于工具 |
| Agent 直接读取 | 很方便 | 通常需要工具或转换 |

OKF 更适合作为轻量、可读、可维护的知识文件层；RDF / OWL 更适合需要严格语义、推理和复杂图查询的场景。

### OKF vs 普通 Markdown 文档

| 对比项 | OKF | 普通 Markdown |
| --- | --- | --- |
| 是否有结构规范 | 有最小规范 | 通常没有 |
| 是否有机器可读元数据 | 有 YAML frontmatter | 不一定有 |
| 是否定义 Concept / Bundle | 有 | 没有 |
| 是否适合工具互操作 | 更适合 | 取决于约定 |
| 是否适合 Agent 渐进读取 | 更适合 | 需要额外设计 |

OKF 可以理解成带最小标准的 Markdown 知识库。它比普通 Markdown 更适合工具消费和 Agent 上下文管理。

## 典型使用场景

### 数据资产目录的文件化副本

可以把 BigQuery、Snowflake、Dataplex、Unity Catalog、Collibra 里的数据资产导出成 OKF：

```text
datasets/
tables/
columns/
metrics/
lineage/
playbooks/
```

适合用于数据资产审查、表结构说明、指标定义管理、数据治理文档、Agent 查表和选表。

### Agent 上下文知识库

OKF 适合作为 Agent 的文件化上下文：

```text
index.md
  ↓
按需读取 tables/orders.md
  ↓
继续追踪 links 到 metrics/revenue.md
```

这种组织方式的优点是：

- 不需要一次性加载全部知识；
- Agent 可以通过 `index.md` 逐层导航；
- frontmatter 可以用于过滤；
- Markdown body 可以直接作为上下文。

## 总结

OKF 是一种非常轻量的开放知识格式。它的核心约定是：用 Markdown 表达知识正文，用 YAML frontmatter 表达机器可读元数据，用目录和链接组织知识关系。

对于 Agent、Codex、Claude Code、RAG 场景，OKF 最值得借鉴的是：

1. 把知识拆成小的 Concept 文件。
2. 用 `index.md` 做渐进式导航。
3. 用 frontmatter 做过滤、索引和路由。
4. 用 Markdown body 保留人类和 LLM 可读的上下文。
5. 用普通 Markdown 链接表达关系。
