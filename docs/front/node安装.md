---
title: windows下node安装
---

#### 1、下载

[官网下载地址](https://nodejs.org/zh-cn/download/)

选择压缩的版本下载


#### 2、解压缩

将文件解压到要安装的位置，并新建两个目录

```
node-global : npm全局安装位置

node-cache：npm 缓存路径
```

#### 3.配置环境变量

在path中添加**node解压的目录**和**node-global （npm全局安装位置）**目录位置

#### 4.配置全局目录

```
# 全局安装位置
npm config set prefix "F:\node-global"
# 全局缓存位置
npm config set cache "F:\node-cache"
```

