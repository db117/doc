---
title: Jenkins
---

## 简介

> 自动化部署服务器
>
> [官网](https://www.jenkins.io/zh/)
>
> [github](https://github.com/jenkinsci/jenkins)

## 流水线

### 使用带密码的用户名

> `environment {
>     \COMMON_CREDS = credentials('jenkins-bitbucket-common-creds')
> }`
>
> 上面会生成三个参数
>
> $COMMON_CREDS(username:password)
>
> $COMMON_CREDS_USR
>
> $COMMON_CREDS_PSW

```
environment {
    BITBUCKET_COMMON_CREDS = credentials('jenkins-bitbucket-common-creds')
}
```



### 将可变密码传递给外部shell

> 设置环境变量

```
export PASS=${PASSWORD}
```

### 将变量从shell脚本传递给jenkins

> 使用一个变量接受shell执行结果

```
def res = sh(
  returnStdout: true, 
  script: 'pwd'
)
```

### 使当前stages失败

```
sh 'exit 1' 
```

### 失败后继续

- shell失败

  > 永远返回true

  ```
  sh 'cd 123 || true'
  ```

- failFast属性

  ```
  failFast false
  ```

- try catch

  ```
  script {
    try {
        sh 'do your stuff'
    } catch (Exception e) {
        sh 'Handle the exception!'
    }
  }
  ```

  