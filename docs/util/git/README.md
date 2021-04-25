---
title: git
---

### git记住密码

> ~/.gitconfig 文件中添加或修改

  ```gitconfig
  [credential] 
  helper = store
  ```

### 解决Git中fatal: refusing to merge unrelated histories

> 在你操作命令后面加`--allow-unrelated-histories` 
> 例如： 
> `git merge master --allow-unrelated-histories`
> push,pull同理

### windows下git报错 warning: Clone succeeded, but checkout failed.


>`git config core.longpaths true`
>Git的文件名限制为4096个字符，但在Windows上使用msys编译Git时除外。它使用Windows API的较早版本，文件名限制为260个字符。
>（对所有项目都避免--system或--global标记）



### 批量pull脚本

> 批量拉取当前目录下的所有git项目

```
find . -maxdepth 1 -type d -exec sh -c '(cd {} && git pull)' ';'
```

