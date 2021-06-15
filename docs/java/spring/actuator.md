---
title: Spring Boot - Actuator
---

##  简介

> spring-boot 子项目
>
> 使用 HTTP 端点或 JMX 来管理和监视应用程序。审计、健康状况和度量标准收集也可以自动应用于您的应用程序。
>
> [Spring Boot Actuator: Production-ready Features](https://docs.spring.io/spring-boot/docs/current/reference/html/actuator.html#actuator)
>
> [Micrometer Application Monitoring](https://micrometer.io/)
>
> [micrometer-metrics/micrometer: An application metrics facade for the most popular monitoring tools. Think SLF4J, but for metrics. (github.com)](https://github.com/micrometer-metrics/micrometer)



## 常用接口

### Kubernetes Probes

> k8s 心跳,就绪接口

```
livenessProbe:
  httpGet:
    path: /actuator/health/liveness
    port: <actuator-port>
  failureThreshold: ...
  periodSeconds: ...

readinessProbe:
  httpGet:
    path: /actuator/health/readiness
    port: <actuator-port>
  failureThreshold: ...
  periodSeconds: ...
```



## 常用配置

### 自定义标签

> 获取指标时,添加标签

```
management:
  metrics:
    tags:
      app: "appname"
      profile: "prod"
```

