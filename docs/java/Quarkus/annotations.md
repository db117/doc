---
title: Quarkus 常用注解对比
---

# Quarkus 常用注解对比

## Bean 定义

| Quarkus / CDI        | Spring                    | 作用            |
|----------------------|---------------------------|-----------------|
| `@ApplicationScoped` | `@Component` / `@Service` | 最常用业务 Bean |
| `@Singleton`         | 默认 singleton            | 单实例 Bean     |
| `@Produces`          | `@Bean`                   | 手动创建 Bean   |
| `@Named`             | `@Component("name")`      | 给 Bean 命名    |

> Quarkus 更推荐普通业务 Bean 使用 @ApplicationScoped。它和 @Singleton 有一个重要区别：@ApplicationScoped 属于 CDI Normal
> Scope，会通过 Client Proxy 使用，并支持延迟实例化；@Singleton 是 pseudo-scope，语义更接近直接持有单实例。

## Bean 作用域

| Quarkus / CDI        | Spring              | 生命周期范围   |
|----------------------|---------------------|----------------|
| `@ApplicationScoped` | singleton           | 应用级         |
| `@Singleton`         | singleton           | 单实例         |
| `@RequestScoped`     | `@RequestScope`     | 一次请求       |
| `@SessionScoped`     | `@SessionScope`     | 一个 Session   |
| `@Dependent`         | `prototype`（近似） | 跟随被注入对象 |

## 容器 / 应用生命周期

| Quarkus                   | Spring                                            | 含义                   |
|---------------------------|---------------------------------------------------|------------------------|
| `@Observes StartupEvent`  | `ApplicationReadyEvent` / `ContextRefreshedEvent` | 应用启动               |
| `@Observes ShutdownEvent` | `ContextClosedEvent`                              | 应用关闭               |
| `@Startup`                | eager singleton 等机制                            | 强制 Bean 启动时初始化 |

## 依赖注入与 Bean 选择

| Quarkus / CDI  | Spring                            |
|----------------|-----------------------------------|
| `@Inject`      | `@Autowired`                      |
| `@Qualifier`   | `@Qualifier`                      |
| `@Named`       | `@Qualifier("xxx")` / Bean Name   |
| `@Alternative` | 类似 `@Primary` / 条件替代实现    |
| `@Priority`    | `@Primary` / `@Order`，视场景而定 |

## Bean 创建与销毁

| Quarkus / CDI | Spring                                        |
|---------------|-----------------------------------------------|
| `@Produces`   | `@Bean`                                       |
| `@Disposes`   | `@Bean(destroyMethod=...)` / `DisposableBean` |

```java

@Produces
Client client() {
    return new Client();
}

void close(@Disposes Client client) {
    client.close();
}
```
