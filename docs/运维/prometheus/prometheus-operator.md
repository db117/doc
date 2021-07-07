---
title: prometheus-operator
---



## 介绍

> [prometheus-operator/kube-prometheus: Use Prometheus to monitor Kubernetes and applications running on Kubernetes (github.com)](https://github.com/prometheus-operator/kube-prometheus)
>
> 通过自定义资源来配置管理各种组件
>
> 通过各种 `config-reloader` 来修改各种配置

**自定义资源**

- **`Prometheus`**, 定义了一个Prometheus deployment。
- **`Alertmanager`**,定义了一个 Alertmanager deployment.
- **`ThanosRuler`**, 定义了一个 Thanos Ruler deployment.
- **`ServiceMonitor`**,定义一组`service`端点，prometheus 主动会拉取数据
- **`PodMonitor`**, 定义一组`pod`端点，prometheus 主动会拉取数据
- **`Probe`**, 支持对`ingress`静态url进行数据拉取
- **`PrometheusRule`**, 定义`rule`规则
- **`AlertmanagerConfig`**, 定义报警规则

## 简单使用

可直接 clone 项目使用

```
# 先创建命名空间，已经自定义资源。然后在创建一系列资源
kubectl create -f manifests/setup
until kubectl get servicemonitors --all-namespaces ; do date; sleep 1; echo ""; done
kubectl create -f manifests/
```

全部删除

```
kubectl delete --ignore-not-found=true -f manifests/ -f manifests/setup
```

需要自己来添加 ingress 来访问service

- 告警服务 `alertmanager-main:9093`
- prometheus `prometheus-k8s:9090`
- Grafana `grafana:3000`

默认是没有配置报警接收器，需要修改配置。详情见后面。

## 普通使用

> 通过自定义的`k8s`组件对各种服务进行动态配置
>
> 可以通过简单的k8s自定义资源对整个监控系统进行配置

- ServiceMonitor

  > 选择一部分 `service`来生成 `target`配置。

  ```
  apiVersion: monitoring.coreos.com/v1
  kind: ServiceMonitor
  metadata:
    labels:
      app.kubernetes.io/name: backend
    name: backend
    namespace: hillinsight
  spec:
    endpoints:											# 定义一组端点
      - interval: 10s 							# 拉取周期
        path: /actuator/prometheus  # 路径
        port: backend-port   				# 端口
        scheme: http  							# 请求方式
        basicAuth: ***  						# 认证
        bearerTokenFile: 						# 权限认证
        metricRelabelings:  				# 指标处理
    jobLabel: backend								# 对拉取的数据添加 label
    namespaceSelector: 							# 命名空间选择
      matchNames:
        - test
    selector:  											# 选择服务
      matchLabels:
        prometheus: backend
  
  ```

- PodMonitor

  > 选择一部分 `pod`来生成 `target`配置。

  ```
  apiVersion: monitoring.coreos.com/v1
  kind: PodMonitor
  metadata:
    labels:
      app.kubernetes.io/name: backend
    name: backend
    namespace: hillinsight
  spec:
    podMetricsEndpoints:						# 定义一组端点
      - interval: 10s 							# 拉取周期
        path: /actuator/prometheus  # 路径
        port: backend-port   				# 端口
        scheme: http  							# 请求方式
        basicAuth: ***  						# 认证
        bearerTokenFile: 						# 权限认证
        metricRelabelings:  				# 指标处理
    jobLabel: backend								# 对拉取的数据添加 label
    namespaceSelector: 							# 命名空间选择
      matchNames:
        - test
    selector:  											# 选择 pod
      matchLabels:
        prometheus: backend
  
  
  ```

- PrometheusRule

  > 添加 `Prometheus`的报警规则

  ```
  apiVersion: monitoring.coreos.com/v1
  kind: PrometheusRule
  metadata:
    annotations: {}
    labels:
      prometheus: k8s
    name: main-rules
    namespace: monitoring
  spec:
    groups:
      - name: groupName  				# 分组名称
        rules:
          - alert: alertName  	# 报警名称
            annotations:
              description: desc # 详情
              runbook_url: url  # 点击后访问的地址
              summary: test  		# 概要
            expr: 							# 规则表达式
            for: 10m  					# 持续时间，满足后才报警
  ```

- AlertmanagerConfig

  > 修改通知规则，`Prometheus`生成报警后，发送到 `Alertmanager`。进行分组，抑制，通知。
  >
  > 简单使用，不建议使用。`kube-prometheus`中并没有添加支持。
  >
  > 如需修改可以直接修改 `alertmanager-main`Secret

  