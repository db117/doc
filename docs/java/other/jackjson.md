---
title: jackson常见操作
---

> [FasterXML/jackson: Main Portal page for the Jackson project (github.com)](https://github.com/FasterXML/jackson)

### 常用 api

#### json 转对象

```
// 对象
POJO result = MAPPER.readerFor(POJO.class).readValue(p);
POJO result = MAPPER.readValue(source, POJO.class);

public enum ABC { A, B, C; }
// 数组
ABC[] value = MAPPER.readerForArrayOf(ABC.class).readValue("[ \"A\", \"C\" ]");
// list
ArrayList value = MAPPER.readerForListOf(ABC.class).readValue("[ \"B\", \"C\" ]");
// map
LinkedHashMap value = MAPPER.readerForMapOf(ABC.class).readValue("{\"key\" : \"B\" }");

// 使用 TypeReference ，来解决泛型
TypeReference ref = new TypeReference<List<Integer>>() { };
List<Integer> ans = MAPPER.readValue("",ref);
```



#### 对象转 json

```
MAPPER.writeValueAsString()；

// 只处理 Foo 及其子类，其他类直接抛出异常
ObjectWriter writer = MAPPER.writerFor(Foo.class);
writer.writeValueAsString(new Foo());

```



------



### 常用配置

#### 反序列化功能

在枚举`com.fasterxml.jackson.databind.DeserializationFeature`中

**类型转换**

- USE_BIG_DECIMAL_FOR_FLOATS (default: false)
  - 使用`java.math.BigDecimal`来保存浮点数
  - 不影响显式类型
  - 关闭情况下使用 `java.lang.Double`
- USE_BIG_INTEGER_FOR_INTS (default: false)
  - 使用`java.math.BigInteger`来保存无小数点数字
  - 关闭情况下使用`java.lang.Integer` 或 `java.lang.Long`，优先使用最小适用类型
- USE_LONG_FOR_INTS (default: false)
  - 使用`java.lang.Long`来保存
  - 优先级低于`USE_BIG_INTEGER_FOR_INTS`
- USE_JAVA_ARRAY_FOR_JSON_ARRAY (default: false)
  - 开启时对于未定义类型的`java.util.List` 和 `Object[]`时，使用`Object[]`
  - 关闭时使用`java.util.List`接收参数
- READ_ENUMS_USING_TO_STRING (default: false)
  - `false` 时使用`Enum.name()`;  `true` 时`Enum.toString()`


**结构转换**

- ACCEPT_SINGLE_VALUE_AS_ARRAY (default: false)
  - 允许一个值序列化为集合。在数据只有一个或没有时可以反序列化为数组或集合。
  - 标准格式不会出现这种情况
- UNWRAP_ROOT_VALUE (default: false)
  - 和`ACCEPT_SINGLE_VALUE_AS_ARRAY`情况相反，会把一个数组对象绑定到一个对象上
  - 当出现多个对象是，会抛出异常

**值转换，强制的那种**

- ACCEPT_EMPTY_ARRAY_AS_NULL_OBJECT (default: false) 
  - 如果启用则数组串相当于 json null
- ACCEPT_EMPTY_STRING_AS_NULL_OBJECT (default: false)
  - 如果启用则空字符串相当于 json null
- ACCEPT_FLOAT_AS_INT (default: true) 
  - 是否允许将浮点数转换为整数 (`int`, `long`, `Integer`, `Long`, `BigInteger`) 
  - 如果允许则截断为整数
  - 不允许则抛出异常
- READ_DATE_TIMESTAMPS_AS_NANOSECONDS (default: false) 
  - 对时间戳按照纳秒进行绑定
  - 只针对与 Java8 Date/Time ，对于`java.util.Date`无效
  - 和`SerializationFeature#WRITE_DATE_TIMESTAMPS_AS_NANOSECONDS`对应
- READ_UNKNOWN_ENUM_VALUES_AS_NULL (default: false)
  - 对于未知枚举类使用 null 
  - 未开启时会抛出异常
- READ_UNKNOWN_ENUM_VALUES_USING_DEFAULT_VALUE (default: false) 
  - 对于未识别枚举使用默认值，使用@`JsonEnumDefaultValue`设置默认值
  - 如未开启或未知道默认值则抛出异常

**故障处理**

- FAIL_ON_IGNORED_PROPERTIES (default: false) 
  - 遇到显示忽略的属性是否抛出异常，默认跳过
- FAIL_ON_UNKNOWN_PROPERTIES (default: true)
  - 遇到未定义属性，且没有 setter 方法时抛出异常
- FAIL_ON_NULL_FOR_PRIMITIVES (default: false)
  - 基本时间类型为 `null` 时是否抛出异常，为 `false` 时使用默认值
- FAIL_ON_NUMBERS_FOR_ENUMS (default: false)
  - (0, 1, 2, ...) 是否可以反序列化为枚举，为`false` 是可以与 `Enum.ordinal()`匹配，为 `true` 抛出异常
- FAIL_ON_READING_DUP_TREE_KEY (default: false) 
  - 遇见重复属性名称是，是否抛出异常。
  - 为 `false` 时使用最后一个匹配的值

#### 序列化功能

在枚举`com.fasterxml.jackson.databind.SerializationFeature`中

**通用特性**

- INDENT_OUTPUT (default: false)
  - 是否使用缩进

**数据类型处理**

- WRITE_DATES_AS_TIMESTAMPS (default: true)
  - 是否将时间转换为时间戳，如果为 false 则使用 `SerializationConfig.getDateFormat`
- WRITE_DATE_KEYS_AS_TIMESTAMPS (default: false)
  - 是否将时间属性的 key 序列化为时间戳，如果为 `false` 则使用 (ISO-8601)
- WRITE_CHAR_ARRAYS_AS_JSON_ARRAYS (default: false)
  - 是否将 char 数组序列化为 json 数组（一个字符的数组）
  - 为 false 时序列化为一个字符串
- WRITE_ENUMS_USING_TO_STRING (default: false)
  - 控制枚举序列化名称
  - 为 true 是为 `Enum.toString()`，否则为 `Enum.name()`（默认）
- WRITE_ENUMS_USING_INDEX (default: false)
  - 决定枚举序列化名称，为 true 时使用`Enum.ordinal()`
  - 优先级大于`WRITE_ENUMS_USING_TO_STRING`
- WRITE_BIGDECIMAL_AS_PLAIN (default: false)
  - 为 `true`时会阻止将数值序列化为科学计数法（带 E）
- WRITE_DATE_TIMESTAMPS_AS_NANOSECONDS (default: true)
  - 是否将毫秒数序列化
  - 只有在 java8 中带有毫秒数是才生效
- ORDER_MAP_ENTRIES_BY_KEYS (default: false)
  - 对于 map 序列化时，是否对 `key` 先排序

------



### 常用注解

> [More Jackson Annotations | Baeldung](https://www.baeldung.com/jackson-advanced-annotations)

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
  - 字段命名策略
- @JsonAutoDetect
  - 在序列化与反序列化时的字段可见性




