---
title: Freemarker
---
## 基础语法

### 字符输出

* 变量存在，输出该变量，否则不输出
      ```
  ${emp.name?if_exists}
      ```
  
* 变量存在，输出该变量，否则不输出

      ${emp.name!}
  
* 变量不存在，取默认值xxx
    ```
    ${emp.name?default("xxx")}
    ```
    
* 变量不存在，取默认值xxx

    ```
    ${emp.name!"xxx"} 
	```
	
* 对字符串进行HTML编码，对html中特殊字符进行转义

    ```
    ${"123<br>456"?html}
    ```

* 使字符串第一个字母大写

    ```
    ${"str"?cap_first}
    ```

* 将字符串转换成小写
    ```
    ${"Str"?lower_case}
    ```
    
* 将字符串转换成大写

    ```
    ${"Str"?upper_case}
    ```

* 去掉字符串前后的空白字符

    * ```
        ${"str"?trim}
        ```

* 输出hello+变量名

    * ```
        ${"hello${emp.name!}"}
        ```

    * ```
        ${"hello"+emp.name!}
        ```

* 截取子串

    * ```
        <#assign str = "abcdefghijklmn"/>
        // 方法1${str?substring(0,4)} // 输出abcd
        // 方法2${str[0]}${str[4]} // 结果是ae
        ${str[1..4]} 　　　 // 结果是bcde// 返回指定字符的索引${str?index_of("n")}
        ```

        

### 日期输出

* 日期格式

  * ```
    ${emp.date?string('yyyy-MM-dd')}
    ```

### 数字输出

```
${num?c}
// 不添加逗号输出数字

${emp.name?string.number} 　					 
// 输出20

${emp.name?string.currency} 				 
// ￥20.00

${emp.name?string.percent} 					 
// 20%

${1.222?int} 　　　　　　　　　　 			
// 将小数转为int，输出1

<#setting number_format="percent"/> 	
// 设置数字默认输出方式('percent',百分比)

<#assign answer=42/> 　　　　　　　　 	
// 声明变量 answer 42

#{answer} 　　　　　　　　 
// 输出 4,200%

${answer?string} 　　　　 
// 输出 4,200%

${answer?string.number} 　　
// 输出 42

${answer?string.currency} 
// 输出 ￥42.00

${answer?string.percent} 　
// 输出 4,200%

#{answer} 　　　　　　　　
// 输出 42


数字格式化插值可采用#{expr;format}形式来格式化数字,其中format可以是:
mX:小数部分最小X位
MX:小数部分最大X位
如下面的例子:
<#assign x=2.582/><#assign y=4/>#{x; M2} // 输出2.58
#{y; M2} // 输出4
#{x; m2} // 输出2.58
#{y; m2} // 输出4.0
#{x; m1M2} // 输出2.58
#{x; m1M2} // 输出4.0
```

### 比较运算符

```
= 或 == ：判断两个值是否相等.
!= ：判断两个值是否不等.
> 或 gt ：判断左边值是否大于右边值
>= 或 gte ：判断左边值是否大于等于右边值
< 或 lt ：判断左边值是否小于右边值
<= 或 lte ：判断左边值是否小于等于右边值
```

### 逻辑判断

```
<#if condition>
...
<#elseif condition2>
...
<#elseif condition3>
...
<#else>
...
</#if>
```

```
条件可为数字，可为字符串
<#switch value>
 <#case refValue1>
 ....
<#break>
<#case refValue2>
....
<#break>
 <#case refValueN>
 ....
<#break>
 <#default>
 ....
 </#switch>
```

### 空值判断

```
// 当 object 不为空时
<#if object??>...</#if>
```

### 集合 & 循环

#### 遍历集合

```
<#list empList! as emp>
    ${emp.name!}
</#list>

// 等效于java for(int i=0; i <= 100; i++)
<#list 0..100 as i> 　　
　　${i}
</#list>

循环索引
<#list 0..(empList!?size-1) as i>
    ${empList[i].name!}
</#list>

循环的状态
empList?size 　　　// 取集合的长度
emp_index: 　　　　// int类型，当前对象的索引值
emp_has_next:     // boolean类型，是否存在下一个对象

// 使用<#break>跳出循环
<#if emp_index = 0><#break></#if>

// 集合长度判断
<#if empList?size != 0></#if>
```

