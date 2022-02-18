---
title: sqlserver
---

#### 获取前 n 条数据

```
SELECT TOP(10) *  FROM table_name;  
```

#### 获取数据库名称

```
select db_name()
```

#### 触发器 mybatis 异常

```
-- 在触发线执行 sql 前加入
SET NOCOUNT ON;

。。。。

-- 在触发线执行 sql 后加入
SET NOCOUNT OFF;
```

