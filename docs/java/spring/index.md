---
title: Spring
---

# Spring

Spring Framework 相关笔记，覆盖核心容器、AOP、事件和 Web。

## 核心容器

- [Spring IOC](./ioc.md)：IOC 加载流程、Bean 创建流程和核心思维导图。
- [Spring 扩展接口执行流程](./extension-points.md)：`BeanDefinitionRegistryPostProcessor`、`BeanFactoryPostProcessor`
  等扩展点。
- [Spring Bean 接口](./bean-interfaces.md)：Aware、BeanPostProcessor、init-method 等生命周期接口。
- [Spring Event](./event.md)：事件发布、监听和事务事件。

## Web 与数据访问

- [Spring AOP](./aop.md)：代理实现、切点、通知和 Advisor。
- [Spring WebFlux](./webflux.md)：响应式 Web 核心组件。
- [Spring MVC 获取 request](./mvc-request.md)：Controller 参数、自动注入等方式。
- [JdbcTemplate](./jdbc-template.md)：查询、`IN` 参数和简单对象保存。

## 资料

- [流程图合集](./diagrams.md)：Spring IOC、事务、AOP、MVC 等流程图。

## 常用片段

### 缓存 request body

`org.springframework.web.util.ContentCachingRequestWrapper`

需要多次调用 `InputStream` 时，会把 body 保存到 `java.io.ByteArrayOutputStream` 中。

### 缓存 response body

`org.springframework.web.util.ContentCachingResponseWrapper`
