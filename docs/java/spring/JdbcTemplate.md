---
title: JdbcTemplate
---

### 常规使用

##### 查询出对象

```
List<foo> list = jdbcTemplate.query(sql,new BeanPropertyRowMapper <Foo>(Foo.class));
```

