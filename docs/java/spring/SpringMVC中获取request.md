---
title: SpringMVC中获取request
---

## Controller中加参数

> 这种方法实现最简单,直接在参数中添加就可以使用

#### 线程安全性

此时request对象是方法参数，相当于局部变量，毫无疑问是线程安全的。

#### 优缺点

这种方法的主要缺点是request对象写起来冗余太多，主要体现在两点：

* 如果多个controller方法中都需要request对象，那么在每个方法中都需要添加一遍request参数

* request对象的获取只能从controller开始，如果使用request对象的地方在函数调用层级比较深的地方，那么整个调用链上的所有方法都需要添加request参数

实际上，在整个请求处理的过程中，request对象是贯穿始终的；也就是说，除了定时器等特殊情况，request对象相当于线程内部的一个全局变量。而该方法，相当于将这个全局变量，传来传去。

## 自动注入

#### 示例

```java
@Autowired
// 自动注入request
private HttpServletRequest request; 
```

#### 源码

```
org.springframework.context.support.AbstractApplicationContext#refresh
在spring进行初始化时调用
org.springframework.context.support.AbstractApplicationContext#postProcessBeanFactory
org.springframework.web.context.support.GenericWebApplicationContext#postProcessBeanFactory
注册web环境
org.springframework.web.context.support.WebApplicationContextUtils#registerWebApplicationScopes(org.springframework.beans.factory.config.ConfigurableListableBeanFactory, javax.servlet.ServletContext)

向依赖容器中注册bean,在spring中创建bean时对依赖进行创建时会从容器中找
beanFactory.registerResolvableDependency(ServletRequest.class, new RequestObjectFactory());
		beanFactory.registerResolvableDependency(ServletResponse.class, new ResponseObjectFactory());
		beanFactory.registerResolvableDependency(HttpSession.class, new SessionObjectFactory());
		beanFactory.registerResolvableDependency(WebRequest.class, new WebRequestObjectFactory());
```

即注入的是`org.springframework.web.context.support.WebApplicationContextUtils.RequestObjectFactory`

```
public ServletRequest getObject() {
// 获取当前request
	return currentRequestAttributes().getRequest();
}	
```

RequestContextHolder中用threadLocal保存request

```
org.springframework.web.context.request.RequestContextHolder

private static final ThreadLocal<RequestAttributes> requestAttributesHolder =
			new NamedThreadLocal<>("Request attributes");

	private static final ThreadLocal<RequestAttributes> inheritableRequestAttributesHolder =
			new NamedInheritableThreadLocal<>("Request context");	
```

#### 线程安全性

根据上面的源码,每一个线程的request是隔离的

#### 优缺点

该方法的主要优点：

* 注入不局限于Controller中：在方法1中，只能在Controller中加入request参数。而对于方法2，不仅可以在Controller中注入，还可以在任何Bean中注入，包括Service、Repository及普通的Bean。

* 注入的对象不限于request：除了注入request对象，该方法还可以注入其他scope为request或session的对象，如response对象、session对象等；并保证线程安全。

* 减少代码冗余：只需要在需要request对象的Bean中注入request对象，便可以在该Bean的各个方法中使用，与方法1相比大大减少了代码冗余。

但是，该方法也会存在代码冗余。考虑这样的场景：web系统中有很多controller，每个controller中都会使用request对象（这种场景实际上非常频繁），这时就需要写很多次注入request的代码；如果还需要注入response，代码就更繁琐了。**可以在控制层基类中注入**

## 手动调用

#### 代码

```
HttpServletRequest request = ((ServletRequestAttributes) (RequestContextHolder.currentRequestAttributes())).getRequest();
```

#### 线程安全性

和自动注入的获取方式一样,所以线程安全

#### 优缺点

* 优点：可以在非Bean中直接获取。
* 缺点：如果使用的地方较多，代码非常繁琐；因此可以与其他方法配合使用。



参考:https://blog.csdn.net/fly910905/article/details/80013315