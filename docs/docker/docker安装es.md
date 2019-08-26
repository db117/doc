---
title: docker安装es
---
## docker安装es
*   创建用户定义的网络（用于连接到连接到同一网络的其他服务（如Kibana））：
    *   docker network create somenetwork
*   运行es
    *   docker run -d --name elasticsearch --net somenetwork -p 9200:9200 -p 9300:9300 -e "discovery.type=single-node" elasticsearch:tag