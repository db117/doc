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

# 将目前目录下的所有文件与子目录皆设为任何人可读取
chmod -R a+r *
```

### 进程

```
# 查看进程
# 显示当前系统进程的列表 
ps ax
# 显示当前系统进程详细列表以及进程用户
ps aux 
# 过滤具体进程（XXX为进程名称）
ps ax|grep XXX | grep -v grep

# 获取进程id
ps -A |grep "cmdname" | grep -v grep| awk '{print $1}'
pgrep "cmdname"

# 杀进程
kill PID
# 强制杀进程
kill -9 PID 

# 杀掉所有匹配的进程进程
# 先检查一下，在 kill
ps -A |grep "cmdname"| grep -v grep | awk '{print $1}'
ps -A |grep "cmdname"| grep -v grep | awk '{print $1}'| while read s;do kill $s;done
```

### 文件

```
# 批量删除空文件
find . -type f -empty -delete
find . -type f -size 0 -delete

## 解压文件 #####
# 压缩文件 file1 和目录 dir2 到 test.tar.gz
tar -zcvf test.tar.gz file1 dir2
# 解压 test.tar.gz（将 c 换成 x 即可）
tar -zxvf test.tar.gz
# 列出压缩文件的内容
tar -ztvf test.tar.gz 
# 使用 -d 选项手动指定解压缩位置
unzip -d /tmp/ ana.zip

```

### 文本浏览

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

#### 文本处理 awk

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



### 字符串变量操作

> 特殊符合使用`\`进行转义

- 替换第一个匹配到的文本`${<源文本>/<需要替换的文本>/<替换后的文本>}`
- 替换所有匹配的文本`${<源文本>//<需要替换的文本>/<替换后的文本>}`
- 删除变量中第一个匹配的字符串`${<源文本>/<需要删除的文本>}`
- 删除变量中所有匹配的字符串`${<源文本>//<需要删除的文本>}`



### BASE64

```
编码
base64 a  > b

解码
base -d a > b
```



------



### nslookup

#### 安装

> Ubuntu

```
apt-get install dnsutils
```

> Debian

```
apt-get update
apt-get install dnsutils
```

> Fedora / Centos

```
yum install bind-utils
```

------



### 文件的组织

以下是对这些目录的解释：

- **/bin**：

  > Binaries (二进制文件) 的缩写, 这个目录存放着最经常使用的命令。

- **/boot：**

  > 这里存放的是启动 Linux 时使用的一些核 心文件，包括一些连接文件以及镜像文件。

- **/dev ：**

  > Device(设备) 的缩写, 该目录下存放的是 Linux 的外部设备，在 Linux 中访问设备的方式和访问文件的方式是相同的。

- **/etc：**

  > etc 是 Etcetera(等等) 的缩写,这个目录用来存放所有的系统管理所需要的配置文件和子目录。

- **/home**：
  用户的主目录，在 Linux 中，每个用户都有一个自己的目录，一般该目录名是以用户的账号命名的，如上图中的 alice、bob 和 eve。

- **/lib**：

  >  Library(库) 的缩写这个目录里存放着系统最基本的动态连接共享库，其作用类似于 Windows 里的 DLL 文件。几乎所有的应用程序都需要用到这些共享库。

- **/lost+found**：

  > 这个目录一般情况下是空的，当系统非法关机后，这里就存放了一些文件。

- **/media**：

  > linux 系统会自动识别一些设备，例如U盘、光驱等等，当识别后，Linux 会把识别的设备挂载到这个目录下。

- **/mnt**：

  > 系统提供该目录是为了让用户临时挂载别的文件系统的，我们可以将光驱挂载在 /mnt/ 上，然后进入该目录就可以查看光驱里的内容了。

- **/opt**：

  > optional(可选) 的缩写，这是给主机额外安装软件所摆放的目录。比如你安装一个ORACLE数据库则就可以放到这个目录下。默认是空的。

- **/proc**：

  > proc 是 Processes(进程) 的缩写，/proc 是一种伪文件系统（也即虚拟文件系统），存储的是当前内核运行状态的一系列特殊文件，这个目录是一个虚拟的目录，它是系统内存的映射，我们可以通过直接访问这个目录来获取系统信息。
  > 这个目录的内容不在硬盘上而是在内存里，我们也可以直接修改里面的某些文件，

- **/root**：

  > 该目录为系统管理员，也称作超级权限者的用户主目录。

- **/sbin**：

  > s 就是 Super User 的意思，是 Superuser Binaries (超级用户的二进制文件) 的缩写，这里存放的是系统管理员使用的系统管理程序。

- **/selinux**：

  > 这个目录是 Redhat/CentOS 所特有的目录，Selinux 是一个安全机制，类似于 windows 的防火墙，但是这套机制比较复杂，这个目录就是存放selinux相关的文件的。

- **/srv**：

  > 该目录存放一些服务启动之后需要提取的数据。

- **/sys**：

  > 这是 Linux2.6 内核的一个很大的变化。该目录下安装了 2.6 内核中新出现的一个文件系统 sysfs 。
  >
  > sysfs 文件系统集成了下面3种文件系统的信息：针对进程信息的 proc 文件系统、针对设备的 devfs 文件系统以及针对伪终端的 devpts 文件系统。
  >
  > 该文件系统是内核设备树的一个直观反映。
  >
  > 当一个内核对象被创建的时候，对应的文件和目录也在内核对象子系统中被创建

- **/tmp**：

  > tmp 是 temporary(临时) 的缩写这个目录是用来存放一些临时文件的。

- **/usr**：

  > usr 是 unix shared resources(共享资源) 的缩写，这是一个非常重要的目录，用户的很多应用程序和文件都放在这个目录下，类似于 windows 下的 program files 目录。

- **/usr/bin：**

  > 系统用户使用的应用程序。

- **/usr/sbin：**

  > 超级用户使用的比较高级的管理程序和系统守护程序。

- **/usr/src：**

  > 内核源代码默认的放置目录。

- **/var**：

  > var 是 variable(变量) 的缩写，这个目录中存放着在不断扩充着的东西，我们习惯将那些经常被修改的目录放在这个目录下。包括各种日志文件。

- **/run**：

  > 是一个临时文件系统，存储系统启动以来的信息。当系统重启时，这个目录下的文件应该被删掉或清除。如果你的系统上有 /var/run 目录，应该让它指向 run。

