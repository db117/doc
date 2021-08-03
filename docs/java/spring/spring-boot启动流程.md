---
title: spring-boot启动流程
---

<iframe id="embed_dom" name="embed_dom" frameborder="0" style="display:block;width:725px; height:245px;" src="https://www.processon.com/embed/60f69a560e3e74596bab3b71"></iframe>

### 执行启动类的mian

> 解压后的目录结构

```
├── BOOT-INF
│   ├── classes               # 项目编译的class文件,已经配置文件
│   └── lib                   # 项目依赖的jar包
├── META-INF
│   └── MANIFEST.MF           # jar描述文件
└── org
    └── springframework
        └── boot
            └── loader        # org.springframework.boot.loader包的class文件
```

> MANIFEST.MF文件主要信息

- Main-Class:`  org.springframework.boot.loader.JarLauncher  `实际启动类
- Start-Class:项目的启动类
- Spring-Boot-Classes:项目`resource`目录文件和class文件
- Spring-Boot-Lib:依赖包



- 启动开始

  > 运行启动类的main方法之前的一系列动作,主要自定义类加载器

```
org.springframework.boot.loader.JarLauncher#main
  org.springframework.boot.loader.Launcher#launch(java.lang.String[])
    # 创建类加载器org.springframework.boot.loader.LaunchedURLClassLoader
    org.springframework.boot.loader.Launcher#createClassLoader(java.util.Iterator<Archive>)
    org.springframework.boot.loader.Launcher#launch(java.lang.String[], java.lang.String, java.lang.ClassLoader)
    	org.springframework.boot.loader.Launcher#createMainMethodRunner
    		# 反射调用Main-Class类的main方法
    		org.springframework.boot.loader.MainMethodRunner#run
```



- org.springframework.boot.loader.LaunchedURLClassLoader 类加载器

  > 通过spring-boot的自定义加载器来加载项目的代码以及依赖jar中的代码

```
org.springframework.boot.loader.LaunchedURLClassLoader#loadClass
  # 先找Spring-Boot-Classes下的类
  org.springframework.boot.loader.LaunchedURLClassLoader#loadClassInLaunchedClassLoader
  # 没有找到继续在Spring-Boot-Lib中找
  org.springframework.boot.loader.LaunchedURLClassLoader#definePackageIfNecessary
  # 都没有找到直接调用父类的
  java.lang.ClassLoader#loadClass(java.lang.String, boolean)
```

### 启动类main

> 主要启动流程都在启动类main中。

<iframe id="embed_dom" name="embed_dom" frameborder="0" style="display:block;width:725px; height:245px;" src="https://www.processon.com/embed/60f6a44be401fd09d480564a"></iframe>

**主要逻辑**

```
public ConfigurableApplicationContext run(String... args) {
		StopWatch stopWatch = new StopWatch();
		stopWatch.start();
		// 在真正的 context 初始化完成前使用的 context，主要用来处理事件
		DefaultBootstrapContext bootstrapContext = createBootstrapContext();
		ConfigurableApplicationContext context = null;
		configureHeadlessProperty();
		// 创建监听器并开始监听
		SpringApplicationRunListeners listeners = getRunListeners(args);
		// 发布启动开始事件
		listeners.starting(bootstrapContext, this.mainApplicationClass);
		try {
			ApplicationArguments applicationArguments = new DefaultApplicationArguments(args);
			// 加载SpringBoot配置环境
			ConfigurableEnvironment environment = prepareEnvironment(listeners, bootstrapContext, applicationArguments);
			configureIgnoreBeanInfo(environment);
			// 打印横幅
			Banner printedBanner = printBanner(environment);
			// 根据项目类型创建不同从 contxt
			context = createApplicationContext();
			context.setApplicationStartup(this.applicationStartup);
			// 设置一下启动类需要的bean，发布事件
			prepareContext(bootstrapContext, context, environment, listeners, applicationArguments, printedBanner);
			// 进入spring中进行初始化
			refreshContext(context);
			// 在springBoot中为空，为其他框架扩展使用
			afterRefresh(context, applicationArguments);
			stopWatch.stop();
			if (this.logStartupInfo) {
				new StartupInfoLogger(this.mainApplicationClass).logStarted(getApplicationLog(), stopWatch);
			}
			// 发布启动事件
			listeners.started(context);
		  // 执行所有 ApplicationRunner CommandLineRunner
			callRunners(context, applicationArguments);
		}
		catch (Throwable ex) {
			handleRunFailure(context, ex, listeners);
			throw new IllegalStateException(ex);
		}

		try {
			// 发布运行事件
			listeners.running(context);
		}
		catch (Throwable ex) {
			handleRunFailure(context, ex, null);
			throw new IllegalStateException(ex);
		}
		return context;
	}
```

