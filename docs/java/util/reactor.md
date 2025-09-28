---
title: Reactor
---

> https://projectreactor.io/
>
> https://github.com/reactor



## 创建序列

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

