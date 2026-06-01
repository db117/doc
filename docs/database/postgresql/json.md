---
title: json 类型
---

> [PostgreSQL: Documentation: 15: 8.14. JSON Types](https://www.postgresql.org/docs/current/datatype-json.html)
>
> [PostgreSQL: Documentation: 15: 9.16. JSON Functions and Operators](https://www.postgresql.org/docs/current/functions-json.html)

#### json 和 jsonb

主要区别在于 `json` 仅仅是存放了字符串，每一次处理都是处理字符串。而 `jsonb` 是把所有信息预处理成二进制数据。

`jsonb`在存储是时候稍慢一点，但是在处理时会快很多。

#### 操作

获取`json`里面数据

| Operator | Right Operand Type | Description                               | Example                                            | Example Result |
| -------- | ------------------ | ----------------------------------------- | -------------------------------------------------- | -------------- |
| `->`     | `int`              | 获取指定 index 的值（0开始）              | `'[{"a":"foo"},{"b":"bar"},{"c":"baz"}]'::json->2` | `{"c":"baz"}`  |
| `->`     | `text`             | 获取 key 对应的值                         | `'{"a": {"b":"foo"}}'::json->'a'`                  | `{"b":"foo"}`  |
| `->>`    | `int`              | 获取指定 index 的值（0开始）并转为 `text` | `'[1,2,3]'::json->>2`                              | `3`            |
| `->>`    | `text`             | 获取指定 key 的值并转为 `text`            | `'{"a":1,"b":2}'::json->>'b'`                      | `2`            |
| `#>`     | `text[]`           | 获取指定路径的对象                        | `'{"a": {"b":{"c": "foo"}}}'::json#>'{a,b}'`       | `{"c": "foo"}` |
| `#>>`    | `text[]`           | 获取指定路径的对象并转为 `text`           | `'{"a":[1,2,3],"b":[4,5,6]}'::json#>>'{a,2}'`      | `3`            |

针对与 `jsonb`的操作

| Operator | Right Operand Type | Description                              | Example                                             |
| -------- | ------------------ | ---------------------------------------- | --------------------------------------------------- |
| `@>`     | `jsonb`            | 左边的`json`是否在顶级包含右边的         | `'{"a":1, "b":2}'::jsonb @> '{"b":2}'::jsonb`       |
| `<@`     | `jsonb`            | 右边的`json`是否在顶级包含左边的         | `'{"b":2}'::jsonb <@ '{"a":1, "b":2}'::jsonb`       |
| `?`      | `text`             | 是否包含顶级`key`                        | `'{"a":1, "b":2}'::jsonb ? 'b'`                     |
| `?|`     | `text[]`           | 是否包含任意一个顶级`key`                | `'{"a":1, "b":2, "c":3}'::jsonb ?| array['b', 'c']` |
| `?&`     | `text[]`           | 是否包含所有顶级`key`                    | `'["a", "b"]'::jsonb ?& array['a', 'b']`            |
| `||`     | `jsonb`            | 合并 2 个`jsonb`                         | `'["a", "b"]'::jsonb || '["c", "d"]'::jsonb`        |
| `-`      | `text`             | 删除匹配（key/value）的数据              | `'{"a": "b"}'::jsonb - 'a'`                         |
| `-`      | `text[]`           | 删除匹配（key/value）的数据              | `'{"a": "b", "c": "d"}'::jsonb - '{a,c}'::text[]`   |
| `-`      | `integer`          | 删除指定索引位置的数据。只能对数组使用。 | `'["a", "b"]'::jsonb - 1`                           |
| `#-`     | `text[]`           | 通过路径进行删除                         | `'["a", {"b":1}]'::jsonb #- '{1,b}'`                |

#### 函数

```
-- json_agg  jsonb_agg 把某一列的值返回一个数组
select json_agg(key) from table
```



#### 索引

```
-- 创建索引
CREATE INDEX idxgin ON api USING GIN (jdoc);

-- 查询 jdoc 中有 key 为 company ，value 为 Magnafone 的数据
SELECT * FROM api WHERE jdoc @> '{"company": "Magnafone"}';

-- 查询 jdoc 中有 key 为 tags ，value 中是否包含 qui 
-- 注意不支持 GIN (jdoc) 索引。可以用 USING GIN ((jdoc -> 'tags'))
SELECT * FROM api WHERE jdoc -> 'tags' ? 'qui';
SELECT * FROM api WHERE jdoc @> '{"tags": ["qui"]}';
-- 使用 jsonpath 表达式
SELECT * FROM api WHERE jdoc @@ '$.tags[*] == "qui"';
```