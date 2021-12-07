---
title: AbstractQueuedSynchronizer相关
---

## AbstractQueuedSynchronizer

> java.util.concurrent包中的大多数同步器实现都是围绕着共同的基础行为，比如等待队列、条件队列、独占获取、共享获取等，而这些行为的抽象就是基于 AbstractQueuedSynchronizer（简称AQS）实现的，AQS是一个抽象同步框架，可以用来实现一个依赖状态的同步器。
>
> 是一个 Java 层面实现的**管程**。

### 特性

- 阻塞等待队列 
- 共享/独占 
- 公平/非公平 
- 可重入 
- 允许中断

### 关键字段

- state：表示资源可用状态，在不同的子类中有不同的含义。
- head ：同步队列头结点
- tail：同步队列尾节点

### 扩展方法

> 需要子类实现。

- isHeldExclusively()：该线程是否正在独占资源。只有用到condition才需要去实现 它。 
- tryAcquire(int)：独占方式。尝试获取资源，成功则返回true，失败则返回false。 
- tryRelease(int)：独占方式。尝试释放资源，成功则返回true，失败则返回false。 
- tryAcquireShared(int)：共享方式。尝试获取资源。负数表示失败；0表示成功，但 没有剩余可用资源；正数表示成功，且有剩余资源。 
- tryReleaseShared(int)：共享方式。尝试释放资源，如果释放后允许唤醒后续等待 结点返回true，否则返回false。

### 队列

#### 节点 node

##### 关键属性

- **waitStatus**：节点状态
  - 0：初始状态，表示当前节点在队列中，等待获取锁
  - **CANCELLED**：1。表示当前线程被取消
  - **SIGNAL**：-1。表示当前节点的后续节点需要被唤醒。
  - **CONDITION**：-2。表示当前节点在等待 condition，即在等待队列中。
  - **PROPAGATE**：-3。表示后续的共享节点可以继续执行。
- prev：前置节点
- next：后置节点
- thread：节点代表的线程
- nextWaiter：等待队列

#### 同步等待队列

> AQS当中的同步等待队列也称CLH队列，CLH队列是Craig、Landin、Hagersten三人发明
> 的一种基于双向链表数据结构的队列，是FIFO先进先出线程等待队列，Java中的CLH队列是原
> CLH队列的一个变种,线程由原自旋机制改为阻塞机制。主要用于维护获取锁失败时入队的线程。

#### 条件等待队列

> 调用`await()`的时候会释放锁，然后线程会加入到条件队列，调用 `signal()`唤醒的时候会把条件队列中的线程节点移动到同步队列中，等待再次获得锁

------

## ReentrantLock

> ReentrantLock是一种基于AQS框架的应用实现，是JDK中的一种线程并发访问的同步手
> 段，它的功能类似于synchronized是一种互斥锁，可以保证线程安全。

### synchronized对比

- 可中断，`lockInterruptibly`可以被中断
- 可设置超时时间
- 可设置为公平锁，`synchronized`只能是非公平锁
- 支持多个等待条件
- 可判断获取锁状态，`isLocked`
- 需要开发者在 finally 中释放锁。`synchronized`会自动释放。

#### ReentrantLock流程图

<iframe id="embed_dom" name="embed_dom" frameborder="0" style="display:block;width:725px; height:245px;" src="https://www.processon.com/embed/61a9d9b10791293428031a40"></iframe>

------

## Condition

> 条件队列，在`ReentrantLock`和`ReentrantReadWriteLock`中使用。
>
> 条件队列仅仅是一个等待队列，获取锁的流程还是在阻塞队列的流程中，即通过子类实现的方法中。
>
> `await` 就是把添加 `node` 节点到条件队列中去，`signal` 就是把 `node` 节点从条件队列移入到等待队列中。

#### 条件等待队列流程图

<iframe id="embed_dom" name="embed_dom" frameborder="0" style="display:block;width:725px; height:245px;" src="https://www.processon.com/embed/61a9f25f63768928167810f6"></iframe>

------

## Semaphore

> 用来控制同时访问特定资源的线程数量，通过协调各个线程，以保证合理的使用资源。
>
> 常见于限流，资源池等。
>
> 是 aqs 的一个简单实现。

#### 信号量流程图

<iframe id="embed_dom" name="embed_dom" frameborder="0" style="display:block;width:725px; height:245px;" src="https://www.processon.com/embed/61add0830791296ac4dcf645"></iframe>

------

## CountDownLatch

> 是一个同步协助类，允许一个或多个线程等待，直到其他线程完成操作集。
>
> 简单来说就是开始设置一个值，通过`countDown`进行减一操作，到 0 的时候所有通过`await`进行等待的线程全部开始执行。

#### CountDownLatch与Thread.join的区别

- CountDownLatch的作用就是允许一个或多个线程等待其他线程完成操作，看起来有点类似join() 方法，但其提供了比 join() 更加灵活的API。
-  CountDownLatch可以手动控制在n个线程里调用n次countDown()方法使计数器进行减一操作，也可以在一个线程里调用n次执行减一操作。
-   join() 的实现原理是不停检查join线程是否存活，如果 join 线程存活则让当前线程永远等待。所以两者之间相对来说还是CountDownLatch使用起来较为灵活。

#### CountDownLatch与CyclicBarrier的区别

-  `CountDownLatch`的计数器只能使用一次，而`CyclicBarrier`的计数器可以使用`reset()` 方法重置。所以`CyclicBarrier`能处理更为复杂的业务场景，比如如果计算发生错误，可以重置计数器，并让线程们重新执行一次

-  `CyclicBarrier`还提供`getNumberWaiting`(可以获得`CyclicBarrier`阻塞的线程数量)、 `isBroken`(用来知道阻塞的线程是否被中断)等方法。

- `CountDownLatch`和`CyclicBarrier`都能够实现线程之间的等待，只不过它们侧重点不 同。`CountDownLatch`一般用于一个或多个线程，等待其他线程执行完任务后，再执行。`CyclicBarrier`一般用于一组线程互相等待至某个状态，然后这一组线程再同时执 行。

-  `CyclicBarrier` 还可以提供一个 `barrierAction`，合并多线程计算结果。
-  `CyclicBarrier`是通过`ReentrantLock`的"独占锁"和`Conditon`来实现一组线程的阻塞唤 醒的，而`CountDownLatch`则是通过`AQS`的“共享锁”实现

------

## CyclicBarrier

> 翻译为循环屏障或回环栅栏。通过它可以实现让一组线程等待至某个状态（屏障点）之后再全部同时执行。叫做回环是因为当所有等待线程都被释放以后，CyclicBarrier可以被**重用**。

#### 主要属性

- lock：除`getParties`外所有操作都需要持有该锁
- trip：等待条件，除最后一个任务外都会`trip.await()`进行等待
- parties：等待的线程数量
- barrierCommand：最后一个到达的线程会执行该任务（有的话），执行完才放行
- Generation：屏障实例，每一次都是一个新的。
- count：剩余需要阻塞的线程数量

#### 循环屏障流程图

<iframe id="embed_dom" name="embed_dom" frameborder="0" style="display:block;width:725px; height:245px;" src="https://www.processon.com/embed/61aec9dd0e3e74014814eb94"></iframe>

------

## ReentrantReadWriteLock