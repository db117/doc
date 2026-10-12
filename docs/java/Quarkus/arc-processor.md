---
title: ArC 构建与容器初始化
---

# ArC 构建与容器初始化

## 1 初始化 BeanProcessor

> 收集索引、配置和其他扩展提供的 BuildItem，创建 BeanProcessor，配置注解转换、Bean 发现规则、移除规则等，并注册自定义 Context。
> 这个会晚于大部分的扩展初始化。

## 2 注册 Bean

> 注册 Scope，然后调用 `BeanProcessor#registerBeans()` 执行 Bean 发现和注册；同时发布 BeanDiscoveryResult。

```mermaid
sequenceDiagram
    participant BP as BeanProcessor
    participant BD as BeanDeployment
    participant B as Beans
    participant I as Injection
    participant O as ObserverInfo
    BP ->> BD: BeanDeployment#registerBeans()
    activate BD
    BD ->> BD: BeanDeployment#findBeans()
    Note right of BD: 扫描索引、过滤候选类，<br/>收集 Bean、Producer、Disposer 和 Observer 元数据

    loop 每个 Bean 类
        BD ->> B: Beans#createClassBean()
        B -->> BD: BeanInfo 和注入点
    end

    loop 每个 Disposer 方法
        BD ->> I: Injection#forDisposer()
        I -->> BD: Disposer 注入信息
        Note right of BD: 创建 DisposerInfo
    end

    loop 每个 Producer 方法或字段
        BD ->> BD: findDisposer() — 查找匹配的 Disposer
        BD ->> B: Beans#createProducerMethod() / createProducerField()
        B -->> BD: Producer BeanInfo
    end

    loop 同步或异步 Observer 方法
        BD ->> BD: registerObserverMethods() — 注册 Observer
        BD ->> I: Injection#forObserver()
        I -->> BD: Observer 注入信息
        BD ->> O: ObserverInfo#create()
        O -->> BD: ObserverInfo
    end

    Note right of BD: findBeans() 返回 BeanDiscoveryResult，<br/>包含发现的 Bean 和跳过的类
    BD ->> BD: findInterceptors() / findDecorators() — 发现拦截器和装饰器
    BD ->> BD: registerSyntheticBeans() — 注册扩展提供的合成 Bean
    BD ->> BD: updateBeanByTypeMap() — 建立类型到 Bean 的索引，供后续按类型查找
    BD -->> BP: RegistrationContext
    deactivate BD
```

## 3 注册合成 Observer

> 注册合成注入点和合成 Observer。合成 Bean、Observer 等通常由扩展通过 configurator 提供。
> 允许扩展在构建期补充或配置 Bean、注入点和 Observer。

```mermaid
sequenceDiagram
    participant AP as ArcProcessor
    participant BC as BeanConfigurator
    participant BD as BeanDeployment
    participant OR as ObserverRegistrar
    participant Next as 后续阶段

    loop 每个 BeanConfigurator
        AP ->> BC: done()
        Note over AP, BC: 完成合成 Bean 配置，不是任意修改已发现的 Bean
    end

    AP ->> BD: registerSyntheticInjectionPoints(context)
    Note over AP, BD: 将合成 Bean 声明的注入点加入部署模型
    AP ->> BD: registerSyntheticObservers()
    Note over AP, BD: 遍历 ObserverRegistrar，收集合成 Observer

    loop 每个 ObserverRegistrar
        BD ->> OR: register(context)
        Note over BD, OR: 扩展在这里声明 Observer
    end

    BD -->> AP: RegistrationContext
    AP -->> Next: ObserverRegistrationPhaseBuildItem
```

## 4 初始化并校验部署

> 结束合成阶段，初始化 `BeanProcessor`，校验 Bean 部署；收集校验错误和需要应用的字节码转换器。

## 5 生成资源

> 根据校验后的 Bean 模型生成 Bean 类、代理等资源，并登记反射信息、服务提供者等。这里生成的是构建产物，不是创建运行时 Bean 实例。

```mermaid
sequenceDiagram
    participant Build as Build Chain
    participant AP as ArcProcessor
    participant BP as BeanProcessor
    participant BG as BeanGenerator
    participant CPG as ClientProxyGenerator
    Build ->> AP: generateResources(...)
    Note over Build, AP: 进入 Phase 5，开始生成资源
    AP ->> BP: processValidationErrors(...)
    Note over AP, BP: 将校验错误加入部署问题
    AP ->> BP: generateResources(...)
    Note over AP, BP: 生成 Bean 类、代理类及相关资源

    loop 每个需要生成的 Bean
        BP ->> BG: generate(bean)
        Note over BP, BG: 生成 Bean 实现类

        opt 需要客户端代理
            BP ->> CPG: generate(bean)
            Note over BP, CPG: 生成 Client Proxy
        end
    end

    BP -->> AP: Resource 列表
    Note over BP, AP: 返回生成的类和服务提供者资源

    loop 每个生成的 Java 类
        AP ->> Build: GeneratedClassBuildItem
        Note over AP, Build: 将生成类加入构建结果
    end

    opt 存在服务提供者资源
        AP ->> Build: GeneratedServiceProviderBuildItem
        Note over AP, Build: 登记生成的 Service Provider
    end

    opt 需要反射或字节码转换
        AP ->> Build: Reflective*BuildItem / BytecodeTransformerBuildItem
        Note over AP, Build: 登记反射需求和字节码转换请求
    end

    AP -->> Build: ResourcesGeneratedPhaseBuildItem
    Note over AP, Build: 标记资源生成完成，供 Phase 6 建立执行顺序
```

## 6 初始化容器

> 消费资源生成阶段屏障，通过 `ArcRecorder#initContainer()` 记录容器初始化逻辑，供生成的应用在 `STATIC_INIT` 阶段执行。

```mermaid
sequenceDiagram
    participant Build as 构建链
    participant AP as ArcProcessor
    participant Recorder as ArcRecorder
    participant App as 生成的应用
    participant Arc as Arc
    Build ->> AP: initializeContainer(...)
    Note over Build, AP: 消费 ResourcesGeneratedPhaseBuildItem，确保 Phase 5 已完成
    AP ->> Recorder: initContainer(...)
    Note over AP, Recorder: @Record(STATIC_INIT)，此处记录初始化调用
    AP -->> Build: ArcContainerBuildItem
    Note over AP, Build: 提供容器结果给后续构建步骤
    App ->> Recorder: 执行记录的 initContainer()
    Recorder ->> Arc: initialize(config)
    Note over Recorder, Arc: 应用启动时初始化实际的 Arc 容器
```
