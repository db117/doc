---
title: IP代理
---
## 通过系统变量方式实现代理

```
System.setProperty("http.proxySet", "true");
System.setProperty("http.proxyHost", "127.0.0.1");
System.setProperty("http.proxyPort", "" + "7777");
```

所以请求都使用这个代理

针对https

```
System.setProperty("https.proxyHost", "127.0.0.1");
System.setProperty("https.proxyPort", "7777");
```

