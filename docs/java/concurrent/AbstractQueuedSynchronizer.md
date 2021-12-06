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