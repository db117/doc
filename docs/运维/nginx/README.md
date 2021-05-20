---
title: Nginx
---
# Nginx
> [官网]([nginx news](http://nginx.org/))

## 文件位置

```
# Nginx配置文件
/etc/nginx/nginx.conf # nginx 主配置文件
/etc/nginx/nginx.conf.default
/etc/nginx/conf.d/    # 默认会把这个目录下的都加载

# 可执行程序文件
/usr/bin/nginx-upgrade
/usr/sbin/nginx

# nginx库文件
/usr/lib/systemd/system/nginx.service # 用于配置系统守护进程
/usr/lib64/nginx/modules # Nginx模块目录

# 帮助文档
/usr/share/doc/nginx

# 静态资源目录
/usr/share/nginx/html/404.html
/usr/share/nginx/html/50x.html
/usr/share/nginx/html/index.html

# 存放Nginx日志文件
/var/log/nginx
```



## 常用命令

1. `systemctl` 系统命令
   	 
     ```
     # 开机配置
     systemctl enable nginx # 开机自动启动
     systemctl disable nginx # 关闭开机自动启动
     
     # 启动Nginx
     systemctl start nginx # 启动Nginx成功后，可以直接访问主机IP，此时会展示Nginx默认页面
     
     # 停止Nginx
     systemctl stop nginx
     
     # 重启Nginx
     systemctl restart nginx
     
     # 重新加载Nginx
     systemctl reload nginx
     
     # 查看 Nginx 运行状态
     systemctl status nginx
     
     ```
     
2. 关闭进程

      ```
      nginx -s stop # 快速关闭
      nginx -s quit # 优雅关闭, 等待工作进程处理完成后关闭
      systemctl stop nginx
      ```

3. 检查配置文件是否有误
      ```
      nginx –t
      ```

4. 重新加载配置文件

      > 向主进程发送信号，重新加载配置文件，热重启

      ```
      nginx –s reload
      ```

5. 重启

      ```
      nginx -s reopen
      systemctl restart nginx
      ```

6. 指定配置文件

      ```
      nginx -c file
      ```

7. 查看当前 Nginx 最终的配置

   ```
   nginx -T
   ```

   

