---
title: Windows 常用操作
---

# Windows 常用操作

## Base64 编码与解码

```powershell
# 将 a.txt 解码到 b.txt
certutil -decode a.txt b.txt

# 将 a.txt 编码到 b.txt
certutil -encode a.txt b.txt
```

## 删除 Windows 服务

先以管理员身份运行终端，并使用服务名（不是显示名称）执行：

```powershell
sc delete "服务名"
```

如果服务项仍然残留，重启后再检查。直接删除
`HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Services` 下的注册表项属于最后手段，操作前应先导出该项备份。

## 开机启动

在运行对话框输入 `shell:startup`，打开当前用户的启动文件夹；把需要开机启动的快捷方式放入其中。

## Windows 11 HDR 截图过曝

当 Edge 截图在 HDR 模式下过曝时，打开 `edge://flags/`，搜索 `Force color profile`，并选择与显示器 HDR 配置匹配的色彩配置文件。
