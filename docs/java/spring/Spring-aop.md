---
title: spring-app
---

## 简介

- **它基于动态代理来实现**。默认地，如果使用接口的，用 JDK 提供的动态代理实现，如果没有接口，使用 CGLIB 实现。

- **Spring 3.2 以后，spring-core 直接就把 CGLIB 和 ASM 的源码包括进来了** 

- Spring 的 IOC 容器和 AOP 都很重要，Spring AOP 需要依赖于 IOC 容器来管理。 

- Spring AOP 只能作用于 Spring 容器中的 Bean，它是使用纯粹的 Java 代码实现的，只能作用于 bean 的方法。

- Spring 提供了 AspectJ 的支持，但只用到的AspectJ的切点解析和匹配。 

- Spring AOP 是基于代理实现的，在容器启动的时候需要生成代理实例，在方法调用上也会增加栈的深度，使得 Spring AOP 的性能不如 AspectJ 那么好。 

## 概念

- pointcut：切点，需要插入增强的连接点
- Joinpoint：连接点，可以插入的增强位置，在spring中连接点为方法调用
- advice：通知，描述如何增强
- aspect：切面，通知和切点的结合

### advice

Advised

Advisor

Interceptor

