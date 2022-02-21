---
title: sqlserver
---

### 官方文档

> [SQL Server 文档导航提示 - SQL Server | Microsoft Docs](https://docs.microsoft.com/zh-cn/sql/sql-server/sql-docs-navigation-guide?view=sql-server-ver15)

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

#### 使用 Transact-SQL 语句在结果集内进行浏览

```
-- 定义字段
declare @au_id char( 11 )

-- 每次查询是更新最小 id
select @au_id = min( au_id ) from authors
while @au_id is not null

begin
select * from authors where au_id = @au_id
select @au_id = min( au_id ) from authors where au_id > @au_id
end
```

#### 使用 FOR JSON 将查询结果格式化为 JSON (SQL Server)

```
SELECT *
FROM table_name  
FOR JSON
```

