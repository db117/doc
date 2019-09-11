---
title: Mysql批量插入数据
---

# insert ignore into

### 作用

- `insert ignore` 会根据主键或者唯一键判断，忽略数据库中已经存在的数据
- 若数据库没有该条数据，就插入为新的数据，跟普通的 `insert into` 一样
- 若数据库有该条数据，就忽略这条插入语句，不执行插入操作。

### 主键冲突情况

1. #### 同时向表中插入两条包含主键的数据

   > insert ignore into 与普通 insert into 的使用方法几乎完全一样
   > 插入时要么指定插入的具体列，要么不指定列名插入全部列值，要么对字段加有默认值
   > 否则会报错：
   >
   > ```
   > ERROR 1136 (21S01): Column count doesn't match value count at row 1
   >    或 ERROR 1364 (HY000): Field 'title' doesn't have a default value
   > ```

### 唯一键冲突情况

​	数据不会发生变化但是自增主键会加1

## insert into ... on duplicate key update

### 作用

- 在`insert into`语句末尾指定`on duplicate key update`，会根据主键或者唯一键判断：
  - 若数据库有该条数据，则直接更新原数据，相当于 `update`
  - 若数据库没有该条数据，则插入为新的数据，跟普通的 `insert into` 一样



```
insert into table_name(field_name...) values (value...), (value...) on duplicate key update field_name=values(field_name), field_name=field_name;
```

1. 与普通` insert into `的使用语法差别不大，只是语句结尾有所区别

2. `field_name=values(field_name)`

   **使用的是插入的字段值**

   表示当存在主键或唯一键冲突时，使用插入语句中对应的 emp_no 和 title 值替换原数据

3. `field_name=field_name`

   **使用的是原的字段值**

   同时，还可以通过运算表达式来指定字段值，如：field_name=field_name+1, field_name=field_name+"test"

4. `field_name=value`

   直接设置值

5. 为设置更新字段不进行更新

6. 如果是插入操作，受到影响行的值为1；如果更新操作，受到影响行的值为2；如果更新的数据和已有的数据一样

## replace into

### 作用

* `replace into` 会根据主键或者唯一键判断：
* 若表中已存在该数据，则先删除此行数据，然后插入新的数据，相当于 `delete + insert`
* 若表中不存在该数据，则直接插入新数据，跟普通的 `insert into` 一样
* 在存在多个唯一索引,或者高并发情况下不建议使用(可能发生死锁)