---
title: query_string
---

> https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-query-string-query.html#query-string-top-level-params
>
> kibana 中查询使用的就是这个。

## 备忘单

```
# 字段 field 包含 active
field:active
# 字段 title 包含 quick 或者 brown
title:(quick OR brown)
# 字段 title 完整包含 John Smith
title:"John Smith"

# 通配符
title:qu?ck bro*

# 模糊查询
title:quikc~
# 模糊查询，编辑距离为 1
title:quikc~1

# 正则匹配
field:/joh?n(ath[oa]n)/

# 匹配所有不为 null 的
field:*
exists_:field
# 一个字符
field:a?
# 多个字符
field:a*

# 范围
# 时间范围
date:[2024-01-01 TO 2024-12-31]
# 数字范围
count:[1 TO 5]
count:(>=1 AND <=5)
count:(+>=1 +<5)
# 字符范围
tag:{alpha TO omega}
# 大于 10 的数字
count:[10 TO *]
count:>=10
# 小于 2024-01-01 的时间
date:{* TO 2024-01-01}
date:<2024-01-01
```



## 语法

#### 查询字段

```
# 存在 title 字段
_exists_:title
# 匹配 foo 开头的字段
foo\*:
# 使用 \ 转义空格
first\ name:
```

#### 通配符

- `?`匹配一个字符
- `*`匹配多个字符
- 当只有一个`*`时匹配所有不为 null 的

#### 正则

- 使用`/正则表达式/`来查询

#### 模糊查询

- 使用 `~`可以模糊查询一个字符
- 默认是 2 个编辑距离
- 可以使用`~1`来指定编辑距离

#### 范围

> [min TO max]

- `[`,`]`包含边界
- `{}`不包含边界

#### 布尔

- `+`必须匹配
- `-`必须不能匹配
- `AND`两个条件都满足
- `OR`或者
- `AND NOT`必须不满足





