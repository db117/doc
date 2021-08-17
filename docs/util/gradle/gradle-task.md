---
title: gradle-task
---

## JavaExec

> [`JavaExec`](https://docs.gradle.org/current/javadoc/org/gradle/api/tasks/JavaExec.html)
>
> 就是执行java class的main方法

### 简单使用

```
plugins {
    id 'java'
}

task runApp(type: JavaExec) {
  classpath = sourceSets.main.runtimeClasspath
  mainClass = 'package.Main'
  // main参数
  args 'appArg1'
}

// 创建jar
jar {
  manifest {
    attributes('Main-Class': 'package.Main')
  }
}

task runExecutableJar(type: JavaExec) {
  // 只能有一个jar存在
  classpath = files(tasks.jar)

  // main可以不定义

  // main参数
  args 'appArg1'
}

```

### 属性

| 属性                                                         | 描述                            |
| ------------------------------------------------------------ | ------------------------------- |
| [`allJvmArgs`](https://docs.gradle.org/current/dsl/org.gradle.api.tasks.JavaExec.html#org.gradle.api.tasks.JavaExec:allJvmArgs) | 用于启动进程的 JVM 的完整参数集 |
| [`args`](https://docs.gradle.org/current/dsl/org.gradle.api.tasks.JavaExec.html#org.gradle.api.tasks.JavaExec:args) | main方法参数                    |
| [`classpath`](https://docs.gradle.org/current/dsl/org.gradle.api.tasks.JavaExec.html#org.gradle.api.tasks.JavaExec:classpath) | classpath                       |
| [`enableAssertions`](https://docs.gradle.org/current/dsl/org.gradle.api.tasks.JavaExec.html#org.gradle.api.tasks.JavaExec:enableAssertions) | 是否启用断言                    |
| [`environment`](https://docs.gradle.org/current/dsl/org.gradle.api.tasks.JavaExec.html#org.gradle.api.tasks.JavaExec:environment) | 环境变量                        |
| [`errorOutput`](https://docs.gradle.org/current/dsl/org.gradle.api.tasks.JavaExec.html#org.gradle.api.tasks.JavaExec:errorOutput) | 错误输出. 默认 `System.err`.    |
| [`mainClass`](https://docs.gradle.org/current/dsl/org.gradle.api.tasks.JavaExec.html#org.gradle.api.tasks.JavaExec:mainClass) | 需要执行的类                    |
| [`maxHeapSize`](https://docs.gradle.org/current/dsl/org.gradle.api.tasks.JavaExec.html#org.gradle.api.tasks.JavaExec:maxHeapSize) | 最大堆大小                      |
| [`systemProperties`](https://docs.gradle.org/current/dsl/org.gradle.api.tasks.JavaExec.html#org.gradle.api.tasks.JavaExec:systemProperties) | 系统属性                        |
| [`workingDir`](https://docs.gradle.org/current/dsl/org.gradle.api.tasks.JavaExec.html#org.gradle.api.tasks.JavaExec:workingDir) | 工作目录，默认项目目录          |

