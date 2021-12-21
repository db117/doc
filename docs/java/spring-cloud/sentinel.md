---
title: sentinel
---

源码地址：https://github.com/alibaba/Sentinel 

官方文档：https://github.com/alibaba/Sentinel/wiki 


![Sentinel-features-overview](https://user-images.githubusercontent.com/9434884/50505538-2c484880-0aaf-11e9-9ffc-cbaaef20be2b.png)

------

### 客户端

#### 客户端流程图

<iframe id="embed_dom" name="embed_dom" frameborder="0" style="display:block;width:725px; height:245px;" src="https://www.processon.com/embed/61c042596376892b1df90c97"></iframe>

------

#### 扩展

- InitFunc

  > `com.alibaba.csp.sentinel.init.InitExecutor#doInit`会在加载时调用。
  >
  > 在`META-INF/services/com.alibaba.csp.sentinel.init.InitFunc`中添加。

- MetricExtension，AdvancedMetricExtension

  > 用于统计。
  >
  > `com.alibaba.csp.sentinel.metric.extension.callback.MetricEntryCallback#onPass`会在操作完成后或发生`BlockException`时调用。

- ProcessorSlot

  > 核心调用链，在`META-INF/services/com.alibaba.csp.sentinel.slotchain.ProcessorSlot`中添加。

- SlotChainBuilder

  > 调用链构建。在`META-INF/services/com.alibaba.csp.sentinel.slotchain.SlotChainBuilder`中添加。

------

### alibaba.cloud

#### 流程图

<iframe id="embed_dom" name="embed_dom" frameborder="0" style="display:block;width:725px; height:245px;" src="https://www.processon.com/embed/61bc2f9b1e08534094243f71"></iframe>



------

### 服务端

#### 扩展

- DynamicRuleProvider

  > 动态规则获取，可扩展为从 `nacos` ，`appllo`，`redis`，`zk`等数据源获取。

- DynamicRulePublisher

  > 在发生配置变更时推送配置。可扩展为向  `nacos` ，`appllo`，`redis`，`zk`等数据源推送。
