---
title: MyBatis
---

### 流程图

- MyBatis 整体执行流程图

<iframe id="embed_dom" name="embed_dom" frameborder="0" style="display:block;width:725px; height:245px;" src="https://www.processon.com/embed/6194d85463768938bc8f076e"></iframe>

- MyBatis 整合 Spring 流程图

  <iframe id="embed_dom" name="embed_dom" frameborder="0" style="display:block;width:725px; height:245px;" src="https://www.processon.com/embed/6197805563768938bc95b5c1"></iframe>

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

- MapperProxy

  > mapper 代理对象的`InvocationHandler`接口，所有 mapper 实际都走这个类。

- MapperMethod

  > 正在干活的类，通过`org.apache.ibatis.binding.MapperMethod#execute`来执行数据库操作。

- Configuration

  > 核心配置类，包含几乎所有东西。

- MappedStatement

  > 对应所有 mapper 方法，保存有执行语句，返回值处理器等信息。

- MapperRegistry

  > 注册 mapper，通过`org.apache.ibatis.builder.annotation.MapperAnnotationBuilder#parse`解析 mapper 接口，通过`org.apache.ibatis.builder.annotation.MapperAnnotationBuilder#parseStatement`解析各种注解。生成 mapper 代理对象。

### 整合 Spring

#### 主要组件

- MapperScannerRegistrar

  > 通过`@MapperScans`注入，向 Spring 容器中注册`MapperScannerConfigurer`

- MapperScannerConfigurer

  > 通过`ClassPathMapperScanner#doScan`扫描`@MapperScans`中设置的包，并向 Spring 容器中注册`MapperFactoryBean`，并设置其`autowireMode`为`AUTOWIRE_BY_TYPE`

- MapperFactoryBean

  > 所有 mqpper 都会包装成这个类注入到 Spring 容器中。通过属性`mapperInterface`执行实际 mapper。通过`AUTOWIRE_BY_TYPE`在创建是自动注入`SqlSessionTemplate`。在 Spring 获取对象时通过`MapperProxyFactory#newInstance`创建代理对象。

- SqlSessionTemplate

  > 通过内部类`SqlSessionInterceptor#invoke`生成代理对象。适配 Spring 的事务管理。

- SqlSessionFactoryBean

  > 核心配置类，需要自行注入到 spring 容器中。在 Spring 创建对象时，调用`SqlSessionFactoryBean#buildSqlSessionFactory加载一系列配置，并配置plugin，TypeHandler,二级缓存等信息，扫描并通过`XMLMapperBuilder`加载所有 mapper