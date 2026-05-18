---
title: git 大文件分析
---

## 查找大文件

### rev-list

所有文件按照大小排序

```
# 列出所有 blob，按字节数降序，取 Top 20
git rev-list --objects --all \
| git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' \
| awk '/^blob/ {print $3,$4}' \
| sort -nr \
| head -20
```

### git-filter-repo

已删除的文件

```
# 让 filter-repo 只分析、不改历史
git filter-repo --analyze

# 报告在 .git/filter-repo/analysis/ 目录里
cat .git/filter-repo/analysis/path-deleted-sizes.txt | head -20
```

### ls-tree

当前目录里面的文件大小排序。不包含历史

```bash
git ls-tree -r -l HEAD | sort -k4 -nr | head -20
```

## 删除文件

删除已经不存在的历史文件

```bash
# 1. 生成“存活路径”白名单（含子目录、含空格、含中文都能处理）
git ls-tree -r --name-only HEAD | sort -u > /tmp/keep.txt

# 2. 让 filter-repo 只保留白名单里的路径，其余全部扔掉
#    --paths-from-file 会逐行读取路径，支持 glob 模式
git filter-repo --paths-from-file /tmp/keep.txt --force
```

删除指定文件

```bash
# 一个文件
git filter-repo --path 那个文件的路径 --invert-paths --force
# 删除多个文件
git filter-repo --path 那个文件的路径 --path 那个文件的路径 --invert-paths --force
```
