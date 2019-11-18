---
title: kafka
---
## windows环境下kafak
*   启动zookeeper
    *   bin\windows\zookeeper-server-start.bat config\zookeeper.properties
*   启动kfaka服务
    *   bin\windows\kafka-server-start.bat config\server.properties
*   创建一个主题
    *   bin\windows\kafka-topics.bat --create --zookeeper localhost:2181 --replication-factor 1 --partitions 1 --topic test
*   查看创建的主题列表
    *   bin\windows\kafka-topics.bat --list --zookeeper localhost:2181
*   启动生产者
    *   bin\windows\kafka-console-producer.bat --broker-list localhost:9092 --topic test
*   启动消费者
    *   bin\windows\kafka-console-consumer.bat --zookeeper localhost:2181 --topic test --from-beginning