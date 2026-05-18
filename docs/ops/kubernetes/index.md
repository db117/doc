---
title: Kubernetes
---

# Kubernetes

Kubernetes 文档、kubectl 命令和集群资源操作笔记。

## 文档

- [kubectl](./kubectl.md)：安装、常用命令、Secret 和节点调度。
- [kubectl 备忘单](./kubectl-cheatsheet.md)：kubectl 常用命令速查。

## 官方资料

- [Kubernetes 文档](https://kubernetes.io/zh-cn/docs/home/)
- [kubectl 备忘单](https://kubernetes.io/zh-cn/docs/reference/kubectl/cheatsheet/)
- [Kubectl 命令参考](https://kubernetes.io/docs/reference/generated/kubectl/kubectl-commands)
- [Kubernetes GitHub](https://github.com/kubernetes)

## 知识点思维导图

<iframe id="embed_dom" name="embed_dom" frameborder="0" style="display:block;width:525px; height:745px;" src="https://www.processon.com/embed/62d140ca5653bb2b401e5e8a"></iframe>

## 服务之间访问

通过 `<服务名称>.<命名空间>.svc.cluster.local` 即可访问服务。

同命名空间可以直接通过 `<服务名称>` 访问，`<服务名称>.<命名空间>` 也可以访问。

## Secret 配置 TLS

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: tls-name
  namespace: kuboard
data:
  tls.crt: Base64crt
  tls.key: Base64key
type: kubernetes.io/tls
```
