---
title: 查询语法
---

## 基础操作

> **Prometheus的查询表达式可以分为四种数据类型：**
> **instant vector** 瞬时向量 - 它是指在同一时刻，抓取的所有度量指标数据。这些度量指标数据的key都是相同的，也即相同的时间戳；
> **range vector** 范围向量 - 它是指在任何一个时间范围内，抓取的所有度量指标数据；
> **scalar** 标量 - 一个简单的浮点值，标量浮点值可以直接写成形式；
> **string** 字符串 - 字符串可以用单引号、双引号或者反引号表示；

### 浮点文本

> 标量浮点值可以以文字整数或浮点数的格式写入

```
[-+]?(
      [0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?
    | 0[xX][0-9a-fA-F]+
    | [nN][aA][nN]
    | [iI][nN][fF]
)

23
-2.43
3.4e-9
0x8f
-Inf
NaN
```



#### 即时矢量选择器

> 即时向量选择器允许在给定的时间戳(即时)选择一组时间序列和每个时间戳的单个样本值: 在最简单的形式中，只指定一个指标名称。这将生成一个即时向量，其中包含具有此度量名称的所有时间序列的元素。

```
kube_pod_info{job="prometheus"}
# 选择标签 job="prometheus" name="kube_pod_info" 的数据
```

标签匹配符：

- =: 精确地匹配标签给定的值
- !=: 不等于给定的标签值
- =~: 选择匹配正则表达式的标签(或子标签)
- !~: 选择不匹配正则表达式的标签(或子标签)

```
# 选择了度量指标名称以jvm_开头的时间序列数据
{__name__ =~"jvm_.*"} 

# 选择给定环境的数据
jvm_classes_loaded{environment=~"staging|testing|development"}
```

#### 范围向量选择

时间范围

> - `ms` - 毫秒
> - `s` - 秒
> - `m` - 分
> - `h` - 时
> - `d` - 天
> - `w` - 周
> - `y` -年(365天)

实例

```
# 选择过去 5 分钟内，度量指标名称为 http_requests_total， 标签为 job="prometheus" 的时间序列数据
http_requests_total{job="prometheus"}[5m]

# 相对于当前时间的前 5 分钟时的时刻, 度量指标名称为 http_requests_total 的时间序列数据
http_requests_total offset 5m

# 相对于当前时间的前一周时，过去 5 分钟的度量指标名称为 http_requests_total 的速率
rate(http_requests_total[5m] offset 1w)
```

## 操作符

### 数学运算符

支持的所有数学运算符如下所示：

- `+`(加法)
- `-` (减法)
- `*`(乘法)
- `/` (除法)
- `%`(求余)
- `^` (幂运算)

### 布尔运算符

目前，Prometheus支持以下布尔运算符如下：

- `==` (相等)
- `!=` (不相等)
- `>` (大于)
- `<` (小于)
- `>=` (大于等于)
- `<=` (小于)

### 聚合函数

- sum：求和。
- min：最小值。
- max：最大值
- avg：平均值
- stddev：标准差
- stdvar：方差
- count：元素个数
- count_values：等于某值的元素个数
- bottomk：最小的 k 个元素
- topk：最大的 k 个元素
- quantile：分位数

> 可以在表达式前后添加 `without` `by`
>
> without: 删除掉某个标签后进行聚合计算
>
> by 根据某些个标签进行聚合计算

```
http_requests_total{instance,application, group}
# 根据 application, group 分组统计总数
sum without (instance) (http_requests_total)
# 与上面相同
sum by (application, group) (http_requests_total)

# 根据所有标签进行分组
sum(http_requests_total)

# 得到所有实例中最大的 5 个 HTTP 请求数
topk(5, http_requests_total)
```

## 内置函数

瞬时向量

- instant-vector abs(instant-vector)：绝对值

- instant-vector sqrt(instant-vector))：平方根

- instant-vector exp(instant-vector )：指数计算

- instant-vector ln(instant-vector )：自然对数

- instant-vector ceil(instant-vector )：向上取整

- instant-vector floor(instant-vector )：向下取整

- instant-vector round(instant-vector )：四舍五入取整

- absent(v instant-vector):

  > 有值返回 空向量
  >
  > 没有值，则返回标签名称的时间序列 并返回值为1

- clamp(v instant-vector, min scalar, max scalar)

  > 使瞬时向量在设定的区间内,即小于最小值取最小值 大于最大值取最大值

- clamp_max(): 同clamp

- clamp_min(): 同clamp

范围向量

- instant-vector delta(range-vector)：计算区间向量里最大最小的差值

- instant-vector increase(range-vector)：计算区间向量里最后一个值和第一个值的差值

- instant-vector rate(range-vector)：计算区间向量里的平均增长率

- instant-vector irate(range-vector)：计算区间向量里的瞬时增长率

- instant-vector avg_over_time(range-vector)：指定间隔内所有点的平均值。

- instant-vector min_over_time(range-vector)：指定间隔中所有点的最小值。

- instant-vector max_over_time(range-vector)：指定间隔内所有点的最大值。

- instant-vector sum_over_time(range-vector)：指定时间间隔内所有值的总和。

- absent_over_time(v range-vector)

  > 与absent类型,不过入参是范围向量

- instant-vector changes(v range-vector):  返回这个区间向量内每个样本数据值变化的次数