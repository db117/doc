---
title: ES 查询操作
---

### 分页查询

> 简单数据量小的查询，直接使用`from`来查询。
>
> 需要遍历大量数据可以使用`scroll`或`search_after`。缺点是需要一页一页的翻。
>
> 当翻的页数比较多时，推荐使用`search_after`。应为`scroll`占用的资源比较多。

#### form

- 使用 `from` `size`来进行分页。

- 默认不能超过`10000`个数据。可以通过`index.max_result_window`来进行修改。

- ```
  GET sample/_search
  {
    "from": 5,
    "size": 20,
    "query": {
      "match": {
        "name": "db"
      }
    }
  }
  ```

  

#### search_after 

- 要有排序字段，每次查询时把上一次查询返回的排序值传入下一次的查询中。

- ```
  GET sample/_search
  {
      "query": {
          "match": {
              "title": "elasticsearch"
          }
      },
      "search_after": [1463538857, "654323"],
      "sort": [
          {"date": "asc"},
          {"tie_id": "asc"}      
      ]
  }
  
  ```

-  point in time (PIT)

  - 在多次查询中间数据可能发生变更，如果想保证数据一致性则可以使用 `pit`

  - 先创建一个pit，在之后的调用都带上这个值

  - 需要带上`size`参数。但是不能带上`form`

  - ```
    POST /sample/_pit?keep_alive=1m
    
    
    GET sample/_search
    {	
    	"size": 20,
        "query": {
            "match": {
                "title": "elasticsearch"
            }
        },
        "search_after": [1463538857, "654323"],
        "pit": {
            "id":  "***==", 
            "keep_alive": "1m"
            },
        "sort": [
            {"date": "asc"},
            {"tie_id": "asc"}      
        ]
    }
    ```

#### scroll

- 主要场景是当需要遍历数据时使用，比如导出。

- 在第一次查询时需要设置参数`scroll=1m`，来指定`scroll`保存的时间。

- 之后就使用scroll进行获取数据

  ```
  GET  /_search/scroll                                                               
  {
    "scroll" : "1m",                                                                 
    "scroll_id" : "上一次返回的值" 
  }
  ```

- 当使用聚合函数时，只有第一次才会返回结果

- 当想要访问的是全部的文档，直接使用`_doc`排序效率非常好

  ```
  GET /_search?scroll=1m
  {
    "sort": [
      "_doc"
    ]
  }
  ```

  

### 同时查询多个索引

可以使用逗号分割或正则直接进行查询

```
GET /my-index-000001,my-index-000002/_search
GET /my-index-*/_search
```



### 模版查询

创建模版

```
PUT _scripts/my-search-template
{
  "script": {
    "lang": "mustache",
    "source": {
      "query": {
        "match": {
          "message": "{{query_string}}"
        }
      },
      "from": "{{from}}",
      "size": "{{size}}"
    }
  }
}
```

测试模版

```
POST _render/template
{
  "id": "my-search-template",
  "params": {
    "query_string": "hello world",
    "from": 20,
    "size": 10
  }
}
```

执行模版

```
GET my-index/_search/template
{
  "id": "my-search-template",
  "params": {
    "query_string": "hello world",
    "from": 0,
    "size": 10
  }
}
```

获取模版

```
GET _scripts/my-search-template
```

删除模版

```
DELETE _scripts/my-search-template
```

