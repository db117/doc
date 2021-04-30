---
title: spring相关
---

### 缓存requestbody

> org.springframework.web.util.ContentCachingRequestWrapper
>
> 需要多次调用inputStream是把body保存到**java.io.ByteArrayOutputStream**中

### 缓存responseBody

> org.springframework.web.util.ContentCachingResponseWrapper