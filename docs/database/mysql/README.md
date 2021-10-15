---
title: mysql
---
## mysql
#### MySQL 8.0 Public Key Retrieval is not allowed

> 最简单的解决方法是在连接后面添加 `allowPublicKeyRetrieval=true`

### Communications link failure、No appropriate protocol Mysql连接失败解决方法

> 基本上是因为http ssl问题

- url 数据源后面添加 `useSSL=false`关闭ssl
- 升级jdk版本

