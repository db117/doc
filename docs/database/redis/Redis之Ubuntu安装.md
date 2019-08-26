---
title:Ubuntu安装Redis
---
## 设置镜像源

```
$ echo deb http://packages.dotdeb.org wheezy all >> dotdeb.org.list
$ echo deb-src http://packages.dotdeb.org wheezy all >> dotdeb.org.list
$ sudo mv dotdeb.org.list /etc/apt/sources.list.d
$ wget -q -O - http://www.dotdeb.org/dotdeb.gpg | sudo apt-key add -
```

## 更新镜像源并安装

```
$ sudo apt-get update
$ sudo apt-get install redis-server
```

## 运行

```
$ redis-server --daemonize yes
```

## 其他命令

Usage: ./redis-server [/path/to/redis.conf] [options]
       ./redis-server - (read config from stdin)
       ./redis-server -v or --version
       ./redis-server -h or --help
       ./redis-server --test-memory <megabytes>

Examples:
       ./redis-server (run the server with default conf)
       ./redis-server /etc/redis/6379.conf
       ./redis-server --port 7777
       ./redis-server --port 7777 --slaveof 127.0.0.1 8888
       ./redis-server /etc/myredis.conf --loglevel verbose

Sentinel mode:
       ./redis-server /etc/sentinel.conf --sentinel

