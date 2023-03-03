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