---
title: jdk工具
---

> 基于 jdk11 
>
> [Tools and Commands Reference (oracle.com)](https://docs.oracle.com/en/java/javase/11/tools/tools-and-command-reference.html)

## javac

> 读取 Java 类和接口定义，并将它们编译成字节码和类文件。
>
> 还可以在Java源文件和类中处理注释。

**参数**

- --class-path path, -classpath path, -cp path

  > 指定在哪里可以找到用户类文件和注释处理器。这个类路径覆盖了 CLASSPATH 环境变量中的用户类路径。

- **-d** **directory**

  > 设置类文件的输出目录。

- -encoding encoding

  > 指定源文件使用的字符编码,如果没有使用则使用系统默认编码

- -g

  > 生成所有调试信息，包括本地变量。默认情况下，只生成行号和源文件信息。

- -verbose

  > 输出有关编译器正在做什么的消息。消息包括有关加载的每个类和编译的每个源文件的信息。

- -source release

  > 指定接受的源代码版本。

- -target release

  > 为特定的 VM 版本生成类文件。

## javap

> 反汇编一个或多个类文件。

**参数**

- -verbose or -v

  > 打印有关所选类的附加信息。

- -l

  > 打印行和局部变量表。

- -public

  > 只显示公共类和成员。

- -protected

  > 只显示受保护的和公共的类和成员。

- -package

  > 显示除私有的

- -private or -p

  > 显示所有的类和成员

- -c

  > 为类中的每个方法打印反汇编代码

- -s

  > 打印内部类型签名。

- -sysinfo

  > 显示正在处理的类的系统信息(路径、大小、日期、 MD5散列)。

- -constants

  > 显示`static`,`final`常量‘

## javadoc

> 使用 javadoc 工具及其选项从 Java 源文件生成 API 文档的 HTML 页面。

**参数**

> javac 的参数一部分参数可以在 javadoc 中使用
>
> - `-bootclasspath`
> - `--class-path`, `-classpath`, or `-cp`
> - `--enable-preview`
> - `-encoding`
> - `-extdirs`
> - `--release`
> - `-source`
> - `--source-path` or `-sourcepath`
> - `--system`

- -exclude pkglist

  > 排除包

- -locale name

  > 指定 javadoc 工具生成文档时使用的区域设置。

- -package,-private,-protected,-public

  > 显示指定包访问级别之上的类和成员

- -quiet

  > 关闭消息，以便只显示警告和错误，使其更容易查看。

- --show-members  [protected|public|package|private]

  > 指定记录哪些成员(字段或方法)

- -author

  > 在生成的文档中包含@author 文本。

- -charset name

  > 指定此文档的 HTML 字符集。

- -d directory

  > 指定 javadoc 工具保存生成的 HTML 文件的目标目录。

- -docencoding name

  > 指定生成的 HTML 文件的编码。

- -header html-code

  > 指定放置在每个输出文件顶部的标题文本。

- -footer html-code

  > 指定放置在每个输出文件底部的页脚文本。

- -nocomment

  > 取消整个注释体，包括主要描述和所有标记，并只生成声明。


- -nodeprecated

  > 防止在文档中生成任何已弃用的 API。
- --no-frames

  > 禁止在生成的输出中使用帧。
- -nohelp

  > 在每个页面输出的顶部和底部的导航栏中省略 HELP 链接。
- -noindex

  > 从生成的文档中省略索引。缺省情况下生成索引。
- -nonavbar

  > 防止导航栏、页眉和页脚的生成，这些导航栏、页眉和页脚通常位于生成页的顶部和底部。
- -nosince

  > 从生成的文档中省略与@Since 标记关联的 Since 部分。

- -notimestamp

  > 取消时间戳，时间戳隐藏在每个页面顶部附近生成的 HTML 中的 HTML 注释中。

- -notree

  > 从生成的文档中省略类和接口层次结构页面

## java

> 可以使用 Java 命令启动 Java 应用程序。
>
> 具体查看jvm参数

## jar

> 为类和资源创建存档，并操作或从存档中恢复单个类或资源。

## jlink

## jmod

## jdeps

## jdeprscan

## jshell

## keytool

## jarsigner

## kinit

## klist

## ktab

## rmic

## rmiregistry

## rmid

## serialver

## pack200

## unpack200

## jconsole

## jps

> 查看系统中运行的 java 程序

**参数**

> -q：只输出进程 ID
>
> -m：输出传入 main 方法的参数
>
> -l：输出完全的包名，应用主类名，jar的完全路径名
>
> -v：输出jvm参数
>
> -V：输出通过flag文件传递到JVM中的参数

**用例**

1. 无参数：jps

   显示进程的ID 和 类的名称	

2. jps -mlvV

   显示进程ID	完全的包名，应用主类名，jar的完全路径名 	jvm参数	通过flag文件传递到JVM中的参数

**原理**

> java程序在启动以后，会在java.io.tmpdir指定的目录下，就是临时文件夹里，生成一个类似于hsperfdata_User的文件夹，这个文件夹里（在Linux中为/tmp/hsperfdata_{userName}/），有几个文件，名字就是java进程的pid，因此列出当前运行的java进程，只是把这个目录里的文件名列一下而已。 至于系统的参数什么，就可以解析这几个文件获得。

## Jmap

参数

- option： 选项参数。
- pid： 需要打印配置信息的进程ID。
- executable： 产生核心dump的Java可执行文件。
- core：需要打印配置信息的核心文件。
- server-id 可选的唯一id，如果相同的远程主机上运行了多台调试服务器，用此选项参数标识服务器。
- remote server IP or hostname 远程调试服务器的IP地址或主机名。

option

- no option： 查看进程的内存映像信息,类似 Solaris pmap 命令。
- heap： 显示Java堆详细信息
- histo[:live]： 显示堆中对象的统计信息
- clstats：打印类加载器信息
- finalizerinfo： 显示在F-Queue队列等待Finalizer线程执行finalizer方法的对象
- dump:<dump-options>：生成堆转储快照
-   F：当-dump没有响应时，使用-dump或者-histo参数. 在这个模式下,live子参数无效.
-   help：打印帮助信息
-   J<flag>：指定传递给运行jmap的JVM的参数

用例

* 不带参数
  * 将会打印目标虚拟机中加载的每个共享对象的起始地址、映射大小以及共享对象文件的路径全称
* heap
  * 打印一个堆的摘要信息，包括使用的GC算法、堆配置信息和各内存区域内存使用信息
* -histo:live
  * 其中包括每个Java类、对象数量、内存大小(单位：字节)、完全限定的类名。打印的虚拟机内部的类名称将会带有一个’*’前缀。如果指定了live子选项，则只计算活动的对象。
  * num：序号
    instances：实例数量
    bytes：占用空间大小
    class name：类名称
* -clstats
  * 打印Java堆内存的永久保存区域的类加载器的智能统计信息。对于每个类加载器而言，它的名称、活跃度、地址、父类加载器、它所加载的类的数量和大小都会被打印。此外，包含的字符串数量和大小也会被打印。
* -finalizerinfo
  * 打印等待终结的对象信息
  * Number of objects pending for finalization: 0 说明当前F-QUEUE队列中并没有等待Fializer线程执行final
* dump:<dump-options>
  * -dump:format=b,file=heapdump.phrof 
  * 以hprof二进制格式转储Java堆到指定filename的文件中。live子选项是可选的。如果指定了live子选项，堆中只有活动的对象会被转储。
  * 可以用**jvisualvm**命令工具导入该dump文件分析

### 细节

* Metadata does not appear to be polymorphic

  * 使用启动的用户进行执行

    ```
    sudo -u 用户名
    ```

* 也可以设置内存溢出自动导出dump文件(内存很大的时候，可能会导不出来)

  * -XX:+HeapDumpOnOutOfMemoryError
  2. -XX:HeapDumpPath=./ （路径）

## Jstack

"Thread-1" 线程名
prio=5 优先级=5
tid=0x000000001fa9e000 线程id
nid=0x2d64 线程对应的本地线程标识nid
runnable 线程状态

### 参数说明：

- -l 长列表. 打印关于锁的附加信息,例如属于java.util.concurrent 的 ownable synchronizers列表.
- -F 当’jstack [-l] pid’没有相应的时候强制打印栈信息
- -m 打印java和native c/c++框架的所有栈信息.
- -h | -help 打印帮助信息

### 线程状态

* **NEW**,未启动的。不会出现在Dump中。
* **RUNNABLE**,在虚拟机内执行的。运行中状态，可能里面还能看到locked字样，表明它获得了某把锁。
* **BLOCKED**,受阻塞并等待监视器锁。被某个锁(synchronizers)給block住了。
* **WATING**,无限期等待另一个线程执行特定操作。等待某个condition或monitor发生，一般停留在park(), wait(), sleep(),join() 等语句里。

* **TIMED_WATING**,有时限的等待另一个线程的特定操作。和WAITING的区别是wait() 等语句加上了时间限制 wait(timeout)。

* **TERMINATED**,已退出的。

### 调用修饰

* locked <地址> 目标：使用synchronized申请对象锁成功,监视器的拥有者。
* waiting to lock <地址> 目标：使用synchronized申请对象锁未成功,在迚入区等待。

* waiting on <地址> 目标：使用synchronized申请对象锁成功后,释放锁幵在等待区等待。

* parking to wait for <地址> 目标

### 线程动作

* runnable:状态一般为RUNNABLE。

* in Object.wait():等待区等待,状态为WAITING或TIMED_WAITING。

* waiting for monitor entry:进入区等待,状态为BLOCKED。

* waiting on condition:等待区等待、被park。

* sleeping:休眠的线程,调用了Thread.sleep()。

### jstack找出占用cpu最高的堆栈信息

> 使用top找到CPU占用最高的
>
> 使用命令top -Hp  ，显示你的java进程的内存情况，pid是你的java进程号，比如4977
>
> 找到内存和cpu占用最高的线程tid，比如4977
>
> 转为十六进制得到 0x1371 ,此为线程id的十六进制表示  linux中可用`printf "%x\n" tid`
>
> 执行 jstack 4977|grep -A 10 1371，得到线程堆栈信息中1371这个线程所在行的后面10行
>
> 查看对应的堆栈信息找出可能存在问题的代码

## Jinfo

#### 参数说明

- pid 对应jvm的进程id
- executable core 产生core dump文件
- [server-id@]remote server IP or hostname 远程的ip或者hostname，server-id标记服务的唯一性id

#### option

- no option 输出全部的参数和系统属性
- -flag name 输出对应名称的参数
- -flag [+|-]name 开启或者关闭对应名称的参数
- -flag name=value 设定对应名称的参数
- -flags 输出全部的参数
- -sysprops 输出系统属性

## Jstat

jstat(Java Virtual Machine statistics monitoring tool)——查看堆内各个部分的使用量，以及加载类的数量

命令格式：**jstat** [generalOption | outputOptions vmid [ interval [ s|ms ] [ count ] ] ]
jstat [-命令选项] [vmid] [间隔时间(毫秒)] [查询次数]

-statOption：

> class：关于类加载器行为的统计信息
>
> compiler：HotSpot即时编译器行为的统计信息
>
> gc：垃圾回收堆行为的统计信息
>
> gacapacity：统计内存三代（young、old、permanent）及他们空间信息
>
> gccause：垃圾收集统计（与-gcutil相同）的摘要，以及最后一个和当前（如果适用）垃圾回收事件的cause
>
> gcnew：新生代的统计信息
>
> gcnewcapacity：新生代及其空间使用情况
>
> gcold：老年代和永久代的统计信息
>
> gcoldcapacity：老年代容量的使用情况
>
> gcpermcapacity：永久代容量的使用情况
>
> gcutil：垃圾回收统计
>
> printcompilation：hotSpot编译器方法统计

-h n：设置隔n行显示header

-t：第一列显示一个时间戳，当前时间与jvm启动时间的时间间隔

### class：类加载统计

> jstat -class pid
>
> 
>
> Loaded:加载class的数量
>
> Bytes：所占用空间大小
>
> Unloaded：未加载数量
>
> Bytes:未加载占用空间
>
> Time：花费在执行类加载和未加载操作上的时间

### compiler：HotSpot即时编译器行为的统计信息

> jstat -compiler pid
>
> ​     
>
> Compiled：编译数量
>
> Failed：失败数量
>
> Invalid：不可用数量
>
> Time：编译花费的时间
>
> FailedType：最近一次编译失败的编译类型
>
> FailedMethod：最近一次编译失败的类名和方法名

### gc：垃圾回收堆行为的统计信息

> jstat -gc pid

> S0C：survivor 0的容量（KB）
>
> S1C：survivor 1的容量（KB）
>
> S0U：survivor 0已使用情况（KB）
>
> S1U：survivor 1已使用情况（KB）
>
> EC：Eden的空间容量（KB）
>
> EU：Eden已使用情况（KB）
>
> OC：老年代空间容量（KB）
>
> OU：老年代已使用大小（KB）
>
> MC：方法区空间容量（KB）
>
> MU：方法区使用大小（KB）
>
> CCSC：压缩类空间大小
>
> CCSU：压缩类空间使用大小
>
> YGC：新生代垃圾回收次数
>
> YGCT：新生代垃圾回收消耗时间
>
> FGC：full gc发生次数
>
> FGCT：full gc消耗时间
>
> GCT：垃圾回收消耗总时间

### gacapacity：统计内存三代（young、old、permanent）及他们空间使用信息

> jstat -gccapacity pid

> NGCMN：新生代最小容量
>
> NGCMX：新生代最大容量
>
> NGC：当前新生代容量
>
> S0C：survivor 0的容量
>
> S1C：survivor 1的容量
>
> EC：Eden的空间容量
>
> OGCMN：老年代最小容量
>
> OGCMX：老年代最大容量
>
> OGC：当前老年代容量
>
> OC: 当前老年代空间大小
>
> MCMN: 永久代最小容量
>
> MCMX：永久代最大容量
>
> MC：当前元数据空间大小
>
> CCSMN：最小压缩类空间大小
>
> CCSMX：最大压缩类空间大小
>
> CCSC：当前压缩类空间大小
>
> YGC：年轻代gc次数
>
> FGC：老年代GC次数

### gcutil：垃圾回收统计

> jstat -gcutil pid 500 10

> S0：survivor 0当前使用比例
>
> S1：survivor 1当前使用比例
>
> E：永久代使用比例
>
> O：老年代使用比例
>
> M：元数据区使用比例
>
> CCS：压缩使用比例
>
> YGC：新生代垃圾回收次数
>
> FGC：老年代垃圾回收次数
>
> FGCT：老年代垃圾回收消耗时间
>
> GCT：垃圾回收消耗总时间

### gccause：垃圾收集统计（与-gcutil相同）的摘要，以及上次和当前（如果适用）垃圾回收事件的cause

> jstat -gccause pid 500 10

> LGCC：上次垃圾回收的cause
>
> GCC：当前垃圾回收的cause

### gcnew：新生代统计

> jstat -gcnew pid 500 10

> S0C：survivor 0的容量大小
>
> S1C：survivor 1的容量大小
>
> S0U：survivor 0的使用大小
>
> S1U：survivor 1的使用大小
>
> TT: 对象在新生代存活的次数
>
> MTT: 对象在新生代存活的最大次数
>
> DSS:期望的survivor大小
>
> EC：Eden的容量大小
>
> EU：Eden的使用大小
>
> YGC：新生代垃圾回收次数
>
> YGCT：新生代垃圾回收消耗时间

### gcnewcapacity：新生代空间大小统计

> jstat -gcnewcapacity pid 500 10

> NGCMN：新生代最小容量
>
> NGCMX：新生代最大容量
>
> NGC：当前新生代容量
>
> S0CMX：最大survivor 0大小
>
> S0C：当前survivor 0大小
>
> S1CMX：最大survivor 1大小
>
> S1C：当前survivor 1大小
>
> ECMX：最大Eden区空间大小
>
> EC：当前Eden区空间大小
>
> YGC：新生代垃圾回收次数
>
> FGC：老年代回收次数

### gcold：老年代和永久代的统计信息

> jstat -gcold pid 500 10

> MC：方法区大小
>
> MU：方法区使用大小
>
> CCSC:压缩类空间大小
>
> CCSU:压缩类空间使用大小
>
> OC：老年代大小
>
> OU：老年代使用大小
>
> YGC：新生代垃圾回收次数
>
> FGC：老年代垃圾回收次数
>
> FGCT：老年代垃圾回收消耗时间
>
> GCT：垃圾回收消耗总时间

### gcoldcapacity：新生代及其空间使用情况

> jstat -gcoldcapacity pid 500 10

> OGCMN：老年代最小容量
>
> OGCMX：老年代最大容量
>
> OGC：当前老年代大小
>
> OC：老年代大小
>
> YGC：新生代垃圾回收次数
>
> FGC：老年代垃圾回收次数
>
> FGCT：老年代垃圾回收消耗时间
>
> GCT：垃圾回收消耗总时间

### gcpermcapacity：永久代容量的使用情况

> PGCMN：perm代中最小容量 (KB)
>
> PGCMX：perm代的最大容量 (KB)  
>
> PGC：perm代当前新生成的容量 (KB)
>
> PC：Perm(持久代)的容量 (KB)
>
> YGC：从应用程序启动到采样时新生代中gc次数
>
> FGC：从应用程序启动到采样时老年代(全gc)gc次数
>
> FGCT：从应用程序启动到采样时老年代(全gc)gc所用时间(s)
>
> GCT：从应用程序启动到采样时gc用的总时间(s)

### printcompilation：hotSpot编译器方法统计

> jstat -printcompilation pid 500 1

> Compiled：最近编译方法的数量
>
> Size：最近编译方法的字节码数量
>
> Type：最近编译方法的编译类型
>
> Method：方法名标识