---
title: 线上问题分析
---

### CUP 过高

```
# 找出进程 id
top 	# 找最高的
jps   	# 直接找 Java 进程

# 找线程 ID
top -Hp 进程ID

#　把线程ID转换为16进制
printf "%x\n"  PID

# 查询线程　
jstack PID
jstack PID | grep <进程id 16进制>

```

### 内存问题

```
# 　查看进程中的内存映像信息
jmap pid
#　显示 Java 堆详细信息
jmap -heap pid

jmap -histo pid
```

### GC信息

```
# 查看 GC 信息
jstat -gc pid
```



#### 查看某个进程的PID

如查看java的进程的pid，`ps -ef | grep java`:

```
[root@localhost ~]# ps -ef | grep java
root     124146   1984  0 09:13 pts/0    00:00:06 java -jar arthas-demo.jar
root     125210  98378  0 10:07 pts/1    00:00:00 grep --color=auto java
```

#### 查看特定进程的数量

如查看java进程的数量,`ps -ef | grep java| wc -l`：

```
[root@localhost ~]# ps -ef | grep java| wc -l
2
```

#### 查看线程是否存在死锁

查看线程是否存在死锁，`jstack -l pid`：

### 保留信息

```
# 系统当前网络连接
ss -antp > $DUMP_DIR/ss.dump 2>&1

# 网络状态统计
# 够按照各个协议进行统计输出，对把握当时整个网络状态，有非常大的作用
netstat -s > $DUMP_DIR/netstat-s.dump 2>&1

# 进程资源
# 能看到打开了哪些文件，可以以进程的维度来查看整个资源的使用情况，包括每条网络连接、每个打开的文件句柄
lsof -p $PID > $DUMP_DIR/lsof-$PID.dump

# CPU 资源
# 主要用于输出当前系统的 CPU 和负载，便于事后排查
mpstat > $DUMP_DIR/mpstat.dump 2>&1
vmstat 1 3 > $DUMP_DIR/vmstat.dump 2>&1
sar -p ALL  > $DUMP_DIR/sar-cpu.dump  2>&1
uptime > $DUMP_DIR/uptime.dump 2>&1

# I/O 资源
iostat -x > $DUMP_DIR/iostat.dump 2>&1

# 内存问题
free -h > $DUMP_DIR/free.dump 2>&1

# Jvm的信息
jinfo $PID > $DUMP_DIR/jinfo.dump 2>&1
jstat -gcutil $PID > $DUMP_DIR/jstat-gcutil.dump 2>&1
jstat -gccapacity $PID > $DUMP_DIR/jstat-gccapacity.dump 2>&1

# 堆信息
jmap $PID > $DUMP_DIR/jmap.dump 2>&1$
jmap -heap $PID > $DUMP_DIR/jmap-heap.dump 2>&1$
jmap -histo $PID > $DUMP_DIR/jmap-histo.dump 2>&1
jmap -dump:format=b,file=$DUMP_DIR/heap.bin $PID > /dev/null  2>&1
```



