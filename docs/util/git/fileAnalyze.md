---
title: git 大文件分析
---

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

