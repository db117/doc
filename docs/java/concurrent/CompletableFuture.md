---
title: CompletableFuture
---

## 概述

`CompletableFuture`是对Future的扩展和增强。`CompletableFuture`实现了Future接口，并在此基础上进行了丰富的扩展，完美弥补了Future的局限性，同时`CompletableFuture`实现了对任务编排的能力。借助这项能力，可以轻松地组织不同任务的运行顺序、规则以及方式。`CompletionStage`接口定义了任务编排的方法，执行某一阶段，可以向下执行后续阶段。

- 默认线程池是`ForkJoinPool.commonPool()`，使用的时候最好使用自定义的线程池。
- 方法中没有带`async`的会有相同的线程执行，否则会在线程池里面执行。



## 功能

### 常用方法

依赖关系

- `thenApply()`：把前面任务的执行结果，交给后面的Function
- `thenCompose()`：用来连接两个有依赖关系的任务，结果由第二个任务返回

and集合关系

- `thenCombine()`：合并任务，有返回值
- `thenAccepetBoth()`：两个任务执行完成后，将结果交给`thenAccepetBoth`处理，无返回值
- `runAfterBoth()`：两个任务都执行完成后，执行下一步操作(Runnable类型任务)

or聚合关系

- `applyToEither()`：两个任务哪个执行的快，就使用哪一个结果，有返回值
- `acceptEither()`：两个任务哪个执行的快，就消费哪一个结果，无返回值
- `runAfterEither()`：任意一个任务执行完成，进行下一步操作(Runnable类型任务)

并行执行

- `allOf()`：当所有给定的 `CompletableFuture` 完成时，返回一个新的 `CompletableFuture`
- `anyOf()`：当任何一个给定的`CompletablFuture`完成时，返回一个新的`CompletableFuture`

结果处理

- `whenComplete`：当任务完成时，将使用结果(或 null)和此阶段的异常(或 null如果没有)执行给定操作
- `exceptionally`：返回一个新的`CompletableFuture`，当前面的`CompletableFuture`完成时，它也完成，当它异常完成时，给定函数的异常触发这个`CompletableFuture`的完成



### 异步操作

如果指定了线程池这使用指定的线程池，不然就用`ForkJoinPool.commonPool()`

```text
// 没有返回值
public static CompletableFuture<Void> runAsync(Runnable runnable)
public static CompletableFuture<Void> runAsync(Runnable runnable, Executor executor)
// 有返回值
public static <U> CompletableFuture<U> supplyAsync(Supplier<U> supplier)
public static <U> CompletableFuture<U> supplyAsync(Supplier<U> supplier, Executor executor)
```



### 获取结果

```
// get 方法需要用户处理异常
get(long timeout, TimeUnit unit)
get()

join()
```



### 结果处理

```
// 任务结束了进行处理
public CompletableFuture<T> whenComplete(BiConsumer<? super T,? super Throwable> action)
public CompletableFuture<T> whenCompleteAsync(BiConsumer<? super T,? super Throwable> action)
public CompletableFuture<T> whenCompleteAsync(BiConsumer<? super T,? super Throwable> action, Executor executor)

// 有异常了进行处理，返回一个对象
public CompletableFuture<T> exceptionally(Function<Throwable, ? extends T> fn)
public CompletableFuture<T> exceptionallyAsync(Function<Throwable, ? extends T> fn)
public CompletableFuture<T> exceptionallyAsync(Function<Throwable, ? extends T> fn, Executor executor)

// 有异常了处理成一个 CompletableFuture
public CompletableFuture<T> exceptionallyCompose(Function<Throwable, ? extends CompletionStage<T>> fn)
public CompletableFuture<T> exceptionallyComposeAsync(Function<Throwable, ? extends CompletionStage<T>> fn)
public CompletableFuture<T> exceptionallyComposeAsync(Function<Throwable, ? extends CompletionStage<T>> fn,Executor executor)
```



## 使用场景

### 异步任务

```
CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
    // 执行耗时的网络请求
    return performNetworkRequest();
});

future.thenApply(result -> {
    // 对结果进行处理
    return processResult(result);
}).thenAccept(finalResult -> {
    // 执行最终的结果处理
    System.out.println("Final result: " + finalResult);
});

String result = future.get(); // 阻塞等待任务完成并获取结果
```

### 并行任务的执行

```
CompletableFuture<String> request1 = CompletableFuture.supplyAsync(() -> performNetworkRequest1());
CompletableFuture<String> request2 = CompletableFuture.supplyAsync(() -> performNetworkRequest2());
CompletableFuture<String> request3 = CompletableFuture.supplyAsync(() -> performNetworkRequest3());

CompletableFuture<Void> allRequests = CompletableFuture.allOf(request1, request2, request3);

allRequests.thenRun(() -> {
    // 所有请求完成后执行汇总或处理
    String result1 = request1.join();
    String result2 = request2.join();
    String result3 = request3.join();
    // 处理结果
});
```

### 异常处理和容错机制

```
CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
    // 可能会抛出异常的任务
    if (someCondition) {
        throw new RuntimeException("An error occurred");
    }
    return "Success";
});

future.exceptionally(ex -> {
    // 处理异常情况
    System.out.println("Exception: " + ex.getMessage());
    return "Default value";
});

future.handle((result, ex) -> {
    // 处理结果和异常
    if (ex != null) {
        System.out.println("Exception: " + ex.getMessage());
        return "Default value";
    } else {
        return result;
    }
});
```

### 替代 `java.util.concurrent.CountDownLatch` 的功能

```
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

public class CompletableFutureCountDownLatchExample {
    public static void main(String[] args) throws InterruptedException {
        int taskCount = 5;

        CompletableFuture<Void> latchFuture = new CompletableFuture<>();

        for (int i = 0; i < taskCount; i++) {
            int taskId = i;
            CompletableFuture.runAsync(() -> {
                // 执行任务
                System.out.println("Task " + taskId + " started");
                try {
                    // 模拟任务执行时间
                    TimeUnit.SECONDS.sleep(2);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                System.out.println("Task " + taskId + " completed");
            });
        }

        latchFuture.thenRun(() -> {
            // 所有任务完成后执行的操作
            System.out.println("All tasks completed");
        });

        // 等待所有任务完成
        latchFuture.join();
    }
}
```

