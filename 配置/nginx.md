#### docker 启动

```
sudo docker run --name my-nginx -p 80:80 -p 443:443 --network my_net -v $PWD/conf/nginx.conf:/etc/nginx/nginx.conf:ro -v $PWD/ssl:/ssl -v $PWD/logs:/logs  -d nginx

```



#### 配置文件

```

#user  nobody;
worker_processes  1;

# 错误日志
error_log  /logs/error.log;
error_log  /logs/error.log  notice;
error_log  /logs/error.log  info;

#pid        logs/nginx.pid;


events {
    worker_connections  1024;
}


http {
    include       mime.types;
    default_type  application/octet-stream;
	
	# 日志格式
    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';
	# 访问日志
    access_log  /logs/access.log  main;

    sendfile        on;
    #tcp_nopush     on;

    #keepalive_timeout  0;
    keepalive_timeout  65;

    #gzip  on;

	# 80强转443 HTTPS
	server {
		listen 80;
		server_name *.db117.top;
		return 301 https://$http_host$request_uri;
	}

    # HTTPS server
    #
    server {
        listen       443 ssl;
        server_name *.db117.top;
		
        ssl_certificate      /ssl/fullchain.crt;
        ssl_certificate_key  /ssl/private.key;

		ssl_session_cache 	 shared:SSL:10m;
		ssl_session_timeout 	10m;

        ssl_prefer_server_ciphers  	on;
		ssl_protocols TLSv1.1 TLSv1.2;
		ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:HIGH:!aNULL:!MD5:!RC4:!DHE;

       location / {
            proxy_pass http://homepage:8080;
       }
    }

}

```

#### http 转 https

```
# 80强转443 HTTPS
	server {
		listen 80;
		server_name *.db117.top;
		return 301 https://$http_host$request_uri;
	}
```

