---
title: git代理
---

#### 全局代理：

```bash
git config --global https.proxy http://127.0.0.1:10800

git config --global http.proxy 'socks5://127.0.0.1:10800'
```

#### 指定某个网址使用

```bash
git config --global http.<URI>.proxy http://127.0.0.1:8118

git config --add core.gitproxy '"http://127.0.0.1:7777" for github.com'
```



#### 编辑文件~/.gitconfig

```gitconfig
[http]
	 	proxy = socks5://127.0.0.1:10800
[https]
		proxy = socks5://127.0.0.1:10800
[core]
    gitproxy = socks5://127.0.0.1:10800
    # 指定网址
    gitproxy="socks5://127.0.0.1:10800" for p.com
[http  "<URI>"]
proxy = socks5://127.0.0.1:10800
```



#### 取消代理

```bash
git config --global --unset http.proxy
git config --global --unset https.proxy
git config --global --unset core.gitproxy
```

