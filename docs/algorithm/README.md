---
title: 算法
---

## 小技巧

### 利用ASCII码与位运算异或进行大小写转换

> 大小写字母在ASCII码中差32(1<<5)

```
c^=1<<5
```

### 计算数字中1的数量

```
int countOne(int n){
  int count = 0;
  while (n != 0){
    count++;
    n = (n-1) & n;
  }
  return count;
}
```

