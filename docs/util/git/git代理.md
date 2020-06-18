---
title: git代理
---

#### http代理：

> git config --global https.proxy http://127.0.0.1:10800

#### socks5代理：

> git config --global http.proxy 'socks5://127.0.0.1:10800'

#### 编辑文件~/.gitconfig

>[http]
> proxy = socks5://127.0.0.1:10800
>[https]
> proxy = socks5://127.0.0.1:10800



#### 取消代理

> git config --global --unset http.proxy
