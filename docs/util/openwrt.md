---
title: openwrt 编译
---

### 仓库

openwrt 源码

[coolsnowwolf/lede: Lean's LEDE source (github.com)](https://github.com/coolsnowwolf/lede)

常用插件

[kenzok8/openwrt-packages: openwrt常用软件包 (github.com)](https://github.com/kenzok8/openwrt-packages)



### 安装



```
# 依赖
sudo apt update -y
sudo apt full-upgrade -y
sudo apt install -y ack antlr3 asciidoc autoconf automake autopoint binutils bison build-essential \
bzip2 ccache cmake cpio curl device-tree-compiler fastjar flex gawk gettext gcc-multilib g++-multilib \
git gperf haveged help2man intltool libc6-dev-i386 libelf-dev libglib2.0-dev libgmp3-dev libltdl-dev \
libmpc-dev libmpfr-dev libncurses5-dev libncursesw5-dev libreadline-dev libssl-dev libtool lrzsz \
mkisofs msmtp nano ninja-build p7zip p7zip-full patch pkgconf python2.7 python3 python3-pyelftools \
libpython3-dev qemu-utils rsync scons squashfs-tools subversion swig texinfo uglifyjs upx-ucl unzip \
vim wget xmlto xxd zlib1g-dev python3-setuptools

# 当使用 win 的 wsl 的时候 需要其他操作
# 下载源码
git clone https://github.com/coolsnowwolf/lede
cd lede

# 配置插件
sed -i '$a src-git kenzo https://github.com/kenzok8/openwrt-packages' feeds.conf.default
sed -i '$a src-git small https://github.com/kenzok8/small' feeds.conf.default
git pull

# 更新插件
./scripts/feeds update -a
./scripts/feeds install -a

# 编译配置
make menuconfig

# 下载 dl 库，编译固件 （-j 后面是线程数，第一次编译推荐用单线程）
ulimit -s 102400 # 堆栈调大点,有可能报错
make download -j8
make V=s -j1
```



当使用 wsl 进行的时候需要

```
# 以管理员身份打开终端
PS > fsutil.exe file setCaseSensitiveInfo <your_local_lede_path> enable
# 将本项目 git clone 到开启了大小写敏感的目录 <your_local_lede_path> 中
PS > git clone git@github.com:coolsnowwolf/lede.git <your_local_lede_path>

# 在执行make前
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
```



二次编译

```
cd lede
git pull
./scripts/feeds update -a
./scripts/feeds install -a
make defconfig
make download -j8
make V=s -j$(nproc)

# 如果需要重新配置
rm -rf ./tmp && rm -rf .config
make menuconfig
make V=s -j$(nproc)
```



menuconfig 配置

cr660x

```
Target System ->  MediaTek Ralink MTPS
Subtarget ->      MT7621 based boards
Target profile -> Xiaomi Mi Router CR660X

# 插件选择
LuCI -> Applications 
```



## 
