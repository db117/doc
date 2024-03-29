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
  
    > Configuration#proxyBeanMethods 为true时，会对说有@bean方法添加代理，直接通过beanFactory获取。即调用该方法时实际只执行一次，多次调用返回的对象是同一个。



#### BeanFactoryPostProcessor#postProcessBeanFactory

> 所有的 bean 定义都已经加载，但是没有被实例化。用来修改 bean 定义或者提前实例化
>
> 在注册 bean 的后置处理器之前调用





#### InstantiationAwareBeanPostProcessor#postProcessBeforeInstantiation

> bean初始化前的操作，主要是生成代理对象



#### MergedBeanDefinitionPostProcessor#postProcessMergedBeanDefinition

> 主要作用是修改BeanDefinition

- `com.alibaba.cloud.sentinel.custom.SentinelBeanPostProcessor`：处理 @SentinelRestTemplate，在RestTemplate中添加拦截器



#### InstantiationAwareBeanPostProcessor#postProcessAfterInstantiation

> 在实例化之后，赋值属性之前调用，返回false则不进行后续赋值。



#### InstantiationAwareBeanPostProcessor#postProcessProperties

> 在设置属性后调用修改属性

- **AutowiredAnnotationBeanPostProcessor**
  - 注入`@Autowired`,`@Value`属性
  - 处理`javax.inject.Inject`注解

#### Aware

> 设置各种对象



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

- **AbstractAdvisingBeanPostProcessor**
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



#### org.springframework.beans.factory.SmartInitializingSingleton#afterSingletonsInstantiated

> 会在所有非延迟加载单例 bean 加载完成后调用

- `com.alibaba.cloud.sentinel.custom.SentinelDataSourceHandler`：处理 sentinel 数据源

- `org.springframework.context.event.EventListenerMethodProcessor`

  > 处理`org.springframework.context.event.EventListener`。

#### **ApplicationListener** 

> 监听 spring 发送的事件。可以在 spring，spring-boot 各个阶段进行调用。