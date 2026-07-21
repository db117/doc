---
title: 窗口函数
---

> 查询数据是对多行数据进行处理并在当前行展示

## 备忘单

```

```



## 函数

### 窗口框架

> 定义了窗口范围
>
> **当值为`null`时排序会排在前面**。

```
frame_clause:
    frame_units frame_extent

frame_units:
    {ROWS | RANGE}
    
frame_extent:
    {frame_start | frame_between}

frame_between:
    BETWEEN frame_start AND frame_end

frame_start, frame_end: {
    CURRENT ROW
  | UNBOUNDED PRECEDING
  | UNBOUNDED FOLLOWING
  | expr PRECEDING
  | expr FOLLOWING
}
```

窗口边界定义

- `CURRENT ROW`: 对于`ROWS`, 当前行. 对于 `RANGE`, 指当前级别
- `UNBOUNDED PRECEDING`: 分区上界
- `UNBOUNDED FOLLOWING`: 分区下界
- `expr PRECEDING`: 对于`ROWS`, 当前行前面数据. 对于`RANGE`, 针对当前级别
- `expr FOLLOWING`: 对于`ROWS`, 当前行后面数据. 对于`RANGE`, 针对当前级别

针对于 `ORDER BY`

- 如果有`ORDER BY`
  - 对于聚合函数，分组开始到当前行
  - 对于非聚合函数，对整个分组
- 没有`ORDER BY` ，默认为整个分组

### 非聚合

> 所有函数后面都可以加 `over(partition by col order by col)` 表示按照某些字段进行分组，排序

#### 排序

> 主要用在分页，或者排名的情况下。

- ROW_NUMBER()  
  -  排序并分配序号
- RANK()  
  - 排序并分配序号，排序值相同则需要相同
  - 两个不同的排序值可能会有间隔（如 1,2,2,4,4,4,7）
- DENSE_RANK()  
  - 排序并分配序号，排序值相同则需要相同
  - 两个不同的排序值没有间隔（如 1,2,2,3,3,3,4）

#### 获取相对行

> 一般情况下我们会对数据进行排序，因为只有在有序的情况下，前面多少行和后面多少行才有意义
>
> 可以用在某些场景下代替自关联的写法

- LAG(col,n,DEFAULT)  
  - 获取当前行前的第几行数据
  - 如不指定默认值则为 null
- LEAD(col,n,DEFAULT) 
  - 同 `LAG` 但是向后面找数据

#### 指定行

> 获取分组指定行

- FIRST_VALUE()
  - 第一行
- LAST_VALUE()
  - 最后一行
  - 在没有`order by`的情况下，是整个分组的最后一个。有的情况下是当前行
- NTH_VALUE()
  - 分组内第几行

###  聚合

> 注意又`order by`的情况下，`frame`默认到当前行

- AVG() 
- COUNT() 

- MAX()
- MIN() 
- SUM()
