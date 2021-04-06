---
title: privoxy
---

### 简介
> 各种代理设置

### 安装使用
> 安装
```bash
brew install privoxy
```

>非开机启动启动
```bash
sudo /usr/local/sbin/privoxy /usr/local/etc/privoxy/config
```

### socks5 转 http代理
```
forward-socks5   /     127.0.0.1:1080 .
```

#### 设置开机启动

> 启动并设置开机启动
```bash
brew services start privoxy
```
> 停止并取消开机启动
```bash
brew services stop privoxy
```

