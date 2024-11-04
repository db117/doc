---
title: JDK 中的 buffer 体系
---



## NIO 对 Buffer 的顶层抽象

> 本质上是一块内存，可以简单的理解为一个数组。
>
> Java 中一共有八种基本类型，JDK NIO 也为这八种基本类型分别提供了其对应的 Buffer 类（除了Boolean）。

#### 关键属性

- capacity
  - 容量
- position
  - 下一个可以操作的位置，写模式下是下一个写入的位置。读模式下是下一个读的位置
- limit
  - 可操作的上限
- mark
  - 标记一个`position`，可以使用`reset`还原

#### 数据储存方式

- HeapBuffer
  - 在堆中有个数组
- DirectBuffer
  - 在堆外内存中分配
- MappedBuffer
  - 通过内存文件映射将文件中的内容直接映射到堆外内存中，其本质也是一个 `DirectBuffer`

#### 主要方法

- flip
  - 切换到读模式
  - `limit` 的上限为下一个要写入的位置
  - `position`设置为 0 。这样使得我们可以从头开始读取 `Buffer` 中写入的数据。
- clear
  - 切换到写模式
  - 属性回到初始模式
  - 如果数据未读取，则会覆盖
- compact
  - 切换到读模式
  - 与`clear`的区别主要是保留未读取的数据，`HeapByteBuffer` 中是把数据移动到最左端
- rewind
  - 重新读取数据
  - `position` 的值重新设置为 0，并丢弃 `mark`



## Buffer 具体实现

>其他的Buffer实现都是基于 ByteBuffer 的。





#### 主要方法

- slice
  - 创建出来的 `ByteBuffer` 视图内容是从原生 `ByteBufer` 的当前位置 `position` 开始一直到 `limit` 之间的数据。也就是说创建出来的视图里边的数据是原生 `ByteBuffer` 中还未处理的数据部分

- duplicate
  - 相当于就是完全复刻原生 `ByteBuffer`。它们的 `offset`，`mark`，`position`，`limit`，`capacity` 变量的值全部是一样的，这里需要注意虽然值是一样的，但是它们各自之间是相互独立的。用于对同一字节数组做不同的逻辑处理。

#### 读写相关操作

```
//从ByteBuffer中读取一个字节的数据，随后position的位置向后移动一位
 public abstract byte get();

 //向ByteBuffer中写入一个字节的数据，随后position的位置向后移动一位
 public abstract ByteBuffer put(byte b);

 //按照指定index从ByteBuffer中读取一个字节的数据，position的位置保持不变
 public abstract byte get(int index);

 //按照指定index向ByteBuffer中写入一个字节的数据，position的位置保持不变
 public abstract ByteBuffer put(int index, byte b);
```





## 参考

https://mp.weixin.qq.com/s?__biz=Mzg2MzU3Mjc3Ng==&mid=2247485497&idx=1&sn=eb4afe6764b2b976fb80f6dc5c6fd68a&chksm=ce77ce7ef900476865864e09bb6f0688ca784afc396084ecc90a894bfd733692049c332edd11&token=927203489&lang=zh_CN&scene=21#wechat_redirect