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

#### 注意事项

* 如需要http的则需要使用privoxy进行前置代理
  [privoxy](../../util/privoxy.md)

* git代理

  [git代理](../../util/git/git代理.md)