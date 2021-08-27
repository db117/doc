---
title: Spring扩展接口即执行流程
---

## 流程图

<iframe id="embed_dom" name="embed_dom" frameborder="0" style="display:block;width:725px; height:245px;" src="https://www.processon.com/embed/612318b37d9c0856876bb0de"></iframe>



## refresh

> 通过初始化各种工厂，扫描BeanDefinition等操作后才会允许用户介入初始化流程



#### BeanDefinitionRegistryPostProcessor

> 主要作用是往容器中添加BeanDefinition

- **ConfigurationClassPostProcessor**
  - @PropertySource，@PropertySources：添加配置文件
  - @ComponentScan，@ComponentScans：扫描bean
  - @Import：往容器中添加bean
    - 如果实现`ImportSelector`，则添加调用 `selectImports`获取配置类
    - 在处理完`ImportSelector`后处理`DeferredImportSelector`接口。特别是存在`@Conditional`时，要在其他bean都加载完后才能起到相应的作用
  - 处理`@ImportResource`注解
  - 处理`@Bean`，添加bean



#### MergedBeanDefinitionPostProcessor#postProcessMergedBeanDefinition

> 主要作用是修改BeanDefinition



#### InstantiationAwareBeanPostProcessor#postProcessAfterInstantiation

> 在实例化之后，赋值属性之前调用，返回false则不进行赋值



#### InstantiationAwareBeanPostProcessor#postProcessProperties

> 在设置属性后调用修改属性

- **AutowiredAnnotationBeanPostProcessor**
  - 注入`@Autowired`,`@Value`属性
  - 处理`javax.inject.Inject`注解

#### BeanNameAware

> 设置BeanName

#### BeanClassLoaderAware

> 设置ClassLoader

#### BeanFactoryAware

> 设置BeanFactory

#### BeanPostProcessor#postProcessBeforeInitialization

> 在初始化之前调用所有后置处理器

- **ApplicationContextAwareProcessor**
  - 设置所有`Aware`
- **InitDestroyAnnotationBeanPostProcessor**
  - 处理 `@PostConstruct`

#### InitializingBean#afterPropertiesSet

> 在初始化前调用afterPropertiesSet方法



#### BeanPostProcessor#postProcessAfterInitialization

> 初始化后调用

- AbstractAdvisingBeanPostProcessor
  - 实现aop功能，生成代理对象
- ApplicationListenerDetector
  - 如果当前类是监听器，则添加监听器到applicationContext
- ScheduledAnnotationBeanPostProcessor
  - 处理 `@Scheduled`



#### DestructionAwareBeanPostProcessor#postProcessBeforeDestruction

> 在销毁之前调用

- InitDestroyAnnotationBeanPostProcessor
  - 调用标记 `@PreDestroy`方法
- ApplicationListenerDetector
  - 注销监听器
- ScheduledAnnotationBeanPostProcessor
  - 关闭任务



### Spring-Boot

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

