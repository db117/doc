---
title: postman预请求处理
---

[官方文档](https://learning.postman.com/docs/getting-started/introduction/)

### 设置属性

```
pm.environment.set("key", value);
```



### 获取时间

```javascript
var moment = require('moment');
var date = moment().format("YYYYMMDDHHmmss");
```

### 随机数 

```javascript
// 随机数 
var randomNumber = Math.round(Math.random() * 1000000 * 100000);
```

### 获取请求body

```javascript
// 请求参数
var obj = pm.request.body.raw;
var param = JSON.parse(obj)
```

### 生成sign

```javascript
var accessToken=CryptoJS.MD5(pivateKey+date+JSON.stringify(param.biz_params)).toString();
```

#### 添加header

```
pm.request.headers.add({
  key: "aad-accesstoken",
  value: "{{aad-accesstoken}}"});
```

