---
title: postman预请求处理
---

[官方文档](https://learning.postman.com/docs/getting-started/introduction/)

### 内置动态变量

> [Dynamic variables | Postman Learning Center](https://learning.postman.com/docs/writing-scripts/script-references/variables-list/)
>
> 在脚本中使用需要用`pm.environment.replaceIn(variableName:String)`替换，
>
> 如`var timestamp = pm.environment.replaceIn("{{$timestamp}}");`



- **`$guid `**  ：uuid
- **`$timestamp`**：时间戳（秒）
- **`$isoTimestamp`**：2020-06-09T21:10:36.177Z
- **`$randomUUID`**：uuid
- **`$randomAlphaNumeric`**：随机字母数字
- **`$randomBoolean`**：随机生成 true|false
- **`$randomInt`**：随机生成[0,1000]
- **`$randomColor`**:随机生成颜色，"red"，"fuchsia"，"grey"等
- **`$randomHexColor`**：随机生成颜色，"#47594a"
- **`$randomAbbreviation`**：随机生成缩写，SQL，JSON
- **`$randomIP`**：随机生成 ipv4
- **`$randomIPV6`**：随机生成 IPv6
- **`$randomMACAddress`**：随机生成 MAC
- **`$randomPassword`**：随机生成一个密码，包含字母数字
- **`$randomLocale`**：随机生成语言编码，“zh”
- **`$randomUserAgent`**：随机生成 user agent
- **`$randomProtocol`**：随机生成网络协议，"http"，"https"



------



### 常用操作

#### 设置属性

```
pm.environment.set("key", value);
```

#### 生成sign

```javascript
var accessToken=CryptoJS.MD5(pivateKey+date+JSON.stringify(param.biz_params)).toString();
```

#### 添加header

```
pm.request.headers.add({
  key: "aad-accesstoken",
  value: "{{aad-accesstoken}}"});
```



------



### 常见参数获取

#### 获取时间

```javascript
var moment = require('moment');
var date = moment().format("YYYYMMDDHHmmss");
```

#### 随机数

```javascript
// 随机数 
var randomNumber = Math.round(Math.random() * 1000000 * 100000);
```

#### 获取请求body

```javascript
// 请求参数
var obj = pm.request.body.raw;
var param = JSON.parse(obj)
```

