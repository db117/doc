---
title: gradle常用操作
---
### gradle代理

  ```
  gradle.properties中加入
  socks5
shan  systemProp.socksProxySet=true
  systemProp.socksProxyHost=127.0.0.1
  systemProp.socksProxyPort=10808
  ```

### 跳过测试

```
build -x test
```

