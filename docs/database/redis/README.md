---
title: redis
---
> [CRUG网站 (redis.cn)](http://www.redis.cn/)

## 备忘单

#### 连接服务

```
# 直接输入密码
redis-cli -h <host> -p <port> -a <password>

# 先登录后输入密码
redis-cli -h <host> -p <port>
auth <password>

# 退出
quit
```



#### 锁

```
SET <key>  <value> NX EX <max-lock-time>
```



#### 字符串

```

```

