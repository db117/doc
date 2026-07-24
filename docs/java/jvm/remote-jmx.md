---
title: Java 远程 JMX
---

# Java 远程 JMX

本地诊断优先使用 JDK 的 Attach API 或本地 `jconsole`，不要为本地访问额外暴露远程端口。

## 生产环境远程访问

远程 JMX 应只在内网开放，并同时固定 RMI 端口、启用密码认证和 TLS：

```text
-Dcom.sun.management.jmxremote.port=10053
-Dcom.sun.management.jmxremote.rmi.port=10053
-Djava.rmi.server.hostname=jmx.example.internal
-Dcom.sun.management.jmxremote.authenticate=true
-Dcom.sun.management.jmxremote.password.file=/etc/myapp/jmxremote.password
-Dcom.sun.management.jmxremote.access.file=/etc/myapp/jmxremote.access
-Dcom.sun.management.jmxremote.ssl=true
-Dcom.sun.management.jmxremote.ssl.need.client.auth=true
-Dcom.sun.management.jmxremote.registry.ssl=true
```

还需要为 JVM 和客户端分别配置可信的密钥库与信任库。密码文件包含明文密码，必须只允许运行应用的用户读写：

```bash
chmod 600 /etc/myapp/jmxremote.password
```

`jmxremote.access` 中的监控账号应使用 `readonly`；只向受信任的运维账号授予 `readwrite`。

## 禁止用于生产的配置

不要同时设置以下两项：

```text
-Dcom.sun.management.jmxremote.authenticate=false
-Dcom.sun.management.jmxremote.ssl=false
```

这会使知道地址和端口的任意用户能够访问甚至控制 JVM。完整的属性说明见
[Oracle JMX 监控与管理文档](https://docs.oracle.com/en/java/javase/21/management/monitoring-and-management-using-jmx-technology.html)。
