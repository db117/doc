---
title: 合并多个 git
---

> 合并多个 git 项目。
>
> 使用 git-filter-repo。
>
> https://github.com/newren/git-filter-repo



git-filter-repo安装

```bash
# macOS
brew install git-filter-repo

# Linux / Windows(Git-Bash)
pip3 install --user git-filter-repo
```



 创建“空壳”目标仓库并克隆

```bash
git clone git@github.com:yourorg/NEW_MONO.git
```



创建并修改脚本

merge.sh

```bash
#!/usr/bin/env bash
set -e

MONO_BARE="$PWD/merged.git"   # 目标裸仓库
REPOS=(                         # 待合并的 Java 仓库
  "git@git.corpautohome.com:group/A.git"
  "git@git.corpautohome.com:group/B.git"
)
SUB_DIRS=(                      # 各自在新仓库里的子目录
  "legacy/A"
  "legacy/A"
)

for idx in "${!REPOS[@]}"; do
  repo=${REPOS[$idx]}
  dir=${SUB_DIRS[$idx]}
  tmp=$(basename "$repo" .git)_$$

  echo "==== 处理 $repo -> $dir ===="
  # 裸克隆
  git clone --single-branch --branch master --bare "$repo" "$tmp"
  cd "$tmp"

  # 用 filter-repo 把根目录搬到 $dir（同时保留历史）
  git filter-repo --to-subdirectory-filter "$dir" --force

  # 重命名 master 分支
  git branch -m master "$dir"-master

  # 推送到 mono 的远端分支（以项目名命名）
  git remote add mono "$MONO_BARE"
  git push mono --all        # 全部分支
  cd ..
  rm -rf "$tmp"

done
```



修改文件权限并执行

```
chmod 777 merge.sh
./merge.sh
```

执行完成后可以在目标裸仓库中查看分支，然后合并

```
git branch

git merge legacy/A --allow-unrelated-histories -m "Merge A"
git merge legacy/B --allow-unrelated-histories -m "Merge B"

# 推送
git push
```