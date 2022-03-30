---
title: ubuntu安装docker
---
## 更新你的apt源

 ```
 sudo apt-get update
 ```

## 安装包以允许apt通过HTTPS使用存储库

```
sudo apt-get install \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg-agent \
    software-properties-common
```



## 添加Docker的官方GPG密钥

```
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -

sudo apt-key fingerprint 0EBFCD88
```



## 使用以下命令设置稳定存储库

```
sudo add-apt-repository \
   "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
   $(lsb_release -cs) \
   stable"


```



## 安装docker-ce

```
sudo apt-get update

sudo apt-get install docker-ce docker-ce-cli containerd.io
```



## 查看是否安装成功

```
docker --version
```



## 卸载

```
sudo apt-get remove docker-ce docker-ce-cli containerd.io
```



