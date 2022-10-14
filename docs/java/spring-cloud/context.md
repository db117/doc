---
title: spring-cloud-context 详细源码 
---

### RefreshScope 实现

流程图

<iframe id="embed_dom" name="embed_dom" frameborder="0" style="display:block;width:525px; height:245px;" src="https://www.processon.com/embed/6348db5b7d9c080c425579d1"></iframe>

注意事项

- 不要太对类都加上`@RefreshScope`，在刷新时，以及访问时是用的同一把锁。
- 有`@RefreshScope`时，spring Aop 回不生效的。
  - 所有对象都会用`LockedScopedProxyFactoryBean`对象包装着
  - 继承与`ScopedProxyFactoryBean`，这个对象回把代理的对象添加上`AopInfrastructureBean`
  - 有`AopInfrastructureBean` 接口就不会被代理