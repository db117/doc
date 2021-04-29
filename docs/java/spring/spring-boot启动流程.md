---
title: spring-boot启动流程
---

### 执行启动类的mian

> 解压后的目录结构

```
├── BOOT-INF
│   ├── classes               # 项目编译的class文件,已经配置文件
│   └── lib                   # 项目依赖的jar包
├── META-INF
│   └── MANIFEST.MF           # jar描述文件
└── org
    └── springframework
        └── boot
            └── loader        # org.springframework.boot.loader包的class文件

```

> MANIFEST.MF文件主要信息

- Main-Class:`  org.springframework.boot.loader.JarLauncher  `实际启动类
- Start-Class:项目的启动类
- Spring-Boot-Classes:项目`resource`目录文件和class文件
- Spring-Boot-Lib:依赖包



- 启动开始

  > 运行启动类的main方法之前的一系列动作,主要自定义类加载器

```
org.springframework.boot.loader.JarLauncher#main
  org.springframework.boot.loader.Launcher#launch(java.lang.String[])
    # 创建类加载器org.springframework.boot.loader.LaunchedURLClassLoader
    org.springframework.boot.loader.Launcher#createClassLoader(java.util.Iterator<Archive>)
    org.springframework.boot.loader.Launcher#launch(java.lang.String[], java.lang.String, java.lang.ClassLoader)
    	org.springframework.boot.loader.Launcher#createMainMethodRunner
    		# 反射调用Main-Class类的main方法
    		org.springframework.boot.loader.MainMethodRunner#run
```



- org.springframework.boot.loader.LaunchedURLClassLoader 类加载器

  > 通过spring-boot的自定义加载器来加载项目的代码以及依赖jar中的代码

```
org.springframework.boot.loader.LaunchedURLClassLoader#loadClass
  # 先找Spring-Boot-Classes下的类
  org.springframework.boot.loader.LaunchedURLClassLoader#loadClassInLaunchedClassLoader
  # 没有找到继续在Spring-Boot-Lib中找
  org.springframework.boot.loader.LaunchedURLClassLoader#definePackageIfNecessary
  # 都没有找到直接调用父类的
  java.lang.ClassLoader#loadClass(java.lang.String, boolean)
```

后面待整理