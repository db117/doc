---
title: 服务配置
---

### 常用配置

### application.yml

> 服务端核心配置类
>
> 这个设置文件背后的核心概念是，Skywalking的Collector基于纯模块化设计。 最终用户可以根据自己的需求切换或组装收集器功能。

#### 核心配置

```
core:
  selector: ${SW_CORE:default}
  default:
    # rest请求配置
    restHost: ${SW_CORE_REST_HOST:0.0.0.0}
    restPort: ${SW_CORE_REST_PORT:12800}
    restContextPath: ${SW_CORE_REST_CONTEXT_PATH:/}
    restMinThreads: ${SW_CORE_REST_JETTY_MIN_THREADS:1}
    restMaxThreads: ${SW_CORE_REST_JETTY_MAX_THREADS:200}
    restIdleTimeOut: ${SW_CORE_REST_JETTY_IDLE_TIMEOUT:30000}
    restAcceptorPriorityDelta: ${SW_CORE_REST_JETTY_DELTA:0}
    restAcceptQueueSize: ${SW_CORE_REST_JETTY_QUEUE_SIZE:0}
    # gRPC配置
    gRPCHost: ${SW_CORE_GRPC_HOST:0.0.0.0}
    gRPCPort: ${SW_CORE_GRPC_PORT:11800}
    gRPCSslEnabled: ${SW_CORE_GRPC_SSL_ENABLED:false}
    gRPCSslKeyPath: ${SW_CORE_GRPC_SSL_KEY_PATH:""}
    gRPCSslCertChainPath: ${SW_CORE_GRPC_SSL_CERT_CHAIN_PATH:""}
    gRPCSslTrustedCAPath: ${SW_CORE_GRPC_SSL_TRUSTED_CA_PATH:""}
    # 追踪记录保存时间
    recordDataTTL: ${SW_CORE_RECORD_DATA_TTL:3} # Unit is day
    # 指标保存时间
    metricsDataTTL: ${SW_CORE_METRICS_DATA_TTL:7} # Unit is day
		# top的计算周期（最慢sql，最慢断点等）
    topNReportPeriod: ${SW_CORE_TOPN_REPORT_PERIOD:10} # top_n record worker report cycle, unit is minute
    # Extra model column are the column defined by in the codes, These columns of model are not required logically in aggregation or further query,
    # and it will cause more load for memory, network of OAP and storage.
    # But, being activated, user could see the name in the storage entities, which make users easier to use 3rd party tool, such as Kibana->ES, to query the data by themselves.
    # 是否开启第三方访问
    activeExtraModelColumns: ${SW_CORE_ACTIVE_EXTRA_MODEL_COLUMNS:false}
    
    # 限制名字的长度
    # The max length of service + instance names should be less than 200
    serviceNameMaxLength: ${SW_SERVICE_NAME_MAX_LENGTH:70}
    instanceNameMaxLength: ${SW_INSTANCE_NAME_MAX_LENGTH:70}
    # The max length of service + endpoint names should be less than 240
    endpointNameMaxLength: ${SW_ENDPOINT_NAME_MAX_LENGTH:150}
```



#### 存储

```
storage:
# 选择存储方式，默认是H2（内存数据库），支持mysql，elasticsearch，influxdb
  selector: ${SW_STORAGE:mysql}
```

#### 客户端分析配置

```
agent-analyzer:
  selector: ${SW_AGENT_ANALYZER:default}
  default:
    # 采样率，默认10000及100% （配置的数值/10000）  
    sampleRate: ${SW_TRACE_SAMPLE_RATE:10000} # The sample rate precision is 1/10000. 10000 means 100% sample in      default.
    
    # 慢sql分析 
    slowDBAccessThreshold: ${SW_SLOW_DB_THRESHOLD:default:200,mongodb:100} # The slow database access thresholds. Unit ms.

```

#### 动态配置

```
configuration:
  # 选择配置服务，支持grpc，Apollo，zookeeper，etcd，consul，k8s-configmap，nacos
  selector: ${SW_CONFIGURATION:none}
```

### alarm-settings.yml

> 告警的核心由一组规则驱动
>
> 告警规则的定义分为三部分。
>
> 1. 告警规则。它们定义了应该如何触发度量警报，应该考虑什么条件。
> 2. [网络钩子](#Webhook}。当警告触发时，哪些服务终端需要被告知。
> 3. [gRPC钩子](https://github.com/SkyAPM/document-cn-translation-of-skywalking/blob/master/docs/zh/8.0.0/setup/backend/backend-alarm.md#gRPCHook). 远程gRPC方法的主机和端口，告警触发后调用.

##### 告警规则

告警规则配置项的说明：

- Rule name：规则名称，也是在告警信息中显示的唯一名称。必须以`_rule`结尾，前缀可自定义
- Metrics name：度量名称，取值为oal脚本中的度量名，目前只支持`long`、`double`和`int`类型。详见[Official OAL script](https://github.com/apache/skywalking/blob/master/docs/en/guides/backend-oal-scripts.md)
- Include names：该规则作用于哪些实体名称，比如服务名，终端名（可选，默认为全部）
- Exclude names：该规则作不用于哪些实体名称，比如服务名，终端名（可选，默认为空）
- Threshold：阈值
- OP： 操作符，目前支持 `>`、`<`、`=`
- Period：多久告警规则需要被核实一下。这是一个时间窗口，与后端部署环境时间相匹配
- Count：在一个Period窗口中，如果values超过Threshold值（按op），达到Count值，需要发送警报
- Silence period：在时间N中触发报警后，在TN -> TN + period这个阶段不告警。 默认情况下，它和Period一样，这意味着相同的告警（在同一个Metrics name拥有相同的Id）在同一个Period内只会触发一次
- message：告警消息

##### 网络钩子

发送字段说明：

- scopeId、scope：所有可用的 Scope 详见 `org.apache.skywalking.oap.server.core.source.DefaultScopeDefine`
- name：目标 Scope 的实体名称
- id0：Scope 实体的 ID
- id1：保留字段，目前暂未使用
- ruleName：告警规则名称
- alarmMessage：告警消息内容
- startTime：告警时间，格式为时间戳

```
# 网络钩子，告警时触发
webhooks:
#  - http://127.0.0.1/notify/
#  - http://127.0.0.1/go-wechat/
```

### component-libraries.yml

> 定义被监控应用程序中使用的所有组件库的名称和id。
>
> 二次开发，或者开发插件时使用
>
> id必须唯一

### endpoint-name-grouping.yml

> 这个分组文件提供了基于正则表达式的定义功能，可以通过更好的和将这些端点合并到一个组中
> 更有意义的聚合度量。

### service-apdex-threshold.yml

> 应用性能指数(APDEX)是基于设置阈值的响应时间度量。它表示令人满意与不满意的响应时间比率。响应时间是指从一个请求到返回的完整请求。