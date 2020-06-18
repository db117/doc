---
title: gradle常用操作
---
### gradle代理

  ```
  gradle.properties中加入
  socks5
  org.gradle.jvmargs=-DsocksProxyHost=127.0.0.1 -DsocksProxyPort=7077
  ```