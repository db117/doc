---
title: alertmanager
---

> Prometheus 中的报警发送给 alertmanager . 在通过分组,过滤,抑制后发送给不同的通知接收器的列表

<iframe id="embed_dom" name="embed_dom" frameborder="0" style="display:block;width:725px; height:245px;" src="https://www.processon.com/embed/60e579a51e08530a5074c834"></iframe>

## 配置

### 通用配置

```
global:
  # 通用邮件通知配置
  # 谁发的
  [ smtp_from: <tmpl_string> ]
  # 服务器地址
  # Example: smtp.example.org:587
  [ smtp_smarthost: <string> ]
  # 服务器用户名
  [ smtp_auth_username: <string> ]
  # 服务器密码
  [ smtp_auth_password: <secret> ]
  # 是否使用HTTPS
  [ smtp_require_tls: <bool> | default = true ]

  # 内置通知配置
  [ slack_api_url: <secret> ]
  [ slack_api_url_file: <filepath> ]
  [ victorops_api_key: <secret> ]
  [ victorops_api_url: <string> | default = "https://alert.victorops.com/integrations/generic/20131114/alert/" ]
  [ pagerduty_url: <string> | default = "https://events.pagerduty.com/v2/enqueue" ]
  [ opsgenie_api_key: <secret> ]
  [ opsgenie_api_url: <string> | default = "https://api.opsgenie.com/" ]
  [ wechat_api_url: <string> | default = "https://qyapi.weixin.qq.com/cgi-bin/" ]
  [ wechat_api_secret: <secret> ]
  [ wechat_api_corp_id: <string> ]

  # http默认配置
  [ http_config: <http_config> ]

  # 报警多久结束
  [ resolve_timeout: <duration> | default = 5m ]

# 模板文件
templates:
  [ - <filepath> ... ]

# 路由
route: <route>

# 通知接收器的列表
receivers:
  - <receiver> ...

# 一系列抑制规则
inhibit_rules:
  [ - <inhibit_rule> ... ]

# 静音路由的时间间隔
mute_time_intervals:
  [ - <mute_time_interval> ... ]
```

### 路由配置

> 可以嵌套

```
# 接收器
[ receiver: <string> ]
# 分组
[ group_by: '[' <labelname>, ... ']' ]

# 警报是否应该继续匹配后续的同级节点
[ continue: <boolean> | default = false ]

# 警报必须满足以匹配该节点的匹配器列表
matchers:
  [ - <matcher> ... ]

# 一个组的消息最多等待时间
[ group_wait: <duration> | default = 30s ]

# 组报警间隔时间
[ group_interval: <duration> | default = 5m ]

# 相同的报警间隔时间
[ repeat_interval: <duration> | default = 4h ]

# 子路由
routes:
  [ - <route> ... ]
```

### 接收者配置

> 消息接收方

```
# 接收者名称,会在路由中使用
name: <string>

# 各种接收者配置
email_configs:
  [ - <email_config>, ... ]
pagerduty_configs:
  [ - <pagerduty_config>, ... ]
pushover_configs:
  [ - <pushover_config>, ... ]
slack_configs:
  [ - <slack_config>, ... ]
opsgenie_configs:
  [ - <opsgenie_config>, ... ]
webhook_configs:
  [ - <webhook_config>, ... ]
victorops_configs:
  [ - <victorops_config>, ... ]
wechat_configs:
  [ - <wechat_config>, ... ]
```

#### email接收

```
#  是否通知已解决的警报
[ send_resolved: <boolean> | default = false ]

# 收件人地址
to: <tmpl_string>

# 发件人地址
[ from: <tmpl_string> | default = global.smtp_from ]

# 服务器地址
[ smarthost: <string> | default = global.smtp_smarthost ]

# SMTP 鉴权
[ auth_username: <string> | default = global.smtp_auth_username ]
[ auth_password: <secret> | default = global.smtp_auth_password ]
[ auth_secret: <secret> | default = global.smtp_auth_secret ]
[ auth_identity: <string> | default = global.smtp_auth_identity ]

# 是否使用HTTPS
[ require_tls: <bool> | default = global.smtp_require_tls ]

# HTTPS配置
tls_config:
  [ <tls_config> ]

# 文本内容
# The HTML body of the email notification.
[ html: <tmpl_string> | default = '{{ template "email.default.html" . }}' ]
# The text body of the email notification.
[ text: <tmpl_string> ]

# 标题头
[ headers: { <string>: <tmpl_string>, ... } ]
```

#### 企业微信通知

```
#  是否通知已解决的警报
[ send_resolved: <boolean> | default = false ]

# api_secret
[ api_secret: <secret> | default = global.wechat_api_secret ]

# api_url
[ api_url: <string> | default = global.wechat_api_url ]

# 企业id
[ corp_id: <string> | default = global.wechat_api_corp_id ]

# 发送内容
[ message: <tmpl_string> | default = '{{ template "wechat.default.message" . }}' ]
# 消息类型
[ message_type: <string> | default = 'text' ]
[ agent_id: <string> | default = '{{ template "wechat.default.agent_id" . }}' ]
[ to_user: <string> | default = '{{ template "wechat.default.to_user" . }}' ]
[ to_party: <string> | default = '{{ template "wechat.default.to_party" . }}' ]
[ to_tag: <string> | default = '{{ template "wechat.default.to_tag" . }}' ]
```

#### http回调

> 向指定的 url 发送 POST HTTP请求

```
#  是否通知已解决的警报
[ send_resolved: <boolean> | default = true ]

# 发送url
url: <string>

# HTTP配置
[ http_config: <http_config> | default = global.http_config ]

# 单次最大消息量
# 默认 0 为所有
[ max_alerts: <int> | default = 0 ]
```

实例消息

```
{
  "version": "4",
  "groupKey": <string>,              	// 分组
  "truncatedAlerts": <int>,          	// 由于“max_alerts”，已截断了多少警报
  "status": "<resolved|firing>",     	// 报警状态
  "receiver": <string>,              	// 接收器名称
  "groupLabels": <object>,						
  "commonLabels": <object>,						
  "commonAnnotations": <object>,
  "externalURL": <string>,            // 回退到 Alertmanager 的地址
  "alerts": [													// 报警列表
    {
      "status": "<resolved|firing>",	// 通知状态
      "labels": <object>,							// 标签
      "annotations": <object>,				
      "startsAt": "<rfc3339>",				// 开始时间
      "endsAt": "<rfc3339>",					// 结束时间
      "generatorURL": <string>,      // identifies the entity that caused the alert
      "fingerprint": <string>        // fingerprint to identify the alert
    },
    ...
  ]
}
```

