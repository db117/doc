---
title: wireshark
---

> 一个非常强大的抓包工具
>
> [Wireshark User’s Guide](https://www.wireshark.org/docs/wsug_html/)
>
> [wireshark/wireshark: GitHub](https://github.com/wireshark/wireshark)

### 备忘单

```
######### TCP  ############
# TCP超时或丢包重传的报文
tcp.analysis.retransmission
# TCP重传并且时间差大于等于0.2s
tcp.analysis.retransmission && tcp.time_delta >= 0.2
# 帧间隔大于100秒
tcp.time_delta >= 100


######### HTTP  ############
# 过滤HTTP/HTTPS/TLS请求域名
tls.handshake.type == 1 || http.request
# HTTP响应4xx、5xx状态码报文
string(http.response.code) ~ "^4[0-9]{2}$|^5[0-9]{2}$"
# 查找固定状态码
http.response.code in {403,404,502,503,504}

######### PING  ############
# 过滤耗时超过8.5ms的请求
icmp.resptime >= 8.5
# 过滤Ping超时/不响应的报文
icmp.resp_not_found

######### DNS  ############
# 过滤耗时超过50ms的dns响应
dns.time > 0.05
# 过滤没有解析到地址的报文
dns.count.answers == 0
# 过滤dns解析的域名
dns.qry.name == "test.com"
dns.qry.name ~ "bing.com$|microsoft.com$" # 正则匹配

######### IP  ############
# 通过IP归属地过滤
ip.geoip.country == "United States"
ip.geoip.city in {"Los Angeles","Chicago"}
ip.geoip.asnum == 20326

######### 函数转换类  ############
# upper()/lower()函数
lower(http.server) ~ "apache"
upper(http.request.method) ~ "post|get"
# len()函数
len(http.request.uri) >= 10  # 过滤http头部的URI字段，大于等于10字节的报文
len(http.host) >= 20  #过滤HTTP主机名大于等于20字节的报文：
# string()函数
string(ip.addr) ~ "^10|^11"  #过滤IP为10网段开头或者11网段开头的IP
string(ip.dst) matches r"^172\.(1[6-9]|2[0-9]|3[0-1])\.[0-9]{1,3}\.255" # 匹配目的IP地址(172.16到172.31)
# max()、min()函数
max(tcp.srcport,tcp.dstport) <= 1024  # 过滤tcp源端口、目的端口，最大不能超过1024的报文
```

### 小技巧

- 任何字段都能成为过滤条件
  - 鼠标拖动任意字段过滤
- 分析
  - **分析(Analyze)** --> **显示过滤表达式(Display Filter Expression)** 可以进入到过滤表达式页面
  - 选择要过滤的字段，选择操作符，写入数值即可

- 查看并搜索过滤字段
  - 在 视图（View） --> 内部（Internals） --> 支持的协议（Supported Protocols）即可查看支持的所有协议，在搜索框中键入想要搜索的字段

- 抓`https`

> 在系统环境变量中设置`SSLKEYLOGFILE`=C:\tmp\tls.log
>
> 在`wireshark`的首选项->Protocls->TLS：配置好刚才配置的目录