---
title: Spring event 
---

> 记录 spring 框架中的一些事件发送时机以及简单使用。

### 主要对象

- `ApplicationEventPublisher`
  - 发送事件的顶级接口
- `ApplicationListener`
  - 监听事件的顶级接口
  - 继承`java.util.EventListener` 
- `ApplicationEvent`
  - 顶级事件对象，在特定的时机会发生不同的事件。
- `@EventListener`
  - 通过注解方式创建`ApplicationListener`
  - `@TransactionalEventListener`

### @EventListener实现方式

<iframe id="embed_dom" name="embed_dom" frameborder="0" style="display:block;width:725px; height:245px;" src="https://www.processon.com/embed/647ed53262920078257f645c"></iframe>

> 简单说就是通过 `BeanFactoryPostProcessor` 添加 `EventListenerFactory`，然后在`spring`所有单例非延迟加载的 Bean 都实例化完后
>
> 通过`SmartInitializingSingleton#afterSingletonsInstantiated`找到所有有`@EventListener`的方法，创建监听器并添加到容器中。

------



### @TransactionalEventListener 实现

> 整体流程和`@EventListener`一致，只是使用`TransactionalEventListenerFactory`来创建`TransactionalApplicationListenerMethodAdapter`。
>
> 在处理事件时，会通过`TransactionSynchronizationManager`注册`TransactionalApplicationListenerSynchronization`。在特定情况下执行注解所在的方法。

------



### 常见事件

- `ContextRefreshedEvent`: 当`ApplicationContext`被初始化或刷新时发送，即当应用程序上下文被完全初始化并可以使用时。

- `ContextStartedEvent`: 当`ApplicationContext`被启动时发送，即当应用程序上下文开始执行时。

- `ContextStoppedEvent`: 当`ApplicationContext`被停止时发送，即当应用程序上下文停止执行时。

- `ContextClosedEvent`: 当`ApplicationContext`被关闭时发送，即当应用程序上下文被销毁时。

- `RequestHandledEvent`: 当HTTP请求被处理完毕后发送，即当HTTP请求处理完成并响应发送回客户端时。

- `ApplicationStartedEvent`: 当Spring Boot应用程序启动时发送，即当Spring Boot启动并准备好接受请求时。
- `ApplicationReadyEvent`: 当Spring Boot应用程序准备好接受请求时发送，即当Spring Boot启动并应用程序上下文已准备好接受请求时。
- `ApplicationStoppedEvent`: 当Spring Boot应用程序停止时发送，即当Spring Boot应用程序停止运行时。