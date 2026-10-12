---
title: Quarkus
---

# Quarkus

整理 Quarkus 的核心概念、构建运行过程与 ArC 实现笔记。源码类名和调用路径可能随 Quarkus 版本变化，阅读时请结合项目实际使用版本。

## 入门与构建

- [核心概念](./start.md)：Quarkus 与 Spring 的概念对照，以及 Build Time 核心流程。
- [常用注解对比](./annotations.md)：Quarkus / CDI 注解与 Spring 常见概念的对照。
- [构建与运行流程](./build-and-run.md)：从 Maven 构建、Augmentation 到应用启动的调用链。

## ArC 实现

- [ArC 构建与容器初始化](./arc-processor.md)：Bean 注册、校验、资源生成及容器初始化阶段。
- [ArC 容器初始化追踪](./bean-initialization.md)：Bean 发现、Recorder 记录与运行时实例获取路径。
- [ArC AOP 拦截流程](./aop.md)：拦截器解析、生成代码与运行时调用链。
- [Quarkus 生成类分析](./generated-classes.md)：ArC、配置、REST 和启动流程中的生成类。
