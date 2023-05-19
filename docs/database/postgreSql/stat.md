---
title: 一些常用的状态信息
---

### 数据库使用情况

表存储空间使用情况

```
SELECT schemaname                              as table_schema,
       relname                                    table_name,
       pg_size_pretty(pg_relation_size(relid)) as table_size
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_relation_size(relid) desc;
```

当前数据库表数据行数

```
SELECT schemaname, relname, n_live_tup total
FROM pg_stat_user_tables
order by total desc;
```



### 数据库视图

### pg_stat_user_tables

`pg_stat_user_tables`是一个统计视图，显示当前数据库中每个非系统表的访问统计信息[1](https://pgpedia.info/p/pg_stat_user_tables.html) [2](https://www.postgresql.org/docs/current/monitoring-stats.html)。它包含以下字段：

- relid：表的OID
- schemaname：表所在的模式名
- relname：表的名字
- seq_scan：顺序扫描的次数
- seq_tup_read：顺序扫描读取的行数
- idx_scan：索引扫描的次数
- idx_tup_fetch：索引扫描获取的行数
- n_tup_ins：插入的行数
- n_tup_upd：更新的行数
- n_tup_del：删除的行数
- n_tup_hot_upd：热更新的行数（不需要更新索引）
- n_live_tup：表中存活的行数（不包括已删除或过期的行）
- n_dead_tup：表中死亡的行数（已删除或过期的行）
- n_mod_since_analyze：自上次分析后修改的行数
- last_vacuum：上次执行VACUUM命令的时间
- last_autovacuum：上次执行自动VACUUM命令的时间
- last_analyze：上次执行ANALYZE命令的时间
- last_autoanalyze：上次执行自动ANALYZE命令的时间
- vacuum_count：执行VACUUM命令的次数
- autovacuum_count：执行自动VACUUM命令的次数
- analyze_count：执行ANALYZE命令的次数
- autoanalyze_count：执行自动ANALYZE命令的次数