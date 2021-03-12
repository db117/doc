---
title: filebeat相关
---

###	收集k8s日志

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
          pattern: '^\s*(\d{4}|\d{2})\-(\d{2}|[a-zA-Z]{3})\-(\d{2}|\d{4})'   # 指定匹配的表达式（匹配以 2017-11-15 08:04:23:889 时间格式开头的字符串）
          negate: true                                # 是否匹配到
          match: after                                # 合并到上一行的末尾, 为了error日志
          max_lines: 1000                             # 最大的行数
          timeout: 30s                                # 如果在规定的时候没有新的日志事件就不等待后面的日志
```