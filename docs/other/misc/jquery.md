---
title: jQuery 常用操作
---

## 获取元素宽度

```js
const content = $('div').width(); // 内容宽度
const contentWithPadding = $('div').innerWidth(); // 内容 + padding
const withoutMargin = $('div').outerWidth(); // 内容 + padding + border
const full = $('div').outerWidth(true); // 内容 + padding + border + margin
```

## iframe 与父页面交互

只有父、子页面同源（协议、域名和端口相同）时，才能直接访问对方的 DOM 或 JavaScript 对象。

```js
// 子页面访问父页面
window.parent.document.getElementById('care');
window.parent.$('selector');

// 父页面访问 iframe 内容
const childWindow = document.getElementById('iframe_ID').contentWindow;
childWindow.document.getElementById('imp');
```

跨域页面应使用 `window.postMessage()` 通信，不要尝试绕过浏览器的同源策略。
