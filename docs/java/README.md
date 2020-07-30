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

sonar.exclude=a.java \
                     	  b.java \
                     
这里的坑就是\必须是每行的**最后一个字符**！

## spring boot获取resource目录下文件

```
Resource resource = new ClassPathResource("resource目录下的文件路径");
File file = resource.getFile();
// Resource为spring中的
```



-verbose:class

