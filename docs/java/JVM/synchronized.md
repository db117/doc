---
title: synchronized
---

> 加锁目的：**序列化访问临界资源**，即同一时刻只能有一个线程访问临界资源(**同步互斥访问**)
>
> `synchronized`内置锁是一种对象锁(锁的是对象而非引用)，作用粒度是对象，可以用来实现对临界资源的同步互斥访问，是可重入的。

### 使用

加锁的方式

- 同步实例方法，锁是当前实例对象

- 同步类方法，锁是当前类对象

- 同步代码块，锁是括号里面的对象

### 原理

> **synchronized是基于JVM**内置锁实现，通过内部对象**Monitor**(监视器锁)实现，基于进入与退出**Monitor**对象实现方法与代码块同步，监视器锁的实现依赖底层操作系统的**Mutex lock**（互斥锁）实现，它是一个重量级锁性能较低。当然，**JVM内置锁在1.5之后版本做了重大的优化，**如锁粗化（Lock Coarsening）、锁消除（Lock Elimination）、轻量级锁（Lightweight Locking）、偏向锁（Biased Locking）、适应性自旋（Adaptive Spinning）等技术来减少锁操作的开销，，内置锁的并发性能已经基本与Lock持平。
>
> synchronized关键字被编译成字节码后会被翻译成monitorenter 和 monitorexit 两条指令分别在同步块逻辑代码的起始位置与结束位置。

#### Monitor

>  **任何一个对象都有一个Monitor与之关联，当且一个Monitor被持有后，它将处于锁定状态**。Synchronized在JVM里的实现都是 **基于进入和退出Monitor对象来实现方法同步和代码块同步**，虽然具体实现细节不一样，但是都可以通过成对的MonitorEnter和MonitorExit指令来实现。

- **monitorenter**：每个对象都是一个监视器锁（monitor）。当monitor被占用时就会处于锁定状态，线程执行monitorenter指令时尝试获取monitor的所有权，过程如下：

- 1. **如果monitor的进入数为0**，则该线程进入monitor，然后将进入数设置为1，该线程即为monitor的所有者；
  2. **如果线程已经占有该monitor**，只是重新进入，则进入monitor的进入数加1；
  3. **如果其他线程已经占用了monitor**，则该线程进入阻塞状态，直到monitor的进入数为0，再重新尝试获取monitor的所有权；

- **monitorexit**：执行monitorexit的线程必须是objectref所对应的monitor的所有者。**指令执行时，monitor的进入数减1，如果减1后进入数为0，那线程退出monitor，不再是这个monitor的所有者**。其他被这个monitor阻塞的线程可以尝试去获取这个 monitor 的所有权。

- **ACC_SYNCHRONIZED**：方法的同步并没有通过指令 **monitorenter** 和 **monitorexit** 来完成（理论上其实也可以通过这两条指令来实现），不过相对于普通方法，其常量池中多了 **ACC_SYNCHRONIZED** 标示符。**JVM就是根据该标示符来实现方法的同步的**：

  当方法调用时，**调用指令将会检查方法的 ACC_SYNCHRONIZED 访问标志是否被设置**，如果设置了，**执行线程将先获取monitor**，获取成功之后才能执行方法体，**方法执行完后再释放monitor**。在方法执行期间，其他任何线程都无法再获得同一个monitor对象。

### ObjectMonitor

