---
title: micrometer
---

> [Micrometer Application Observability](https://micrometer.io/)
>
> [micrometer-metrics/micrometer: An application observability facade for the most popular observability tools. Think SLF4J, but for observability. (github.com)](https://github.com/micrometer-metrics/micrometer)

### 概念

- **Registry**
  - 相当于一个容器，存放一下指标
  - `Global Registry`一个公用的容器
- **Meters** 
  - 指标，整个项目就是收集维护一系列指标
- **Tag**
  - 标签每一个指标都有一系列的标签，Meters+Tag 才能确定一个唯一的数据
  - `Common Tags`,一个`Registry`中公用的标签
  - 标签值不能为 null
- **Meter Filters**
  - 指标过滤器
  - 实现方法来判断是否需要该指标
    - DENY：不需要（不进行后续判断）
    - NEUTRAL：没有其他的 DENY 则需要，交给后续的 filter 来决定。
    - ACCEPT：需要（不进行后续判断）
  - Transforming metrics
    - 替换过滤符合条件的指标

- **Counters**
  - 只能累加的计数器
  - 适合统计方法执行次数，接口调用次数等
- **Gauges**
  - 就是一个数字。
  - 适合一个可以量化的属性，最长用的指标类型。
  - 比如某张表的行数，硬盘容量，cpu，内存使用情况等
- **Timers**
  - 某一个事件执行的情况
  - 记录接口，方法等执行时间情况
