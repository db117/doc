##需要下载软件
*   https://github.com/kohsuke/winsw
*   WinSW是一个可执行的二进制文件，可用于将自定义进程包装和管理为Windows服务。
    下载安装包后，您可以重命名winsw.exe为任何名称，例如myService.exe。
##配置xml
*   实例为启动java -jar renren-admin.jar
```
    <configuration>
     
     <!-- 服务的ID。在Windows系统中应该是唯一的-->
     <id>scl_web</id>
     <!-- 显示服务的名称 -->
     <name>scl_web</name>
     <!-- 服务描述 -->
     <description>scl_web</description>
     
     <!-- 应该启动的可执行文件的路径 -->
     <executable>java</executable>
     <arguments>-jar renren-admin.jar</arguments>
     <logmode>rotate</logmode>
   
   </configuration>
   ```
##安装服务
*   myService.exe install
    *   出现如下提示则成功创建服务
        ```
        2018-09-02 17:38:32,595 INFO  - Installing the service with id 'scl_web'
        ```
*   myService.exe 为自己修改的文件名称
##其他操作
*   install

     将服务安装到Windows服务控制器。此命令需要“ 安装指南”中描述的一些预备步骤。
*   uninstall

     卸载服务。以上相反的操作。
*   start

    开始服务。该服务必须已安装。
*   stop 
    
    停止服务
*   restart
    
    重启服务。如果该服务当前未运行，则此命令的作用如下start。
*   status 

    检查服务的当前状态。
*   此命令将一行打印到控制台。
    *   NonExistent 
        
        表示当前未安装该服务
    *   Started 
        
        表示该服务当前正在运行
    *   Stopped 
        
        表示该服务已安装但当前未运行。