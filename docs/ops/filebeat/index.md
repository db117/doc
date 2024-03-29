---
title: filebeat相关
---

### 介绍

> 官网 [Filebeat](https://www.elastic.co/guide/en/beats/filebeat/7.12/index.html)
>
> github [Beats ](https://github.com/elastic/beats)

### 配置文件

#### 刷新配置文件

这些文件包括主配置文件都需要写限`chmod go+w ...`

```
filebeat.config.inputs:
  enabled: true				  
  path: inputs.d/*.yml		# 配置文件地址
  reload.enabled: true		# 开启刷新配置文件
  reload.period: 10s			# 刷新周期
```

#### 聚合多行日志

```
 multiline:
   pattern: '^[0-9]{4}-[0-9]{2}-[0-9]{2}'   	# 指定匹配的表达式（匹配以 2017-11-15）
   negate: true                                # 是否未匹配到
   match: after                                # 合并到上一行的末尾, 为了error等日志
   max_lines: 1000                             # 最大的行数
   timeout: 30s                                # 如果在规定的时候没有新的日志事件就不等待后面的日志
```



#### 提取参数

```
processors:
  - dissect:
      tokenizer: "%{key1} %{key2} %{key3|convert_datatype}"  	# 通过正则提取参数
      field: "message"																				# 提取的字段，默认“message”
      target_prefix: "dissect"																# 输出字段前缀，默认“dissect”
```



####	收集k8s日志

```
		filebeat.inputs:
    - type: container
      exclude_lines: ['^DBG']   #屏蔽空字符串
      paths:
        - /var/log/containers/*.log
      processors:
        - add_kubernetes_metadata:
            host: ${NODE_NAME}
            matchers:
            - logs_path:
                logs_path: "/var/log/containers/"
        # 删除一下乱七八糟的字段
        - drop_fields:
            fields: ["container", "ecs","beat","host","input","source","offset"]
              
        # 只收集 hillinsight 命名空间下的日志
        - drop_event:
              when:
                not:
                  contains:
                    kubernetes.namespace: "hillinsight"
   
      multiline:
          pattern: '^[0-9]{4}-[0-9]{2}-[0-9]{2}'   # 指定匹配的表达式（匹配以 2017-11-15）
          negate: true                                # 是否未匹配到
          match: after                                # 合并到上一行的末尾, 为了error等日志
          max_lines: 1000                             # 最大的行数
          timeout: 30s                                # 如果在规定的时候没有新的日志事件就不等待后面的日志
```