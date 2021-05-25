---
title: yaml格式
---

[官网](http://yaml.org/)

[github](https://github.com/yaml/yaml)

## 格式

### 基本格式

1. yaml中允许表示三种格式，分别为常量值、对象和数组
2. 大小写敏感
3. 使用缩进代表层级关系
4. .缩进只能使用空格，**不能使用tab键**，不要求空格个数，只需要相同层级左对齐（一般2或4个空格）

### 类型

> 可以使用!!来定义类型

- map

  > key唯一

  ```
  Block style: !!map
    Clark : Evans
    Ingy  : döt Net
    Oren  : Ben-Kiki
  
  Flow style: !!map { Clark: Evans, Ingy: döt Net, Oren: Ben-Kiki }
  ```

- omap

- > 键: 值对的有序序列，无重复值。

  ```
  # Explicitly typed ordered map (dictionary).
  Bestiary: !!omap
    - aardvark: African pig-like ant eater. Ugly.
    - anteater: South-American ant eater. Two species.
    - anaconda: South-American constrictor snake. Scaly.
    # Etc.
  # Flow style
  Numbers: !!omap [ one: 1, two: 2, three : 3 ]
  ```

- pairs

- > 键: 值对的有序序列，允许重复。

  ```
  # Explicitly typed pairs.
  Block tasks: !!pairs
    - meeting: with team.
    - meeting: with boss.
    - break: lunch.
    - meeting: with client.
  Flow tasks: !!pairs [ meeting: with team, meeting: with boss ]
  ```

- set

- > 非等值的无序集合。

  ```
  # Explicitly typed set.
  baseball players: !!set
    ? Mark McGwire
    ? Sammy Sosa
    ? Ken Griffey
  # Flow style
  baseball teams: !!set { Boston Red Sox, Detroit Tigers, New York Yankees }
  ```

- seq 

- > 表示一个从零开始的连续整数索引的集合。

  ```
  Block style: !!seq
  - Clark Evans
  - Ingy döt Net
  - Oren Ben-Kiki
  
  Flow style: !!seq [ Clark Evans, Ingy döt Net, Oren Ben-Kiki ]
  ```

- str  

- >  表示 Unicode 字符串,由零个或多个 Unicode 字符组成的序列。

  ```
  Block style: !!str |-
    String: just a theory.
  
  Flow style: !!str "String: just a theory."
  ```

- null  

- > 表示缺少值。
  >
  > null | Null | NULL | ~

  ```
  !!null null: value for null key
  key with null value: !!null null
  ```

- bool  

- > 表示一个 true/false 值
  >
  > true | True | TRUE | false | False | FALSE

  ```
  YAML is a superset of JSON: !!bool true
  Pluto is a planet: !!bool false
  ```

- int

- > 整数

  ```
  negative: !!int -12
  zero: !!int 0
  positive: !!int 34
  ```

- float

  > 表示实数的近似值，包括三个特殊值(正无穷大和负无穷大，以及“非数”)。

  ```
  negative: !!float -1
  zero: !!float 0
  positive: !!float 2.3e4
  infinity: !!float .inf
  not a number: !!float .nan
  ```

- binary

- > 一个由零个或多个八位元组成的序列(8位值)。

  ```
  canonical: !!binary "\
   R0lGODlhDAAMAIQAAP//9/X17unp5WZmZgAAAOfn515eXvPz7Y6OjuDg4J+fn5\
   OTk6enp56enmlpaWNjY6Ojo4SEhP/++f/++f/++f/++f/++f/++f/++f/++f/+\
   +f/++f/++f/++f/++f/++SH+Dk1hZGUgd2l0aCBHSU1QACwAAAAADAAMAAAFLC\
   AgjoEwnuNAFOhpEMTRiggcz4BNJHrv/zCFcLiwMWYNG84BwwEeECcgggoBADs="
  generic: !binary |
   R0lGODlhDAAMAIQAAP//9/X17unp5WZmZgAAAOfn515eXvPz7Y6OjuDg4J+fn5
   OTk6enp56enmlpaWNjY6Ojo4SEhP/++f/++f/++f/++f/++f/++f/++f/++f/+
   +f/++f/++f/++f/++f/++SH+Dk1hZGUgd2l0aCBHSU1QACwAAAAADAAMAAAFLC
   AgjoEwnuNAFOhpEMTRiggcz4BNJHrv/zCFcLiwMWYNG84BwwEeECcgggoBADs=
  description:
   The binary value above is a tiny arrow encoded as a gif image.
  ```

- merge

- > 指定一个或多个要与当前映射合并的映射。

  ```
  ---
  - &CENTER { x: 1, y: 2 }
  - &LEFT { x: 0, y: 2 }
  - &BIG { r: 10 }
  - &SMALL { r: 1 }
  
  # All the following maps are equal:
  
  - # Explicit keys
    x: 1
    y: 2
    r: 10
    label: center/big
  
  - # Merge one map
    << : *CENTER
    r: 10
    label: center/big
  
  - # Merge multiple maps
    << : [ *CENTER, *BIG ]
    label: center/big
  
  - # Override
    << : [ *BIG, *LEFT, *SMALL ]
    x: 1
    label: center/big
  ```

- timestamp

- > 时间

  ```
   匹配:
   [0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9] # (ymd)
  |[0-9][0-9][0-9][0-9] # (year)
   -[0-9][0-9]? # (month)
   -[0-9][0-9]? # (day)
   ([Tt]|[ \t]+)[0-9][0-9]? # (hour)
   :[0-9][0-9] # (minute)
   :[0-9][0-9] # (second)
   (\.[0-9]*)? # (fraction)
   (([ \t]*)Z|[-+][0-9][0-9]?(:[0-9][0-9])?)? # (time zone)
   
   
   
  canonical:        2001-12-15T02:59:43.1Z
  valid iso8601:    2001-12-14t21:59:43.10-05:00
  space separated:  2001-12-14 21:59:43.10 -5
  no time zone (Z): 2001-12-15 2:59:43.10
  date (00:00:00Z): 2002-12-14
  ```

  
