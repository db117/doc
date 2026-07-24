---
title: MyBatis-Plus
---

# MyBatis-Plus

> [MyBatis-Plus 官方文档](https://baomidou.com/)
>
> [baomidou/mybatis-plus（GitHub）](https://github.com/baomidou/mybatis-plus)

MyBatis-Plus 在 MyBatis 之上提供通用 Mapper、条件构造器和分页等增强功能；涉及复杂 SQL 时仍应将 SQL 语义保留在 Mapper 或 XML 中。

## 单元测试初始化元数据

不启动 Spring 容器的单元测试中，如果实体元数据尚未初始化，可显式初始化 `TableInfo`：

```java
TableInfoHelper.initTableInfo(new MapperBuilderAssistant(new MybatisConfiguration(), ""), Student.class);
```

这只适用于隔离的 Mapper 单测；集成测试优先让 Spring Boot 完成 MyBatis-Plus 的自动配置。
