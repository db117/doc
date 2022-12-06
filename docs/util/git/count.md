---
title: git 常用统计
---

### **提交数统计**

```
git log --oneline | wc -l
```

### **查看提交者排名前N位**

```
git log --pretty='%aN' | sort | uniq -c | sort -k1 -n -r | head -n 5
```

### **根据用户名统计**

```
# 全部时间
git log --author="db117" --pretty=tformat: --numstat | awk '{ add += $1; subs += $2; loc += $1 - $2 } END { printf "added lines: %s, removed lines: %s, total lines: %s\n", add, subs, loc }' -

# 指定时间
git log --author="db117" --since=2022-12-01 --until=2022-12-31 --pretty=tformat: --numstat | awk '{ add += $1; subs += $2; loc += $1 - $2 } END { printf "added lines: %s, removed lines: %s, total lines: %s\n", add, subs, loc }' 
```

### 统计所有人的代码行数

```
git log --format='%aN' | sort -u | while read name; do echo -en "$name\t"; git log --author="$name" --pretty=tformat: --numstat | awk '{ add += $1; subs += $2; loc += $1 - $2 } END { printf "added lines: %s, removed lines: %s, total lines: %s \n", add, subs, loc }' -; done
```

### 提交代码人数

```
git log --pretty='%aN' | sort -u | wc -l
```

