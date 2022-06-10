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

### 文本

```
# 显示文本内容
cat <file>  				# 一次性显示完
head -20 <file>			# 显示开头 20 行文本
tail -n3 <file>			# 显示最后 3 行文本
tail -n10 <file>		# 显示最后 10 行文本，并监听文件

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

