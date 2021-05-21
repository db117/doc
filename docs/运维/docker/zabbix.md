---
title: zabbix
---

## 在线安装
*   用MySQL数据库安装存储库(数据库另装)
    *   rpm -i http://repo.zabbix.com/zabbix/3.4/rhel/7/x86_64/zabbix-release-3.4-2.el7.noarch.rpm
*   安装ZabBix服务器，前端，代理
    *   yum install zabbix-server-mysql zabbix-web-mysql zabbix-agent
*   创建初始数据库
    *   mysql -uroot -p
    *   password
    *   mysql> create database zabbix character set utf8 collate utf8_bin;
    *   mysql> grant all privileges on zabbix.* to zabbix@localhost identified by 'password';
    *   mysql> quit;
*   导入初始模式和数据。将提示您输入新创建的密码。
    *   zcat /usr/share/doc/zabbix-server-mysql*/create.sql.gz | mysql -uzabbix -p zabbix
*   为ZabBIX服务器配置数据库
    *   编辑文件    vim /etc/zabbix/zabbix_server.conf
        *   DBPassword=password
*   为ZabBIX前端配置PHP
    *   编辑文件    vim /etc/httpd/conf.d/zabbix.conf
        *   php_value date.timezone Asia/Shanghai
*   启动ZabBIX服务器和代理进程
    *   systemctl restart zabbix-server zabbix-agent httpd
    *   systemctl enable zabbix-server zabbix-agent httpd
*   然后就可以访问了ip/zabbix
    *   默认帐号密码Admin/zabbix
## 修改为中文
*   打开Zabbix界面，Administrator-Users 选择语言-Chinese(zh_CN)-update 
*   解决乱码
    *   从Window服务器找到相应的字休复制到zabbix Server服务器上：
    
         控制面板-->字体-->选择一种中文字库例如“楷体”（simkai.ttf）
    *   将我们选择的字体文件上传到zabbix web服务，cd /usr/share/zabbix/fonts目录下（rpm安装目录）
    *   修改此vim /usr/share/zabbix/include/defines.inc.php文件中字体的配置，
        将里面关于字体设置从graphfont替换成simkai
        *   define('ZBX_GRAPH_FONT_NAME',           'simkai'); // font file name

## 关闭selinux
*   vim /etc/selinux/config
    *   SELINUX=disabled
*   setenforce 0
*   getenforce


## docker搭建zabbix
本次使用docker搭建zabbix的组合是mysql+docker+zabix-server
*   先安装数据库mysql
```
    docker run --name zabbix-mysql-server --hostname zabbix-mysql-server \
    -e MYSQL_ROOT_PASSWORD="123456" \
    -e MYSQL_USER="zabbix" \
    -e MYSQL_PASSWORD="123456" \
    -e MYSQL_DATABASE="zabbix" \
    -p 3306:3306 \
    -d mysql:5.7.22 \
    --character-set-server=utf8 --collation-server=utf8_bin
```

*   创建zabbix-server
```
    docker run  --name zabbix-server-mysql --hostname zabbix-server-mysql \
    --link zabbix-mysql-server:mysql \
    -e DB_SERVER_HOST="mysql" \
    -e MYSQL_USER="zabbix" \
    -e MYSQL_DATABASE="zabbix" \
    -e MYSQL_PASSWORD="123456" \
    -v /etc/localtime:/etc/localtime:ro \
    -v /data/docker/zabbix/alertscripts:/usr/lib/zabbix/alertscripts \
    -v /data/docker/zabbix/externalscripts:/usr/lib/zabbix/externalscripts \
    -p 10051:10051 \
    -d zabbix/zabbix-server-mysql \
    
```
*   最后web-nginx
```
    docker run --name zabbix-web-nginx-mysql --hostname zabbix-web-nginx-mysql \
    --link zabbix-mysql-server:mysql \
    --link zabbix-server-mysql:zabbix-server \
    -e DB_SERVER_HOST="mysql" \
    -e MYSQL_USER="zabbix" \
    -e MYSQL_PASSWORD="123456" \
    -e MYSQL_DATABASE="zabbix" \
    -e ZBX_SERVER_HOST="zabbix-server" \
    -e PHP_TZ="Asia/Shanghai" \
    -p 8000:80 \
    -p 8443:443 \
    -d \
    zabbix/zabbix-web-nginx-mysql
```
*   登录访问测试

浏览器访问ip:8000查看
默认登录
username:Admin
password:zabbix
这里说明下，mysql没做数据卷的映射，nginx也没做数据卷的映射，在实际生产环境下，最好做数据映射。防止数据丢失。

*   docker-zabbbix-agent的安装以及链接zabbix-server
```
docker run --name zabbix-agent --link zabbix-server-mysql:zabbix-server -d zabbix/zabbix-agent:latest
```
```docker run --name some-zabbix-agent -p 10050:10050 -e ZBX_HOSTNAME="192.168.1.109" -e ZBX_SERVER_HOST="192.168.1.109" -e ZBX_SERVER_PORT=10051 -d zabbix/zabbix-agent:3.2.5
```
最后需要在web端将，zabbix-agent添加到zabbix-server的host列表里面。