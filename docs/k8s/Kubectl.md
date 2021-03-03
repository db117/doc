---
title: Kubectl常用
---

###  linux安装

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



### 常用命令

#### pod

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


#### 命名空间

* 创建命名空间

    ```
    kubectl create namespace test-env 
    ```

* 设置默认命名空间

    ```
    kubectl config set-context default --namespace=${work_namespace}
    ```

#### Secret

> 创建docker访问secret
> 需要在Deployment中指定

    kubectl create secret docker-registry my-secret --docker-server=DOCKER_REGISTRY_SERVER --docker-username=DOCKER_USER --docker-password=DOCKER_PASSWORD --docker-email=DOCKER_EMAIL

```
spec:
  imagePullSecrets:
  - name: my-secret
```

