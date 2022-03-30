---
Title: logstash相关
---

###	删除字段
> 	在任意插件中添加
```
# 删除字段
        remove_field => ["host","agent","ecs","tags","fields","@version","stream","log","input"]
        remove_field => [ "[kubernetes][namespace_uid]"]
        remove_field => [ "[kubernetes][node][labels]"]
        remove_field => [ "[kubernetes][node][uid]" ]
        remove_field => [ "[kubernetes][pod][uid]" ]
```

### 	判断
>	 嵌套判断,取值使用[1][2]

```
		if [kubernetes][labels][profile] {
        mutate { add_field => { "[@metadata][profile]" => "%{[kubernetes][labels][profile]}" } }
    }else {
        mutate { add_field => { "[@metadata][profile]" => "unknownProfile" } }
    }

```
[官方文档](https://www.elastic.co/guide/en/logstash/6.7/event-dependent-configuration.html#conditionals)