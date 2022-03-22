---
title: 源码分析
---

## Java agent

> Java 客户端,搜集各种数据发送到服务端。
>
> [apache/skywalking-java: The Java agent for Apache SkyWalking (github.com)](https://github.com/apache/skywalking-java)

### 目录结构

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

- org.apache.skywalking.apm.agent.core.conf.Config

> ​	所有配置都在这个类中。