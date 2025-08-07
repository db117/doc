---
title: gradle
---
## gradle

## gradle配置国内镜像

> 对于 gradle 的配置文件。
>
> gradle-wrapper.properties

```
distributionUrl=https\://mirrors.cloud.tencent.com/gradle/gradle-8.8-bin.zip
```



对所有项目生效，在${USER_HOME}/.gradle/下创建init.gradle文件

https://docs.gradle.org/current/userguide/init_scripts.html#sec:using_an_init_script

```
allprojects{
    repositories {
        def ALIYUN_REPOSITORY_URL = 'https://maven.aliyun.com/repository/public/'
        def ALIYUN_JCENTER_URL = 'https://maven.aliyun.com/repository/jcenter/'
        def ALIYUN_GOOGLE_URL = 'https://maven.aliyun.com/repository/google/'
        def ALIYUN_GRADLE_PLUGIN_URL = 'https://maven.aliyun.com/repository/gradle-plugin/'
        all { ArtifactRepository repo ->
            if(repo instanceof MavenArtifactRepository){
                def url = repo.url.toString()
                if (url.startsWith('https://repo1.maven.org/maven2/')) {
                    project.logger.lifecycle "Repository ${repo.url} replaced by $ALIYUN_REPOSITORY_URL."
                    remove repo
                }
                if (url.startsWith('https://repo.maven.org/maven2/')) {
                    project.logger.lifecycle "Repository ${repo.url} replaced by $ALIYUN_REPOSITORY_URL."
                    remove repo
                }
                if (url.startsWith('https://jcenter.bintray.com/')) {
                    project.logger.lifecycle "Repository ${repo.url} replaced by $ALIYUN_JCENTER_URL."
                    remove repo
                }
                if (url.startsWith('https://dl.google.com/dl/android/maven2/')) {
                    project.logger.lifecycle "Repository ${repo.url} replaced by $ALIYUN_GOOGLE_URL."
                    remove repo
                }
                if (url.startsWith('https://plugins.gradle.org/m2/')) {
                    project.logger.lifecycle "Repository ${repo.url} replaced by $ALIYUN_GRADLE_PLUGIN_URL."
                    remove repo
                }
            }
        }
        maven { url ALIYUN_REPOSITORY_URL }
        maven { url ALIYUN_JCENTER_URL }
        maven { url ALIYUN_GOOGLE_URL }
        maven { url ALIYUN_GRADLE_PLUGIN_URL }
    }
}

```



### gradle代理

  ```
  # 构建时添加jvm参数
  # socks
  -DsocksProxyHost=127.0.0.1 
  -DsocksProxyPort=7777
  # http
  -Dhttp.proxyPort=8080
  -Dhttp.proxyHost=127.0.0.1
  # https
  -Dhttps.proxyPort=8080
  -Dhttps.proxyHost=127.0.0.1
  ```

### 跳过测试

```
build -x test
```

### 跳过失败

```
build --continue
```

