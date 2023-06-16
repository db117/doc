---
title: maven
---
## 备忘单

```
#	打包跳过编译失败
mvn clean package -DskipTests --fail-never

# 编译时测试失败不阻断
mvn clean package -Dmaven.test.failure.ignore=true 

# 打包是不编译测试代码,也不执行
mvn clean package -Dmaven.test.skip=true  

# 编译测试类,但不运行
mvn clean package  -DskipTests 

# 只执行当前目录的，不对子目录进行
mvn clean package --non-resolvable

# 指定环境
mvn clean package -P test
```

pom配置

```
 
 <properties>
		 <!--跳过checkstyle-->
        <checkstyle.skip>true</checkstyle.skip>
        <!--使用时间-->
         <timestamp>${maven.build.timestamp}</timestamp>
        <maven.build.timestamp.format>yyyy-MM-dd'T'HH-mm-ss</maven.build.timestamp.format>
 </properties>
```



## 其他

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

------



####  获取git信息

> 使用插件 [git-commit-id/git-commit-id-maven-plugin](https://github.com/git-commit-id/git-commit-id-maven-plugin)
>
> 5.0 开始不支持`jdk1.8`了，而且变了 `groupId`和 `artifactId`。



```
			<plugin>
<!--                <groupId>pl.project13.maven</groupId>-->
<!--                <artifactId>git-commit-id-plugin</artifactId>-->
<!--                <version>4.0.5</version>-->
                <groupId>io.github.git-commit-id</groupId>
                <artifactId>git-commit-id-maven-plugin</artifactId>
                <version>5.0.0</version>
                <executions>
                    <execution>
                        <goals>
                            <goal>revision</goal>
                        </goals>
                    </execution>
                </executions>
                <configuration>
                    <dateFormat>yyyyMMdd-HHmmss</dateFormat>
                    <prefix>git</prefix>
                    <verbose>true</verbose>
                    <generateGitPropertiesFile>true</generateGitPropertiesFile>
                    <generateGitPropertiesFilename>${project.build.outputDirectory}/git.properties
                    </generateGitPropertiesFilename>
                </configuration>
            </plugin>
```



默认的参数

```
git.tags=${git.tags}
git.branch=${git.branch}
git.local.branch.ahead=${git.local.branch.ahead}
git.local.branch.behind=${git.local.branch.behind}
git.dirty=${git.dirty}
git.remote.origin.url=${git.remote.origin.url}
  git.commit.id=${git.commit.id}
  OR (depends on commitIdGenerationMode)
  git.commit.id.full=${git.commit.id.full}
git.commit.id.abbrev=${git.commit.id.abbrev}
git.commit.id.describe=${git.commit.id.describe}
git.commit.id.describe-short=${git.commit.id.describe-short}
git.commit.user.name=${git.commit.user.name}
git.commit.user.email=${git.commit.user.email}
git.commit.message.full=${git.commit.message.full}
git.commit.message.short=${git.commit.message.short}
git.commit.time=${git.commit.time}
git.closest.tag.name=${git.closest.tag.name}
git.closest.tag.commit.count=${git.closest.tag.commit.count}

git.build.user.name=${git.build.user.name}
git.build.user.email=${git.build.user.email}
git.build.time=${git.build.time}
git.build.host=${git.build.host}
git.build.version=${git.build.version}
git.build.number=${git.build.number}
git.build.number.unique=${git.build.number.unique}
```

------



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

------



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

#### 

#### 使用Maven运行main 方法

> [mojohaus/exec-maven-plugin: Exec Maven Plugin (github.com)](https://github.com/mojohaus/exec-maven-plugin)
>
> [Exec Maven Plugin – Introduction (mojohaus.org)](https://www.mojohaus.org/exec-maven-plugin/)

