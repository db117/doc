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



## 默认接口

### Spring-boot

> url/actuator/+具体接口
>
> 直接调用`url/actuator`会展示可用接口

- beans  ：显示所有 bean
- conditions ：显示所有condition
- configprops : 显示所有`@ConfigurationProperties`
- env :  显示所有ConfigurableEnvironment
- health :  监控接口
- info ：应用信息
- metrics ：所有生效的统计指标
- mappings ： 显示所有的`@RequestMapping`
- scheduledtasks ： 显示所有的`@Scheduled`
- threaddump :  dump 当前线程
- [POST]shutdown ： 关闭应用

### spring-cloud-gateway

> url/actuator/gateway/+具体接口
>
> 直接调用`url/actuator/gateway`会显示所有接口

- routes : 路由
- globalfilters ：GlobalFilter
- routefilters ：GatewayFilter
- refresh :  清除路由器缓存
- [GET] routes/{id} : 通过路由 id 获取路由详细信息
- [POST] routes/{id_route_to_create} : 创建路由
- [DELETE] routes/{id_route_to_delete} : 删除路由

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

