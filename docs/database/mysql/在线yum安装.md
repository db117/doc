---
title: 在线yum安装
---
# 在线yum安装

## 安装
* 下载mysql源安装包
  *   wget http://dev.mysql.com/get/mysql57-community-release-el7-8.noarch.rpm
  *   yum localinstall mysql57-community-release-el7-8.noarch.rpm
* 检查mysql源是否安装成功
  *   检查mysql源是否安装成功
  *   可以修改vim /etc/yum.repos.d/mysql-community.repo源，改变默认安装的mysql版本。比如要安装5.6版本，
  将5.7源的enabled=1改成enabled=0。然后再将5.6源的enabled=0改成enabled=1即可
* 安装MySQL

  *   yum install mysql-community-server
  
## 启动
* 启动MySQL服务

  *   systemctl start mysqld
* 开机启动
  *   systemctl enable mysqld
  *   systemctl daemon-reload
  
## 密码访问
* 修改密码策略
  *   在vim /etc/my.cnf文件添加validate_password_policy配置，指定密码策略
  *   选择0（LOW），1（MEDIUM），2（STRONG）其中一种，选择2需要提供密码字典文件
      *    validate_password_policy=0
  *   如果不需要密码策略，添加my.cnf文件中添加如下配置禁用即可：
      *   validate_password = off
* 修改root本地登录密码
  *   mysql安装完成之后，在/var/log/mysqld.log文件中给root生成了一个默认密码。
      通过下面的方式找到root默认密码，然后登录mysql进行修改
      *   grep 'temporary password' /var/log/mysqld.log
      *   mysql -uroot -p
      *   ALTER USER 'root'@'localhost' IDENTIFIED BY 'password';
      *   或者set password for 'root'@'localhost'=password('password'); 
* 添加远程登录用户

  *    GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' IDENTIFIED BY 'root' WITH GRANT OPTION;
  
## 配置
  ```
  #不需要密码策略
  validate_password = off  
  #默认编码       
  character_set_server=utf8      
  #连接编码 
  init_connect='SET NAMES utf8'
  #忽略大小写(Linux)   
  lower_case_table_names=1 
  #最大连接量       
  max_allowed_packet=50m  
  #分布式下id        
  server-id=1     
  #开启binglog                
  log-bin=mysql-bin   
  #binglog格式            
  binlog_format=MIXED            
  ```
