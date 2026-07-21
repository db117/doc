---
title: Elasticsearch
---

# Elasticsearch

## 文档

- [query string](./query-string.md)：Elasticsearch query string 查询语法。

## Kibana 报错内存溢出

> kibana/bin

```
NODE_OPTIONS="--max-old-space-size=4096"
```
