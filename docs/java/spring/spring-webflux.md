---
title: spring-webflux
---

> 非阻塞，反应式web。

### 主要组件

> 主要的配置类型，可在spring容器中获取。

| Bean name                    | Bean type                    | Count | Description                                        |
| :--------------------------- | :--------------------------- | :---- | :------------------------------------------------- |
| <any>                        | `WebExceptionHandler`        | 0..N  | 异常处理                                           |
| <any>                        | `WebFilter`                  | 0..N  | 过滤器，形成调用链                                 |
| `webHandler`                 | `WebHandler`                 | 1     | 核心，用来处理请求                                 |
| `webSessionManager`          | `WebSessionManager`          | 0..1  | WebSession                                         |
| `serverCodecConfigurer`      | `ServerCodecConfigurer`      | 0..1  | 请求数据编码，默认`ServerCodecConfigurer.create()` |
| `forwardedHeaderTransformer` | `ForwardedHeaderTransformer` | 0..1  | 通过请求头进行转发，默认没有                       |