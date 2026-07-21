---
title: linux
---
## 备忘单

### 权限

```
# 将文件 file1.txt 设为所有人皆可读取
chmod ugo+r file1.txt
chmod a+r file1.txt
chmod 444 file1.txt

# 文件file的所有者增加读和运行的权限
chmod u+rx file 
# 文件file的群组用户增加读的权限
chmod g+r file 
#文件file的其它用户移除读的权限
chmod o-r file 
# 文件file的群组用户增加读的权限，其它用户移除读的权限
chmod g+r o-r file 
# 文件file的所有用户增加运行的权限
chmod +x file 
#文件file的所有者分配读写和执行的权限，群组其它用户分配读的权限，其他用户没有任何权限
chmod u=rwx,g=r,o=- file
# 将目前目录下的所有文件与子目录皆设为任何人可读取
chmod -R a+r *
```

### 进程

```
# 查看进程
# 显示当前系统进程的列表 
ps -ax
# 显示当前系统进程详细列表以及进程用户
ps -aux 
# 过滤具体进程（XXX为进程名称）
ps -ax|grep XXX | grep -v grep
# 按 CPU 使用降序排列
ps -aux --sort -pcpu
# 表示按内存使用降序排列
ps -aux --sort -pmem 
# 以树形结构显示进程
ps -axjf 

# 获取进程id
ps -A | grep "cmdname" | grep -v grep| awk '{print $1}'
pgrep "cmdname"

# 杀进程
kill PID
# 强制杀进程
kill -9 PID 

# 杀掉所有匹配的进程进程
# 先检查一下，在 kill
ps -A |grep "cmdname"| grep -v grep | awk '{print $1}'
ps -A |grep "cmdname"| grep -v grep | awk '{print $1}'| while read s;do kill $s;done

# 杀掉所有匹配的进程进程（通过参数匹配）
# 一定要先检查一下，在 kill
ps -ef |grep "cmdname args"| grep -v grep | awk '{print $2}'
ps -ef |grep "cmdname args"| grep -v grep | awk '{print $2}'| while read s;do kill $s;done

# 杀掉进程（指定 cmd 名称，在通过参数过滤）
# 一定要先检查一下，在 kill
ps -C java -o pid,cmd |grep "cmdname args"| grep -v grep | awk '{print $1}'
ps -C java -o pid,cmd |grep "cmdname args"| grep -v grep | awk '{print $1}'| while read s;do kill $s;done

# 查询 java 命令的执行文件地址
which java
```



### 文件

```
# 当前文件夹大小
du -sh
# 当前文件夹以及子文件夹大小
du -h

# 批量删除空文件
find . -type f -empty -delete
find . -type f -size 0 -delete

# 近 7天内访问过的.txt结尾的文件
find -name "*.txt" -atime -7 

## 解压文件 #####
# 压缩文件 file1 和目录 dir2 到 test.tar.gz
tar -zcvf test.tar.gz file1 dir2
# 解压 test.tar.gz（将 c 换成 x 即可）
tar -zxvf test.tar.gz
# 列出压缩文件的内容
tar -ztvf test.tar.gz 
# 使用 -d 选项手动指定解压缩位置
unzip -d /tmp/ ana.zip
# 把 tar.gz 解压缩为 tar
gzip -d file.tar.gz

```

#### 文本浏览

```
# 显示文本内容
cat <file>  					# 一次性显示完
head -20 <file>				# 显示开头 20 行文本
tail -n3 <file>				# 显示最后 3 行文本
tail -n10 <file>			# 显示最后 10 行文本，并监听文件
sed -n '3,7p' <file>	# 指定读取某个文件的第3-7行
sed -n '3,$p' <file>	# 指定读取某个文件第 3 行到最后一行，$代表最后一行


# 浏览文本
less -N <file> 			# 开始浏览文本
# 搜索
  /字符串：向下搜索
  ?字符串：向上搜索
  n：重复前一个搜索（与 / 或 ? 有关）
  N：反向重复前一个搜索（与 / 或 ? 有关）
# 向前翻页
  y 向前滚动一行
  u 向前滚动半页
  b 向上翻一页
# 向后翻页
	回车键 滚动一行
	d 向后翻半页
	空格键 滚动一页
h 显示帮助界面
Q 退出less 命令


```

