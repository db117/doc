---
title: docker
---
# docker
## 常用操作

### 进入容器

```
docker container exec -it 容器id bash
```



### 批量删除镜像或容器

```
docker rmi --force $(docker images | grep <过滤> | awk '{print $3}')
```

### 清理镜像

```
# 清理所有没有正在使用的镜像
docker system prune -a
# 删除所有未使用的容器、网络、图像(没有tag的和未引用的)
docker system prune
```



###  容器开机自动启动

> --restart具体参数值详细信息：

   - no -  容器退出时，不重启容器；
   - on-failure - 只有在非0状态退出时才从新启动容器；
   - always - 无论退出状态是如何，都重启容器；

> 如果创建时未指定 --restart=always ,可通过update 命令设置

```
docker update --restart=always 容器id
```



###  查看日志 logs

| 名字            | 默认值 | 描述                                             |
| --------------- | ------ | ------------------------------------------------ |
| –details        |        | 显示提供给日志的额外细节                         |
| –follow或-f     |        | 按日志输出                                       |
| –since          |        | 从某个时间开始显示，例如2013-01-02T13:23:37      |
| –tail           | all    | 从日志末尾多少行开始显示                         |
| –timestamps或-t |        | 显示时间戳                                       |
| –until          |        | 打印某个时间以前的日志，例如 2013-01-02T13:23:37 |

```
# 追踪查看最后100行日志
docker logs -fn100 容器id
```



## 安装应用

###  mysql

*   配置
    *   -p 3306:3306：
        *   将容器的 3306 端口映射到主机的 3306 端口。
    *   -v -v $PWD/conf:/etc/mysql/conf.d：
        *   将主机当前目录下的 conf/my.cnf 挂载到容器的 /etc/mysql/my.cnf。
    *   -v $PWD/logs:/logs：
        *   将主机当前目录下的 logs 目录挂载到容器的 /logs。
    *   -v $PWD/data:/var/lib/mysql ：
        *   将主机当前目录下的data目录挂载到容器的 /var/lib/mysql 。
    *   -e MYSQL_ROOT_PASSWORD=123456：
        *   初始化 root 用户的密码。

```
docker run -p 3306:3306  --restart=always --name mymysql -v $PWD/conf:/etc/mysql/conf.d -v $PWD/logs:/logs -v $PWD/data:/var/lib/mysql -e MYSQL_ROOT_PASSWORD=123456 -d mysql:5.7
```





##  镜像

*		Docker中国区官方镜像
   
   *		https://registry.docker-cn.com
*		网易
   
   *		http://hub-mirror.c.163.com
*		ustc
   
   *		https://docker.mirrors.ustc.edu.cn
*		中国科技大学
   
   * https://docker.mirrors.ustc.edu.cn
   
     


##  network 网络

创建网络

```
docker network create my_net
```


创建容器时指定网络

```
--network my_net 
```

创建容器时设置别名

```
--network-alias nginx
```

 查看网络内部信息

docker network inspect my_net
