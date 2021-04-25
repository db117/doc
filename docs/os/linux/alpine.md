---
title: alpine
---

# Alpine

## 网络工具

- telnet：`busybox-extras`
- net-tools: `net-tools`
- tcpdump: `tcpdump`
- wget: `wget`
- dig nslookup: `bind-tools`
- curl: `curl`
- nmap: `nmap`
- wget ifconfig nc traceroute.. : `busybox`
- ssh: `openssh-client`
- ss iptables: `iproute2`
- ethtool: `ethtool`

```
apk add --no-cache --virtual .persistent-deps \
                curl \
		            tcpdump \
                iproute2 \
                bind-tools \
                ethtool \
                busybox-extras \
                libressl \
                openssh-client \
		            busybox
```