#### 文本搜索

```
# 搜索某个文件中，包含某个关键词的内容
grep root /etc/passwd
# 搜索某个文件中，以某个关键词开头的内容
grep ^root /etc/passwd
# 展示匹配行的前后若干行（B：前 A：后 C： 前后）
grep -C1 leo passwd
# 搜索多个文件中，包含某个关键词的内容
grep root /etc/passwd /etc/shadow
# 搜索多个文件中，包含某个关键词的内容，不显示文件名称
grep -h root /etc/passwd /etc/shadow
# 输出在某个文件中，包含某个关键词行的数量
grep -c root /etc/passwd /etc/shadow
# 搜索某个文件中，不包含某个关键词的内容
grep -v nologin /etc/passwd
# 搜索某个文件中，精准匹配到某个关键词的内容（搜索词应与整行内容完全一样才会显示，有别于一般搜索）
grep -x cdrom anaconda-ks.cfg
# 搜索某个文件中，空行的数量
grep -c ^$ anaconda-ks.cfg 
# 统计某个字符串在文本中出现的次数
grep -o -i 'error' service.log | wc -l

```

#### 文本编辑

```
# sed 可以接在管道上，也可以在后面指定文件
# sed 添加 -i 可以直接修改文件
# 删除所有行
sed 'd'
# 删除第2行
sed '2d'
# 删除第2~5行
sed '2,5d'
# 删除第3到最后一行，$代表最后一行
sed '3,$d'
# 删除空行
sed '/^$/d'


# 替换第二个 test 为 trial
sed 's/test/trial/2'
# 替换所有 test 为 trial
sed 's/test/trial/g'
# -n 选项会禁止 sed 输出，但 p 标记会输出修改过的行，将二者匹配使用的效果就是只输出被替换命令修改过的行
sed -n 's/test/trial/p' 
# 将处理后的结果保存到指定文件中
sed 's/test/trial/w test.txt' 
# 将第2到5行替换为一行字符串"No 2~5 lines"
sed '2,5c No 2~5 lines'

# 插入多行数据只需对要插入或附加的文本中的每一行末尾（除最后一行）添加反斜线即可
# 在第三行插入数据，即第三行和第二行中间
sed '3i\
> This is an inserted line.'
# 在第三行追加数据，即第三行和第四行中间
sed '3a\
> This is an appended line.'
# 把第三行数据替换掉
sed '3c\
> This is a changed line of text.'
# 把 data.txt 文件内容插入到第三行后面
sed '3r data.txt'
# 把 data.txt 文件内容插入到数据流尾部
sed '$r data.txt'
# 可以添加一个完全为空的空行
sed '4 a \\'
# 可以添加两个完全为空的空行
sed '4 a \\n'

# 替换字符
# 把 1 替换成 7,2 替换成 8,3 替换成 9
sed 'y/123/789/'
```

### 网络

```
# 查看 Tcp 连接
netstat

# 查看哪个端口被哪个进程占用
lsof -i :80
netstat -naptcp | grep 80
```

### 系统

```
# 查看内存使用情况
free -m
top

# 查看负载情况
uptime
```



### 其他

```
# 打印全部环境变量
env 
# 打印指定变量
echo $env_name
# 设置变量
export VARIABLE_NAME=value

# 全局变量
/etc/environment

# 端口占用
netstat -tunlp | grep 端口号

# 编码
base64 a  > b
# 解码
base -d a > b
```



### 文本处理 awk

**常用参数：**

| -F   | 指定输入时用到的字段分隔符 |
| ---- | -------------------------- |
| -v   | 自定义变量                 |
| -f   | 从脚本中读取awk命令        |
| -m   | 对val值设置内在限制        |

内置变量：

