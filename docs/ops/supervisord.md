---
title: supervisord使用
---

#### 简介

[GitHub](https://github.com/Supervisor/supervisor)

[pypi](https://pypi.org/project/supervisor/)

[官网](http://supervisord.org/index.html)

#### 安装

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



#### 命令

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
