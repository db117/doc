---
title: IDEA 相关
---

## 常用插件

### ignore

> 添加各种忽略文件

### Chinese (Simplified) Language Pack

> 添加中文作为 IDE 界面语言。

### Choose Runtime

> 选择 idea 运行时 jdk

### Easy Javadoc

> [github](https://github.com/starcwang/easy_javadoc)
>
> 能帮助java开发者自动生成javadoc文档注释

### EasyYapi

> [github](https://github.com/tangcent/easy-yapi)
>
> 基于javadoc&KDoc&ScalaDoc解析API文档**导出api到`yapi`/`postman`/`markdown`**

### GsonFormatPlus

> [github](https://github.com/mars-men/GsonFormatPlus)
>
> 通过 json 生成 java 对象

### Java Bean to Json

> [github](https://github.com/linsage/java2json)
>
> 一个简单的将 javabean 转换为 JSON 的插件

### Jenkins Pipeline Linter

> 连接 Jenkins 服务器,验证 jenkinsfile , 语法检查

### JMH Java Microbenchmark Harness

> [github](https://github.com/artyushov/idea-jmh-plugin)
>
> 从 IDE 生成和运行 JMH 基准的插件

### Jsonnet

> 支持 jsonnet 语法校验

### leetcode editor

> [github](https://github.com/shuzijun/leetcode-editor)
>
> 支持在 idea 中刷题

### Maven Helper

> maven 插件。主要用来解决依赖冲突

### Statistic

> 统计代码行数

### String Manipulation

> 字符串转换工具

### Translation

> [github.com](https://github.com/YiiGuxing/TranslationPlugin)
>
> ide 中翻译

### jclasslib Bytecode Viewer

> Java 类文件的字节码查看器
>
> [jclasslib](https://github.com/ingokegel/jclasslib)

### SequenceDiagram

> [SequencePlugin | SequencePlugin for IntelliJ IDEA (vanco.github.io)](https://vanco.github.io/SequencePlugin/)
>
> 调用链路自动生成时序图

### Grep Console

> [krasa/GrepConsole: IntelliJ plugin - https://plugins.jetbrains.com/plugin/7125 (github.com)](https://github.com/krasa/GrepConsole)
>
> 控制台日志 高亮



### IntelliJ IDEA 并发参数记录

#### 配置位置（macOS）

在 IDEA 菜单中选择 **Help → Edit Custom Properties**，设置索引相关参数：

```
caches.indexerThreadsCount=2
caches.scanningThreadsCount=2
```

再选择 **Help → Edit Custom VM Options**，设置 JVM 参数：

```
-XX:ActiveProcessorCount=4
```

保存后重启 IDEA。菜单里找不到对应操作时，可按 `⇧⌘A` 搜索操作名称。

#### 参数与影响范围

| 参数                          | 控制范围                                                     | 不控制什么                                                   |
| ----------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| `caches.indexerThreadsCount`  | 项目内容索引的并发线程数。数值越小，索引通常越慢，但并发负载可能降低。 | 不限制 IDEA 的全部 CPU 使用率，也不指定使用哪类核心。        |
| `caches.scanningThreadsCount` | 扫描项目文件的并发线程数。降低它可能减少扫描时的并发负载，但会延长扫描时间。 | 不限制 IDEA 其他功能或插件的 CPU 使用率。                    |
| `-XX:ActiveProcessorCount`    | IDEA 所在 JVM 用来估算部分线程池大小的处理器数量，影响范围比前两项广。 | 不是 CPU 百分比上限，不会把线程固定到某几个核心，也不保证给 UI 留出核心。 |

JetBrains 将索引线程数和 `ActiveProcessorCount` 都列为降低 IDE 并发负载的调整方式；JVM 文档说明，`ActiveProcessorCount` 会影响包括 GC、`ForkJoinPool` 在内的线程池大小估算。
