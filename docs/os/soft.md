---
title:常用软件
---

#### sdkman

> https://github.com/sdkman/sdkman-cli
>
> https://sdkman.io/
>
> 一个开发工具管理



```
# 安装
curl -s "https://get.sdkman.io" | bash

# 查看所有可以用的工具
sdk list

# 切换使用的版本
sdk use java 21.0.7-oracle

# 查看所有的 java 版本
sdk list java

# 安装 java ,可以通过 tab 显示出所有可以使用的版本
sdk install java
# 安装知道版本的 java
sdk install java 21.0.7-oracle

# 安装本地的 java
sdk install java 17-zulu /Library/Java/JavaVirtualMachines/zulu-17.jdk/Contents/Home

# 卸载
sdk uninstall java 17-zulu

# 查看当前使用的本部
sdk current
```

