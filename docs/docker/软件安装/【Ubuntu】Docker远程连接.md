---
title: 【Ubuntu】Docker远程连接
---

## 开启宿主机的2375端口

- 配置文件

  ```
  /lib/systemd/system/docker.service
  
  ExecStart=/usr/bin/dockerd -H tcp://0.0.0.0:2375 -H unix:///var/run/docker.sock 
  ```

- 重启docker

  ```
  systemctl daemon-reload
  systemctl restart docker
  ```

## 临时开启远程端口

```
sudo dockerd -H unix:///var/run/docker.sock -H tcp://0.0.0.0:2375
```

