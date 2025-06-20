---
title: jetCache
---

> Java 缓存框架
>
> https://github.com/alibaba/jetcache

### 流程图

<iframe id="embed_dom" name="embed_dom" frameborder="0" style="display:block;width:725px; height:300px;" src="https://www.processon.com/embed/683edac80625a2683de7181e?cid=683edac80625a2683de71821"></iframe>

### 核心

- 使用 springAop 切所有的注解
  - `JetCacheInterceptor`
- 所有的注解标记的方法都会调用`CacheHandler#invoke`
