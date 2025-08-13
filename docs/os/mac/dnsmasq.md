---
title: MAC 下 DNSmasq 安装于使用 
---

### 安装

```
brew install dnsmasq
```

###  配置文件

配置文件默认在`$(brew --prefix)/etc/dnsmasq.conf`

```
# 只监听本地，防止外部访问
listen-address=127.0.0.1

# 启用缓存
cache-size=10000

# 日志
log-queries
log-facility=/usr/local/var/log/dnsmasq.log

# 上游 DNS
server=8.8.8.8
server=223.5.5.5

# 本地通配符解析
address=/test.local/192.168.1.100
```



日志文件目录需要能访问

```bash
sudo mkdir -p /usr/local/var/log
sudo chown $(whoami):admin /usr/local/var/log
```

### 服务

```
sudo brew services start dnsmasq
sudo brew services restart dnsmasq
sudo brew services stop dnsmasq

# 查看服务状态
sudo brew services list | grep dnsmasq
```





### 验证

验证域名解析是否生效

```
dig test.local @127.0.0.1
```

验证服务端口

```
# 默认是 53
sudo lsof -i :53
```



如果起不来，可以手动启动一下。观察异常情况

```bash
sudo dnsmasq --keep-in-foreground --log-queries --conf-file=$(brew --prefix)/etc/dnsmasq.conf
```