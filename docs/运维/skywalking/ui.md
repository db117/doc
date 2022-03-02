---
title: UI详情
---

 ### 栏目

- 仪表盘：查看被监控服务的运行状态
- 拓扑图：以拓扑图的方式展现服务直接的关系，并以此为入口查看相关信息
- 追踪：以接口列表的方式展现，追踪接口内部调用过程
- 性能剖析：单独端点进行采样分析，并可查看堆栈信息
- 告警：触发告警的告警列表，包括实例，请求超时等。
- 自动刷新：刷新当前数据内容

### 仪表盘

#### 控制栏

- 第一栏：不同内容主题的监控面板，应用/数据库/容器等
- 第二栏：操作，包括编辑/导出当前数据/倒入展示数据/不同服务端点筛选展示
- 第三栏：不同纬度展示，服务/实例/端点

#### 应用

##### Global全局维度

- Services load：服务每分钟请求数

- Slow Services：慢响应服务，单位ms

- Un-Health services(Apdex):Apdex性能指标，1为满分。

- Global Response Latency：百分比响应延时，不同百分比的延时时间，单位ms

- Global Heatmap：服务响应时间热力分布图，根据时间段内不同响应时间的数量显示颜色深度

##### Service服务维度

- Service Apdex（数字）:当前服务的评分 
- Service Apdex（折线图）：不同时间的Apdex评分
- Successful Rate（数字）：请求成功率
- Successful Rate（折线图）：不同时间的请求成功率
- Servce Load（数字）：每分钟请求数
- Servce Load（折线图）：不同时间的每分钟请求数
- Service Avg Response Times：平均响应延时，单位ms
- Global Response Time Percentile：百分比响应延时
- Servce Instances Load：每个服务实例的每分钟请求数
- Show Service Instance：每个服务实例的最大延时
- Service Instance Successful Rate：每个服务实例的请求成功率

##### Instance实例维度

- Service Instance Load：当前实例的每分钟请求数
- Service Instance Successful Rate：当前实例的请求成功率
- Service Instance Latency：当前实例的响应延时
- JVM CPU:jvm占用CPU的百分比
- JVM Memory：JVM内存占用大小，单位m
- JVM GC Time：JVM垃圾回收时间，包含YGC和OGC
- JVM GC Count：JVM垃圾回收次数，包含YGC和OGC

##### Endpoint端点（API）维度

-  Endpoint Load in Current Service：每个端点的每分钟请求数
- Slow Endpoints in Current Service：每个端点的最慢请求时间，单位ms
- Successful Rate in Current Service：每个端点的请求成功率
- Endpoint Load：当前端点每个时间段的请求数据
- Endpoint Avg Response Time：当前端点每个时间段的请求行响应时间
- Endpoint Response Time Percentile：当前端点每个时间段的响应时间占比
- Endpoint Successful Rate：当前端点每个时间段的请求成功率

#### 数据库

- Database Avg Response Time：数据库平均响应时间
- Database Access Successful Rate：数据库请求成功率
- Database Traffic：数据库吞吐量
- Database Access Latency Percentile：数据库访问延迟百分比
- Slow Statements：慢sql展示
- All Database Loads：所有数据库请求量
- Un-Health Databases (Successful Rate)：数据库请求成功率

### 拓扑图

### 追踪

- 左侧：api接口列表，红色-异常请求，蓝色-正常请求
-  右侧：api追踪列表，api请求连接各端点的先后顺序和时间
  - 点开可以查看详情

### 性能剖析

##### 新建任务

- 服务：需要分析的服务
- 端点名称：追踪里面看到的名称
- 监控数据：开始监控的时间
- 监控持续时间
- 起始监控时间：小于监控间隔无效
- 监控间隔：小于间隔的请求不能获取堆栈
- 最大采样

### 告警

- 不同维度告警列表，可分为服务、端点和实例。

