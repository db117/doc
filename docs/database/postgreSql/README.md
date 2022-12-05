---
title: PostgreSQL
---

### 不存在则插入/存在则更新

```
-- 1、主键id不重复就插入，否则更新
insert into 表名称 (字段a, 字段b, ...)
            values
            (value_a, value_b, ...)
            on conflict (主键id)
            do
            update set ...略
            -- 也可以直接 DO NOTHING; 什么都不做

-- 2、直接绑定主键名称，主键重复则更新
insert into 表名称 (字段a, 字段b, ...)
            values
            (value_a, value_b, ...)
            on conflict on constraint this_table_key
            do
            update set ...略
```

