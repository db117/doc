---
title: k8s相关
---

### 知识点思维导图

<iframe id="embed_dom" name="embed_dom" frameborder="0" style="display:block;width:525px; height:745px;" src="https://www.processon.com/embed/62d140ca5653bb2b401e5e8a"></iframe>

### 服务之间访问

>通过 **<服务名称>.<命名空间>.svc.cluster.local**  即可访问
>
>​    	 **<服务名称>.<命名空间>**  也是可以访问的
>
>同命名空间可以直接通过 **<服务名称>** 访问

### secret配置tls

```
apiVersion: v1
kind: Secret
metadata:
  name: tls-name
  namespace: kuboard   # 需指定命名空间，一个secret只能在一个命名空间生效
data:
	# 直接把证书，秘钥base64编码放入即可
  tls.crt: Base64crt
  tls.key: Base64key
type: kubernetes.io/tls
```

