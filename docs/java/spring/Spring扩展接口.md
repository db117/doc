---
title: Spring扩展接口
---

### Spring-Boot启动流程

#### ServletContextInitializer

> org.springframework.boot.web.servlet.ServletContextInitializer
>
> 用于以编程方式配置Servlet 3.0+{@link ServletContext Context}的接口。与 WebApplicationInitializer 不同的是实现此接口(且不实现 WebApplicationInitializer)的类不会被 SpringServletContainerInitializer 检测到，因此Servlet容器不会自动引导
>
> 此接口的设计方式类似于ServletContainerInitializer，但其生命周期由Spring管理，而不是Servlet容器
>
> 在springboot启动web容器后调用

#### Banner

> org.springframework.boot.Banner
>
> 用于以编程方式编写横幅的接口类
>
> 在springboot启动时打印横幅
>
> 需要在SpringApplication中设置

#### ApplicationRunner

> org.springframework.boot.ApplicationRunner
>
> 在springboot启动完成后调用
>
> 支持@Order注解

#### CommandLineRunner

> org.springframework.boot.CommandLineRunner
>
> 同ApplicationRunner接口，区别为入参不同
>
> 在ApplicationRunner后调用

#### SpringApplicationRunListener

> org.springframework.boot.SpringApplicationRunListener
>
> 在springboot启动的各个阶段进行回调
>
> 需要在spring.factories中定义
>
> 需要有入参为(SpringApplication application,String ... args)的构造函数

#### RestTemplateCustomizer

> org.springframework.boot.web.client.RestTemplateCustomizer
>
> 配置RestTemplate

### Spring启动流程

#### ApplicationContextAware

> org.springframework.context.ApplicationContextAware，继承Aware
>
> 为bean注入ApplicationContext
>
> 在org.springframework.context.support.ApplicationContextAwareProcessor 中调用

#### EnvironmentAware

> org.springframework.context.EnvironmentAware
>
> 为bean注入Environment
>
> 在org.springframework.context.support.ApplicationContextAwareProcessor 中调用

#### EmbeddedValueResolverAware

> org.springframework.context.EmbeddedValueResolverAware
>
> 注入org.springframework.util.StringValueResolver，实现字符串解析
>
> 在org.springframework.context.support.ApplicationContextAwareProcessor 中调用

#### ApplicationEventPublisherAware

> org.springframework.context.ApplicationEventPublisherAware
>
> 注入org.springframework.context.ApplicationEventPublisher 实现事件推送

#### ApplicationListener

> org.springframework.context.ApplicationListener
>
> 监听org.springframework.context.ApplicationEvent 事件
>
> spring-boot启动会在特定的时机发布事件
>
> org.springframework.boot.web.servlet.context.ServletWebServerInitializedEvent
>
> org.springframework.context.event.ContextRefreshedEvent
>
> org.springframework.boot.context.event.ApplicationStartedEvent
>
> org.springframework.boot.availability.AvailabilityChangeEvent
>
> org.springframework.boot.context.event.ApplicationReadyEvent
>
> org.springframework.boot.availability.AvailabilityChangeEvent

#### BeanFactoryAware

> org.springframework.beans.factory.BeanFactoryAware
>
> 注入 org.springframework.beans.factory.BeanFactory
>
> 在bean初始化时调用

#### BeanNameAware

> org.springframework.beans.factory.BeanNameAware
>
> 设置bean名称
>
> 在bean初始化时调用

#### DisposableBean

> org.springframework.beans.factory.DisposableBean
>
> bean销毁是调用

#### InitializingBean

> org.springframework.beans.factory.InitializingBean
>
> bean初始化后设置参数使用
>
> 在初始化完成后掉用

#### SmartInitializingSingleton

> org.springframework.beans.factory.SmartInitializingSingleton
>
> 当所有单例 bean 都初始化完成以后， 容器会回调该接口的方法 `afterSingletonsInstantiated`。
>
> 保证在所有非懒加载的单例bean都加载完成后调用

#### BeanFactoryPostProcessor

> org.springframework.beans.factory.config.BeanFactoryPostProcessor
>
> 注入org.springframework.beans.factory.config.ConfigurableListableBeanFactory
>
> 在读取完BeanDefinition后调用，可获取BeanDefinition进行修改

#### BeanPostProcessor

> org.springframework.beans.factory.config.BeanPostProcessor
>
> 在bean实例化后调用，初始化前后调用

#### ServletContextAware

> org.springframework.web.context.ServletContextAware
>
> 注入javax.servlet.ServletContext