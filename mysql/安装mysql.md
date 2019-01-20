##Windows解压安装   
*   下载mysql
   *    进入官网：https://www.mysql.com/
        单击【Downloads】选项卡
        最下面有个【 MySQL Community Edition  (GPL)】，单击【Community (GPL) Downloads »】
        单击【MySQL Community Server (GPL)】下的【DOWNLOAD】
        在弹出的页面上下载【Windows (x86, 64-bit), ZIP Archive】
*   安装mysql
   压缩包相当于免安装文件，要想使用它，需要配置正确，并通过服务来启动数据库服务。
*   把压缩包解压到你喜欢的位置
    本示例解压到：D:\mysql-5.7.13-winx64，文件夹下
*   创建my.ini文件，内容如下：
    ```
    [mysql]
    # 设置mysql客户端默认字符集
    default-character-set=utf8 
    [mysqld]
    #设置3306端口
    port = 3306 
    # 设置mysql的安装目录
    basedir=C:\mysql-5.7.12-winx64
    # 设置mysql数据库的数据的存放目录
    datadir=C:\mysql-5.7.12-winx64\data
    # 允许最大连接数
    max_connections=200
    # 服务端使用的字符集默认为8比特编码的latin1字符集
    character-set-server=utf8
    # 创建新表时将使用的默认存储引擎
    default-storage-engine=INNODB
    ```
   *    注意，basedir和datadir是必须要配置的，basedir就是你解压的目录。官方文档上说，如果你喜欢用反斜杠，则要用双反斜杠，斜杠的话就不用这样。即：D:\\mysql-5.7.13-winx64\\ 或：D:/mysql-5.7.13-winx64/
   由于本人喜欢把数据库的数据文件独立出来，所以就把datadir配置到其它地方，方便管理。另外，创建该目录。
   
*   配置环境变量
    *    添加一个名叫 MYSQL_HOME 的变量。
    *    修改Path变量，在末尾添加 %MYSQL_HOME%\bin 
*   安装mysql服务
    *   以管理员身份运行cmd，进入mysql的bin目录。
    *   初始化数据库文件
    *   mysqld  --initialize
    *   初始化成功后，会在datadir目录下生成一些文件，其中，xxx.err文件里说明了root账户的临时密码。那行大概长这样：
    *   2016-07-24T05:19:20.152135Z 1 [Note] A temporary password is generated for root@localhost: bL2uuwuf0H(X
   
        即密码是：bL2uuwuf0H(X
   
*   注册mysql服务
    *   mysqld -install MySQL
*   启动mysql服务
    *   net start MySQL
   
*   修改root密码
    *   输入以下命令，回车，然后输入上面的默认密码：
    *   mysql -u root -p
   
    *   进入MySQL命令行模式后，输入如下命令，命令中的 new_password 为root账号的新密码，请修改它。
    *   ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';
###在线yum安装
*   下载mysql源安装包
    *   wget http://dev.mysql.com/get/mysql57-community-release-el7-8.noarch.rpm
    *   yum localinstall mysql57-community-release-el7-8.noarch.rpm
*   检查mysql源是否安装成功
    *   检查mysql源是否安装成功
    *   可以修改vim /etc/yum.repos.d/mysql-community.repo源，改变默认安装的mysql版本。比如要安装5.6版本，
    将5.7源的enabled=1改成enabled=0。然后再将5.6源的enabled=0改成enabled=1即可
*   安装MySQL
    *   yum install mysql-community-server
*   启动MySQL服务
    *   systemctl start mysqld
*   开机启动
    *   systemctl enable mysqld
    *   systemctl daemon-reload
*   修改密码策略
    *   在vim /etc/my.cnf文件添加validate_password_policy配置，指定密码策略
    *   选择0（LOW），1（MEDIUM），2（STRONG）其中一种，选择2需要提供密码字典文件
        *    validate_password_policy=0
    *   如果不需要密码策略，添加my.cnf文件中添加如下配置禁用即可：
        *   validate_password = off
*   修改root本地登录密码
    *   mysql安装完成之后，在/var/log/mysqld.log文件中给root生成了一个默认密码。
        通过下面的方式找到root默认密码，然后登录mysql进行修改
        *   grep 'temporary password' /var/log/mysqld.log
        *   mysql -uroot -p
        *   ALTER USER 'root'@'localhost' IDENTIFIED BY 'password';
        *   或者set password for 'root'@'localhost'=password('password'); 
*   添加远程登录用户
    *    GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' IDENTIFIED BY 'root' WITH GRANT OPTION;
*   配置
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
