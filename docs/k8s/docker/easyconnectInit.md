---
title: 深信服easyConnect在docker中进行透明代理
---

### 连接

> https://github.com/Hagb/docker-easyconnect

### docker启动

> 启动后就可以socks5代理（可以通过插件配置），地址: 127.0.0.1, 端口: 1080

```
docker run --name ec --device /dev/net/tun --cap-add NET_ADMIN -d --restart=always -p 127.0.0.1:1080:1080 -e EC_VER=7.6.3 -e CLI_OPTS="-d 服务器地址 -u 用户名称 -p 密码" hagb/docker-easyconnect:cli
```

