---
title: PostgreSQL
---

#### 不存在则插入/存在则更新

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

#### 唯一主键 null 值唯一

以前唯一主键对于有 null 都认为是不同的值，在 15 版本中添加了新功能可以解决这个问题。https://www.postgresql.org/docs/15/release-15.html#id-1.11.6.5.5.3.4

```
-- 添加唯一约束
ALTER TABLE favorites
ADD CONSTRAINT favo_uni UNIQUE NULLS NOT DISTINCT (user_id, menu_id, recipe_id);

-- 添加联合主键
CREATE UNIQUE INDEX favo_uni_idx
ON favorites (user_id, menu_id, recipe_id) NULLS NOT DISTINCT;
```

