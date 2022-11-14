---
title: JVM参数
---



### 基本参数

| **参数名称**                | **含义**                                                   | **默认值** |                                                              |
| --------------------------- | ---------------------------------------------------------- | ---------- | ------------------------------------------------------------ |
| -Xms                        | 初始堆大小                                                 | 内存的1/64 | 默认(MinHeapFreeRatio参数可以调整)空余堆内存小于40%时，JVM就会增大堆直到-Xmx的最大限制. |
| -Xmx                        | 最大堆大小                                                 | 内存的1/4  | 默认(MaxHeapFreeRatio参数可以调整)空余堆内存大于70%时，JVM会减少堆直到 -Xms的最小限制 |
| -Xmn                        | 年轻代大小                                                 |            | **注意**：此处的大小是（eden+ 2 survivor space).与jmap -heap中显示的New gen是不同的。 整个堆大小=年轻代大小 + 年老代大小 + 持久代大小. 增大年轻代后,将会减小年老代大小.此值对系统性能影响较大,Sun官方推荐配置为整个堆的3/8 |
| -XX:NewSize                 | 设置年轻代大小                                             |            |                                                              |
| -XX:MaxNewSize              | 年轻代最大值                                               |            |                                                              |
| -XX:PermSize                | 设置持久代(perm gen)初始值                                 | 内存的1/64 | JDK1.8以前                                                   |
| -XX:MaxPermSize             | 设置持久代最大值                                           | 内存的1/4  | JDK1.8以前                                                   |
| -Xss                        | 每个线程的堆栈大小                                         |            | JDK5.0以后每个线程堆栈大小为1M,以前每个线程堆栈大小为256K.   |
| -XX:NewRatio                | 年轻代(包括Eden和两个Survivor区)与年老代的比值(除去持久代) |            | -XX:NewRatio=4表示年轻代与年老代所占比值为1:4,年轻代占整个堆栈的1/5 Xms=Xmx并且设置了Xmn的情况下，该参数不需要进行设置。 |
| -XX:SurvivorRatio           | Eden区与Survivor区的大小比值                               |            | 设置为8,则两个Survivor区与一个Eden区的比值为2:8,一个Survivor区占整个年轻代的1/10 |
| -XX:LargePageSizeInBytes    | 内存页的大小不可设置过大， 会影响Perm的大小                |            | =128m                                                        |
| -XX:+UseFastAccessorMethods | 原始类型的快速优化                                         |            |                                                              |
| -XX:+DisableExplicitGC      | 关闭System.gc()                                            |            | 这个参数需要严格的测试                                       |
| -XX:MaxTenuringThreshold    | 垃圾最大年龄                                               |            | 如果设置为0的话,则年轻代对象不经过Survivor区,直接进入年老代. 对于年老代比较多的应用,可以提高效率 |
| -XX:+UseBiasedLocking       | 锁机制的性能改善                                           |            |                                                              |
| -Xnoclassgc                 | 禁用垃圾回收                                               |            |                                                              |
| -XX:PretenureSizeThreshold  | 对象超过多大是直接在旧生代分配                             | 0          | 单位字节 新生代采用Parallel Scavenge GC时无效 另一种直接在旧生代分配的情况是大的数组对象,且数组中无外部引用对象. |
| -XX:TLABWasteTargetPercent  | TLAB占eden区的百分比                                       | 1%         |                                                              |
| -XX:+*CollectGen0First*     | FullGC时是否先YGC                                          | false      |                                                              |

**Jdk8版本的重要特有参数**

| **参数名称**         | **含义**   | **默认值** |          |
| -------------------- | ---------- | ---------- | -------- |
| -XX:MetaspaceSize    | 元空间大小 |            | Jdk8版本 |
| -XX:MaxMetaspaceSize | 最大元空间 |            | Jdk8版本 |

### JVM日志

```text
// 打印GC的详细信息
-XX:+PrintGCDetails
// 打印GC的时间戳
-XX:+PrintGCDateStamps
// 在GC前后打印堆信息
-XX:+PrintHeapAtGC
// 打印Survivor区中各个年龄段的对象的分布信息
-XX:+PrintTenuringDistribution
// JVM启动时输出所有参数值，方便查看参数是否被覆盖
-XX:+PrintFlagsFinal
// 打印GC时应用程序的停止时间
-XX:+PrintGCApplicationStoppedTime
// 打印在GC期间处理引用对象的时间（仅在PrintGCDetails时启用）
-XX:+PrintReferenceGC
```

### 打印参数参数

```
// 打印最终使用的jvm参数
-XX:+PrintFlagsFinal

// 打印默认参数
-XX:+PrintFlagsInitial 

// 打印用户设置的参数
-XX:+PrintCommandLineFlags

```



### 并行收集器相关参数

| **参数名称**                | **含义**                                          | **默认值** |                                                              |
| --------------------------- | ------------------------------------------------- | ---------- | ------------------------------------------------------------ |
| -XX:+UseParallelGC          | Full GC采用parallel MSC (此项待验证)              |            | 选择垃圾收集器为并行收集器.此配置仅对年轻代有效.即上述配置下,年轻代使用并发收集,而年老代仍旧使用串行收集.(此项待验证) |
| -XX:+UseParNewGC            | 设置年轻代为并行收集                              |            | 可与CMS收集同时使用 JDK5.0以上,JVM会根据系统配置自行设置,所以无需再设置此值 |
| -XX:ParallelGCThreads       | 并行收集器的线程数                                |            | 此值最好配置与处理器数目相等 同样适用于CMS                   |
| -XX:+UseParallelOldGC       | 年老代垃圾收集方式为并行收集(Parallel Compacting) |            | 这个是JAVA 6出现的参数选项                                   |
| -XX:MaxGCPauseMillis        | 每次年轻代垃圾回收的最长时间(最大暂停时间)        |            | 如果无法满足此时间,JVM会自动调整年轻代大小,以满足此值.       |
| -XX:+UseAdaptiveSizePolicy  | 自动选择年轻代区大小和相应的Survivor区比例        |            | 设置此选项后,并行收集器会自动选择年轻代区大小和相应的Survivor区比例,以达到目标系统规定的最低相应时间或者收集频率等,此值建议使用并行收集器时,一直打开. |
| -XX:GCTimeRatio             | 设置垃圾回收时间占程序运行时间的百分比            |            | 公式为1/(1+n)                                                |
| -XX:+*ScavengeBeforeFullGC* | Full GC前调用YGC                                  | true       | Do young generation GC prior to a full GC. (Introduced in 1.4.1.) |



### 其他

##### -XX:+PerfDisableSharedMem

该参数决定了存储PerfData的内存是不是可以被共享，也就是说不管这个参数设置没设置，jvm在启动的时候都会分配一块内存来存PerfData，只是说这个PerfData是不是其他进程可见的问题，如果设置了这个参数，说明不能被共享，此时其他进程将访问不了该内存，这样一来，譬如我们jps，jstat等都无法工作。默认这个参数是关闭的，也就是默认支持共享的方式

##### -XX:-UsePerfData

如果关闭了UsePerfData这个参数，那么jvm启动过程中perf memory都不会被创建，默认情况是是打开的



#### 