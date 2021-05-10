# Nginx 反向代理实现

1. 反向代理基本配置
2. 负载均衡配置与参数解析
3. 负载均衡算法详解
4. 反向代理基本配置

提问：什么是反向代理其与正向代理有什么区别？
**正向代理的概念：**
正向代理是指客户端与目标服务器之间增加一个代理服务器，客户端直接访问代理服务器，在由代理服务器访问目标服务器并返回客户端并返回 。这个过程当中客户端需要知道代理服务器地址，并配置连接。
![图片](https://images-cdn.shimo.im/Toh3jB1uHeodiycl/image.png!thumbnail)

**反向代理的概念：**
反向代理是指 客户端访问目标服务器，在目标服务内部有一个统一接入网关将请求转发至后端真正处理的服务器并返回结果。这个过程当中客户端不需要知道代理服务器地址，代理对客户端而言是透明的。 

![图片](https://images-cdn.shimo.im/i8oQuJikm9EREsxz/image.png!thumbnail)

**反向代理与正向代理的区别**

|                | **正向代理**                                               | **反向代理**                         |
| :------------- | :--------------------------------------------------------- | :----------------------------------- |
| 代理服务器位置 | 客户端与服务都能连接的们位置                               | 目标服务器内部                       |
| 主要作用       | 屏蔽客户端IP、集中式缓存、解决客户端不能直连服务端的问题。 | 屏蔽服务端内部实现、负载均衡、缓存。 |
| 应用场景       | 爬虫、翻墙、maven 的nexus 服务                             | Nginx 、Apache负载均衡应用           |

## 1.Nginx代理基本配置

Nginx 代理只需要配置 location 中配置proxy_pass 属性即可。其指向代理的服务器地址。

```
# 正向代理到baidu 服务
location = /baidu.html {
         proxy_pass http://www.baidu.com;
}
```

```
# 反向代理至 本机的8010服务
location /luban/ {
     proxy_pass http://127.0.0.1:8010;  
}
```

**代理相关参数：**

```
# 代理服务
proxy_pass
# 是否允许重定向
proxy_redirect off; 
# 传 header 参数至后端服务
proxy_set_header Host $host; 
# 设置request header 即客户端IP 地址
proxy_set_header X-Forwarded-For $remote_addr; 
# 连接代理服务超时时间
proxy_connect_timeout 90; 
# 请求发送最大时间
proxy_send_timeout 90; 
# 读取最大时间
proxy_read_timeout 90;  
proxy_buffer_size 4k; 
proxy_buffers 4 32k;
proxy_busy_buffers_size 64k; 
proxy_temp_file_write_size 64k;
```



## 2.负载均衡配置与参数解析

通过proxy_pass 可以把请求代理至后端服务，但是为了实现更高的负载及性能， 我们的后端服务通常是多个， 这个是时候可以通过upstream 模块实现负载均衡。

**演示upstream 的实现。**

```
upstream backend {     
   server 127.0.0.1:8010 weight=1;
   server 127.0.0.1:8080 weight=2;

  server 127.0.0.1:8030 weight=1 backup;
}
location / {
    proxy_pass http://backend;
}
```

**upstream 相关参数:**

- server	反向服务地址 加端口
- **weight	 **权重
- **max_fails	**失败多少次 认为主机已挂掉则，踢出
- **fail_timeout	**踢出后重新探测时间
- **backup	**备用服务
- **max_conns	**允许最大连接数
- **slow_start	**当节点恢复，不立即加入,而是等待 slow_start	后加入服务对列。

## 3.upstream 负载均衡算法介绍

- **ll+weight： **轮询加权重 (默认)
- **ip_hash : **基于Hash 计算 ,用于保持session 一至性
- **url_hash:** 静态资源缓存,节约存储，加快速度（第三方）
- **least_conn **：最少链接（第三方）
- **least_time  **：最小的响应时间,计算节点平均响应时间，然后取响应最快的那个，分配更高权重（第三方）