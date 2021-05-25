# Nginx配置

## 核心配置

### 文件结构

- `main` 全局配置，对全局生效；
- `events` 配置影响 `Nginx` 服务器与用户的网络连接；
- `http` 配置代理，缓存，日志定义等绝大多数功能和第三方模块的配置；
- `server` 配置虚拟主机的相关参数，一个 `http` 块中可以有多个 `server` 块；
- `location` 用于配置匹配的 `uri` ；
- `upstream` 配置后端服务器具体地址，负载均衡配置不可或缺的部分；

```
# main段配置信息
user  nginx;                        				# 运行用户，默认即是nginx，可以不进行设置
daemon off; 																# 默认是on，后台运行模式
worker_processes  auto;             				# Nginx 进程数，一般设置为和 CPU 核数一样
worker_cpu_affinity 0001 0010 0100 1000; 		# 4个物理核心，4个worker子进程复制代码
pid        /var/run/nginx.pid;      				# Nginx 服务启动时的 pid 存放位置
worker_rlimit_nofile 20480; 								# 可以理解成每个worker子进程的最大连接数量。
worker_priority -10; 												# 120-10=110，110就是最终的优先级

worker_shutdown_timeout 5s;									# 指定 worker 子进程优雅退出时的超时时间。

error_log  /var/log/nginx/error.log warn;   # Nginx 的错误日志存放目录


# events段配置信息
events {
    use epoll;     							# 使用epoll的I/O模型(如果你不知道Nginx该使用哪种轮询方法，会自动选择一个最适合你操作系统的)
    worker_connections 1024;   	# 每个进程允许最大并发数
    accept_mutex on;						# 是否打开负载均衡互斥锁,默认是off关闭的
}

# http段配置信息
# 配置使用最频繁的部分，代理、缓存、日志定义等绝大多数功能和第三方模块的配置都在这里设置
http {
    # 设置日志模式
    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;   # Nginx访问日志存放位置

    sendfile            on;   # 开启高效传输模式
    tcp_nopush          on;   # 减少网络报文段的数量
    tcp_nodelay         on;
    keepalive_timeout   65;   # 保持连接的时间，也叫超时时间，单位秒
    types_hash_max_size 2048; # 散列表大小,默认1024

    include             /etc/nginx/mime.types;      # 文件扩展名与类型映射表
    default_type        application/octet-stream;   # 默认文件类型

    include /etc/nginx/conf.d/*.conf;   # 加载子配置项

    # server段配置信息
    server {
     listen       80;       		# 配置监听的端口
     server_name  localhost;    # 配置的域名

     # location段配置信息
     location / {
      root   /usr/share/nginx/html;  	# 网站根目录
      index  index.html index.htm;   	# 默认首页文件
      deny 172.168.22.11;   					# 禁止访问的ip地址，可以为all
      allow 172.168.33.44；					  # 允许访问的ip地址，可以为all
     }

     error_page 500 502 503 504 /50x.html;  # 默认50x对应的访问页面
     error_page 400 404 error.html;   			# 同上
    }
}
```

### 常用变量

