---
title: 线程池
---

### 线程池流程图

<iframe id="embed_dom" name="embed_dom" frameborder="0" style="display:block;width:725px; height:245px;" src="https://www.processon.com/embed/619f50e40e3e743d103b520d"></iframe>

<iframe id="embed_dom" name="embed_dom" frameborder="0" style="display:block;width:725px; height:245px;" src="https://www.processon.com/embed/61a48efa1efad425fd73dce4"></iframe>

### 关键属性

- ctl

  > 使用高 2 位保存线程池运行状态，低 29 为保存运行线程数

- workQueue

  > 工作队列，保存需要运行的线程

- mainLock

  > 主锁，在修改一下核心属性是需要持有该锁

- largestPoolSize

  > 达到的最大线程数量，访问需要持有 `mainLock`

- completedTaskCount

  > 完成任务的计数器。访问需要持有 `mainLock`

- threadFactory

  > 线程工厂

- handler

  > 添加任务失败，或者强制结束线程是调用

- keepAliveTime

  > 工作线程允许空闲时间

- allowCoreThreadTimeOut

  > 是否允许核心线程超时，默认 false

- corePoolSize

  > 核心线程数量

- maximumPoolSize

  > 最大线程数量

### 常用方法

- shutdown

  > 结束线程池，但会执行完已提交的任务。不会接收新任务。

- shutdownNow

  > 结束线程池，不会执行队列中的任务。并对所有工作线程进行中断。

- allowCoreThreadTimeOut

  > 设置是否允许核心线程超时关闭

- getActiveCount

  > 获取工作线程数量

- getLargestPoolSize

  > 获取最大的工作线程数量

- getTaskCount

  > 获取执行的任务数量，包括执行中的。是一个近似值。

- getCompletedTaskCount

  > 获取已完成的任务数量。不包含运行中的。也是一个近似值。

- beforeExecute

  > 每一个任务执行前调用的方法，可以通过子类实现。

- afterExecute

  > 每一个任务执行后调用的方法，可以通过子类实现。

- prestartAllCoreThreads

  > 启动所有核心线程

- prestartCoreThread

  > 启动一个核心线程

- ensurePrestart

  > 和`prestartCoreThread`一样，不过核心线程数为 0 是也会启动一个线程。

- purge

  > 取消掉所有以结束的任务

### ScheduledThreadPoolExecutor

> 定时调度的线程池，继承与`ThreadPoolExecutor`。通过重写`submit`，`execute`等方法，并实现私有的`BlockingQueue`：`java.util.concurrent.ScheduledThreadPoolExecutor.DelayedWorkQueue`。把所有的的任务都包装成`java.util.concurrent.ScheduledThreadPoolExecutor.ScheduledFutureTask`来进行统一管理。

#### ScheduledFutureTask

> 封装所有的任务，进行统一的调度。

##### 主要属性

- sequenceNumber：在创建任务是生成的序列号，在执行时间一致时来决定执行顺序
- time：执行时间，用来进行排序，决定执行顺序。
- period：周期。大于 0 时为固定速率，等于 0 时为非周期任务，小于 0 是为固定延迟执行。
- heapIndex：在队列`DelayedWorkQueue`的索引，用来快速取消。

##### 主要函数

- compareTo：执行顺序的关键，通过对比`time`，`sequenceNumber`进行比较。
- getDelay：返回剩余的延迟，0 或负数则表示已经过去。
- **run**：核心函数，如果是周期任务则在执行完后重新设置下次执行的时间，并把当前任务加入到队列中。

#### DelayedWorkQueue

> 一个私有的无界阻塞队列，针对 ScheduledThreadPool 进行特殊处理。主要表现在获取数据时通过`ScheduledFutureTask#getDelay`来处理。

##### 主要属性

- leader：下一个任务执行的线程。只有该线程是延时阻塞，其他线程都是无限期等待。在获取完任务后会唤醒一个等待的线程。
- available：一个条件信号，在leader发生变更时会发出条件信号。

##### 主要函数

- take：获取任务，获取不到无限等待。在当前线程不用回收是，线程池通过该方法获取任务。
- poll：获取任务，获取不到超时等待。在当前线程可以被回收是，通过该方法获取任务。
- offer：添加任务。设置`ScheduledFutureTask#heapIndex`，**并唤醒一个线程获取任务**。

#### 主要函数

- decorateTask：可以通过子类来修改运行的任务。
- delayedExecute：延时执行任务。
- schedule：添加任务，把任务都包装成`RunnableScheduledFuture`放入到延时队列中。
