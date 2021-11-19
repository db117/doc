---
title: MyBatis
---

<iframe id="embed_dom" name="embed_dom" frameborder="0" style="display:block;width:525px; height:245px;" src="https://www.processon.com/embed/6194d85463768938bc8f076e"></iframe>

### 主要组件

- Executor

  > sql执行器接口,主要用于维护一级缓存和二级缓存,并且提供事务管理功能

  - BaseExecutor：一级缓存

     *          batchExecutor：批量执行器

     *          ReUseExecutor：可重用的

     *          SimpleExecutor：简单的

     *          CacheExecutor：加入了二级缓存

- ParameterHandler

  > 参数处理

- ResultSetHandler

  > 处理返回值

- StatementHandler

  > 处理Statement

- SqlSession

  > 执行sql，通过调用Executor执行

- SqlSessionFactory

  > 获取SqlSession

- **Interceptor**

  > 拦截器,可以在创建时拦截Executor，ParameterHandler，ResultSetHandler，StatementHandler。
  >
  > 先通过`@Signature`进行筛选过滤然后通过 jdk 动态代理，一层层的包装实现装饰器模式。