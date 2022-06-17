---
title: JdbcTemplate
---

### 常规使用

##### 查询出对象

```

List<foo> list = jdbcTemplate.query(sql,new BeanPropertyRowMapper <Foo>(Foo.class));


List<foo> result = mock.getJdbcTemplate().query(sql,
				new DataClassRowMapper<Foo>(Foo.class));
```

##### 参数 in

```
BeanPropertySqlParameterSource params = new BeanPropertySqlParameterSource(new ParameterCollectionBean(3, 5));
long l = template.query("SELECT AGE FROM CUSTMR WHERE ID IN (:ids)", params, Long.class).longValue();


MapSqlParameterSource params = new MapSqlParameterSource();
params.addValue("ids", Arrays.asList(3, 4));
template.queryForObject("SELECT AGE FROM CUSTMR WHERE ID IN (:ids)", params, Integer.class);
```

##### 简单对象保存

```
// 会自动获取表字段
SimpleJdbcInsert insert = new SimpleJdbcInsert(dataSource)
				.withTableName("me") // 表名称
				.usingGeneratedKeyColumns("id") // 自增
				.usingColumns("col1","col2");// 使用的字段,如设置则不会自动获取
// 自动匹配参数并执行
insert.execute(new BeanPropertySqlParameterSource(new Person()));
```
