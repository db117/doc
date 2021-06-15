---
title: prometheus
---

### 简介

> [官网](https://prometheus.io/)
>
> [Prometheus (github.com)](https://github.com/prometheus)
>
> 基于时序数据库的开源监控告警系统



### 配置

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

# List of labeled statically configured targets for this job.
static_configs:
  [ - <static_config> ... ]

# List of target relabel configurations.
relabel_configs:
  [ - <relabel_config> ... ]

# List of metric relabel configurations.
metric_relabel_configs:
  [ - <relabel_config> ... ]

# Per-scrape limit on number of scraped samples that will be accepted.
# If more than this number of samples are present after metric relabeling
# the entire scrape will be treated as failed. 0 means no limit.
[ sample_limit: <int> | default = 0 ]

# Per-scrape limit on number of labels that will be accepted for a sample. If
# more than this number of labels are present post metric-relabeling, the
# entire scrape will be treated as failed. 0 means no limit.
[ label_limit: <int> | default = 0 ]

# Per-scrape limit on length of labels name that will be accepted for a sample.
# If a label name is longer than this number post metric-relabeling, the entire
# scrape will be treated as failed. 0 means no limit.
[ label_name_length_limit: <int> | default = 0 ]

# Per-scrape limit on length of labels value that will be accepted for a sample.
# If a label value is longer than this number post metric-relabeling, the
# entire scrape will be treated as failed. 0 means no limit.
[ label_value_length_limit: <int> | default = 0 ]

# Per-scrape config limit on number of unique targets that will be
# accepted. If more than this number of targets are present after target
# relabeling, Prometheus will mark the targets as failed without scraping them.
# 0 means no limit. This is an experimental feature, this behaviour could
# change in the future.
[ target_limit: <int> | default = 0 ]
```