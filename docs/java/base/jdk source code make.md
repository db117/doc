---
title: jdk源码编译
---

### 下载源码

> [jdk11]([openjdk/jdk11u-dev: https://openjdk.java.net/projects/jdk-updates/ (github.com)](https://github.com/openjdk/jdk11u-dev))
>
> [jdk]([openjdk/jdk: JDK main-line development (github.com)](https://github.com/openjdk/jdk))

### configuration

```
bash configure
```

- mac需要安装 `Xcode`
- 需要安装jdk

### 生成Compilation Database

> 解决CLion找不到头文件

```
make compile-commands
```

### 编译

```
make
```

### 导入到CLion

> 通过`File -> Open`功能,选中`${source_root}/build/macosx-***/compile_commands.json`,`As a project`打开,这样就导入了Compilation Database文件,接下来CLion开始进行索引。
>
> 这时候,你会发现你是看不到源码的,所以下面需要修改项目的根目录,通过`Tools -> Compilation Database -> Change Project Root`功能,选中你的源码目录,也就是`${source_root}`,这样设置就可以在CLion中看到源代码啦。