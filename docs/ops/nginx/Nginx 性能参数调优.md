# Nginx 性能参数调优

## 工作线程数量

worker_processes number;
每个worker进程都是单线程的进程，它们会调用各个模块以实现多种多样的功能。如果这些模块确认不会出现阻塞式的调用，那么，有多少CPU内核就应该配置多少个进程；反之，如果有可能出现阻塞式调用，那么需要配置稍多一些的worker进程。例如，如果业务方面会致使用户请求大量读取本地磁盘上的静态资源文件，而且服务器上的内存较小，以至于大部分的请求访问静态资源文件时都必须读取磁盘（磁头的寻址是缓慢的），而不是内存中的磁盘缓存，那么磁盘I/O调用可能会阻塞住worker进程少量时间，进而导致服务整体性能下降。

## 每个worker 进程的最大连接数

**语法**：worker_connections number;
**默认**：worker_connections 1024



## 绑定Nginx worker进程到指定的CPU内核

**worker_cpu_affinity cpumask[cpumask……]**

为什么要绑定worker进程到指定的CPU内核呢？假定每一个worker进程都是非常繁忙的，如果多个worker进程都在抢同一个CPU，那么这就会出现同步问题。反之，如果每一个worker进程都独享一个CPU，就在内核的调度策略上实现了完全的并发。
例如，如果有4颗CPU内核，就可以进行如下配置：
worker_processes 4;
worker_cpu_affinity 1000 0100 0010 0001;
注意 worker_cpu_affinity配置仅对Linux操作系统有效。

## Nginx worker 进程优先级设置

**语法**：worker_priority nice;
**默认**：worker_priority 0;
优先级由静态优先级和内核根据进程执行情况所做的动态调整（目前只有±5的调整）共同决定。nice值是进程的静态优先级，它的取值范围是–20～+19，–20是最高优先级，+19是最低优先级。因此，如果用户希望Nginx占有更多的系统资源，那么可以把nice值配置得更小一些，但不建议比内核进程的nice值（通常为–5）还要小

## Nginx worker进程可以打开的最大句柄描述符个数

**语法**： worker_rlimit_nofile limit;
**默认：**空
更改worker进程的最大打开文件数限制。如果没设置的话，这个值为操作系统的限制。设置后你的操作系统和Nginx可以处理比“ulimit -a”更多的文件，所以把这个值设高，这样nginx就不会有“too many open files”问题了。

## 是否打开accept锁

**语法**：accept_mutex[on|off]
**默认**：accept_mutext on;
accept_mutex是Nginx的负载均衡锁，当某一个worker进程建立的连接数量达到worker_connections配置的最大连接数的7/8时，会大大地减小该worker进程试图建立新TCP连接的机会，accept锁默认是打开的，如果关闭它，那么建立TCP连接的耗时会更短，但worker进程之间的负载会非常不均衡，因此不建议关闭它。

## 使用accept锁后到真正建立连接之间的延迟时间

语法：accept_mutex_delay Nms; 
默认：accept_mutex_delay 500ms; 
在使用accept锁后，同一时间只有一个worker进程能够取到accept锁。这个accept锁不是堵塞锁，如果取不到会立刻返回。如果只有一个worker进程试图取锁而没有取到，他至少要等待accept_mutex_delay定义的时间才能再次试图取锁。

