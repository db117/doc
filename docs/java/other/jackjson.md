---
title: jackson常见操作
---

> [FasterXML/jackson: Main Portal page for the Jackson project (github.com)](https://github.com/FasterXML/jackson)

### 常用 api

#### json 转对象

```
// 对象
POJO result = MAPPER.readerFor(POJO.class).readValue(p);
POJO result = objectReader.readValue(source, POJO.class);

public enum ABC { A, B, C; }
// 数组
ABC[] value = MAPPER.readerForArrayOf(ABC.class).readValue("[ \"A\", \"C\" ]");
// list
ArrayList value = MAPPER.readerForListOf(ABC.class).readValue("[ \"B\", \"C\" ]");
// map
LinkedHashMap value = MAPPER.readerForMapOf(ABC.class).readValue("{\"key\" : \"B\" }");
```



#### 对象转 json

```
MAPPER.writeValueAsString()；

// 只处理 Foo 及其子类
ObjectWriter writer = MAPPER.writerFor(Foo.class);
writer.writeValueAsString(new Foo());


```



------



### 常用配置

```

```



### 常用注解

- @JsonProperty
  - 更改属性的 JSON 名称
- @JsonIgnore
  - 忽略某个字段
- @JsonIgnoreProperties
  - 忽略某些字段
  - `ignoreUnknown` 忽略未知属性
  - `allowGetters` 允许 get 方法，默认 false
  - `allowSetters` 允许 set 方法，默认 false
- @JsonIgnoreType
  - 忽略某个类型，在序列化与反序列化时忽略某些类型
- @JsonAlias
  - 对字段类型设置别名
  - 可配合@`JsonCreator`使用
- @JsonFilter
  - 过滤某些字段
  - 通过`SimpleFilterProvider`简单使用
- @JsonFormat
  - 指定序列号格式
- @JsonRootName
  - 指定对象在 json 中的名称
- @JsonDeserialize
  - 指定反序列化实现

- @JsonSerialize
  - 指定序列化实现

- @JsonNaming
  - 知道命名策略




