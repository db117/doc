---
title: 权限相关
---

## 备忘单

### 授予权限

```
-- 把Student表查询权限授予userName
GRANT SELECT ON Student TO userName;
-- 把Student表全部权限授予userName
GRANT ALL ON Student TO userName;
-- 把Student表查询权限授予全部用户
GRANT SELECT ON Student TO PUBLIC;
-- 把Student表name,age,sex字段的更新权限授予userName.授予用户更新多列的权限
GRANT UPDATE(name,age,sex) ON  Student TO userName;
-- 把对表Student的INSERT权限授予userName用户，并允许他再将此权限授予其他用户.
GRANT INSERT  ON  Student TO userName WITH GRANT OPTION;
```

### 回收权限

```
-- 回收userName用户对Student表的查询权限
REVOKE SELECT ON Student FROM userName;
-- 级联回收user1，user2，user3用户对Student表的查询权限
-- 将user1的select权限回收，同时也将user2，user3的select权限回收，前提是user2，user3的select权限是user1授予的.
REVOKE SELECT ON Student FROM userName CASCADE;

```

