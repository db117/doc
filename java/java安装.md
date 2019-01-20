##Linux压缩包安装jdk
*   在要安装的目录解压压缩包
    *   tar -xzvf  jdk***.tar.gz
*   配置环境变量
    *   vim /etc/profile
    ```
    export JAVA_HOME=/usr/java/jdk1.8
    export CLASSPATH=$JAVA_HOME/lib/
    export PATH=$PATH:$JAVA_HOME/bin
    export PATH JAVA_HOME CLASSPATH
        ```
*   加载环境变量使文件立即生效
    *   source /etc/profile 