---
title: Java 常用技巧
---

# Java 常用技巧

## 非静态代码块和静态代码块

类中存在两种特殊的代码块：

- 非静态代码块：直接由 `{}` 包起来。
- 静态代码块：由 `static {}` 包起来。

非静态代码块在创建实例时会被提取到构造器中执行，并且执行顺序早于构造器中的代码。

## 保存动态代理字节码

```java
// 设置系统属性，保存 JDK 动态代理生成的文件
System.getProperties().put("sun.misc.ProxyGenerator.saveGeneratedFiles", "true");

// 设置 CGLIB 代理生成文件目录
System.setProperty(DebuggingClassWriter.DEBUG_LOCATION_PROPERTY, "C:\\class");
```

## String hash 碰撞字符串

```text
BBBB AaAa AaBB
hashcode -> 2031744
```

## 解决 FastJSON 首字母默认小写问题

```java
String jsonObject = JSONObject.toJSONString(对象, new PascalNameFilter());
```

或者：

```java
TypeUtils.compatibleWithJavaBean = true;
```

## properties 配置文件中的多行值

`properties` 中通常以 `name=value` 的形式保存配置。value 较长时可以用 `\` 换行，最后一行不需要 `\`。

```properties
sonar.exclude=a.java \
b.java
```

注意：`\` 必须是每行的最后一个字符。

## Spring Boot 获取 resource 目录下文件

```java
Resource resource = new ClassPathResource("resource目录下的文件路径");
File file = resource.getFile();
```

`Resource` 来自 Spring。

## 执行 Java class 文件并引入 jar 包

```bash
java -classpath jar目录 class文件目录
java -classpath .:lib/* Run
```

上面的命令会将当前 `Run.class` 目录下 `lib` 中的所有 jar 包引入。

## 查找 JAVA_HOME

Linux 和 macOS：

```bash
java -XshowSettings:properties -version 2>&1 > /dev/null | grep 'java.home'
```

Windows：

```bat
java -XshowSettings:properties -version 2>&1 | findstr "java.home"
```

## 通过系统变量设置代理

```java
System.setProperty("http.proxySet", "true");
System.setProperty("http.proxyHost", "127.0.0.1");
System.setProperty("http.proxyPort", "7777");
```

所有请求都会使用该代理。

针对 HTTPS：

```java
System.setProperty("https.proxyHost", "127.0.0.1");
System.setProperty("https.proxyPort", "7777");
```

## 通过返回值获取泛型类型

```java
public static <T> Class<T> a(T... reified) {
    return (Class<T>) reified.getClass().getComponentType();
}
```