| 类别     | 监控命令                                                     | 描述                                                         | 备注                                                         |
| :------- | :----------------------------------------------------------- | :----------------------------------------------------------- | :----------------------------------------------------------- |
| 内存瓶颈 | free                                                         | 查看内存使用                                                 |                                                              |
|          | vmstat 3(间隔时间) 100(监控次数)                             | 查看swap in/out详细定位是否存在性能瓶颈                      | 推荐使用                                                     |
|          | sar -r 3                                                     | 和free命令类似，查看内存的使用情况，但是不包含swap的情况     |                                                              |
| cpu瓶颈  | top -H                                                       | 按照cpu消耗高低进行排序                                      |                                                              |
|          | ps -Lp 进程号 cu                                             | 查看某个进程的cpu消耗排序                                    |                                                              |
|          | cat /proc/cpuinfo \|grep 'processor'\|wc -l                  | 查看cpu核数                                                  |                                                              |
|          | top 然后shift+h:显示java线程，然后shift+M:按照内存使用进行排序；shift+P:按照cpu时间排序;shift+T:按照cpu累计使用时间排序多核cpu，按“1”进入top视图 | 专项性能排查，多核CPU主要看CUP各个内核的负载情况             |                                                              |
|          | sar -u 3(间隔时间)                                           | 查看cpu总体消耗占比                                          |                                                              |
|          | sar -q                                                       | 查看cpu load                                                 |                                                              |
|          | top -b -n 1 \| awk '{if (NR<=7)print;else if($8=="D"){print;count++}}END{print "Total status D:"count}' | 计算在cpu load里面的uninterruptedsleep的任务数量 uninterruptedsleep的任务会被计入cpu load，如磁盘堵塞 |                                                              |
| 网络瓶颈 | cat /var/log/messages                                        | 查看内核日志，查看是否丢包                                   |                                                              |
|          | watch more /proc/net/dev                                     | 用于定位丢包，错包情况，以便看网络瓶颈                       | 重点关注drop(包被丢弃)和网络包传送的总量，不要超过网络上限   |
|          | sar -n SOCK                                                  | 查看网络流量                                                 |                                                              |
|          | netstat -na\|grep ESTABLISHED\|wc -l                         | 查看tcp连接成功状态的数量                                    | 此命令特别消耗cpu，不适合进行长时间监控数据收集              |
|          | netstat -na\|awk'{print $6}'\|sort \|uniq -c \|sort -nr      | 看tcp各个状态数量                                            |                                                              |
|          | netstat -i                                                   | 查看网络错误                                                 |                                                              |
|          | ss state ESTABLISHED\| wc -l                                 | 更高效地统计tcp连接状态为ESTABLISHED的数量                   |                                                              |
|          | cat /proc/net/snmp                                           | 查看和分析240秒内网络包量，流量，错包，丢包                  | 用于计算重传率`tcpetr=RetransSegs/OutSegs`                   |
|          | traceroute $ip                                               | 查看路由经过的地址                                           | 常用于定位网络在各个路由区段的耗时                           |
|          | dig $域名                                                    | 查看域名解析地址                                             |                                                              |
|          | dmesg                                                        | 查看系统内核日志                                             |                                                              |
| 磁盘瓶颈 | iostat -x -k -d 1                                            | 详细列出磁盘的读写情况                                       | 当看到I/O等待时间所占CPU时间的比重很高的时候，首先要检查的就是机器是否正在大量使用交换空间，同时关注iowait占比cpu的消耗是否很大，如果大说明磁盘存在大的瓶颈，同时关注await，表示磁盘的响应时间以便小于5ms |
|          | iostat -x                                                    | 查看系统各个磁盘的读写性能                                   | 重点关注await和iowait的cpu占比                               |
|          | iotop                                                        | 查看哪个进程在大量读取IO                                     | 一般先通过iostat查看是否存在io瓶颈，再定位哪个进程在大量读取IO |
|          | df -hl                                                       | 查看磁盘剩余空间                                             |                                                              |
|          | du -sh                                                       | 查看磁盘使用了多少空间                                       |                                                              |
| 应用瓶颈 | ps -ef                                                       | grep java                                                    | 查看某个进程的id号                                           |
|          | ps -ef \| grep httpd\| wc -l                                 | 查看特定进程的数量                                           |                                                              |
|          | cat *** .log \| grep *** Exception\| wc -l                   | 统计日志文件中包含特定异常数量                               |                                                              |
|          | awk'{print $8}' 2017-05-22-access_log\|egrep '301\|302'\| wc -l | 统计log中301、302状态码的行数，$8表示第八列是状态码，可以根据实际情况更改 | 常用于应用故障定位                                           |
|          | grep 'wholesaleProductDetailNew' cookie_log \| awk '{if($10=="200")}'print}' | awk 'print $12' \| more                                      | 打印包含特定数据的12列数据                                   |
|          | grep "2017:05:22" cookielog \| awk '($12>0.3){print 8}' \| sort > 目录地址 | 对apache或者nginx访问log进行响应时间排序，$12表示cookie log中的12列表示响应时间 用于排查是否是由于是某些访问超长造成整体的RT变长 |                                                              |
|          | grep -v 'HTTP/1.1" 200'                                      | 取出非200响应码的URL                                         |                                                              |
|          | pgm -A -f $应用集群名称 "grep "'301' log文件地址 \| wc -l"   | 查看整个集群的log中301状态码的数量                           |                                                              |
|          | ps -efL \| grep [PID] \| wc -l                               | 查看某个进程创建的线程数                                     |                                                              |
|          | find / -type f -name " * .log" \| xargs grep "ERROR"         | 统计所有的log文件中，包含Error字符的行                       | 这个在排查问题过程中比较有用                                 |
|          | gcore [pid]                                                  | 导出完成的内存快照                                           | 通常和`jmap -permstat /opt/ ** /java gcore.bin`一起使用，将core dump转换成heap dump |
|          | -XX:HeapDumpPath=/home/logs -Xloggc:/home/log/gc.log -XX:+PrintGCDetails -XX:+PrintGCDateStamps | 在Java启动参数中加入，打印gc日志                             |                                                              |