**启动web容器流程**

当项目为 `web` 是 `org.springframework.boot.SpringApplication#createApplicationContext`，会返回 `org.springframework.boot.web.servlet.context.AnnotationConfigServletWebServerApplicationContex`。

其父类中 `org.springframework.boot.web.servlet.context.ServletWebServerApplicationContext#onRefresh`会创建web容器

`onRefresh`会在spring容器启动是执行

```
org.springframework.boot.web.servlet.context.ServletWebServerApplicationContext#onRefresh
    // 根据设置返回不同的容器
    org.springframework.boot.web.servlet.context.ServletWebServerApplicationContext#createWebServer 
      // 配置 Tomcat 容器
      org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory#getWebServer 
				// 创建 Tomcat 容器
				org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory#getTomcatWebServer 
						// 启动 Tomcat 容器，并启动异常检测线程。
						org.springframework.boot.web.embedded.tomcat.TomcatWebServer#initialize
```

### 自动装配

> 默认大于配置。springboot核心功能。

<iframe id="embed_dom" name="embed_dom" frameborder="0" style="display:block;width:725px; height:245px;" src="https://www.processon.com/embed/610120817d9c083494ed059a"></iframe>

**EnableAutoConfiguration**

核心注解，开启自动装配。通过`org.springframework.context.annotation.Import`注入 `org.springframework.boot.autoconfigure.AutoConfigurationImportSelector`，该类实现了 `DeferredImportSelectorSpring`

会在spring解析 `@import`是调用 `getAutoConfigurationEntry`

**AutoConfigurationImportSelector**

通过 `org.springframework.boot.autoconfigure.AutoConfigurationImportSelector#getCandidateConfigurations`

获取 `META-INF/spring.factories`中定义的类。改接口会在spring初始化是进行装载。

**关闭**

通知设置 `spring.boot.enableautoconfiguration=true`来关闭自动配置

### 注解

**@Configuration(proxyBeanMethods = false)**

标记了@Configuration Spring底层会给配置创建cglib动态代理。 作用：就是防止每次调用本类的Bean方法而重新创建对 象，Bean是默认单例的

**@Conditional派生注解（Spring注解版原生的@Conditional作用）**

- @ConditionalOnJava 
  - 系统的java版本是否符合要求
- @ConditionalOnBean
  - 容器中存在指定Bean
- @ConditionalOnMissingBean
  - 容器中不存在指定Bean
- @ConditionalOnExpression
  - 满足SpEL表达式指定
-  @ConditionalOnClass 
  - 系统中有指定的类
-  @ConditionalOnMissingClass 
  - 系统中没有指定的类 
- @ConditionalOnSingleCandidate 
  - 容器中只有一个指定的Bean，或者这个Bean是首选Bean 
- @ConditionalOnProperty 
  - 系统中指定的属性是否有指定的值 
- @ConditionalOnResource 
  - 类路径下是否存在指定资源文件
- @ConditionalOnWebApplication 
  - 当前是web环境 
- @ConditionalOnNotWebApplication 
  - 当前不是web环境
-  @ConditionalOnJndi 
  - JNDI存在指定项
- EnableConfigurationProperties
  - 将配置文件的值和对象绑定起来，并注册到ioc容器中

### 事件

> 在springBoot启动中各个阶段发布不同的事件。

1. `ApplicationStartingEvent`在运行开始时发送，但在进行任何处理之前（侦听器和初始化程序的注册除外）发送。 

2. 在创建上下文之前，将发送`ApplicationEnvironmentPreparedEvent`。
3. 准备ApplicationContext并调用`ApplicationContextInitializers`之后，将发送`ApplicationContextInitializedEvent`。 
4. 读取完配置类后发送`ApplicationPreparedEvent`。
5. 在刷新上下文之后但在调用`ApplicationRunner`和`CommandLineRunner`之前，将发送`ApplicationStartedEvent`。 
6. 紧随其后发送带有LivenessState.CORRECT的`AvailabilityChangeEvent`，以指示该应用程序被视为处于活动状态。
7. 在调用任何应用程序和命令行运行程序之后，将发送`ApplicationReadyEvent`。 
8. 紧随其后发送ReadabilityState.ACCEPTING_TRAFFIC的`AvailabilityChangeEvent`，以指示应用程序已准备就绪，可以 处理请求。
9. 如果启动时发生异常，则发送`ApplicationFailedEvent`。