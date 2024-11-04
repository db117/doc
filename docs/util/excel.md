---
title: Excel 公式
---

### 文本

```
# 字符串拼接
=A4 & A5 & “text”
=CONCAT("","")

# 替换字符串
=SUBSTITUTE(A1, "1", "")
# 替换多个字符串
=SUBSTITUTE(=SUBSTITUTE(A1, "1", ""), "2", "")
# 替换字符串为特殊符号
=SUBSTITUTE(A1, """", CHAR(10))

```



### 时间

```
# 时间格式化
=TEXT(A4,"yyyy年mm月dd日 hh:mm:ss")

# 计算时间间隔
=TEXT(A2,"[h]")
=TEXT(A2,"[m]")
=TEXT(A2,"[s]")
```



### 数字处理

```
# 固定数字位数 固定为 8 位，不够补0
=TEXT(A4,"00000000")

# 阿拉伯数字转中文数字 
=TEXT(A1,"[DBnum1]") 

# 百分比
=TEXT(0.285,"0.0%")   

# 给数字加上千分位，保留 2 位小数
=TEXT(1234.567,"$#,##0.00")

# 科学计数法
=TEXT(12200000,"0.00E+00")

# 四舍五入
=ROUND(F4,2)
```



### 数据引用

```
# 列转行，行转列
=TRANSPOSE(A2:A12)
=IF(TRANSPOSE(sheet1!B2:B12)="","",TRANSPOSE(sheet1!B2:B12))

# 当前列的某一行
=INDIRECT(ADDRESS(1,COLUMN()))
# 当前行的某一列
=INDIRECT("M"&ROW())

# 行列转换（放在区域的左上角，拉倒右下角）
=INDEX($A$1:$C$3, COLUMN(A1), ROW(A1))

```



#### 引用其他工作表的单元格

1. **使用工作表名称**:
   - 语法: `工作表名称!单元格地址`
   - 例如: `Sheet2!A1` 表示引用 Sheet2 工作表的 A1 单元格。
2. **使用定义名称**:
   - 如果你已经为某个单元格区域定义了名称,也可以直接使用该名称进行引用。
   - 例如: 如果你将 Sheet2!A1:B10 定义为 "SalesData",则可以直接使用 `SalesData` 进行引用。
3. **使用完整路径**:
   - 语法: `[工作簿名称].[工作表名称]!单元格地址`
   - 例如: `[Demo.xlsx]Sheet2!A1` 表示引用 Demo.xlsx 文件中 Sheet2 工作表的 A1 单元格。
