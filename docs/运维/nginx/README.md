---
title: Nginx
---
## Nginx
#### 常用命令

1. 关闭进程
   	  ```
      nginx -s stop # 快速关闭
      nginx -s quit # 优雅关闭
      ```
2. 检查配置文件是否有误
      ```
      nginx –t
      ```
3. 重新加载配置文件
      ```
      nginx –s reload
      ```
4. 指定配置文件
      ```
      nginx -c file
      ```
      