---
title: Kubectl常用
---

##  linux安装

*	下载
	*	最新版本
	```
	curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
	```
	*	指定版本
	```
	curl -LO https://dl.k8s.io/release/v1.20.0/bin/linux/amd64/kubectl
	```
* 安装
  ```
    sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
  ```
* 配置
> 配置文件位置 ~/kube/config 

------



## Kubectl 自动补全

### BASH

```bash
source <(kubectl completion bash) # 在 bash 中设置当前 shell 的自动补全，要先安装 bash-completion 包。
echo "source <(kubectl completion bash)" >> ~/.bashrc # 在您的 bash shell 中永久的添加自动补全
```

您还可以为 `kubectl` 使用一个速记别名，该别名也可以与 completion 一起使用：

```bash
alias k=kubectl
complete -F __start_kubectl k
```

### ZSH

```bash
source <(kubectl completion zsh)  # 在 zsh 中设置当前 shell 的自动补全
echo "[[ $commands[kubectl] ]] && source <(kubectl completion zsh)" >> ~/.zshrc # 在您的 zsh shell 中永久的添加自动补全
```

------



## 常用命令

### pod

* 重启

  1. 强制替换Pod 
       ```
       kubectl replace --force -f xxxx.yaml
       ```

  2. 调整副本来重启
       ```
       kubectl scale deployment {deployment} --replicas=0 -n {namespace}
       kubectl scale deployment {deployment} --replicas=1 -n {namespace}
       ```
  3. 直接删除
       ```
       kubectl delete pod {podname} -n {namespace}
          
       kubectl delete replicaset {rs_name} -n {namespace}
      ```
  4. 没有 yaml 文件，直接使用的 Pod 对象

       ```
       kubectl get pod {podname} -n {namespace} -o yaml | kubectl replace --force -f -
       ```


### 命名空间

* 创建命名空间

    ```
    kubectl create namespace test-env 
    ```

* 设置默认命名空间

    ```
    kubectl config set-context default --namespace=${work_namespace}
    ```

### Secret

> 创建docker访问secret
> 需要在Deployment中指定

    kubectl create secret docker-registry my-secret --docker-server=DOCKER_REGISTRY_SERVER --docker-username=DOCKER_USER --docker-password=DOCKER_PASSWORD --docker-email=DOCKER_EMAIL

```
spec:
  imagePullSecrets:
  - name: my-secret
```

### 污点

* **打上污点**

  > NoSchedule:[K8S](https://www.iyunw.cn/archives/tag/k8s/)node添加这个effecf类型污点，新的不能容忍的pod不能再调度过来，但是老的运行在node上不受影响
  >
  > NoExecute：K8Snode添加这个effecf类型污点，新的不能容忍的pod不能调度过来，老的pod也会被驱逐
  >
  > PreferNoSchedule：pod会尝试将pod分配到该节点

    ```
    kubectl taint nodes node1 key=value:NoSchedule
  
    kubectl taint nodes node1 key=value:NoExecute
  
    kubectl taint nodes node1 key=value:PreferNoSchedule
    ```
  
* **删除污点**

  * > 加上[-] 

  ```
    kubectl taint nodes node1 key=value:NoSchedule-
  
    kubectl taint nodes node1 key=value:NoExecute-
  
    kubectl taint nodes node1 key=value:PreferNoSchedule-
  ```

  ##### **pod设置容忍**

  ```
  tolerations:  #containers同级
      - key: "key1"          #能容忍的污点key
        operator: "Equal"    #Equal等于表示key=value ， Exists不等于，表示当值不等于下面value正常
        value: "value1"      #值
        effect: "NoExecute"  #effect策略，见上面
        tolerationSeconds: 3600  #原始的pod多久驱逐，注意只有effect: "NoExecute"才能设置，不然报错
  ```
  
  

### 查询配置文件结构

> 不清楚某些配置文件怎么配置的情况下使用

```
kubectl explain ServiceMonitor.spec.endpoints
```

