---
title: prometheus
---

## 简介

> [官网](https://prometheus.io/)
>
> [Prometheus (github.com)](https://github.com/prometheus)
>
> 基于时序数据库的开源监控告警系统



## 配置

> 官方配置文档 [Configuration | Prometheus](https://prometheus.io/docs/prometheus/latest/configuration/configuration/)
>
> 下面记录一下经常修改的配置文件

### 通用

```
global:
  # 抓取周期
  [ scrape_interval: <duration> | default = 1m ]

  # 超时时间
  [ scrape_timeout: <duration> | default = 10s ]

  # 评估报警规则周期
  [ evaluation_interval: <duration> | default = 1m ]

  # 记录 PromQL 查询的文件
  # 重新加载配置将重新打开文件
  [ query_log_file: <string> ]

# 报警配置文件
rule_files:
  [ - <filepath_glob> ... ]

# 抓取配置
scrape_configs:
  [ - <scrape_config> ... ]

# 报警相关配置
alerting:
  alert_relabel_configs:
    [ - <relabel_config> ... ]
  alertmanagers:
    [ - <alertmanager_config> ... ]

# 抓取配置文件,主要用于抓取目标鉴权
remote_read:
  [ - <remote_read> ... ]
```

#### 抓取配置`<scrape_config>`

```
# 作业名称.
job_name: <job_name>

# 抓取周期,默认使用通用配置
[ scrape_interval: <duration> | default = <global_config.scrape_interval> ]

# 超时时间,默认使用通用配置
[ scrape_timeout: <duration> | default = <global_config.scrape_timeout> ]

# 从目标获取度量的 HTTP 资源路径
[ metrics_path: <path> | default = /metrics ]

# 配置用于请求的协议方案[https|http]
[ scheme: <scheme> | default = http ]

# 请求参数
params:
  [ <string>: [<string>, ...] ]

# 鉴权信息
basic_auth:
  [ username: <string> ]
  [ password: <secret> ]
  [ password_file: <string> ]

# 鉴权信息
authorization:
  # 设置鉴权方式
  [ type: <string> | default: Bearer ]
  [ credentials: <secret> ]
  [ credentials_file: <filename> ]

# Optional OAuth 2.0 configuration.
# Cannot be used at the same time as basic_auth or authorization.
oauth2:
  [ <oauth2> ]

# 是否从定向
[ follow_redirects: <bool> | default = true ]

# 代理地址
[ proxy_url: <string> ]

# 列出此作业的标记为静态配置的目标
static_configs:
  # 获取目标
  targets:
    [ - '<host>' ]

  # label过滤
  labels:
    [ <labelname>: <labelvalue> ... ]

# 修改标签
relabel_configs:
  [ - <relabel_config> ... ]

# List of metric relabel configurations.
metric_relabel_configs:
  [ - <relabel_config> ... ]
```

### rules

> 记录规则,可以预先计算经常需要或计算量大的表达式，并将其结果保存为一组新的时间序列
>
> 警报规则允许您基于 Prometheus 表达式语言表达式定义警报条件，并向外部服务发送有关发射警报的通知。每当警报表达式在给定时间点产生一个或多个向量元素时，警报对这些元素的标签集计为活动的。

```
groups: #  分组
  - name: example # 组名
    rules:
    - record: job:http_inprogress_requests:sum  # 记录规则名称
      expr: sum by (job) (http_inprogress_requests)  # 规则
      labels:  # 添加或覆盖标签
  			[ <labelname>: <labelvalue> ]
  			
    - alert: HighRequestLatency # 报警规则名称
      expr: job:request_latency_seconds:mean5m{job="myjob"} > 0.5 # 规则
      for: 10m  # 持续时间
      labels:   # 添加或覆盖标签
        severity: page
      annotations:	# 描述信息,可以使用模板
        summary: High request latency
        # $value为当前记录数值
        # $labels.instance 为名称为instance的labels
        description: "{{ $labels.instance }}请求延迟的中位数大于1秒(当前值 {{ $value }}s)"
```

###  模板

> Prometheus 模板语言是基于 Go 模板系统的

#### 数据格式

> 样本的度量名称保存在Labels中的`__name__`中
>
> 名称都以`_`进行分割

```
type sample struct {
        Labels map[string]string
        Value  float64
}
```

#### 方法

查询

| 名称        | 参数             | 返回值   | 注释                               |
| :---------- | :--------------- | :------- | :--------------------------------- |
| query       | query string     | []sample | 查询数据库，不支持返回范围向量。   |
| first       | []sample         | sample   | 相当于数组第一个对象               |
| label       | label, sample    | string   | 相当于 `index sample.Labels label` |
| value       | sample           | float64  | 相当于`sample.Value`               |
| sortByLabel | label, []samples | []sample | 通过给定标签对样品进行排序。       |

格式化数字

| 名称               | 参数             | 返回值 | 注释                                   |
| :----------------- | :--------------- | :----- | :------------------------------------- |
| humanize           | number or string | string | 使用公制前缀将数字转换为更易读的格式。 |
| humanize1024       | number or string | string | 使用1024而不是1000的基础               |
| humanizeDuration   | number or string | string | 将持续时间(秒)转换为更易读的格式。     |
| humanizePercentage | number or string | string | 转换为百分比                           |
| humanizeTimestamp  | number or string | string | 将 Unix 时间戳(秒)转换为更易读的格式。 |

### 字符串

| 名称         | 参数                       | 返回值  | 注释                                                         |
| :----------- | :------------------------- | :------ | :----------------------------------------------------------- |
| title        | string                     | string  | [strings.Title](https://golang.org/pkg/strings/#Title), 每个单词的首字母大写。 |
| toUpper      | string                     | string  | [strings.ToUpper](https://golang.org/pkg/strings/#ToUpper), 将所有字符转换为大写。 |
| toLower      | string                     | string  | [strings.ToLower](https://golang.org/pkg/strings/#ToLower), 将所有字符转换为小写。 |
| match        | pattern, text              | boolean | [regexp.MatchString](https://golang.org/pkg/regexp/#MatchString) regexp 匹配 |
| reReplaceAll | pattern, replacement, text | string  | [Regexp.ReplaceAllString](https://golang.org/pkg/regexp/#Regexp.ReplaceAllString) 匹配替换 |

#### 迭代

```
# 查询up 并循环输出数值
{{ range query "up" }}
  {{ .Labels.instance }} {{ .Value }}
{{ end }}
```

#### 管道

```
# 查询第一个值并格式化
{{ with query "some_metric{instance='someinstance'}" }}
  {{ . | first | value | humanize }}
{{ end }}
```

