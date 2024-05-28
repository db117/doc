---
title: wsl
---



#### WSL2  参考的对象类型不支持尝试的操作

在管理员模式下运行命令后重启即可

```
netsh winsock reset
```

在windows资源管理器打开wsl文件

```
cd /home
explorer.exe .
```



### wsl2 配置文件

> [Advanced settings configuration in WSL | Microsoft Learn](https://learn.microsoft.com/en-us/windows/wsl/wsl-config#wslconfig)

路径位置`C:\Users\<UserName>\.wslconfig`，如果找不到也可以在`Win+R`，然后输入`%userprofile%`回车即可

```
# Settings apply across all Linux distros running on WSL 2
[wsl2]

# 限制内存
memory=4GB 

# 限制 CPU
processors=2

# 设置交换区大小，默认可用内存的 25%
swap=8GB

# swapfile 文件路径, 默认 %USERPROFILE%\AppData\Local\Temp\swap.vhdx
swapfile=C:\\temp\\wsl-swap.vhdx


```

