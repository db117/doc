---
title: 客户端配置
---

### 常用设置
```
# 设置Agent命名空间，它用来隔离追踪和监控数据，当两个应用使用不同的名称空间时，跨进程传播链会中断。
agent.namespace=${SW_AGENT_NAMESPACE:default-namespace}
 
# 设置服务名称，会在 Skywalking UI 上显示的名称
agent.service_name=${SW_AGENT_NAME:Your_ApplicationName}
 
# 每 3秒采集的样本跟踪比例，如果是负数则表示 100%采集
agent.sample_n_per_3_secs=${SW_AGENT_SAMPLE:-1}
 
# 启用 Debug ，如果为 true 则将把所有检测到的类文件保存在"/debug"文件夹中
# agent.is_open_debugging_class = ${SW_AGENT_OPEN_DEBUG:true}
 
# 后端的 collector 端口及地址
collector.backend_service=${SW_AGENT_COLLECTOR_BACKEND_SERVICES:192.168.2.215:11800}
 
# 日志级别
logging.level=${SW_LOGGING_LEVEL:DEBUG}

# 这个配置项控制SpringMVC插件是否应该收集请求的参数
plugin.springmvc.collect_http_params=true

# mysql plugin configuration
# 收集MySQL执行参数
# plugin.mysql.trace_sql_parameters=${SW_MYSQL_TRACE_SQL_PARAMETERS:false}
```

