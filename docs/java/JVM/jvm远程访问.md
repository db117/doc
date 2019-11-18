---
title: java开启远程访问
---
## 开启参数

```
-Dcom.sun.management.jmxremote 
-Dcom.sun.management.jmxremote.port=10053 
-Dcom.sun.management.jmxremote.authenticate=false 
-Dcom.sun.management.jmxremote.ssl=false
```

## 注意事项

- 这几个参数需要连在一起

  