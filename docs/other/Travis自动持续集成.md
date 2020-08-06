---
title: Travis自动持续集成
---

#### 使用准备

1. Travis CI 只支持 Github，不支持其他代码托管服务
   1. 拥有 GitHub 帐号
   2. 该帐号下面有一个项目
   3. 该项目里面有可运行的代码
2. 访问官方网站 [travis](https://travis-ci.org/)，使用 Github 账户登入 Travis CI。
3. Travis 会列出 Github 上面你的所有仓库，以及你所属于的组织。此时，选择你需要 Travis 帮你构建的仓库，打开仓库旁边的开关。一旦激活了一个仓库，Travis 会监听这个仓库的所有变化



#### 配置

Travis 要求项目的根目录下面，必须有一个`.travis.yml`文件。这是配置文件，指定了 Travis 的行为。该文件必须保存在 Github 仓库里面，一旦代码仓库有新的 Commit，Travis 就会去找这个文件，执行里面的命令。

```
language: node_js
node_js:
  - lts/*
script:
  - npm run docs:build
  - npm run cname
deploy:
  provider: pages
  # Git项目
  repo: db117/db117.github.io
  # 不清理编译文件
  skip-cleanup: true
  # 目录
  local_dir: docs/.vuepress/dist
  # token
  github-token: $github
  keep-history: true
  # 用token的邮箱用户名提交
  committer_from_gh: true
  # 目标分支
  target_branch: master
```

#### 使用技巧

- 环境变量

  - `.travis.yml`的`env`字段可以定义环境变量。然后，脚本内部就使用这些变量了。

  - ```
    env:
      - DB=postgres
      - SH=bash
      - PACKAGE_VERSION="1.0.*"
    ```

  - 有些环境变量（比如用户名和密码）不能公开，这时可以通过 Travis 网站，写在每个仓库的设置页里面，Travis 会自动把它们加入环境变量。这样一来，脚本内部依然可以使用这些环境变量，但是只有管理员才能看到变量的值。具体操作请看[官方文档](https://docs.travis-ci.com/user/environment-variables)。

    - 在使用时用$+变量名

      ```
      github-token: $github
      ```


#### 使用Travis Client

[文档](https://github.com/travis-ci/travis.rb)

```
# 安装ruby等依赖
sudo apt-get install ruby-dev libffi-dev make gcc -y
# 安装Travis
sudo gem install travis
# 查看是否安装成功
travis version
```



#### 添加ssh

- 生成秘钥

    ```
    ssh-keygen -t rsa -b 4096 -C "<your_email>" -f <key_name> -N ''
    ```

- 把公钥放在需要的地方

- 使用Travis client加密私钥

  ```
  travis encrypt-file <key_name>
  # 找到输出的类似的,放到配置文件中
openssl aes-256-cbc -K $encrypted_XXXXXXXXXXXX_key -iv $encrypted_XXXXXXXXXXXX_iv -in <key_name>.enc -out <key_name> -d
  
  ```
  
- 修改.travis配置文件

  ```
  before_install:
  - openssl aes-256-cbc -K $encrypted_**********_key -iv $encrypted_********_iv
    -in .travis/<key_name>.enc -out ~/.ssh/<key_name> -d
  - chmod 600 ~/.ssh/<key_name>
  - eval $(ssh-agent)
  - ssh-add ~/.ssh/<key_name>
  
# 最后添加
  addons:
    ssh_known_hosts:
    - github.com
  ```
  