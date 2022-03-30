---
title: docker阿里云镜像安装
---
*   配置docker阿里云yum源 (直接执行下面的命令即可)
```cat >>/etc/yum.repos.d/docker.repo<<EOF
   [docker-ce-edge]
   name=Docker CE Edge - \$basearch
   baseurl=https://mirrors.aliyun.com/docker-ce/linux/centos/7/\$basearch/edge
   enabled=1
   gpgcheck=1
   gpgkey=https://mirrors.aliyun.com/docker-ce/linux/centos/gpg
   EOF
```
*   yum 方式安装 docker
``` 
    yum -y install docker-ce
    
    
    ### 查看docker版本
    docker --version  
    
    ### 开机启动 启动docker
    systemctl enable docker
    systemctl start docker
```