---
title: kube-prometheus
---

> [kube-prometheus](https://github.com/prometheus-operator/kube-prometheus)
>
> 该项目使用`jsonnet`编写，上手有一定难度。
>
> 主要是在 k8s 中部署监控的一系列工具。
>
> -  [Prometheus Operator](https://github.com/prometheus-operator/prometheus-operator)
> - 高可用 [Prometheus](https://prometheus.io/)
> - 高可用 [Alertmanager](https://github.com/prometheus/alertmanager)
> - [Prometheus node-exporter](https://github.com/prometheus/node_exporter)
> - [Prometheus Adapter for Kubernetes Metrics APIs](https://github.com/DirectXMan12/k8s-prometheus-adapter)
> - [kube-state-metrics](https://github.com/kubernetes/kube-state-metrics)
> - [Grafana](https://grafana.com/)

## 简单使用

> 对默认的没有特别的要求情况下可以直接使用

### 前置条件

- go环境
- 安装jb(jsonnet-bundler)
    - 使用go安装
       ```
       go get github.com/jsonnet-bundler/jsonnet-bundler/cmd/jb
       ```
    - 使用brewhome安装
        ```shell
         brew install jsonnet-bundler
        ```
- gojsontoyaml安装
  ```
  go get github.com/brancz/gojsontoyaml
  ```

### 使用

- 修改配置文件
  
  > example.jsonnet
  
- 生成文件
  
  > 运行`./build.sh example.jsonnet` 会在`manifests`目录生成配置文件
- 格式化.jsonnet
  > 需要安装jsonnetfmt
  ```
    git clone git@github.com:google/go-jsonnet.git
    cd go-jsonnet
    go build ./cmd/jsonnetfmt
  ```
  > 使用vsCode的`jsonnet Formatter`插件
  > 或者使用下面代码直接格式化
  ```
   jsonnetfmt --indent 2 --max-blank-lines 2 --sort-imports --string-style s --comment-style s -i test.jsonnet  
  ```

### 注意事项

- vendor目录是jb生成的
- 除配置文件都是从github上面copy的不需要修改直接`jb update`

## 自定义配置

> 默认的配置,不满足的情况下。
>
> 实际上都是对生成的文件进行修改，如果不想写配置文件，可以直接对生成的文件进行修改使用。

```
local filter = {
  // 过滤某些通知，也可以对 alertmanager-config.yaml 添加抑制配置
  kubernetesControlPlane+:: {
    prometheusRule+: {
      spec+: {
        groups: std.filter(
          function(group)
            group.name != 'kubernetes-system-scheduler'
            && group.name != 'kubernetes-system-controller-manager',
          super.groups
        ),
      },
    },
  },
};

local update = {
	// 对默认的配置进行修改
  // 调整报警阈值
  kubernetesControlPlane+:: {
    prometheusRule+: {
      spec+: {
        groups: std.map(
          function(group)
            if group.name == 'kubernetes-resources' then
              group {
                rules: std.map(
                  function(rule)
                    if rule.alert == 'CPUThrottlingHigh' then
                      rule {
                        expr: |||
sum(increase(container_cpu_cfs_throttled_periods_total{container!="", }[5m])) by (container, pod, namespace)
                            /
                          sum(increase(container_cpu_cfs_periods_total{}[5m])) by (container, pod, namespace)
                            > ( 70 / 100 )
                        |||,
                      }
                    else
                      rule,
                  group.rules
                ),
              }
            else
              group,
          super.groups
        ),
      },
    },
  },
};

local kp =
  (import 'kube-prometheus/main.libsonnet') +
  (import 'kube-prometheus/addons/all-namespaces.libsonnet') + // 监听全部命名空间
  {
    values+:: {
      common+: {
        namespace: 'monitoring',  // 工作命名空间
        images+: {
          // 替换镜像
          kubeStateMetrics: 'bitnami/kube-state-metrics:' + $.values.common.versions.kubeStateMetrics,
        },
      },
      alertmanager+: {
        config: importstr 'alertmanager-config.yaml',  // alertmanager 配置文件
        replicas: 1,
      },
    },
    // 添加储存类
    prometheus+:: {
      prometheus+: {
        spec+: {
          retention: '30d',
          replicas: 1,
          storage: {
            volumeClaimTemplate: {
              apiVersion: 'v1',
              kind: 'PersistentVolumeClaim',
              spec: {
                accessModes: ['ReadWriteOnce'],
                resources: { requests: { storage: '100Gi' } },
                storageClassName: 'nfs-dynamic-class',
              },
            },
          },  // storage
        },  // spec
      },  // prometheus
    },  // prometheus
  } + filter + update;

// 下面的不要动
{ 'setup/0namespace-namespace': kp.kubePrometheus.namespace } +
{
  ['setup/prometheus-operator-' + name]: kp.prometheusOperator[name]
  for name in std.filter((function(name) name != 'serviceMonitor' && name != 'prometheusRule'), std.objectFields(kp.prometheusOperator))
} +
// serviceMonitor and prometheusRule are separated so that they can be created after the CRDs are ready
{ 'prometheus-operator-serviceMonitor': kp.prometheusOperator.serviceMonitor } +
{ 'prometheus-operator-prometheusRule': kp.prometheusOperator.prometheusRule } +
{ 'kube-prometheus-prometheusRule': kp.kubePrometheus.prometheusRule } +
{ ['alertmanager-' + name]: kp.alertmanager[name] for name in std.objectFields(kp.alertmanager) } +
{ ['blackbox-exporter-' + name]: kp.blackboxExporter[name] for name in std.objectFields(kp.blackboxExporter) } +
{ ['grafana-' + name]: kp.grafana[name] for name in std.objectFields(kp.grafana) } +
{ ['kube-state-metrics-' + name]: kp.kubeStateMetrics[name] for name in std.objectFields(kp.kubeStateMetrics) } +
{ ['kubernetes-' + name]: kp.kubernetesControlPlane[name] for name in std.objectFields(kp.kubernetesControlPlane) }
{ ['node-exporter-' + name]: kp.nodeExporter[name] for name in std.objectFields(kp.nodeExporter) } +
{ ['prometheus-' + name]: kp.prometheus[name] for name in std.objectFields(kp.prometheus) } +
{ ['prometheus-adapter-' + name]: kp.prometheusAdapter[name] for name in std.objectFields(kp.prometheusAdapter) }
```