| 变量名称 | 说明                                  |
| -------- | ------------------------------------- |
| ARGC     | 命令行参数个数                        |
| ARGV     | 命令行参数排列                        |
| ENVIRON  | 支持队列中系统环境变量的使用          |
| FILENAME | awk浏览的文件名                       |
| FNR      | 浏览文件的记录数                      |
| FS       | 设置输入域分隔符，等价于命令行 -F选项 |
| NF       | 浏览记录的域的个数                    |
| NR       | 已读的记录数                          |
| OFS      | 输出域分隔符                          |
| ORS      | 输出记录分隔符                        |
| RS       | 控制记录分隔符                        |

```
# 打印内容
# 仅显示指定文件中第1、2列的内容（默认以空格为间隔符）
awk ' {print $1,$2} ' test.log
# 以冒号为间隔符，仅显示指定文件中第1列的内容
awk -F ':' '{print $1}' test.log
# 以冒号为间隔符，显示系统中所有UID号码大于500的用户信息（第3列）
awk -F : '$3>=500' /etc/passwd
# 仅显示指定文件中最后一个字段的内容
awk '{print $NF}' test.log
# 第一列匹配 oo 的行
awk -F ':' '$1 ~/oo/' test.txt

# 处理脚本
# 第一条命令会给字段变量 $4 赋值。第二条命令会打印整个数据字段。
awk '{$4="Christine"; print $0}' test.log
# 累加第五列，并打印
awk '{sum+=$5} END {print sum}'
# 过滤第一列大于2并且第二列等于'Are'的行
awk '$1>2 && $2=="Are" {print $1,$2,$3}' log.txt

# 打印九九乘法表
seq 9 | sed 'H;g' | awk -v RS='' '{for(i=1;i<=NF;i++)printf("%dx%d=%d%s", i, NR, i*NR, i==NR?"\n":"\t")}'
```





### 系统参数

#### ulimit

> /etc/security/limits.conf
>
> 限制应用打开的文件数量
>
> 配置格式如下:
> `<domain> <type> <item> <value>`
>
> `<domain>` 指定的用户或者组，可以使用通配符 * % 等
> `<type>` 有soft，hard和-，soft指的是当前系统生效的设置值，软限制也可以理解为警告值。
> hard表名系统中所能设定的最大值。soft的限制不能比hard限制高，用-表名同时设置了soft和hard的值。
> `<item>` 设置项的名称
> `<value>` 设置项的值

可配置项

```
# - core - limits the core file size (KB)    限制内核文件的大小。
# - data - max data size (KB)    最大数据大小
# - fsize - maximum filesize (KB)    最大文件大小
# - memlock - max locked-in-memory address space (KB)    最大锁定内存地址空间
# - nofile - max number of open file descriptors 最大打开的文件数(以文件描叙符，file descripter计数) 
# - rss - max resident set size (KB) 最大持久设置大小
# - stack - max stack size (KB) 最大栈大小
# - cpu - max CPU time (MIN)    最多CPU占用时间，单位为MIN分钟
# - nproc - max number of processes 进程的最大数目
# - as - address space limit (KB) 地址空间限制 
# - maxlogins - max number of logins for this user    此用户允许登录的最大数目
# - maxsyslogins - max number of logins on the system    系统最大同时在线用户数
# - priority - the priority to run user process with    运行用户进程的优先级
# - locks - max number of file locks the user can hold    用户可以持有的文件锁的最大数量
# - sigpending - max number of pending signals
# - msgqueue - max memory used by POSIX message queues (bytes)
# - nice - max nice priority allowed to raise to values: [-20, 19] max nice优先级允许提升到值
# - rtprio - max realtime pr iority
```

临时修改

```
# 调整最大限制数量
ulimit -HSn 65536
# 移除限制
ulimit -c unlimited
```

永久修改，完后需要重新登录

```
* soft nofile 65536
* hard nofile 65536
```

------



### 字符串变量操作

> 特殊符合使用`\`进行转义

- 替换第一个匹配到的文本`${<源文本>/<需要替换的文本>/<替换后的文本>}`
- 替换所有匹配的文本`${<源文本>//<需要替换的文本>/<替换后的文本>}`
- 删除变量中第一个匹配的字符串`${<源文本>/<需要删除的文本>}`
- 删除变量中所有匹配的字符串`${<源文本>//<需要删除的文本>}`
