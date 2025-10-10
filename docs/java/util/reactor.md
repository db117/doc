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
Flux.flatMap();flatMapSequential 
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
```

