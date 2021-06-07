---
title: k8s相关
---

### 服务之间访问

>通过 **<服务名称>.<命名空间>.svc.cluster.local**  即可访问
>
>​    	 **<服务名称>.<命名空间>**  也是可以访问的
>
>同命名空间可以直接通过 **<服务名称>** 访问

### 查询命名空间下所有资源

```
kubectl api-resources --verbs=list --namespaced -o name   | xargs -n 1 kubectl get --show-kind --ignore-not-found -l <label>=<value>  -n <命名空间>
```

