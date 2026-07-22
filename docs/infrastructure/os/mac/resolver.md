---
title: macOS 使用 /etc/resolver 配置分域 DNS
---

# macOS 使用 `/etc/resolver` 配置分域 DNS

`/etc/resolver/` 是 macOS 的分域 DNS 配置目录。它可以让指定域名及其子域名使用特定 DNS 服务器，而其他域名仍走系统默认 DNS。

典型用途：

```text
公司内网域名  -> 公司或 VPN DNS
开发测试域名  -> 本地 DNS
其他公网域名  -> 系统默认 DNS
```

## 基本规则

在 `/etc/resolver/` 下创建与目标域名同名的文件。例如，`/etc/resolver/company.internal` 的内容如下：

```conf
nameserver 10.0.0.53
```

这样，`company.internal` 以及其所有子域名（如 `api.company.internal`）都会通过 `10.0.0.53` 解析；`github.com` 等其他域名仍使用系统默认
DNS。

## 创建配置

```bash
sudo mkdir -p /etc/resolver

sudo tee /etc/resolver/company.internal >/dev/null <<'EOF'
nameserver 10.0.0.53
EOF
```

确认配置内容：

```bash
cat /etc/resolver/company.internal
```

## 匹配优先级

规则按最长域名后缀匹配。假设存在以下两个文件：

```text
/etc/resolver/company.internal
/etc/resolver/dev.company.internal
```

```conf
# /etc/resolver/company.internal
nameserver 10.0.0.53
```

```conf
# /etc/resolver/dev.company.internal
nameserver 10.0.0.54
```

则 `www.company.internal` 使用 `10.0.0.53`，而 `api.dev.company.internal` 同时匹配两条规则，会优先使用更具体的
`dev.company.internal` 规则，即 `10.0.0.54`。

## 常用配置项

```conf
nameserver 10.0.0.53
nameserver 10.0.0.54
port 53
timeout 5
options attempts:2
```

| 配置项               | 说明                         |
|----------------------|------------------------------|
| `nameserver`         | DNS 服务器地址               |
| `port`               | DNS 端口，默认为 `53`        |
| `timeout`            | 查询超时时间                 |
| `options attempts:2` | 查询尝试次数                 |
| `search`             | 补全短主机名；不用于域名分流 |

通常只需要设置一个或多个 `nameserver`。

## 本地 DNS 示例

若本地 DNS 服务监听在 `127.0.0.1:5353`，可创建 `/etc/resolver/test`：

```conf
nameserver 127.0.0.1
port 5353
```

之后，`api.test`、`mysql.test` 等域名都会交由本机 `5353` 端口上的 DNS 服务解析。

## 验证与排查

查看系统当前加载的 DNS 配置，并定位目标规则：

```bash
scutil --dns
scutil --dns | grep -A 5 'company.internal'
```

使用系统解析器测试：

```bash
dscacheutil -q host -a name api.company.internal
ping api.company.internal
curl https://api.company.internal
```

`dig` 和 `nslookup` 不一定走 macOS 的系统 DNS 解析链路，因此不能只依据它们判断 `/etc/resolver` 是否生效。

## 删除与缓存刷新

删除规则：

```bash
sudo rm /etc/resolver/company.internal
```

如果仍受到旧缓存影响，刷新 DNS 缓存：

```bash
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
```

## 与 Linux `/etc/resolv.conf` 的区别

Linux 的 `/etc/resolv.conf` 一般用于配置全局默认 DNS：

```conf
nameserver 1.1.1.1
nameserver 8.8.8.8
```

它通常不像 macOS 的 `/etc/resolver/` 一样按域名分流。Linux 若需实现分域 DNS，可使用 `systemd-resolved`、NetworkManager 或
DNS 转发工具。

## 注意事项

1. 文件名使用域名，不需要为每个完整主机名单独建文件。
2. 子域名会自动匹配，且更具体的域名规则优先。
3. 避免创建 `/etc/resolver/local`；`.local` 通常由 Bonjour/mDNS 使用，可能产生冲突。
4. `/etc/resolver/` 只影响 DNS 解析，不负责代理、路由或端口转发。
