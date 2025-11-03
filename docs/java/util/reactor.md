---
title: Reactor
---

> https://projectreactor.io/
>
> https://github.com/reactor



### 创建序列

```
# 生成固定的序列
Flux.just(1, 2, 3);
Flux.range(1, 12);
Flux.from();
Flux.fromArray();
Flux.fromStream();
Flux.fromIterable();

# 从 1 生成到 10
Flux.<Integer, Integer>generate(() -> 1, (s, o) -> {
			if (s < 11) {
				o.next(s);
			}
			else {
				o.complete();
			}
			return s + 1;
		});
		
# 按照时间间隔生成
Flux.interval(Duration.ofMillis(100), Duration.ofMillis(100), Schedulers.newSingle("interval-test"))
      .take(5, false)
      .map(v -> System.currentTimeMillis())
      .subscribe(ts);

# 通过回到方法生成
Flux.create(sink -> {
			    sink.next("1");
			    sink.next("2");
			    sink.complete();
		    });
```



### 改变序列

```
# 1 变 1
# 直接转换对象
Flux.map();
# 强转转换对象，如果不能转就报错
Flux.cast();
# 给每一个数据添加一个索引
Flux.index();

# 1 变 多
# 把一个元素变成另一个元素序列
Flux.flatMap(); 
# 把一个元素变成另一个元素序列（按照顺序来）
Flux.flatMapSequential(); 
# 直接消费元素以及一个SynchronousSink。可以做各种操作
Flux.handle();


# 拼接序列
# 把一个序列加到当前序列前面
Flux.startWith();
# 把一个序列加到当前序列后面
Flux.concatWithValues();

# 聚合序列
# 聚合成一个 list
collectList();
collectSortedList();
# 分组聚合
collectMap();
collectMultiMap();
# 给一个初始数据，一个转换方法聚合成一个对象
reduce();
# 聚合成一个 Boolean
all();# 全部元素都满足
any();# 任意一个元素满足
hasElement();# 包含指定元素

# 合并序列
# 简单合并两个序列，不阻塞排序
merge();
# 按照顺序合并序列
mergeSequential();
# 组和序列，对不同序列的元素进行配对
zip();

# 把一个元素转换成一个序列
expand();
```

### 查看序列

```
# 每一个元素都查看
doOnNext();
# 完成后调用
doOnComplete();
# 出现异常后调用
doOnError();
# 取消后调用
doOnCancel();
# 第一个元素触发
doFirst();
doOnSubscribe();
# request 时触发
doOnRequest();
# 结束后触发，正常和异常都会调用但是取消不会。
doOnTerminate();
# 消费一个 single 对象。可以根据元素状态进行处理
doOnEach();
# 结束都会调用
doFinally();
```

### 过滤元素

```
# 同步过滤元素
filter();
# 异步过滤元素
filterWhen();
# 过滤指定类型的元素
ofType();
# 忽略元素
ignoreElements();
# 去重元素
distinct();
# 去掉连续相同的元素
distinctUntilChanged();
# 获取一定数量或时间的元素
take();
# 获取最后一个元素
takeLast();
# 获取直到返回 true。（换返回第一个为 true 的元素）
takeUntil();
# 获取直到返回 false（不返回第一个为 false 的元素）
takeWhile();
# 获取第多少元素
elementAt();
# 跳过多少个或多长时间
skip();
# 跳过直到返回 true 为止（最后一个返回 false 的不会包含在内）
skipUntil();
# 跳过直到返回 false 为止（最后一个返回 true 的不会包含在内）
skipWhile();
# 周期内的最后一个元素
sample();
```

### 处理异常

```
# 触发异常
# 直接发出一个异常
error();
# 拼接一个异常
.concat(Flux.error(e))();
.then(Mono.error(e))();
# 超时异常
timeout();

# 异常后处理
# 异常后返回指定数据
onErrorReturn();
# 异常后转为完成，相当于 catch
onErrorComplete();
# 异常后转为另一个流
onErrorResume();
# 转本异常类型
onErrorMap();
# 重试
retry();
retryWhen();
```

### 拆分流

```
# 按照窗口大小，或时间进行拆分
window();
# 满足条件就分组 
windowUntil():
# 按照数量分组，如果超时也分组
windowTimeout():
# 满足条件就分租
windowWhile ():

# 按照数量或时间分成集合
buffer():
# 按照数量分成集合，如果超时也分成集合
bufferTimeout():
# 按照条件分集合
bufferUntil():
bufferWhile():
```

