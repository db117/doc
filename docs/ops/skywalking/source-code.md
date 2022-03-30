---
title: 源码分析
---

### oap server

> [apache/skywalking: APM, Application Performance Monitoring System (github.com)](https://github.com/apache/skywalking)
>
> [Apache SkyWalking](https://skywalking.apache.org/)
>
> 服务端主流程源码分析。

#### 目录结构

```
oap-server
├── analyzer									数据分析模块
│   ├── agent-analyzer				分析客户端发送的jvm，指标，trace 数据
│   ├── event-analyzer				分析事件
│   ├── log-analyzer					分析日志
│   ├── meter-analyzer				分析特定指标
│   └── pom.xml
├── exporter
│   ├── pom.xml
│   └── src
├── microbench								基准测试
│   ├── pom.xml
│   └── src
├── oal-grammar								oal 相关
│   ├── pom.xml
│   └── src
├── oal-rt
│   ├── pom.xml
│   └── src
├── pom.xml
├── server-alarm-plugin				告警插件
│   ├── pom.xml
│   └── src
├── server-cluster-plugin			集群相关
│   ├── cluster-consul-plugin
│   ├── cluster-etcd-plugin
│   ├── cluster-kubernetes-plugin
│   ├── cluster-nacos-plugin
│   ├── cluster-standalone-plugin
│   ├── cluster-zookeeper-plugin
│   └── pom.xml
├── server-configuration			动态配置相关
│   ├── configuration-api
│   ├── configuration-apollo
│   ├── configuration-consul
│   ├── configuration-etcd
│   ├── configuration-k8s-configmap
│   ├── configuration-nacos
│   ├── configuration-zookeeper
│   ├── grpc-configuration-sync
│   └── pom.xml
├── server-core								核心模块
│   ├── pom.xml
│   └── src
├── server-fetcher-plugin			数据接收模块，可以从别的地方获取数据
│   ├── kafka-fetcher-plugin
│   ├── pom.xml
│   └── prometheus-fetcher-plugin
├── server-health-checker			健康检查
│   ├── pom.xml
│   └── src
├── server-library						
│   ├── library-client									各种客户端
│   ├── library-datacarrier-queue				一个数据队列
│   ├── library-elasticsearch-client		es 客户端
│   ├── library-module									module 核心模块
│   ├── library-server									jetty 服务，grpc 服务
│   ├── library-util										各种工具类
│   └── pom.xml
├── server-query-plugin
│   ├── pom.xml
│   └── query-graphql-plugin						前端 ui graphql查询接口
├── server-receiver-plugin							各种接收数据
│   ├── configuration-discovery-receiver-plugin
│   ├── envoy-metrics-receiver-plugin
│   ├── otel-receiver-plugin
│   ├── pom.xml
│   ├── receiver-proto
│   ├── skywalking-browser-receiver-plugin
│   ├── skywalking-clr-receiver-plugin
│   ├── skywalking-ebpf-receiver-plugin
│   ├── skywalking-event-receiver-plugin
│   ├── skywalking-jvm-receiver-plugin
│   ├── skywalking-log-recevier-plugin
│   ├── skywalking-management-receiver-plugin
│   ├── skywalking-mesh-receiver-plugin
│   ├── skywalking-meter-receiver-plugin
│   ├── skywalking-profile-receiver-plugin
│   ├── skywalking-sharing-server-plugin
│   ├── skywalking-trace-receiver-plugin
│   ├── skywalking-zabbix-receiver-plugin
│   └── zipkin-receiver-plugin
├── server-starter										启动类
│   ├── pom.xml
│   └── src
├── server-storage-plugin							数据存储模块
│   ├── pom.xml
│   ├── storage-elasticsearch-plugin
│   ├── storage-influxdb-plugin
│   ├── storage-iotdb-plugin
│   ├── storage-jdbc-hikaricp-plugin
│   ├── storage-tidb-plugin
│   └── storage-zipkin-elasticsearch-plugin
├── server-telemetry
│   ├── pom.xml
│   ├── telemetry-api
│   └── telemetry-prometheus
├── server-testing
│   ├── pom.xml
│   ├── server-testing.iml
│   └── src
└── server-tools
    ├── pom.xml
    └── profile-exporter

```

##### 主要类以及接口

- OAPServerStartUp：启动类
- ApplicationConfigLoader：加载配置
- ModuleManager：加载各种模块
- ModuleProvider：提供服务类，主要通过 `prepare`，`start`，`notifyAfterCompleted`实现各种个功能
- ModuleConfig：各种插件配置类
- ISource：数据对象
- GRPCHandlerRegister：GRPC 处理器注册
- JettyHandlerRegister：jetty 处理器注册





### Java agent

> Java 客户端,搜集各种数据发送到服务端。
>
> [apache/skywalking-java: The Java agent for Apache SkyWalking (github.com)](https://github.com/apache/skywalking-java)

#### 目录结构

```
.
├── apm-application-toolkit  				一些工具类，仅仅是接口，具体实现在 apm-toolkit-activation 中
├── apm-protocol										Protocol协议定义了各种数据格式，以及通信格式等
├── apm-sniffer											核心代码
│   ├── apm-agent										插件入口
│   ├── apm-agent-core							核心代码
│   ├── apm-sdk-plugin							所有插件的父项目，以及大部分插件
│   ├── apm-test-tools							
│   ├── apm-toolkit-activation			apm-application-toolkit 的具体实现
│   ├── bootstrap-plugins
│   ├── config
│   ├── optional-plugins
│   ├── optional-reporter-plugins
├── changes													变更记录
├── docs														文档

```

#### 流程图

<iframe id="embed_dom" name="embed_dom" frameborder="0" style="display:block;width:725px; height:245px;" src="https://www.processon.com/embed/621347b66376897c8c8308a3"></iframe>

#### 主要类

- SkyWalkingAgent：启动类
- Config：所有配置都在这个类中。
- BootService：所有服务的顶级接口
- TracingContext：核心类，主要用来创建 span
- GlobalIdGenerator：生成 `traceId` ，第一部分为`实例 id`，第二部分为`线程 id`，第三部分为时间戳（毫秒）+当前线程中的序列号[0,9999]
- AbstractSpan：各种插件使用

## 