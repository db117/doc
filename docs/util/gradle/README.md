---
title: gradle
---
## gradle


### gradle代理

  ```
  # 构建时添加jvm参数
  # socks
  -DsocksProxyHost=127.0.0.1 
  -DsocksProxyPort=7777
  # http
  -Dhttp.proxyPort=8080
  -Dhttp.proxyHost=127.0.0.1
  # https
  -Dhttps.proxyPort=8080
  -Dhttps.proxyHost=127.0.0.1
  ```

### 跳过测试

```
build -x test
```

