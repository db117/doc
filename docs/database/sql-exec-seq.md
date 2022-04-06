---
title: sql 语句执行顺序
---

> 常用的 sql 中大致执行顺序
>
> 每一步都生成一个虚拟的表，供后面的表使用。

```
(8) SELECT (9)DISTINCT<Select_list>
(1) FROM <left_table> (3) <join_type>JOIN<right_table>
(2) ON<join_condition>
(4) WHERE<where_condition>
(5) GROUP BY<group_by_list>
(6) WITH {CUBE|ROLLUP}
(7) HAVING<having_condtion>
(10) ORDER BY<order_by_list>
(11) LIMIT<limit_number>
```

- 先对 `from` 中的两个表执行笛卡尔积，在通过 `on` 进行筛选，并根据连接类型进行下一步操作。

- `where` 对上一步产生的虚拟表，进行过滤

  - 由于现在还没有分组，没有执行聚合函数。所以不能使用聚合函数进行个过滤。
  - 由于还没有进行列的选取操作，所以还不能使用 `select` 中列的别名

- `group by` 对查询的列进行分组

  - 从这一步开始可以使用 `select` 中的别名
  - 也可以使用数组 1，2...来表示 `select` 中的列（从 1 开始算）

- 计算聚合函数，如`COUNT`，`FIRST`，`AVG`，`LAST`，`MAX`，`MIN`，`SUM`等。

- `with`应用`ROLLUP`或`CUBE`，会作用在 `group by` 中多个字段的情况下

  - `ROLLUP`：从左往右多层次的聚合统计，相当于加上了从左到右多种组合的分组统计。

  - `CUBE`：想当于对 group by 中的字段进行 1...n  个字段的组合进行分组

    ```
    group 1，2，3
    
    with ROLLUP
    相当于
    group by 1,2,3 + group by 1,2 +group 1
    
    with CUBE
    相当于
    group by 1,2,3 +group by 1 + group by 2 + group by 3 + group by 1,2 + group by 1,3 + group by 2,3 
    ```

- `having` 对分组后的数据进行筛选

- `select` 把需要的列筛选出来，过滤掉不需要的列

- `distinct` 把重复的数据进行剔除

- `order by` 对数据进行排序

- `limit`：选择指定行