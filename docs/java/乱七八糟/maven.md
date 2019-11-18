---
title: maven
---
## 使用maven自动将源码打包并发布

```
<!-- Source attach plugin -->
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-source-plugin</artifactId>
    <executions>
        <execution>
            <id>attach-sources</id>
            <goals>
                <goal>jar</goal>
            </goals>
        </execution>
    </executions>
</plugin>
```

注意：在多项目构建中，将source-plugin置于顶层或parent的pom中并不会发挥作用，必须置于具体项目的pom中。

### 编译时测试失败不阻断

 -Dmaven.test.failure.ignore=true 

### 打包是不编译测试代码,也不执行

 -Dmaven.test.skip=true   

### 编译测试类,但不运行

 -DskipTests 