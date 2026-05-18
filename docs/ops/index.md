---
title: 运维
---

# 运维

日常部署、容器、网关、监控、日志、链路追踪和排障笔记。内容偏向“遇到问题时能快速找到命令、配置和定位方向”。

## 基础设施

- [容器](./containers/index.md)：Docker 命令、安装、远程连接和容器化应用。
- [Kubernetes](./kubernetes/index.md)：kubectl、资源操作、集群访问和常用配置。
- [网关](./gateway/index.md)：Nginx 安装、配置、HTTPS 和性能参数。

## 可观测

- [监控告警](./monitoring/index.md)：Prometheus、Alertmanager、Grafana 和 kube-prometheus。
- [日志链路](./logging/index.md)：Filebeat、Logstash、Elasticsearch 和日志采集处理。
- [链路追踪](./tracing/index.md)：SkyWalking 客户端、服务端、UI 和源码结构。

## 工程工具

- [CI/CD](./ci-cd/index.md)：Jenkins 等持续集成和发布工具。
- [进程管理](./process/index.md)：supervisord 等进程守护工具。

## 排查优先级

1. 先确认服务是否启动、端口是否监听、配置是否生效。
2. 再看日志、指标和链路追踪，缩小到具体组件。
3. 最后再调整参数或重建环境，避免一上来就改大配置。
