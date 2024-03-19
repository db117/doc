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



## 小主机安装openwrt

### 准备

镜像刷入U盘工具  [Win32 Disk Imager download | SourceForge.net](https://sourceforge.net/projects/win32diskimager/)

openwrt开源项目

> [Releases · coolsnowwolf/lede (github.com)](https://github.com/coolsnowwolf/lede)
>
> 
>
> [immortalwrt/immortalwrt: An opensource OpenWrt variant for mainland China users. (github.com)](https://github.com/immortalwrt/immortalwrt)
>
> 有很多内置的软件源



#### 安装

- 把镜像刷入到U盘中

- 插入小主机

- 计入 `bios` 中设置 U盘启动

- 使用网线，进入管理界面（默认密码一般为`password`）

- 查找安装硬盘的盘符

  ```
  fdisk -l
  ```

- 把U盘中的系统刷入到小主机的硬盘中

  ```
  dd if=<要写入的镜像.img> of=<需要写入的硬盘,上一步查询出来的>
  ```

- 拔掉 U 盘，重启就使用硬盘中的系统进入了

#### 旁路由设置

- 在`网络`-`接口`的`常规设置`中给  `LAN` 网络接口设置一个和现有局域网同网段的静态 IP 地址，注意不要和现有设备的 IP 地址冲突
- 将 LAN 网络接口的`默认网关`设为主路由的 IP 地址
- 在`高级设置`中找到`使用自定义的 DNS 服务器`设为主路由的 IP 地址
- 在`DHCP 服务器`中勾选`忽略此接口`
- 在`网络`-`防火墙`中，关闭`SYN-flood 防御`，点击`保存并应用`
- 重启

客户端接入

- 设置 IP 为静态
- 设置 IP 地址为不冲突的路由器网段的地址
- 设置路由器（网关地址）为旁路由 IP
- 设置 DNS 为主路由 IP

### app 配置

#### openclash

内核下载

> Dev 内核下载: https://github.com/vernesong/OpenClash/releases/tag/Clash
> Tun 内核下载: https://github.com/vernesong/OpenClash/releases/tag/TUN-Premium
> Tun 游戏内核: https://github.com/vernesong/OpenClash/releases/tag/TUN



### overlay分区（软件包）扩容方法

> 参考 [eSir OpenWrt固件/overlay分区（软件包）扩容方法 - 知乎 (zhihu.com)](https://zhuanlan.zhihu.com/p/652959325)

- fdisk -l 
  - 记录磁盘的挂载点的名称  /dev/nvme0n1 (后面要用)
- opkg install cfdisk
  - 安装磁盘管理工具
- cfdisk /dev/nvme0n1
  - 使用工具进入要扩展的磁盘
- 选中 Free space ，调到 New 选项，新建分区
  - 选择分区大小
- 调到 Write 选项，回车，再输入 yes 回车确认。
- fdisk -l
  - 查看新添加的分区
- mkfs.ext4 /dev/nvme0n1p3(名字根据自己的来)
  - 格式化新的分区
- mkdir /mnt/expansion_space 
  - 新建的目录名称随意，根据自己喜好
- mount /dev/nvme0n1p3 /mnt/expansion_space/
  - 挂载之前创建的 nvme0n1p3 分区
  - 使用 ls -alh /mnt/expansion_space/ 命令检查，有 lost+found 这个目录代表挂载成功
- cp -r /overlay/* /mnt/expansion_space/ 
  - 将原 /overlay 分区文件，全部复制到新建空间的挂载目录
- 进入网页端，添加挂载点
- 勾选启用挂载点，挂载为overlay，保存应用
- 重启路由器
