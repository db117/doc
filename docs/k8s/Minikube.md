---
title: minikube常用
---



### macOS安装

```shell
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-darwin-amd64
sudo install minikube-darwin-amd64 /usr/local/bin/minikube
```

#### 添加镜像地址

```
minikube start  --registry-mirror=https://docker.mirrors.ustc.edu.cn  --vm-driver=docker  --base-image="anjone/kicbase" 
```

