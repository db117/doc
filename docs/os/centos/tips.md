
####centos 开启DHCP服务
*   vim /etc/sysconfig/network-scripts/ifcfg-ens33
    
    把ONBOOT=no, 修改成ONBOOT=yes
   
    service network restart
   
    之后， ifconfig查看一下， 是否已经自动获取了IP地址。
    
####CentOS 7 开放防火墙端口 命令
*   关闭防火墙
    *   systemctl stop firewalld.service           
        *   停止firewall
    *   systemctl disable firewalld.service        
        *   禁止firewall开机启动
*   开启端口
    *   firewall-cmd --zone=public --add-port=80/tcp --permanent
    *   命令含义：
        *   --zone #作用域
        *  --add-port=80/tcp #添加端口，格式为：端口/通讯协议
        * --permanent #永久生效，没有此参数重启后失效
*   重启防火墙
    *   firewall-cmd --reload
*   常用命令介绍
    *   firewall-cmd --state                           
        *   查看防火墙状态，是否是running
    *   firewall-cmd --reload                          
        *   重新载入配置，比如添加规则之后，需要执行此命令
    *   firewall-cmd --get-zones                       
        *   列出支持的zone
    *   firewall-cmd --get-services                    
        *   列出支持的服务，在列表中的服务是放行的
    *   firewall-cmd --query-service ftp               
        *   查看ftp服务是否支持，返回yes或者no
    *   firewall-cmd --add-service=ftp                 
        *   临时开放ftp服务
    *   firewall-cmd --add-service=ftp --permanent     
        *   永久开放ftp服务
    *   firewall-cmd --remove-service=ftp --permanent  
        *   永久移除ftp服务
    *   firewall-cmd --add-port=80/tcp --permanent     
        *   永久添加80端口 
    *   iptables -L -n                                 
        *   查看规则，这个命令是和iptables的相同的
    *   man firewall-cmd                               
        *   查看帮助
*   CentOS 7.0默认使用的是firewall作为防火墙，使用iptables必须重新设置一下
    *  直接关闭防火墙
    *   systemctl stop firewalld.service        
        *   停止firewall
    *   systemctl disable firewalld.service     
        *   禁止firewall开机启动

    *   设置 iptables service
        *   yum -y install iptables-services
    *   如果要修改防火墙配置，如增加防火墙端口3306
        *   vi /etc/sysconfig/iptables 
    *   增加规则
        *   -A INPUT -m state --state NEW -m tcp -p tcp --dport 3306 -j ACCEPT
    
    *    保存退出后
        *   systemctl restart iptables.service #重启防火墙使配置生效
        *   systemctl enable iptables.service #设置防火墙开机启动
    *   最后重启系统使设置生效即可。

####安装rz和sz命令
yum install lrzsz  

#本地yum包制作

####收集rpm安装包
*   要制作本地源，那么首先得需要rpm包,我们知道安装一个glibc.i686
    可能需要很多其他的依赖的rpm包，如果依赖包过多，
    我们不大可能通过手动整理的到，所以我们可以通过使用yum安装一次，来获取众多的rpm安装包。
    yum 是有缓存安装包的功能的，只是默认是不缓存安装包的。
    *   编辑  vim /etc/yum.conf 文件中, 将文件中的 keepcache=0 改为 keepcache=1,
     开启缓存功能（ps 收集好了rpm安装包后记得关闭缓存功能哦，否则/var/cache/yum 下会有很多rpm包哦）  
    *   搜索/var/cache/yum目录下所有的rpm包（
    之前没开启缓存功能，所有不会有无关的rpm包），将其拷贝至名为glibc的空文件夹下。
    将glibc 文件夹移动至一个名为localyumsource的空文件夹下。
 
#### CentOs rpm安装警告
*   原因：这是由于yum安装了旧版本的GPG keys造成的
    解决办法：后面加上
     --force --nodeps
     
     
####新建用户并授权
*   创建一个用户名为：es
    *   adduser es
*   为这个用户初始化密码，linux会判断密码复杂度，不过可以强行忽略：
    *   passwd es
    
####开机启动项
*   使用 systemctl list-unit-files  查看开机启动项 

*   systemctl is-enabled redis.service  是否开机启动