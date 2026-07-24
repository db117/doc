---
title: spring-webflux
---

# Spring WebFlux

> 非阻塞、响应式 Web 框架。

## 主要组件

主要的配置类型，可在 Spring 容器中获取。

| Bean name                    | Bean type                    | Count | Description                               |
|:-----------------------------|:-----------------------------|:------|:------------------------------------------|
| &lt;any&gt;                  | `WebExceptionHandler`        | 0..N  | 异常处理                                      |
| &lt;any&gt;                  | `WebFilter`                  | 0..N  | 过滤器，形成调用链                                 |
| `webHandler`                 | `WebHandler`                 | 1     | 核心，用来处理请求                                 |
| `webSessionManager`          | `WebSessionManager`          | 0..1  | WebSession                                |
| `serverCodecConfigurer`      | `ServerCodecConfigurer`      | 0..1  | 请求数据编码，默认 `ServerCodecConfigurer.create()` |
| `forwardedHeaderTransformer` | `ForwardedHeaderTransformer` | 0..1  | 通过请求头进行转发，默认没有                            |

## DataBufferLimitException

当网关或 WebFlux 组件聚合较大的请求/响应体时，可能出现
`DataBufferLimitException: Exceeded limit on max bytes to buffer`。可以按实际报文上限调整内存缓冲区：

```yaml
spring:
  codec:
    max-in-memory-size: 1MB
```

不要无上限增大该值；对于大文件或持续数据流，应改用流式处理，并在网关层限制请求体大小。
