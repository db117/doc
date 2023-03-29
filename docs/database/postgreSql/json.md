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