>  **每一个Java对象自打娘胎里出来就带了一把看不见的锁，它叫做内部锁或者Monitor锁**。
>
> [源码](https://github.com/openjdk/jdk/blob/e92e2fd4e0bc805d8f7d70f632cce0282eb1809b/src/hotspot/share/runtime/objectMonitor.hpp)

`ObjectWaiter`结构

```
// 对所有需要进入的线程进行封装
class ObjectWaiter : public StackObj {
 public:
  enum TStates { TS_UNDEF, TS_READY, TS_RUN, TS_WAIT, TS_ENTER, TS_CXQ };// 线程状态
  ObjectWaiter* volatile _next;		// 下一个等待对象
  ObjectWaiter* volatile _prev;   // 上一个等待对象
  JavaThread*   _thread;					// 线程
  uint64_t      _notifier_tid;
  ParkEvent *   _event;
  volatile int  _notified;
  volatile TStates TState;					// 线程状态
  bool          _active;           // Contention monitoring is enabled
 public:
  ObjectWaiter(JavaThread* current);

  void wait_reenter_begin(ObjectMonitor *mon);
  void wait_reenter_end(ObjectMonitor *mon);
};
```
`ObjectMonitor`主要结构

```
class ObjectMonitor : public CHeapObj<mtInternal> {
  friend class ObjectSynchronizer;
  friend class ObjectWaiter;
  friend class VMStructs;
  JVMCI_ONLY(friend class JVMCIVMStructs;)


  volatile markWord _header;    		// 对象头
  WeakHandle _object;               // 锁不是平白出现的，而是寄托存储于对象中。
  void* volatile _owner;            // 指向所属线程或栈锁的指针
  volatile uint64_t _previous_owner_tid;  // 上一个拥有当前锁的线程id
  ObjectMonitor* _next_om;          	// Next ObjectMonitor* linkage
  volatile intx _recursions;        	// 递归次数
  ObjectWaiter* volatile _EntryList;  // 处于等待锁block状态的线程，会被加入到entry set；

  ObjectWaiter* volatile _cxq;      // LL of recently-arrived threads blocked on entry.
  JavaThread* volatile _succ;       // Heir presumptive thread - used for futile wakeup throttling
  int _contentions;                 // 竞争数量

```

### 对象头

> 所有对象都有的。主要包含锁状态，以及hash值，gc信息
>
> [源码](https://github.com/openjdk/jdk/blob/e92e2fd4e0bc805d8f7d70f632cce0282eb1809b/src/hotspot/share/oops/markWord.hpp)



|          | 25bit                | 4bit     | 1bit                       | 2bit     |
| -------- | -------------------- | -------- | -------------------------- | -------- |
| 锁状态   |                      | 分代年龄 | 是否偏向锁（是否禁用偏向） | 锁标志位 |
| 无锁态   | 对象的hashCode       |          | 0                          | 01       |
| 轻量级锁 | 指向栈中锁记录的指针 |          |                            | 00       |
| 重量级锁 | 指向Monitor的指针    |          |                            | 10       |
| GC标记   | 空                   |          |                            | 11       |
| 偏向锁   | 线程ID/Epoch(2bit)   |          | 1                          | 01       |

**对象头分析工具**

> 分析java对象的工具包
>
> [OpenJDK: jol (java.net)](https://openjdk.java.net/projects/code-tools/jol/)
>
> [github.com](https://github.com/openjdk/jol)

### 锁升级

> 锁的状态总共有四种，无锁状态、偏向锁、轻量级锁和重量级锁。随着锁的竞争，锁可以从偏向锁升级到轻量级锁，再升级的重量级锁，但是锁的升级是单向的，也就是说只能从低到高升级，不会出现锁的降级。

**偏向锁**

> 为了减少同一线程获取锁(会涉及到一些CAS操作,耗时)的代价而引入偏向锁。偏向锁的核心思想是，如果一个线程获得了锁，那么锁就进入偏向模式，此时Mark Word 的结构也变为偏向锁结构，当这个线程再次请求锁时，无需再做任何同步操作，即获取锁的过程，这样就省去了大量有关锁申请的操作，从而也就提供程序的性能。所以，对于没有锁竞争的场合，偏向锁有很好的优化效果，毕竟极有可能连续多次是同一个线程申请相同的锁。但是对于锁竞争比较激烈的场合，偏向锁就失效了，因为这样场合极有可能每次申请锁的线程都是不相同的，因此这种场合下不应该使用偏向锁，否则会得不偿失，需要注意的是，偏向锁失败后，并不会立即膨胀为重量级锁，而是先升级为轻量级锁。

- JDK 1.6 开始默认开启偏向锁
- 在jdk15中偏向锁默认关闭

- 开启偏向锁：`-XX:+UseBiasedLocking`  

- 关闭偏向锁：`-XX:-UseBiasedLocking`
- 偏向锁生效时间：`-XX:BiasedLockingStartupDelay=5`

**轻量级锁**

> 倘若偏向锁失败，虚拟机并不会立即升级为重量级锁，它还会尝试使用一种称为轻量级锁的优化手段(1.6之后加入的)，此时Mark Word 的结构也变为轻量级锁的结构。轻量级锁能够提升程序性能的依据是“对绝大部分的锁，在整个同步周期内都不存在竞争”，注意这是经验数据。需要了解的是，轻量级锁所适应的场景是线程交替执行同步块的场合，如果存在同一时间访问同一锁的场合，就会导致轻量级锁膨胀为重量级锁。

**自旋锁**

轻量级锁失败后，虚拟机为了避免线程真实地在操作系统层面挂起，还会进行一项称为自旋锁的优化手段。这是基于在大多数情况下，线程持有锁的时间都不会太长，如果直接挂起操作系统层面的线程可能会得不偿失，毕竟操作系统实现线程之间的切换时需要从用户态转换到核心态，这个状态之间的转换需要相对比较长的时间，时间成本相对较高，因此自旋锁会假设在不久将来，当前的线程可以获得锁，因此虚拟机会让当前想要获取锁的线程做几个空循环(这也是称为自旋的原因)，一般不会太久，可能是50个循环或100循环，在经过若干次循环后，如果得到锁，就顺利进入临界区。如果还不能获得锁，那就会将线程在操作系统层面挂起，这就是自旋锁的优化方式，这种方式确实也是可以提升效率的。最后没办法也就只能升级为重量级锁了。

**锁消除**

消除锁是虚拟机另外一种锁的优化，这种优化更彻底，Java虚拟机在JIT编译时(可以简单理解为当某段代码即将第一次被执行时进行编译，又称即时编译)，通过对运行上下文的扫描，去除不可能存在共享资源竞争的锁，通过这种方式消除没有必要的锁，可以节省毫无意义的请求锁时间，如下StringBuffer的append是一个同步方法，但是在add方法中的StringBuffer属于一个局部变量，并且不会被其他线程所使用，因此StringBuffer不可能存在共享资源竞争的情景，JVM会自动将其锁消除。**锁消除的依据是逃逸分析的数据支持。**

锁消除，前提是java必须运行在server模式（server模式会比client模式作更多的优化），同时必须开启逃逸分析

:-XX:+DoEscapeAnalysis 开启逃逸分析

-XX:+EliminateLocks 表示开启锁消除。

**逃逸分析**

使用逃逸分析，编译器可以对代码做如下优化：

一、同步省略。如果一个对象被发现只能从一个线程被访问到，那么对于这个对象的操作可以不考虑同步。

二、将堆分配转化为栈分配。如果一个对象在子程序中被分配，要使指向该对象的指针永远不会逃逸，对象可能是栈分配的候选，而不是堆分配。

三、分离对象或标量替换。有的对象可能不需要作为一个连续的内存结构存在也可以被访问到，那么对象的部分（或全部）可以不存储在内存，而是存储在CPU寄存器中。

是不是所有的对象和数组都会在堆内存分配空间？

**不一定**

在Java代码运行时，通过JVM参数可指定是否开启逃逸分析， -XX:+DoEscapeAnalysis ： 表示开启逃逸分析 -XX:-DoEscapeAnalysis ： 表示关闭逃逸分析。从jdk 1.7开始已经默认开启逃逸分析，如需关闭，需要指定-XX:-DoEscapeAnalysis