#### 添加依赖

sudo apt-get install libcurl4 openssl

#### 下载文件

<https://www.mongodb.com/download-center/community?jmp=docs>

#### 解压文件

```
tar -zxvf mongodb-linux-*-4.0.9.tgz
```

#### 运行

sudo ./mongodb/bin/mongod --dbpath ./data/ --logpath ./log/mongodb.log --fork