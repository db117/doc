---
title: supervisord使用
---

### 简介

[GitHub](https://github.com/Supervisor/supervisor)

[pypi](https://pypi.org/project/supervisor/)

[官网](http://supervisord.org/index.html)

### 安装

> 安装

```bash
# pip
pip install supervisor
# centos
yum install supervisor –y 
# mac
brew install supervisor
```

> 配置文件

```
../etc/supervisord.conf (相对于可执行文件)
../supervisord.conf (相对于可执行文件)
$pwd/supervisord.conf
$pwd/etc/supervisord.conf
/etc/supervisord.conf
```



### 命令

- 查看所有进程的状态

  ```bash
  supervisorctl status
  ```

  > 服务名称   
  >
  > 运行状态:RUNNING(运行中),FATAL(运行失败),STARTING(启动中),STOPED(已停止)
  >
  > 进程号
  >
  > 已经运行时间

- 查看单个任务状态

  ```bash
  supervisorctl status <服务名称>
  ```

- 关闭任务

  ```bash
  supervisorctl stop <服务名称>
  ```

- 启动任务

  ```bash
  supervisorctl start <服务名称>
  ```

- 重启任务

  ```bash
  supervisorctl restart  <服务名称>
  ```

- 更新任务

- > 重新加载 config 并根据需要添加/删除，然后重新启动受影响的程序

  ```
  supervisorctl update <服务名称>
  ```

- 获取pid

  > 获取某个任务pid

  ```
  supervisorctl pid <服务名称> 
  ```

  > 获取所有任务pid

  ```
  supervisorctl pid
  ```

  > 获取任务包括子进程pid

  ```
  supervisorctl pid all
  ```

- 重载修改、新添加的配置文件

  > 有时候只改动了某个配置文件，只想重载这个配置文件然后重启，不影响其他配置文件

  ```
  supervisorctl update
  ```

  > 新添加了一个配置文件，此时update命令没用了，要用reread命令。然后再update重启

  ```
  supervisorctl reread
  ```

### 配置文件

>  supervisor.conf

```
[unix_http_server]
file=/tmp/supervisor.sock   #UNIX socket 文件，supervisorctl 会使用
#chmod=0700                 #socket文件的mode，默认是0700
#chown=nobody:nogroup       #socket文件的owner，格式：uid:gid
 
#[inet_http_server]         #HTTP服务器，提供web管理界面
#port=127.0.0.1:9001        #Web管理后台运行的IP和端口，如果开放到公网，需要注意安全性
#username=user              #登录管理后台的用户名
#password=123               #登录管理后台的密码
 
[supervisord]
logfile=/tmp/supervisord.log #日志文件，默认是 $CWD/supervisord.log
logfile_maxbytes=50MB        #日志文件大小，超出会rotate，默认 50MB，如果设成0，表示不限制大小
logfile_backups=10           #日志文件保留备份数量默认10，设为0表示不备份
loglevel=info                #日志级别，默认info，其它: debug,warn,trace
pidfile=/tmp/supervisord.pid #pid 文件
nodaemon=false               #是否在前台启动，默认是false，即以 daemon 的方式启动
minfds=1024                  #可以打开的文件描述符的最小值，默认 1024
minprocs=200                 #可以打开的进程数的最小值，默认 200
 
[supervisorctl]
serverurl=unix:///tmp/supervisor.sock #通过UNIX socket连接supervisord，路径与unix_http_server部分的file一致
#serverurl=http://127.0.0.1:9001 # 通过HTTP的方式连接supervisord
 
#[program:xx]是被管理的进程配置参数，xx是进程的名称
[program:xx]
command=/opt/apache-tomcat-8.0.35/bin/catalina.sh run  # 程序启动命令
autostart=true       # 在supervisord启动的时候也自动启动
startsecs=10         # 启动10秒后没有异常退出，就表示进程正常启动了，默认为1秒
autorestart=true     # 程序退出后自动重启,可选值：[unexpected,true,false]，默认为unexpected，表示进程意外杀死后才重启
startretries=3       # 启动失败自动重试次数，默认是3
user=tomcat          # 用哪个用户启动进程，默认是root
priority=999         # 进程启动优先级，默认999，值小的优先启动
redirect_stderr=true # 把stderr重定向到stdout，默认false
stdout_logfile_maxbytes=20MB  # stdout 日志文件大小，默认50MB
stdout_logfile_backups = 20   # stdout 日志文件备份数，默认是10
# stdout 日志文件，需要注意当指定目录不存在时无法正常启动，所以需要手动创建目录（supervisord 会自动创建日志文件）
stdout_logfile=/opt/apache-tomcat-8.0.35/logs/catalina.out
stopasgroup=false     #默认为false,进程被杀死时，是否向这个进程组发送stop信号，包括子进程
killasgroup=false     #默认为false，向进程组发送kill信号，包括子进程
 
#包含其它配置文件
[include]
files = relative/directory/*.ini    #可以指定一个或多个以.ini结束的配置文件

```

