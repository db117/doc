---
title: mysql
---
## mysql
#### MySQL 8.0 Public Key Retrieval is not allowed

> 最简单的解决方法是在连接后面添加 `allowPublicKeyRetrieval=true`

#### Communications link failure、No appropriate protocol Mysql连接失败解决方法

> 基本上是因为http ssl问题

- url 数据源后面添加 `useSSL=false`关闭ssl
- 升级jdk版本

#### order by 主键

> 当 order by 只有主键时，可以在 select 中出现所有字段。
>
> [MySQL :: MySQL 5.7 Reference Manual :: 12.20.3 MySQL Handling of GROUP BY](https://dev.mysql.com/doc/refman/5.7/en/group-by-handling.html)

##### docker 安装

```
docker run --name mysql -e MYSQL_ROOT_PASSWORD=your_password -p 3306:3306 -d mysql
```

