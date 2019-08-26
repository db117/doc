####jquery 获取div宽度
```
var content = $(‘div’). width();//只是获取content宽度

var contentWithPadding = $(‘div’). innerWidth();//获取content+padding的宽度

var withoutMargin = $(‘div’). outerWidth();//获取content+padding+border的宽度

var full = $(‘div’). outerWidth(true);//获取content+padding+border+margin的宽度
```

####ifarm操作父类
*   子页面获取父页面的id=care的子页面
    *   parent.care.location.reload();
*   父页面获取id=imp的子页面
    *   imp.location.reload();
*   jquery在iframe子页面获取父页面元素和方法代码如下:
    *   parent.$("selector");
    *   parent.method();
 
*   jquery在父页面获取iframe子页面的元素和方法
    *   代码如下:
    *   iframe.$("select");
    *   iframe.method();
 
*   js在iframe子页面获取父页面元素代码如下:
    *   window.parent.document.getElementById("元素id");
 
*   js在父页面获取iframe子页面元素代码如下:
    *   window.frames["iframe_ID"].document.getElementById("元素id");
 
*   方法调用
    *   父页面调用子页面方法：FrameName.window.childMethod();
    *   子页面调用父页面方法：parent.window.parentMethod();
