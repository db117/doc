---
title: Ubuntu相关
---

#### 安装Chrome 

```
# 安装依赖
sudo apt-get install libxss1 libappindicator1 libindicator7
# 下载安装包
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
# 安装
sudo apt-get install -f
sudo dpkg -i google-chrome-stable_current_amd64.deb
```

 安装完成后查询版本号

```
google-chrome --version
```

#### 安装chromedriver

选择需要的版本下载http://npm.taobao.org/mirrors/chromedriver/

```
# 解压
unzip chromedriver_linux64.zip
# 给权限
chmod +x chromedrive
# 在命令目录添加软连接
sudo mv -f chromedriver /usr/local/share/chromedriver
sudo ln -s /usr/local/share/chromedriver /usr/local/bin/chromedriver
sudo ln -s /usr/local/share/chromedriver /usr/bin/chromedrive
```

