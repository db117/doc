---
title: 线程池
---

### 线程池流程图

<iframe id="embed_dom" name="embed_dom" frameborder="0" style="display:block;width:725px; height:245px;" src="https://www.processon.com/embed/619f50e40e3e743d103b520d"></iframe>

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