#### 集合

```
// 定义一个int区间的0~100的集合，数字范围也支持反递增,如100..2
<#assign l=0..100/>    

// 截取子集合：
empList[3..5] //返回empList集合的子集合,子集合中的元素是empList集合中的第4-6个元素

// 创建集合：
<#list ["星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期天"] as x>

// 集合连接运算,将两个集合连接成一个新的集合
<#list ["星期一","星期二","星期三"] + ["星期四","星期五","星期六","星期天"] as x>

seq_contains：判断序列中的元素是否存在
<#assign x = ["red", 16, "blue", "cyan"]>
${x?seq_contains("blue")?string("yes", "no")}    // yes
${x?seq_contains("yellow")?string("yes", "no")}  // no
${x?seq_contains(16)?string("yes", "no")}        // yes
${x?seq_contains("16")?string("yes", "no")}      // no

// seq_index_of：第一次出现的索引
<#assign x = ["red", 16, "blue", "cyan", "blue"]>
${x?seq_index_of("blue")}  // 2

// sort_by：排序（升序）
<#list movies?sort_by("showtime") as movie></#list>

// sort_by：排序（降序）
<#list movies?sort_by("showtime")?reverse as movie></#list>
```

#### 排序

```
排序，按元素的首字母
<#list movies?sort as movie>
　　<a href="${movie.url}">${movie.name}</a>
</#list>

// 若要按list中对象元素的某一属性排序的话，则用
<#list moives?sort_by(["name"]) as movie>
　　<a href="${movie.url}">${movie.name}</a>
</#list>

按list中对象元素的[name]属性排序的，是升序，如果需要降序的话，如下所示：
<#list movies?sort_by(["name"])?reverse as movie>
　　<a href="${movie.url}">${movie.name}</a>
</#list>
```

#### map

```
// 创建map
<#assign scores = {"语文":86,"数学":78}>

// Map连接运算符
<#assign scores = {"语文":86,"数学":78} + {"数学":87,"Java":93}>

// Map元素输出
emp.name       // 全部使用点语法
emp["name"]    // 使用方括号

```

### 转义字符

```
\" ：双引号(u0022)
\' ：单引号(u0027)
\\ ：反斜杠(u005C)
\n ：换行(u000A)
\r ：回车(u000D)
\t ：Tab(u0009)
\b ：退格键(u0008)
\f ：Form feed(u000C)
\l ：<
\g ：>
\a ：&
\{ ：{
\xCode ：直接通过4位的16进制数来指定Unicode码,输出该unicode码对应的字符.

如果某段文本中包含大量的特殊符号,FreeMarker提供了另一种特殊格式:
可以在指定字符串内容的引号前增加r标记,在r标记后的文件将会直接输出.看如下代码:
${r"${foo}"}    // 输出 ${foo}
${r"C:/foo/bar"}    // 输出 C:/foo/bar
```

### 其他

#### include指令

```
// include指令的作用类似于JSP的包含指令:
<#include "/test.ftl" encoding="UTF-8" parse=true>

// 在上面的语法格式中,两个参数的解释如下:
encoding="GBK"  // 编码格式
parse=true 　　 // 是否作为ftl语法解析,默认是true，false就是以文本方式引入,
注意:在ftl文件里布尔值都是直接赋值的如parse=true,而不是parse="true"
```

#### import指令

```
// 类似于jsp里的import,它导入文件，然后就可以在当前文件里使用被导入文件里的宏组件
<#import "/libs/mylib.ftl" as my>
// 上面的代码将导入/lib/common.ftl模板文件中的所有变量,
交将这些变量放置在一个名为com的Map对象中，
"my"在freemarker里被称作namespace
```

#### compress 压缩

```
<#compress>
    ...
</#compress>
<#t> // 去掉左右空白和回车换行

<#lt>// 去掉左边空白和回车换行

<#rt>// 去掉右边空白和回车换行

<#nt>// 取消上面的效果
```