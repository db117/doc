---
title： byte-buddy 简单使用
---

> [Byte Buddy - runtime code generation for the Java virtual machine](https：//bytebuddy.net/#/tutorial)
>
> [raphw/byte-buddy： Runtime code generation for the Java virtual machine. (github.com)](https：//github.com/raphw/byte-buddy)
>
> Byte Buddy是致力于解决字节码操作和 instrumentation API 的复杂性的开源框架。Byte Buddy 所声称的目标是将显式的字节码操作隐藏在一个类型安全的领域特定语言背后。通过使用 Byte Buddy，任何熟悉 Java 编程语言的人都有望非常容易地进行字节码操作。



------



### 主要类

#### ByteBuddy

> 核心类，用于创建DynamicType.Builder。

##### 常用方法

- subclass ：继承一个类，新类名可以通过实现`NamingStrategy`来修改默认策略
- redefine：修改一个类，如果修改了方法，则源方法会丢失
- rebase：修改一个类，如果修改了方法，则原方法会重命名

#### NamingStrategy

> 用于子类名称生成策略

#### DynamicType.Builder

> 核心类，添加修改字段方法等操作
>
> `DynamicType.Unloaded#load(java.lang.ClassLoader)`方法加载一个类，**默认会包装一个`ClassLoader`**，并创建一个`DynamicType.Loaded`对象。
>
> 通过调用`DynamicType.Loaded#getLoaded`生成一个 class 对象

##### 常用方法

- method ：修改或覆盖源方法
- field ：修改源字段
- implement ：实现接口
- defineField ：定义一个字段
- defineMethod ： 定义一个方法
- defineConstructor：定义一个构造函数
- make：生成一个`DynamicType.Unloaded`。即未被加载的类定义。



------



### 常见用法

##### 继承一个类

```
Class<?> type = new ByteBuddy()
  .subclass(Object.class)
  .make()
  .load(getClass().getClassLoader(), ClassLoadingStrategy.Default.WRAPPER)
  .getLoaded();
```

##### 重新定义类

```
Foo foo = new Foo();
new ByteBuddy()
  .redefine(Bar.class)
  .name(Foo.class.getName())// 指定名称
  .make()
  .load(Foo.class.getClassLoader(), ClassReloadingStrategy.fromInstalledAgent());
```

##### 修改方法

固定返回值

```
class Foo {
  public String bar() { return null; }
  public String foo() { return null; }
  public String foo(Object o) { return null; }
}
 
Foo dynamicFoo = new ByteBuddy()
  .subclass(Foo.class)
  .method(isDeclaredBy(Foo.class)).intercept(FixedValue.value("One!"))// 所有的方法都返回 One
  .method(named("foo")).intercept(FixedValue.value("Two!"))// 所有 foo 方法都返回 Two
  .method(named("foo").and(takesArguments(1))).intercept(FixedValue.value("Three!"))// foo 方法参数只有一个的返回 Three
  .make()
  .load(getClass().getClassLoader())
  .getLoaded()
  .newInstance();

```

调用别的方法

```
class Source {
  public String hello(String name) { return null; }
}
 
class Target {
	// 有相同的方法签名优先
  public static String hello(String name) {
    return "Hello " + name + "!";
  }
}
 
String helloWorld = new ByteBuddy()
  .subclass(Source.class)
  .method(named("hello")).intercept(MethodDelegation.to(Target.class))// 委托给 Target 类
  .make()
  .load(getClass().getClassLoader())
  .getLoaded()
  .newInstance()
  .hello("World");
  
  class Target {
  // 当没有相同签名的方法时会匹配到这个方法，应为 String 类型的入参比 Object 优先。类似于 java 方法匹配
  public static String intercept(String name) { return "Hello " + name + "!"; }
  public static String intercept(int i) { return Integer.toString(i); }
  public static String intercept(Object o) { return o.toString(); }
}
```

调用默认方法（java8）

```
interface First {
  default String qux() { return "FOO"; }
}
 
interface Second {
  default String qux() { return "BAR"; }
}

new ByteBuddy(ClassFileVersion.JAVA_V8)
  .subclass(Object.class)
  .implement(First.class)
  .implement(Second.class)
  .method(named("qux")).intercept(DefaultMethodCall.prioritize(First.class))
  .make()
```

指定注解

```
@Retention(RetentionPolicy.RUNTIME)
@interface RuntimeDefinition { }
class RuntimeDefinitionImpl implements RuntimeDefinition {
  @Override
  public Class<? extends Annotation> annotationType() {
    return RuntimeDefinition.class;
  }
}

new ByteBuddy()
  .subclass(Object.class)
    .annotateType(new RuntimeDefinitionImpl())		// 给类添加注解
  .method(named("toString"))
    .intercept(SuperMethodCall.INSTANCE)					// 调用父类方法
    .annotateMethod(new RuntimeDefinitionImpl()) 	// 给方法添加注解
  .defineField("foo", Object.class)
    .annotateField(new RuntimeDefinitionImpl())		// 给字段添加注解
```

