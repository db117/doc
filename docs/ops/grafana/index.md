---
title: grafana
---

> [Grafana documentation | Grafana documentation](https://grafana.com/docs/grafana/latest/)
>
> 仪表板[Dashboards | Grafana Labs](https://grafana.com/grafana/dashboards/) 

### 数据源

#### postgres数据库

需要权限，没有权限查询不到表信息

```sql
 CREATE USER grafanareader WITH PASSWORD 'password';
 GRANT USAGE ON SCHEMA schema TO grafanareader;
 GRANT SELECT ON schema.table TO grafanareader;
```

------



### 常见配置

> 使用中常见配置
>
> [Configure Grafana | Grafana documentation](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/)
>
> 默认配置文件在`$WORKING_DIR/conf/defaults.ini`
>
> 通过`--config`来指定配置文件

#### 数据库

> `postgresql` 数据库不支持指定 `currentSchema`

```
[database]
type = postgres
host = 1.1.1.1:5432
name = dbname
user = username
# If the password contains # or ; you have to wrap it with triple quotes. Ex """#password;"""
password = """132456"""
```

#### 代理

> 需要前置代理来访问的情况下，需要修改配置

```
[server]
domain = domain.com
root_url = %(protocol)s://%(domain)s/grafana/
serve_from_sub_path = true

[security]
csrf_trusted_origins = domain.com
```

