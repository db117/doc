---
title: python
---

### pip 镜像

Windows下，你需要在当前对用户目录下（C:\Users\xx\AppData\Roaming\pip，xx 表示当前使用对用户，比如张三）创建一个 pip.ini在pip.ini文件中输入以下内容：

```
[global]
index-url = https://pypi.tuna.tsinghua.edu.cn/simple
[install]
trusted-host = pypi.tuna.tsinghua.edu.cn
```

### 其他国内镜像源

- 中国科学技术大学 : https://pypi.mirrors.ustc.edu.cn/simple
- 豆瓣：http://pypi.douban.com/simple/
- 阿里云：http://mirrors.aliyun.com/pypi/simple/



### poetry 镜像

安装依赖

```
poetry self add poetry-plugin-pypi-mirror
```

新建或修改配置文件config.toml，增加如下内容
(该toml文件路径是：Linux系统在`~/.config/pypoetry/`，Windows在`%APPDATA%\pypoetry\`，Mac在`~/Library/Preferences/pypoetry/`)

```
[plugins]
[plugins.pypi_mirror]
url = "https://mirrors.cloud.tencent.com/pypi/simple/"
```