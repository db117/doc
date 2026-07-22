# macOS `/etc/resolver` 使用说明

## 一句话说明

`/etc/resolver/` 是 macOS 的 **分域 DNS 配置目录**，用于让不同域名通过不同的 DNS 服务器解析。

常见用途：

```text
公司内网域名  -> 公司或 VPN DNS
开发测试域名  -> 本地 DNS
其他公网域名  -> 系统默认 DNS
```

---

## 基本规则

在 `/etc/resolver/` 下创建一个文件， **文件名通常就是需要匹配的域名**。

例如：

```text
/etc/resolver/company.internal
```

内容：

```conf
nameserver 10.0.0.53
```

解析效果：

```text
api.company.internal  -> 10.0.0.53
www.company.internal  -> 10.0.0.53
github.com             -> 系统默认 DNS
```

`company.internal` 本身及它的所有子域名都会使用 `10.0.0.53`。

---

## 创建配置

```bash
sudo mkdir -p /etc/resolver

sudo tee /etc/resolver/company.internal >/dev/null <<'EOF2'
nameserver 10.0.0.53
EOF2
```

查看文件：

```bash
cat /etc/resolver/company.internal
```

---

## 最长后缀优先

macOS 会优先使用匹配范围更具体的规则。

假设存在：

```text
/etc/resolver/company.internal
/etc/resolver/dev.company.internal
```

配置如下：

```conf
# /etc/resolver/company.internal
nameserver 10.0.0.53
```

```conf
# /etc/resolver/dev.company.internal
nameserver 10.0.0.54
```

解析结果：

```text
www.company.internal      -> 10.0.0.53
api.dev.company.internal  -> 10.0.0.54
```

`api.dev.company.internal` 同时匹配两个规则，但 `dev.company.internal` 更具体，因此优先使用 `10.0.0.54`。

---

## 常用配置项

```conf
nameserver 10.0.0.53
nameserver 10.0.0.54
port 53
timeout 5
options attempts:2
```

常用字段：

| 配置                 | 作用                           |
|----------------------|--------------------------------|
| `nameserver`         | 指定 DNS 服务器                |
| `port`               | 指定 DNS 端口，默认是 `53`     |
| `timeout`            | 设置查询超时时间               |
| `options attempts:2` | 设置尝试次数                   |
| `search`             | 补全短主机名，不是域名分流规则 |

通常只配置 `nameserver` 就够了。

---

## 本地 DNS 示例

假设本地 DNS 服务监听：

```text
127.0.0.1:5353
```

可以创建：

```text
/etc/resolver/test
```

内容：

```conf
nameserver 127.0.0.1
port 5353
```

之后：

```text
api.test
mysql.test
```

都会交给本机 `5353` 端口上的 DNS 服务解析。

---

## 查看是否生效

查看 macOS 当前加载的 DNS 配置：

```bash
scutil --dns
```

可以查找对应域名：

```bash
scutil --dns | grep -A 5 'company.internal'
```

测试系统解析器：

```bash
dscacheutil -q host -a name api.company.internal
ping api.company.internal
curl https://api.company.internal
```

注意：`dig` 和 `nslookup` 不一定完全使用 macOS 的系统 DNS 解析链路，因此不能只根据它们判断 `/etc/resolver` 是否生效。

---

## 删除规则

```bash
sudo rm /etc/resolver/company.internal
```

如果仍然受到旧缓存影响，可以刷新 DNS 缓存：

```bash
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
```

---

## 与 Linux `/etc/resolv.conf` 的区别

Linux 的 `/etc/resolv.conf` 通常用于配置 **全局默认 DNS**，例如：

```conf
nameserver 1.1.1.1
nameserver 8.8.8.8
```

它通常不会像 macOS `/etc/resolver/` 一样，根据域名选择不同的 DNS。

简单理解：

```text
macOS /etc/resolver/  -> 按域名分流 DNS
Linux /etc/resolv.conf -> 配置默认 DNS
```

Linux 若要实现类似的分域 DNS，通常需要使用 `systemd-resolved`、NetworkManager 或其他 DNS 转发工具。

---

## 注意事项

1. 文件名应使用域名，不要写成完整主机名规则列表。
2. 子域名会自动匹配，不需要为每个子域名单独创建文件。
3. 更具体的域名规则优先。
4. 不要随意创建 `/etc/resolver/local`，`.local` 通常由 Bonjour/mDNS 使用，可能发生冲突。
5. `/etc/resolver/` 只负责 DNS 解析，不负责代理、路由或端口转发。

---

## 重点总结

```text
配置目录：/etc/resolver/
文件名称：需要匹配的域名
主要内容：nameserver DNS地址
匹配规则：域名后缀最长匹配
主要用途：公司内网、VPN、本地开发环境的 DNS 分流
```

最小可用配置：

```text
文件：/etc/resolver/company.internal
```

```conf
nameserver 10.0.0.53
```
