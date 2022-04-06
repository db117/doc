---
title: java
---
## java
###  Java非静态代码块和静态代码块

> 类中存在两种特殊的代码块，即非静态代码块和静态代码块，前者是直接由 { } 括起来的代码，而后者是由 static{ } 括起来的代码。
>
> 非静态代码块在类初始化创建实例时，将会被提取到类的构造器中执行，但是，非静态代码块会比构造器中的代码块先被执行。



## 保存动态代理字节码

```
// 设置系统属性jdk动态代理
System.getProperties().put("sun.misc.ProxyGenerator.saveGeneratedFiles", "true"); 
// cglib 代理生成文件目录
System.setProperty(DebuggingClassWriter.DEBUG_LOCATION_PROPERTY, "C:\\class");
```

## String hash碰撞字符串

```
BBBB AaAa AaBB
hashcode->2031744
```

## 解决FastJSON首字母默认小写问题

```
String jsonObject = JSONObject.toJSONString(对象,new PascalNameFilter());
```

或者

```
TypeUtils.compatibleWithJavaBean = true;
```

## properties配置文件中的换行(多行)的坑

properties中都是以name=value这样的k-v字符串对形式保存的。
在写properties文件时,如果value非常长,看起来是非常不方便的，可以用\来换行(最后一行不需要\)，如下 :

```
sonar.exclude=a.java \
b.java \                     
这里的坑就是\必须是每行的**最后一个字符**！
```

## spring boot获取resource目录下文件

```
Resource resource = new ClassPathResource("resource目录下的文件路径");
File file = resource.getFile();
// Resource为spring中的
```



#### 执行 java class 文件引入jar包

```
java -classpath jar目录 class文件目录

java -classpath .:lib/* Run 
```

备注：上面命令中是将当前（Run.class）目录下的lib目录下的所有jar包引入

#### 如何找到JAVA_HOME

> 对于Linux和macOS ， 让我们使用 grep：
>
> java -XshowSettings:properties -version 2>&1 > /dev/null | grep 'java.home'
>
> 对于Windows，让我们使用 findstr：
>
> java -XshowSettings:properties -version 2>&1 | findstr "java.home"

#### 通过系统变量方式实现代理

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

