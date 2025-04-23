---
title: caffeine
---

>一个 Java 缓存工具包
>
>https://github.com/ben-manes/caffeine

## 流程图

<iframe id="embed_dom" name="embed_dom" frameborder="0" style="display:block;width:725px; height:300px;" src="https://www.processon.com/embed/67ff8ff63c3a8606fa5df26d?cid=67ff8ff63c3a8606fa5df270"></iframe>

## 核心

- 数据使用 ConcurrentHashMap 保存，读取数据直接操作这个 map。
- 把数据分成 3 个区，对于 3 个队列。分区变更就是节点在这三个队列中转移。
- 每次读取数据后会向`读/写缓存`中写入数据。
- 每次操作后都会调用`BoundedLocalCache#maintenance`
  - 处理`读/写缓存`中的事件
  - 维护各种队列
  - 根据驱逐策略驱逐元素
- `FrequencySketch`频率草图
  - 它的实现原理和布隆过滤器类似，牺牲了部分准确性，但减少了占用内存的大小
  - 使用一个long[] 来记录频率，对结点进行 Hash。对对应的 slot 进行操作