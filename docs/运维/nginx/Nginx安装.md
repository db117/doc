# 编译与安装

## 安装环境准备

**（1）linux 内核2.6及以上版本:**
只有2.6之后才支持epool ，在此之前使用select或pool多路复用的IO模型，无法解决高并发压力的问题。通过命令uname -a 即可查看。

```
#查看 linux 内核
uname -a  
```

**（2）GCC编译器**
GCC（GNU Compiler Collection）可用来编译C语言程序。Nginx不会直接提供二进制可执行程序,只能下载源码进行编译。
**（3）PCRE库**
PCRE（Perl Compatible Regular Expressions，Perl兼容正则表达式）是由Philip Hazel开发的函数库，目前为很多软件所使用，该库支持正则表达式。
**（4）zlib库**
zlib库用于对HTTP包的内容做gzip格式的压缩，如果我们在nginx.conf里配置了gzip on，并指定对于某些类型（content-type）的HTTP响应使用gzip来进行压缩以减少网络传输量。
**（5）OpenSSL开发库**
如果我们的服务器不只是要支持HTTP，还需要在更安全的SSL协议上传输HTTP，那么就需要拥有OpenSSL了。另外，如果我们想使用MD5、SHA1等散列函数，那么也需要安装它。
上面几个库都是Nginx 基础功能所必需的，为简单起见我们可以通过yum 命令统一安装。

```
#yum 安装nginx 环境
yum -y install make zlib zlib-devel gcc-c++ libtool openssl openssl-devel pcre pcre-devel
```

### 源码获取：

nginx 下载页：http://nginx.org/en/download.html 。

```
# 下载nginx 最新稳定版本
wget http://nginx.org/download/nginx-1.14.0.tar.gz
#解压
tar -zxvf nginx-1.14.0.tar.gz
```

最简单的安装：

```
# 全部采用默认安装
./configure & make & make install  
make   & make install 
```

执行完成之后 nginx 运行文件 就会被安装在 /usr/local/nginx 下。

基于参数构建

```
./configure    
```

### 模块更新：

```
# 添加状态查查看模块
./configure --with-http_stub_status_module 
# 重新创建主文件
make
# 将新生成的nginx 文件覆盖 旧文件。
cp objs/nginx /usr/local/nginx/sbin/
# 查看是否更新成功 显示了 configure 构建参数表示成功
/usr/local/nginx/sbin/nginx -V
```
