---
title: maven
---
#### 使用maven自动将源码打包并发布

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

#### 编译时测试失败不阻断

 -Dmaven.test.failure.ignore=true 

#### 打包是不编译测试代码,也不执行

 -Dmaven.test.skip=true   

#### 编译测试类,但不运行

 -DskipTests 

#### 版本号范围写法

| 范围          | 意义                                                         |
| ------------- | ------------------------------------------------------------ |
| 1.0           | x >= 1.0 * 1.0 的默认 Maven 含义是所有 （，），但建议使用 1.0。显然，这不能在这里强制实施版本，因此它已被重新定义为最小版本。 |
| (,1.0]        | x <= 1.0                                                     |
| (,1.0)        | x < 1.0                                                      |
| [1.0]         | x = 1.0                                                      |
| [1.0,)        | x >= 1.0                                                     |
| (1.0,)        | x > 1.0                                                      |
| (1.0,2.0)     | 1.0 < x < 2.0                                                |
| [1.0,2.0]     | 1.0 <= x <= 2.0                                              |
| (,1.0],[1.2,) | x <= 1.0 或 x >= 1.2。多个集是逗号分隔的                     |
| (,1.1),(1.1,) | x ！ = 1.1                                                   |

#### 不进行递归执行

--non-resolvable  只执行当前目录的，不对子目录进行

#### 子项目中排除掉定义在Parent中的插件

```
<plugin>
	<groupId>org.apache.maven.plugins</groupId>
	<artifactId>maven-xxx-plugin</artifactId>
	<executions>
		<!--加一个execution , phase设置成空-->
		<execution>
			<phase/>
		</execution>
		<!--加一个有自己id的execution，id随便，其余可以不写-->
		<execution>
			<id>myid</id>
		</execution>
	</executions>
</plugin>
```

#### 跳过checkstyle

```
 <properties>
        <checkstyle.skip>true</checkstyle.skip>
 </properties>
```

##### 指定环境

```
-P test
```

#### 使用Maven运行main 方法

> [mojohaus/exec-maven-plugin: Exec Maven Plugin (github.com)](https://github.com/mojohaus/exec-maven-plugin)
>
> [Exec Maven Plugin – Introduction (mojohaus.org)](https://www.mojohaus.org/exec-maven-plugin/)

