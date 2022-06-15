---
tital: json 相关 
---

# JSON 基本操作

> [使用 JSON 数据 - SQL Server | Microsoft Docs](https://docs.microsoft.com/zh-cn/sql/relational-databases/json/json-data-sql-server?view=sql-server-ver15)

### 将查询结果格式化为 JSON

```
SELECT name, surname  
FROM emp  
FOR JSON AUTO;
```

### 获取 json 数据

```
DECLARE @jsonInfo NVARCHAR(MAX)

SET @jsonInfo=N'{  
     "info":{    
       "type":1,  
       "address":{    
         "town":"Bristol",  
         "county":"Avon",  
         "country":"England"  
       },  
       "tags":["Sport", "Water polo"]  
    },  
    "type":"Basic"  
 }' 
 
 // 对于数组
```



- 获取值 JSON_VALUE

  > 从 JSON 字符串中提取标量值。不能获取对象。
  >
  > JSON_VALUE(<字段或设置的变量>,'<path>')

  ```
  json_value(@jsonInfo,'$')							null
  json_value(@jsonInfo,'$.info.type')		N'1'
  ```
  
- 获取对象 JSON_QUERY

  > 从 JSON 字符串中提取对象或数组。不能获取值。
  >
  > JSON_QUERY(<字段或设置的变量>,'<path>')

  ```
  json_query(@jsonInfo,'$.info.type')  	null
  json_query(@jsonInfo,'$')							返回整个 JSON 文本。
  json_query(@jsonInfo,'$.info.tags')  	N'[ "Sport", "Water polo"]'
  ```

- 数组读取

  > 对于数组读取，可以使用OPENJSON，或使用 `$[0].xxx`方式获取

  ```
  DECLARE @jsonInfo NVARCHAR(MAX)
  
  SET @jsonInfo=N'[{  
       "info":{    
         "type":1,  
         "address":{    
           "town":"Bristol",  
           "county":"Avon",  
           "country":"England"  
         },  
         "tags":["Sport", "Water polo"]  
      },  
      "type":"Basic"  
   }]' 
   
  json_value(@jsonInfo,'$[0].info.type')		N'1'
  json_query(@jsonInfo,'$[0].info.tags')  	N'[ "Sport", "Water polo"]'
  ```

  

- OPENJSON

  > 对 JSON 文档提供行集视图。
  >
  > OPENJSON( jsonExpression [ , path ] )  [ <with_clause> ] <with_clause> ::= WITH ( { colName type [ column_path ] [ AS JSON ] } [ ,...n ] )

  解析默认为 `key`,`value`,`type`三个属性，下面为 type 的含义。
  
  | 类型列的值 | JSON 数据类型 |
  | :--------- | :------------ |
  | 0          | Null          |
  | 1          | 字符串        |
  | 2          | 数字          |
  | 3          | true/false    |
  | 4          | array         |
	| 5          | 对象 (object) |

  可以使用 `with`指定返回的行集头

  ```
  DECLARE @array VARCHAR(MAX);
  SET @array = '[{"month":"Jan", "temp":10},{"month":"Feb", "temp":12},{"month":"Mar", "temp":15},
                 {"month":"Apr", "temp":17},{"month":"May", "temp":23},{"month":"Jun", "temp":27}
                ]';
  
  SELECT * FROM OPENJSON(@array)
          WITH (  month VARCHAR(3),
                  temp int)
  ```

### 修改 json 的值

> JSON_MODIFY ( expression , path , newValue )  

```
DECLARE @info NVARCHAR(100)='{"name":"John","skills":["C#","SQL"]}'

-- 修改字段
SET @info=JSON_MODIFY(@info,'$.name','Mike')
{
    "name": "Mike",
    "skills": ["C#", "SQL"]
}

-- 添加字段
SET @info=JSON_MODIFY(@info,'$.surname','Smith')
{
    "name": "Mike",
    "skills": ["C#", "SQL"],
    "surname": "Smith"
}

-- 设置字段为 null
SET @info=JSON_MODIFY(@info,'strict $.name',NULL)
-- 删除字段
SET @info=JSON_MODIFY(@info,'$.name',NULL)
{
    "skills": ["C#", "SQL"],
    "surname": "Smith"
}

-- 追加数据
SET @info=JSON_MODIFY(@info,'append $.skills','Azure')
{
    "skills": ["C#", "SQL", "Azure"],
    "surname": "Smith"
}
```
