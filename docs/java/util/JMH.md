---
title: JMH基准测试
---

### JMH基准测试

#### 1.简介

JMH，即Java Microbenchmark Harness，是专门用于代码微基准测试的工具套件。主要是基于方法层面的基准测试，精度可以达到纳秒级。当你定位到热点方法，希望进一步优化方法性能的时候，就可以使用JMH对优化的结果进行量化的分析。

[官方网站](http://openjdk.java.net/projects/code-tools/jmh/)

> JMH 实现了JSR269规范，即注解处理器，能在编译Java源码的时候，识别的到需要处理的注解，如@Beanmark，JMH能根据@Beanmark的配置生成一系列测试辅助类

#### 2.maven依赖

```
<dependency>
    <groupId>org.openjdk.jmh</groupId>
    <artifactId>jmh-core</artifactId>
    <version>[1.23,]</version>
</dependency>
<dependency>
    <groupId>org.openjdk.jmh</groupId>
    <artifactId>jmh-generator-annprocess</artifactId>
    <version>[1.23,]</version>
    <scope>provided</scope>

```

#### 3.注解

- @Benchmark
  - 方法级注解，表示该方法是需要进行 benchmark 的对象，用法和 JUnit 的 @Test 类似
- @BenchmarkMode
  - Throughput: 整体吞吐量，例如“1秒内可以执行多少次调用”。
  - AverageTime: 调用的平均时间，例如“每次调用平均耗时xxx毫秒”。
  - SampleTime: 随机取样，最后输出取样结果的分布，例如“99%的调用在xxx毫秒以内，99.99%的调用在xxx毫秒以内”
  - SingleShotTime: 只运行一次。往往同时把 warmup 次数设为0，用于测试冷启动时的性能。
  - All：所有模式
  - 默认Throughput, ops/time
- @Warmup
  - iterations：预热的次数。
  - time：每次预热的时间。
  - timeUnit：时间的单位，默认秒。
  - batchSize：批处理大小，每次操作调用几次方法。
  - 默认 5次，每次10秒
- @Measurement
  - iterations 进行测试的轮次
  - time 每轮进行的时长
  - timeUnit 时长单位
  - 默认 5次，每次10秒
- @Timeout
  - 超时时间，每次运行的时间不能超过设定的时间
  - 默认10分钟
- @Fork
  - value：几个分叉，运行几次，默认5次
  - warmups：预热次数，默认0次
  - jvm：运行的jvm，默认当前jvm
  - jvmArgs：jvm运行main参数，没人当前main入参
- @OutputTimeUnit
  - 基准测试结果的时间类型
- @Param
  - 属性级注解，@Param 可以用来指定某项参数的多种情况。特别适合用来测试一个函数在不同的参数输入的情况下的性能。
- @Setup
  - 方法级注解，这个注解的作用就是我们需要在测试之前进行一些准备工作，比如对一些数据的初始化之类的。
  - Trial：在每次Benchmark的之前执行。
  - Iteration：在每次Benchmark的iteration的之前执行。
  - Invocation：每次调用Benchmark标记的方法之前都会执行。
  - 类似于junit的@Before
  - 使用该注解必须定义 @State注解。
- @TearDown
  - 方法级注解，这个注解的作用就是我们需要在测试之后进行一些结束工作，比如关闭线程池，数据库连接等的，主要用于资源的回收等。
  - Trial：在每次Benchmark的之后执行。
  - Iteration：在每次Benchmark的iteration的之后执行。
  - Invocation：每次调用Benchmark标记的方法之后都会执行。
  - 类似于junit的@After
  - 使用该注解必须定义 @State注解。
- @State
  - 当使用@Setup参数的时候，必须在类上加这个参数，不然会提示无法运行。
  - Thread: 该状态为每个线程独享。
  - Group: 该状态为同一个组里面所有线程共享。
  - Benchmark: 该状态在所有线程间共享。
- @Group
  - 结合@Benchmark一起使用，把多个基准方法归为一类，只能作用在**方法**上。
  - 同一个组中的所有测试设置相同的名称(否则这些测试将独立运行——没有任何警告提示！)
- @GroupThreads
  - 定义了多少个线程参与在组中运行基准方法。只能作用在**方法**上。
- @CompilerControl
  - DONT_INLINE：强制跳过内联
  - INLINE：强制内联
  - BREAK：插入一个调试断点
  - PRINT：打印方法被JIT编译后的机器码信息
  - EXCLUDE：从编译中排除该方法
  - COMPILE_ONLY：只编译此方法，不编译其他方法

#### 4.注意事项

- ERROR: org.openjdk.jmh.runner.RunnerException: ERROR: Exception while trying to acquire the JMH lock (C:\WINDOWS/jmh.lock): 拒绝访问。, exiting. Use -Djmh.ignoreLock=true to forcefully continue.
  - 这个错误是因为JMH运行需要访问系统的TMP目录，解决办法是：
    打开Run Configuration -> Environment Variables -> include system environment viables(勾选)
- JMH plugin
  - idea的jmh插件，注解直接执行
- 避免JIT优化
  - 基准测试方法一定不要返回void。
  - 如果要使用void返回，可以使用 `Blackhole` 的 `consume` 来避免JIT的优化消除。
  - 计算不要引用常量，否则会被优化到JMH的循环之外。
- 常量折叠（Constant Folding）
  - 如果你的计算输入是可预测的，在编译器就计算出常量的计算，会被JIT优化掉
  - 永远从@State实例中读取你的方法输入；
  - 返回你的计算结果；
  - 或者考虑使用BlackHole对象
- 循环处理
  - 因为编译器可能会将我们的循环进行展开或者做一些其他方面的循环优化，所以JHM建议我们不要在Beanchmark中使用循环
  - 可以是有@Measurement(batchSize = N)来达到效果

