# Nginx 配置与使用

1. 配置文件语法格式
2. 配置第一个静态WEB服务
3. 配置案例
4. 动静分离实现
5. 防盗链
6. 多域名站点
7. 下载限速
8. IP 黑名单
9. 基于user-agent分流
10. 日志配置

## 1、配置文件的语法格式

先来看一个简单的nginx 配置

```
worker_processes  1;
events {
    worker_connections  1024;
}
http {
    include       mime.types;
    default_type  application/octet-stream;
    sendfile        on;
    keepalive_timeout  65;
    server {
        listen       80;
        server_name  localhost;
        location / {
            root   html;
            index  index.html index.htm;
        }
        location /nginx_status {
    	   stub_status on;
    	   access_log   off;
  	    }
    }
}
```

上述配置中的events、http、server、location、upstream等属于配置项块。而worker_processes 、worker_connections、include、listen  属于配置项块中的属性。   /nginx_status   属于配置块的特定参数参数。其中server块嵌套于http块，其可以直接继承访问Http块当中的参数。

| **配置块** | 名称开头用大口号包裹其对应属性                               |
| :--------- | :----------------------------------------------------------- |
| **属性**   | 基于空格切分属性名与属性值，属性值可能有多个项 都以空格进行切分 如：  access_log  logs/host.access.log  main |
| **参数**   | 其配置在 块名称与大括号间，其值如果有多个也是通过空格进行拆  |

注意 如果配置项值中包括语法符号，比如空格符，那么需要使用单引号或双引号括住配置项值，否则Nginx会报语法错误。例如：
    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                     '$status $body_bytes_sent "$http_referer" '
                     '"$http_user_agent" "$http_x_forwarded_for"';

## 2、配置第一个静态WEB服务

**基础站点演示：**

- [ ] 创建站点目录 mkdir -p /usr/www/luban 
- [ ] 编写静态文件
- [ ] 配置 nginx.conf
  - [ ] 配置server
  - [ ] 配置location

基本配置介绍说明：
（1）监听端口
语法：listen address：
默认：listen 80;
配置块：server

（2）主机名称
语法：server_name name[……];
默认：server_name "";
配置块：server
server_name后可以跟多个主机名称，如server_name [www.testweb.com](http://www.testweb.com)、download.testweb.com;。 支持通配符与正则

**（3）location**
语法：location[=|～|～*|^～|@]/uri/{……}
配置块：server

1. =表示把URI作为字符串，以便与参数中的uri做完全匹配。
2. / 基于uri目录匹配
3. ～表示正则匹配URI时是字母大小写敏感的。
4. ～*表示正则匹配URI时忽略字母大小写问题。
5. ^～表示正则匹配URI时只需要其前半部分与uri参数匹配即可。

**匹配优先规则：**

1. 精确匹配优先 =
2. 正则匹配优先 ^~
3. 前缀最大匹配优先。
4. 配置靠前优化

（4）root 指定站点根目录
可配置在 server与location中，基于ROOT路径+URL中路径去寻找指定文件。
（5）alias 指定站点别名
只能配置location 中。基于alias 路径+ URL移除location  前缀后的路径来寻找文件。
如下示例：

```
location /V1 {
      alias  /www/old_site;
      index  index.html index.htm;
}
#防问规则如下
URL：http://xxx:xx/V1/a.html
最终寻址：/www/old_site/a.thml
```



**动静分离演示：**

- [ ] 创建静态站点
- [ ] 配置 location /static
- [ ] 配置 ~* \.(gif|png|css|js)$ 

**基于目录动静分离**

```
   server {
        listen 80;
        server_name *.luban.com;
        root /usr/www/luban;
        location / {
                index luban.html;
        }
        location /static {
         alias /usr/www/static;
        }
 }
```

**基于正则动静分离**

```
location ~* \.(gif|jpg|png|css|js)$ {
      root /usr/www/static;
}
```

**防盗链配置演示：**

```
# 加入至指定location 即可实现
valid_referers none blocked *.luban.com;
 if ($invalid_referer) {
       return 403;
}
```

**下载限速：**

```
location /download {
    limit_rate 1m; //限制每S下载速度
    limit_rate_after 30m; // 超过30 之 后在下载
}

```

**创建IP黑名单**

```
#封禁指定IP
deny 192.168.0.1;
allow 192.168.0.1;
#开放指定IP 段
allow 192.168.0.0/24;
#封禁所有
deny    all;
#开放所有
allow    all;
# 创建黑名单文件
echo 'deny 192.168.0.132;' >> balck.ip
#http 配置块中引入 黑名单文件
include       black.ip;
```

## 3、日志配置

**日志格式：**

```
log_format  main  '$remote_addr - $remote_user [$time_local]   "$request" '
                     '$status $body_bytes_sent "$http_referer" '
                  '"$http_user_agent" "$http_x_forwarded_for"';
access_log  logs/access.log  main;
#基于域名打印日志
access_log logs/$host.access.log main;
```

**error日志的设置**
语法：error_log /path/file level;
默认：error_log logs/error.log error;
level是日志的输出级别，取值范围是debug、info、notice、warn、error、crit、alert、emerg，
**针对指定的客户端输出debug级别的日志**
语法：debug_connection[IP|CIDR]
events {
debug_connection 192.168.0.147; 
debug_connection 10.224.57.0/200;
}
注意：debug 日志开启 必须在安装时 添加  --with-debug (允许debug)
[nginx.conf](