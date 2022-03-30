---
title: skywalking
---
## skywalking
### 简介

> SkyWalking 是观察性分析平台和应用性能管理系统。
>
> 提供分布式追踪、服务网格遥测分析、度量聚合和可视化一体化解决方案.
>
> 支持Java, .Net Core, PHP, NodeJS, Golang, LUA语言探针
>
> 支持Envoy + Istio构建的Service Mesh
>
> [apache/skywalking: APM, Application Performance Monitoring System (github.com)](https://github.com/apache/skywalking)
>
> [Apache SkyWalking](https://skywalking.apache.org/)

#### 特性

- 多种监控手段，语言探针和service mesh
- 多语言自动探针，Java, .Net Core, PHP, NodeJS, Golang, LUA
- 轻量高效，不需要大数据
- 模块化，UI、存储、集群管理多种机制可选
- 支持告警
- 优秀的可视化方案

## 文件下载

[Downloads | Apache SkyWalking](https://skywalking.apache.org/downloads/)

## 文件夹介绍

```
├── README.txt
├── agent													java客户端收集数据使用
│   ├── activations								激活的插件		
│   ├── bootstrap-plugins					也是插件，如需使用copy到plugins中
│   ├── config										各种配置文件
│   ├── logs											执行日志
│   ├── optional-plugins					可选插件，如需使用copy到plugins中
│   ├── optional-reporter-plugins	可选插件，如需使用copy到plugins中
│   ├── plugins										实际上使用的插件
│   └── skywalking-agent.jar			执行文件 -javaagent:/skywalking/agent/skywalking-agent.jar
├── bin														服务端执行脚本
│   ├── oapService.bat						
│   ├── oapService.sh
│   ├── oapServiceInit.bat				初始化数据库脚本
│   ├── oapServiceInit.sh
│   ├── oapServiceNoInit.bat
│   ├── oapServiceNoInit.sh
│   ├── startup.bat								启动脚本
│   ├── startup.sh
│   ├── webappService.bat					ui启动脚本
│   └── webappService.sh
├── config														各种配置文件
│   ├── alarm-settings.yml						报警配置文件
│   ├── application.yml								主配置文件，基本上都是改这个
│   ├── component-libraries.yml				自定义组件配置文件
│   ├── endpoint-name-grouping.yml		
│   ├── envoy-metrics-rules
│   ├── fetcher-prom-rules
│   ├── gateways.yml
│   ├── lal
│   ├── log-mal-rules
│   ├── log4j2.xml										日志配置文件
│   ├── metadata-service-mapping.yaml
│   ├── meter-analyzer-config
│   ├── oal														oal配置文件
│   ├── otel-oc-rules
│   ├── service-apdex-threshold.yml
│   ├── ui-initialized-templates
│   └── zabbix-rules
├── config-examples
│   ├── alarm-settings.yml
│   ├── lal.yaml
│   └── log-mal.yaml
├── oap-libs													依赖库，如需连接mysql则添加驱动
├── tools
│   └── profile-exporter
└── webapp														ui文件
    ├── skywalking-webapp.jar					
    └── webapp.yml										ui配置文件
```

