---
title: git
---

### 简介

> [Git (git-scm.com)](http://git-scm.com/)

### git记住密码

> ~/.gitconfig 文件中添加或修改

  ```gitconfig
  [credential] 
  helper = store
  ```
------

### 解决Git中fatal: refusing to merge unrelated histories

> 在你操作命令后面加`--allow-unrelated-histories` 
> 例如： 
> `git merge master --allow-unrelated-histories`
> push,pull同理

------

### windows下git报错 warning: Clone succeeded, but checkout failed.


>`git config core.longpaths true`
>Git的文件名限制为4096个字符，但在Windows上使用msys编译Git时除外。它使用Windows API的较早版本，文件名限制为260个字符。
>（对所有项目都避免--system或--global标记）

------



### 批量pull脚本

> 批量拉取当前目录下的所有git项目

```
find . -maxdepth 1 -type d -exec sh -c '(cd {} && pwd && git pull)' ';'
```

### 当前分支最新的commitid

```
git rev-parse HEAD
```

### 查看拥有某个commitId的分支

```
git branch --contains $COMMIT_ID
```

------

### git 对比两个分支差异

#### 显示出branch1和branch2中差异的部分

```
git diff branch1 branch2 --stat
```

#### 显示指定文件的详细差异

```
git diff branch1 branch2 具体文件路径
```

#### 显示出所有有差异的文件的详细差异

```
git diff branch1 branch2
```

#### 查看branch1分支有，而branch2中没有的log

```
git log branch1 ^branch2
```

#### 查看branch2中比branch1中多提交了哪些内容

`git log branch1..branch2`
 **注意，列出来的是两个点后边（此处即dev）多提交的内容。**

#### 不知道谁提交的多谁提交的少，单纯想知道有什么不一样

```
git log branch1...branch2
```

### 按照时间来列出两个 commit id 之间的相差数

> git rev-list: Lists commit objects in reverse chronological order（按时间逆向列出 commit 对象的顺序）
>
> 所谓时间逆向：第一个 commit id 提交的时间比第二个 commit id 早

找commit-id-1之间的commit-id-2

```
git rev-list <commit-id-1>..<commit-id-2>
```

利用这个我们可以对比两个 commit id 谁比较新：

```
git rev-list <commit-id-1>..<commit-id-2> --count
```

如果结果大于 0：commit-id-2 比 commit-id-1 新

------

### 修改 commit 信息

#### 最后一次提交时间

```
GIT_COMMITTER_DATE="2021-12-12T12:27:07" git commit --amend --date="2021-12-12T12:27:07"
```



### git tag不能显示所有tags

git pull不能默认将所有的tags拉下来。

```
git fetch --tags
```



#### 提示安全目录问题

```
git config --global --add safe.directory "*"
```



#### 修改已提交的邮箱

```
# 过滤并修改
git filter-branch -f --env-filter '
OLD_EMAIL="your-old-email@example.com" 
CORRECT_NAME="Your Correct Name"
CORRECT_EMAIL=your-correct-email@example.com
if [ "$GIT_COMMITTER_EMAIL" = "$OLD_EMAIL" ]
then
    export GIT_COMMITTER_NAME="$CORRECT_NAME"
    export GIT_COMMITTER_EMAIL="$CORRECT_EMAIL"
fi
if [ "$GIT_AUTHOR_EMAIL" = "$OLD_EMAIL" ]
then
    export GIT_AUTHOR_NAME="$CORRECT_NAME"
    export GIT_AUTHOR_EMAIL="$CORRECT_EMAIL"
fi
' --tag-name-filter cat -- --branches --tags

# 强制推送
git push origin --force --all
git push origin --force --tags

```



#### 只使用某些文件夹

```
# 1. 克隆仓库，但不检出
git clone --no-checkout https://github.com/user/repo.git

# 2. 进入仓库目录
cd repo

# 3. 初始化 sparse-checkout 配置
git sparse-checkout init --cone

# 4. 设置需要检出的目录路径 (假设是 'folderA')，到这一步已经把文件弄出来了
git sparse-checkout set folderA

# 5. 更新工作副本
git checkout main # 或其他分支名

```

