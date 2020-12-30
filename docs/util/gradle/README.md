---
title: gradle
---
## gradle
 

### gradle代理

  ```
  #gradle.properties中加入socks5
  systemProp.socksProxySet=true
  systemProp.socksProxyHost=127.0.0.1
  systemProp.socksProxyPort=10808
  
  #或者
  org.gradle.jvmargs=-DsocksProxyHost=127.0.0.1 -DsocksProxyPort=10808
  ```

### 跳过测试

```
build -x test
```