| 变量名               | 含义                                                         |
| :------------------- | :----------------------------------------------------------- |
| `remote_addr`        | 客户端 `IP` 地址                                             |
| `remote_port`        | 客户端端口                                                   |
| `server_addr`        | 服务端 `IP` 地址                                             |
| `server_port`        | 服务端端口                                                   |
| `server_protocol`    | 服务端协议                                                   |
| `binary_remote_addr` | 二进制格式的客户端 `IP` 地址                                 |
| `connection`         | `TCP` 连接的序号，递增                                       |
| `connection_request` | `TCP` 连接当前的请求数量                                     |
| `uri`                | 请求的URL，不包含参数                                        |
| `request_uri`        | 请求的URL，包含参数                                          |
| `scheme`             | 协议名， `http` 或 `https`                                   |
| `request_method`     | 请求方法                                                     |
| `request_length`     | 全部请求的长度，包含请求行、请求头、请求体                   |
| `args`               | 全部参数字符串                                               |
| `arg_参数名`         | 获取特定参数值                                               |
| `is_args`            | `URL` 中是否有参数，有的话返回 `?` ，否则返回空              |
| `query_string`       | 与 `args` 相同                                               |
| `host`               | 请求信息中的 `Host` ，如果请求中没有 `Host` 行，则在请求头中找，最后使用 `nginx` 中设置的 `server_name` 。 |
| `http_user_agent`    | 用户浏览器                                                   |
| `http_referer`       | 从哪些链接过来的请求                                         |
| `http_via`           | 每经过一层代理服务器，都会添加相应的信息                     |
| `http_cookie`        | 获取用户 `cookie`                                            |
| `request_time`       | 处理请求已消耗的时间                                         |
| `https`              | 是否开启了 `https` ，是则返回 `on` ，否则返回空              |
| `request_filename`   | 磁盘文件系统待访问文件的完整路径                             |
| `document_root`      | 由 `URI` 和 `root/alias` 规则生成的文件夹路径                |
| `limit_rate`         | 返回响应时的速度上限值                                       |

实例演示 `var.conf` ：

```
server{
 listen 8081;
 server_name var.lion-test.club;
 root /usr/share/nginx/html;
 location / {
  return 200 "
remote_addr: $remote_addr
remote_port: $remote_port
server_addr: $server_addr
server_port: $server_port
server_protocol: $server_protocol
binary_remote_addr: $binary_remote_addr
connection: $connection
uri: $uri
request_uri: $request_uri
scheme: $scheme
request_method: $request_method
request_length: $request_length
args: $args
arg_pid: $arg_pid
is_args: $is_args
query_string: $query_string
host: $host
http_user_agent: $http_user_agent
http_referer: $http_referer
http_via: $http_via
request_time: $request_time
https: $https
request_filename: $request_filename
document_root: $document_root
";
 }
}
```

## 常用配置

### 负载均衡

- `server` 定义上游服务器地址；

  ```
  语法：server address [parameters]
  
  parameters 可选值：
  weight=number 权重值，默认为1；
  max_conns=number 上游服务器的最大并发连接数；
  fail_timeout=time 服务器不可用的判定时间；
  max_fails=numer 服务器不可用的检查次数；
  backup 备份服务器，仅当其他服务器都不可用时才会启用；
  down 标记服务器长期不可用，离线维护；
  ```

- `zone` 定义共享内存，用于跨 `worker` 子进程；

- `keepalive` 对上游服务启用长连接；

- `keepalive_requests` 一个长连接最多请求 `HTTP` 的个数；默认1000

- `keepalive_timeout` 空闲情形下，一个长连接的超时时长 默认60s

- `keepalive_time`一个连接最长时间 默认1h

  

负载均衡类型

- `hash` 哈希负载均衡算法；

- `ip_hash` 依据 `IP` 进行哈希计算的负载均衡算法；

- `random` 随机负载均衡算法；

- `least_conn` 最少连接数负载均衡算法；

- `least_time` 最短响应时间负载均衡算法；

  

```
upstream dynamic {
		hash $request_uri;
		least_conn;
		ip_hash;
		least_conn;
		
		
    zone upstream_dynamic 64k;

    server backend1.example.com      weight=5;
    server backend2.example.com:8080 fail_timeout=5s slow_start=30s;
    server 192.0.2.1                 max_fails=3;
    server backend3.example.com      resolve;
    server backend4.example.com      service=http resolve;

    server backup1.example.com:8080  backup;
    server backup2.example.com:8080  backup;
    
    keepalive 32;
}
```

### proxy_pass

> 代理转发

```
 location / {
      proxy_set_header        X-Real-IP       $remote_addr;
      proxy_set_header        X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_http_version 1.1;
      proxy_set_header Connection "";
      proxy_pass http://127.0.0.1:9400;
    }
```

