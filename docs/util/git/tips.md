---
title: Git常用操作
---
### git记住密码

  ```
  [credential] 
  helper = store
  ```

#### 解决Git中fatal: refusing to merge unrelated histories

在你操作命令后面加`--allow-unrelated-histories` 
例如： 
`git merge master --allow-unrelated-histories`

push,pull同理