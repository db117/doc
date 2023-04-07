---
title: sql 分析
---



### 执行状态

- 查询正在执行的 SQL

    ```
    SELECT
        procpid,
        start,
        now() - start AS lap,
        current_query
    FROM
        (SELECT
             backendid,
             pg_stat_get_backend_pid(S.backendid) AS procpid,
             pg_stat_get_backend_activity_start(S.backendid) AS start,
             pg_stat_get_backend_activity(S.backendid) AS current_query
         FROM
             (SELECT pg_stat_get_backend_idset() AS backendid) AS S
        ) AS S
    where start is not null
    ORDER BY
        lap DESC;
    ```

- 结束正在进行的查询

  ```
  select pg_cancel_backend(pid);
  ```


- 结束正在执行操作(修改修改数据库操作)

  ```
  select pg_terminate_backend(pid)
  ```

- 查询最耗时的SQL

  ```
  select * from pg_stat_statements order by total_time desc limit 5;
  ```

- 查询使用Buffer次数最多的SQL

  ```
  select * from pg_stat_statements order by shared_blks_hit+shared_blks_read desc limit 5;
  ```



### EXPLAIN

#### 属性

-  `ANALYZE` [ boolean ]   : 是否真正执行 该选项默认为FALSE。
-  `VERBOSE` [ boolean ]   : 计划中每个节点输出的各个列，如果触发器被触发，还会输出触发器的名称。该选项默认为FALSE。
- `COSTS` [ boolean ]   : 选项显示每个计划节点的启动成本和总成本，以及估计行数和每行宽度。该选项默认是TRUE。
-  `BUFFERS` [ boolean ]   : 选项显示关于缓存区的信息。该选项只能与ANALYZE参数一起使用。该选项默认为FALSE。
- `TIMING` [ boolean ]   : 记录每一步的时间 默认是TRUE。
-  `FORMAT` { TEXT | XML | JSON | YAML }  : 输出格式,默认 text

#### 结果分析

 扫描类型

- 全表扫描 (seq scan)
- 索引扫描(Index Scan)
- 位图扫描(Bitmap)

表关联

- Nestloop join
  - 循环第一张表,去第二张表查询数据
  - 小表驱动大表,大表最好有索引
- Hash join
  - 对一张表建立 hash ,然后扫描另一张表
- Merge Join
  - 对两张表进行排序,然后合并

#### 小技巧

对于分析插入更新的语句，我们我们是可以把ANALYZE放到事物里面的，分析后之后回滚

```
BEGIN;
EXPLAIN ANALYZE ...;
ROLLBACK;
```

