---
title: spring-app
---

## 流程图

<iframe id="embed_dom" name="embed_dom" frameborder="0" style="display:block;width:725px; height:245px;" src="https://www.processon.com/embed/611f88760e3e745cf8fffbad"></iframe>

## 简介

- **它基于动态代理来实现**。默认地，如果使用接口的，用 JDK 提供的动态代理实现，如果没有接口，使用 CGLIB 实现。

- **Spring 3.2 以后，spring-core 直接就把 CGLIB 和 ASM 的源码包括进来了** 

- Spring 的 IOC 容器和 AOP 都很重要，Spring AOP 需要依赖于 IOC 容器来管理。 

- Spring AOP 只能作用于 Spring 容器中的 Bean，它是使用纯粹的 Java 代码实现的，只能作用于 bean 的方法。

- Spring 提供了 AspectJ 的支持，但只用到的AspectJ的切点解析和匹配。 

- Spring AOP 是基于代理实现的，在容器启动的时候需要生成代理实例，在方法调用上也会增加栈的深度，使得 Spring AOP 的性能不如 AspectJ 那么好。 

## 概念

- `pointcut`：切点，需要插入增强的连接点
- `Joinpoint`：连接点，可以插入的增强位置，在spring中连接点为方法调用
- `advice`：通知，描述如何增强
- `aspect`：切面，通知和切点的结合
- `Advisor`：封装`Joinpoint`和`advice`

## 使用

> spring中使用通过添加 `@EnableAspectJAutoProxy`即可开启
>
> spring-boot中默认开启，2.0后`proxy-target-class`默认为`true`。即默认为cglib代理（不是接口或本身就是jdk代理的情况下）

## 源码

### 主要类

- AspectJAutoProxyRegistrar
  - 注入`AnnotationAwareAspectJAutoProxyCreator`
- AnnotationAwareAspectJAutoProxyCreator
  - 继承`AnnotationAwareAspectJAutoProxyCreator`
    - 继承`AbstractAdvisorAutoProxyCreator`
      - 继承`AbstractAutoProxyCreator`
- BeanFactoryAspectJAdvisorsBuilder
  - 构建所有`AspectJ`的`Advisor`
- ReflectiveAspectJAdvisorFactory
  - 获取`Pointcut`，`Advice`
- DefaultAdvisorChainFactory
  - 生成调用链
- DefaultAopProxyFactory
  - 创建`AopProxy`
- JdkDynamicAopProxy
  - jdk动态代理对象生成
- CglibAopProxy
  - cglib动态代理对象生成

### 主要流程

1. 通过`@EnableAspectJAutoProxy`注解注入`AnnotationAwareAspectJAutoProxyCreator`
2. 在类第一次实例化前