---
title: Milvus 向量数据库
---

> [milvus-io/milvus: A cloud-native vector database, storage for next generation AI applications (github.com)](https://github.com/milvus-io/milvus)
>
> [The High-Performance Vector Database Built for Scale | Milvus](https://milvus.io/)
>
> 可视化工具
>
> [zilliztech/attu: The GUI for Milvus (github.com)](https://github.com/zilliztech/attu)



### 在Windows 下使用 docker-compose 安装

- 创建一个工作目录，比如`D:\milvus`

- 在工作目录下创建文件夹`volumes`

- 在工作目录下下载 `docker-compose` 文件，并使用`docker`安装

```
wget https://github.com/milvus-io/milvus/releases/download/v2.4.6/milvus-standalone-docker-compose.yml -O docker-compose.yml

docker compose up -d
```

访问 http://localhost:9091/ 出现404这说明成功了。

### 安装 Attu

注意映射的端口号和`MILVUS_URL`的`IP`（如果都是在本地的`docker`，需要把`IP`改成本地网卡的）

```
docker run -p 3001:3000 -e MILVUS_URL=127.0.0.1:19530 -d --name atte  zilliz/attu:v2.4
```

