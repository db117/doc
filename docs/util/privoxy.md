---
title: privoxy
---

### 简介
> 各种代理设置

### 安装使用
> 安装
```
brew install privoxy
```

>启动
```
sudo /usr/local/sbin/privoxy /usr/local/etc/privoxy/config
```

### socks5 转 http代理
```
forward-socks5   /     127.0.0.1:1080 .
```