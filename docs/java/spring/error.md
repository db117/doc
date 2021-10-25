---
title: 常见异常
---

#### org.springframework.core.io.buffer.DataBufferLimitException: Exceeded limit on max bytes to buffer : 262144

> 常见于网关操作http的body，或者数据量太大
>
> 配置参数加大缓冲区
>
> 默认的缓冲区为256K，可以通过配置`spring.codec.max-in-memory-size`加大缓冲区