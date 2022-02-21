---
title: 数据库信息获取
---

### sysobjects

> 在数据库中创建的每个对象（例如约束、默认值、日志、规则以及存储过程）都对应一行。

#### 

| 列名称              | 数据类型         | 说明                                                         |
| :------------------ | :--------------- | :----------------------------------------------------------- |
| name                | **sysname**      | 对象名称。                                                   |
| object_id           | **int**          | 对象标识号。 在数据库中是唯一的。                            |
| principal_id        | **int**          | 如果不是架构所有者，则为单个所有者的 ID。 默认情况下，架构包含的对象由架构所有者拥有。 不过，通过使用 ALTER AUTHORIZATION 语句更改所有权可以指定备用所有者。  如果没有备用的单个所有者，则为 NULL。  如果对象类型为下列类型之一，则为 NULL：  C = CHECK 约束  D = DEFAULT（约束或独立）  F = FOREIGN KEY 约束  PK = PRIMARY KEY 约束  R = 规则（旧式，独立）  TA = 程序集（CLR 集成）触发器  TR = SQL 触发器  UQ = UNIQUE 约束  EC = Edge 约束 |
| schema_id           | **int**          | 包含该对象的架构的 ID。  始终包含在 sys 或 INFORMATION_SCHEMA 架构中的架构范围内的系统对象。 |
| parent_object_id    | **int**          | 此对象所属对象的 ID。  0 = 不是子对象。                      |
| type                | **char(2)**      | 对象类型：  AF = 聚合函数 (CLR)  C = CHECK 约束  D = DEFAULT（约束或独立）  F = FOREIGN KEY 约束  FN = SQL 标量函数  FS = 程序集 (CLR) 标量函数  FT = 程序集 (CLR) 表值函数  IF = SQL 内联表值函数  IT = 内部表  P = SQL 存储过程  PC = 程序集 (CLR) 存储过程  PG = 计划指南  PK = PRIMARY KEY 约束  R = 规则（旧式，独立）  RF = 复制筛选过程  S = 系统基表  SN = 同义词  SO = 序列对象  U = 表（用户定义类型）  V = 视图  EC = Edge 约束    **适用于**：SQL Server 2012 (11.x) 及更高版本。  SQ = 服务队列  TA = 程序集 (CLR) DML 触发器  TF = SQL table-valued-function  TR = SQL DML 触发器  TT = 表类型  UQ = UNIQUE 约束  X = 扩展存储过程    **适用于 ：** SQL Server 2014 (12.x) 及更高版本 Azure SQL 数据库 Azure Synapse Analytics 、、、 Analytics Platform System (PDW) 。  ST = STATS_TREE    **适用于 ：** SQL Server 2016 (13.x) 及更高版本 Azure SQL 数据库 Azure Synapse Analytics 、、、 Analytics Platform System (PDW) 。  ET = 外部表 |
| type_desc           | **nvarchar(60)** | 对对象类型的说明                                             |
| create_date         | **datetime**     | 对象的创建日期。                                             |
| modify_date         | **datetime**     | 上次使用 ALTER 语句修改对象的日期。 如果对象是表或视图，则在创建或更改表或视图的索引时，modify_date 也会发生更改。 |
| is_ms_shipped       | **bit**          | 对象由内部 SQL Server 组件创建。                             |
| is_published        | **bit**          | 对象为发布对象。                                             |
| is_schema_published | **bit**          | 仅发布对象的架构。                                           |

### sys.tables

> 为 SQL Server 中的每个用户表返回一行。

| 列名称                       | 数据类型         | 说明                                                         |
| :--------------------------- | :--------------- | :----------------------------------------------------------- |
| <inherited columns>          |                  | 有关此视图所继承的列的列表，请参阅[sys.databases (SQL)](https://docs.microsoft.com/zh-cn/sql/relational-databases/system-catalog-views/sys-objects-transact-sql?view=sql-server-ver15)。 |
| lob_data_space_id            | **int**          | 对于该表，非零值是存放二进制大型对象 (LOB) 数据的数据空间（文件组或分区方案）的 ID。 LOB 数据类型的示例包括 **varbinary (max)**、 **varchar (max)**、 **geography** 或 **xml**。  0 = 该表没有 LOB 数据。 |
| filestream_data_space_id     | **int**          | FILESTREAM 文件组或包含 FILESTREAM 文件组的分区方案的数据空间 ID。  若要报告 FILESTREAM 文件组的名称，请执行查询 `SELECT FILEGROUP_NAME (filestream_data_space_id) FROM sys.tables` 。  sys.tables 可以按 filestream_data_space_id = data_space_id 与下列视图联接。  -sys.databases. 文件组  -sys.partition_schemes  -sys. 索引  -sys.allocation_units  -sys.fulltext_catalogs  -sys.data_spaces  -sys.destination_data_spaces  -sys.master_files  -sys.database_files  -backupfilegroup (联接 filegroup_id) |
| max_column_id_used           | **int**          | 此表曾使用的最大列 ID。                                      |
| lock_on_bulk_load            | **bit**          | 大容量加载期间将锁定表。 有关详细信息，请参阅 [sp_tableoption (Transact-SQL)](https://docs.microsoft.com/zh-cn/sql/relational-databases/system-stored-procedures/sp-tableoption-transact-sql?view=sql-server-ver15)。 |
| uses_ansi_nulls              | **bit**          | 在创建表时，将 SET ANSI_NULLS 数据库选项设置为 ON。          |
| is_replicated                | **bit**          | 1 = 使用快照复制或事务复制发布表。                           |
| has_replication_filter       | **bit**          | 1 = 表具有复制筛选器。                                       |
| is_merge_published           | **bit**          | 1 = 使用合并复制发布表。                                     |
| is_sync_tran_subscribed      | **bit**          | 1 = 使用立即更新订阅来订阅表。                               |
| has_unchecked_assembly_data  | **bit**          | 1 = 表包含依赖于上次 ALTER ASSEMBLY 期间定义发生更改的程序集的持久化数据。 在下一次成功执行 DBCC CHECKDB 或 DBCC CHECKTABLE 后将重置为 0。 |
| text_in_row_limit            | **int**          | Text in row 允许的最大字节数。  0 = 未设置 Text in row 选项。 有关详细信息，请参阅 [sp_tableoption (Transact-SQL)](https://docs.microsoft.com/zh-cn/sql/relational-databases/system-stored-procedures/sp-tableoption-transact-sql?view=sql-server-ver15)。 |
| large_value_types_out_of_row | **bit**          | 1 = 在行外存储大值类型。 有关详细信息，请参阅 [sp_tableoption (Transact-SQL)](https://docs.microsoft.com/zh-cn/sql/relational-databases/system-stored-procedures/sp-tableoption-transact-sql?view=sql-server-ver15)。 |
| is_tracked_by_cdc            | **bit**          | 1 = 为表启用变更数据捕获。 有关详细信息，请参阅[sys.sp_cdc_enable_table (SQL transact-sql)](https://docs.microsoft.com/zh-cn/sql/relational-databases/system-stored-procedures/sys-sp-cdc-enable-table-transact-sql?view=sql-server-ver15)。 |
| lock_escalation              | **tinyint**      | 表的 LOCK_ESCALATION 选项的值如下：  0 = TABLE  1 = DISABLE  2 = AUTO |
| lock_escalation_desc         | **nvarchar(60)** | 表的 lock_escalation 选项的文本说明。 可能的值有：TABLE、AUTO 和 DISABLE。 |



### sys.columns

> 为包含列的对象（如视图或表）的每一列返回一行。 下面是包含列的对象类型的列表。
>
> - 表值程序集函数 (FT)
> - 内联表值 SQL 函数 (IF)
> - 内部表 (IT)
> - 系统表 (S)
> - 表值 SQL 函数 (TF)
> - 用户表 (U)
> - 视图 (V)



| 列名称                              | 数据类型          | 说明                                                         |
| :---------------------------------- | :---------------- | :----------------------------------------------------------- |
| object_id                           | **int**           | 此列所属对象的 ID。                                          |
| name                                | **sysname**       | 列的名称。 在对象中是唯一的。                                |
| column_id                           | **int**           | 列的 ID。 在对象中是唯一的。  列 ID 可以不按顺序排列。       |
| system_type_id                      | **tinyint**       | 列的系统类型的 ID。                                          |
| user_type_id                        | **int**           | 用户定义的列类型的 ID。  若要返回类型的名称，请联接到此列上的 [sys.types](https://docs.microsoft.com/zh-cn/sql/relational-databases/system-catalog-views/sys-types-transact-sql?view=sql-server-ver15) 目录视图。 |
| max_length                          | **smallint**      | 列的最大长度（字节）。  -1 = 列数据类型为 **varchar (max**) 、nvarchar **(max**) 、varbinary **(max)** 或 **xml**。  对于 **text、ntext** 和 **image** 列，max_length 值为 16 (表示仅 16 字节指针) 或 sp_tableoption"text in row"设置的值。 |
| 精准率                              | **tinyint**       | 如果基于数值，则为该列的精度；否则为 0。                     |
| scale                               | **tinyint**       | 如果基于数值，则为列的小数位数；否则为 0。                   |
| collation_name                      | **sysname**       | 列的排序规则的名称（如果基于字符）;否则 `NULL` 为 。         |
| is_nullable                         | **bit**           | 1 = 列可为空。                                               |
| is_ansi_padded                      | **bit**           | 1 = 如果列为字符、二进制或变量类型，则该列使用 ANSI_PADDING ON 行为。  0 = 列不是字符、二进制或变量类型。 |
| is_rowguidcol                       | **bit**           | 1 = 列为声明的 ROWGUIDCOL。                                  |
| is_identity                         | **bit**           | 1 = 列具有标识值                                             |
| is_computed                         | **bit**           | 1 = 列为计算列。                                             |
| is_filestream                       | **bit**           | 1 = 列为 FILESTREAM 列。                                     |
| is_replicated                       | **bit**           | 1 = 列已复制。                                               |
| is_non_sql_subscribed               | **bit**           | 1 = 列具有非 SQL Server 订阅服务器。                         |
| is_merge_published                  | **bit**           | 1 = 列已合并发布。                                           |
| is_dts_replicated                   | **bit**           | 1 = 使用 SSIS 复制列。                                       |
| is_xml_document                     | **bit**           | 1 = 内容为完整的 XML 文档。  0 = 内容是文档片段或列数据类型不是 **xml**。 |
| xml_collection_id                   | **int**           | 如果列的数据类型为 xml 且 XML 为类型 **，** 则不为零。 该值将为包含列的验证 XML 架构命名空间的集合的 ID。  0 = 没有 XML 架构集合。 |
| default_object_id                   | **int**           | 默认对象的 ID，无论它是独立对象 [sys.sp_bindefault还是内](https://docs.microsoft.com/zh-cn/sql/relational-databases/system-stored-procedures/sp-bindefault-transact-sql?view=sql-server-ver15)联列级 DEFAULT 约束。 内联列级默认对象的 parent_object_id 列是对该表本身的反引用。  0 = 无默认值。 |
| rule_object_id                      | **int**           | 使用 sys.sp_bindrule 绑定到列的独立规则的 ID。  0 = 无独立规则。 有关列级 CHECK 约束，请参阅 sys.check_constraints ([Transact-SQL)。](https://docs.microsoft.com/zh-cn/sql/relational-databases/system-catalog-views/sys-check-constraints-transact-sql?view=sql-server-ver15) |
| is_sparse                           | **bit**           | 1 = 列为稀疏列。 有关详细信息，请参阅 [使用稀疏列](https://docs.microsoft.com/zh-cn/sql/relational-databases/tables/use-sparse-columns?view=sql-server-ver15)。 |
| is_column_set                       | **bit**           | 1 = 列为列集。 有关详细信息，请参阅 [使用稀疏列](https://docs.microsoft.com/zh-cn/sql/relational-databases/tables/use-sparse-columns?view=sql-server-ver15)。 |
| generated_always_type               | **tinyint**       | **适用于**：SQL Server 2016 (13.x) 及更高版本、SQL 数据库。 7、8、9、10 仅适用于 SQL 数据库 。  标识何时生成列值 (系统表中的列始终为 0) ：  0 = NOT_APPLICABLE 1 = AS_ROW_START 2 = AS_ROW_END 7 = AS_TRANSACTION_ID_START 8 = AS_TRANSACTION_ID_END 9 = AS_SEQUENCE_NUMBER_START 10 = AS_SEQUENCE_NUMBER_END  有关详细信息，请参阅关系[数据库(临时表)。](https://docs.microsoft.com/zh-cn/sql/relational-databases/tables/temporal-tables?view=sql-server-ver15) |
| generated_always_type_desc          | **nvarchar(60)**  | **适用于**：SQL Server 2016 (13.x) 及更高版本、SQL 数据库。  对于系统表中的 `generated_always_type` 列 (，NOT_APPLICABLE值的文本说明始终)  NOT_APPLICABLE AS_ROW_START AS_ROW_END  适用于：SQL 数据库  AS_TRANSACTION_ID_START AS_TRANSACTION_ID_END AS_SEQUENCE_NUMBER_START AS_SEQUENCE_NUMBER_END |
| encryption_type                     | **int**           | **适用于**：SQL Server 2016 (13.x) 及更高版本、SQL 数据库。  加密类型：  1 = 确定性加密  2 = 随机加密 |
| encryption_type_desc                | **nvarchar (64)** | **适用于**：SQL Server 2016 (13.x) 及更高版本、SQL 数据库。  加密类型说明：  随机  DETERMINISTIC |
| encryption_algorithm_name           | **sysname**       | **适用于**：SQL Server 2016 (13.x) 及更高版本、SQL 数据库。  加密算法的名称。  仅AEAD_AES_256_CBC_HMAC_SHA_512支持。 |
| column_encryption_key_id            | **int**           | **适用于**：SQL Server 2016 (13.x) 及更高版本、SQL 数据库。  CEK 的 ID。 |
| column_encryption_key_database_name | **sysname**       | **适用于**：SQL Server 2016 (13.x) 及更高版本、SQL 数据库。  列加密密钥存在的数据库的名称（如果不同于列的数据库）。 `NULL` 如果键与列位于同一数据库中，则为 。 |
| is_hidden                           | **bit**           | **适用于**：SQL Server 2019 (15.x) 及更高版本、SQL 数据库。  指示列是否隐藏：  0 = 常规、非隐藏、可见列  1 = 隐藏列 |
| is_masked                           | **bit**           | **适用于**：SQL Server 2019 (15.x) 及更高版本、SQL 数据库。  指示该列是否由动态数据掩码屏蔽：  0 = 常规、未屏蔽的列  1 = 已屏蔽列 |
| graph_type                          | **int**           | 具有一组值的内部列。 图形列和其他列的值介于 1-8 `NULL` 之间。 |
| graph_type_desc                     | **nvarchar(60)**  | 具有一组值的内部列                                           |
| is_data_deletion_filter_column      | **bit**           | **适用于 ：Azure SQL 数据库** Edge。 指示列是否为表的数据保留筛选器列。 |
| ledger_view_column_type             | **tinyint**       | **适用于**： SQL 数据库。  如果不为 NULL，则指示账本视图中列的类型：  1 = TRANSACTION_ID 2 = SEQUENCE_NUMBER 3 = OPERATION_TYPE 4 = OPERATION_TYPE_DESC  有关数据库账本详细信息，请参阅 Azure SQL 数据库[账本](https://docs.microsoft.com/zh-cn/azure/azure-sql/database/ledger-overview)。 |
| ledger_view_column_type_desc        | **nvarchar(60)**  | **适用于**： SQL 数据库。  如果不为 NULL，则包含账本视图中列类型的文本说明：  TRANSACTION_ID SEQUENCE_NUMBER OPERATION_TYPE OPERATION_TYPE_DESC |

#### 常见查询

- 查询某个表的所有字段

  ```
  SELECT * FROM sys.columns where object_id = 1
  ```



### sys.identity_columns

> 记录所有自增列。

| 列名称                                   | 数据类型        | 说明                                                         |
| :--------------------------------------- | :-------------- | :----------------------------------------------------------- |
| **<columns inherited from sys.columns>** |                 | **Sys.identity_columns** 视图返回 **sys.columns** 视图中的所有列。 |
| **seed_value**                           | **sql_variant** | 该标识列的种子值。 种子值的数据类型与列本身的数据类型相同。  |
| **increment_value**                      | **sql_variant** | 该标识列的增量值。 种子值的数据类型与列本身的数据类型相同。  |
| **last_value**                           | **sql_variant** | 为该标识列生成的最后一个值。 种子值的数据类型与列本身的数据类型相同。 |
| **is_not_for_replication**               | **bit**         | 标识列声明为 NOT FOR REPLICATION。 **注意：** 此列不适用于 Azure Synapse 分析。 |



### sys.indexes

> 每个表格对象（例如，表、视图或表值函数）的索引或堆都包含一行。

| 列名称                          | 数据类型          | 说明                                                         |
| :------------------------------ | :---------------- | :----------------------------------------------------------- |
| object_id                       | **int**           | 该索引所属对象的 ID。                                        |
| name                            | **sysname**       | 索引的名称。 **name** 仅在 对象中是唯一的。  NULL = 堆       |
| index_id                        | **int**           | 索引的 ID。 **index_id** 仅在 对象中是唯一的。  0 = 堆  1 = 聚集索引  > 1 = 非聚集索引 |
| **type**                        | **tinyint**       | 索引的类型：  0 = 堆  1 = b 树 (聚集行)  2 = 非群集行存储 (b 树)  3 = XML  4 = 空间  5 = 聚集列存储索引。 **适用于**：SQL Server 2014 (12.x) 及更高版本。  6 = 非群集列存储索引。 **适用于**：SQL Server 2012 (11.x) 及更高版本。  7 = 非群集哈希索引。 **适用于**：SQL Server 2014 (12.x) 及更高版本。 |
| **type_desc**                   | **nvarchar(60)**  | 索引类型的说明：  HEAP  CLUSTERED  NONCLUSTERED  XML  SPATIAL  CLUSTERED COLUMNSTORE - **适用于** 和 SQL Server 2014 (12.x) 更高版本。  NONCLUSTERED COLUMNSTORE - **适用于** 和 SQL Server 2012 (11.x) 更高版本。  NONCLUSTERED HASH：NONCLUSTERED HASH 索引仅在内存优化表上受支持。 sys.hash_indexes 视图显示当前哈希索引和哈希属性。 有关详细信息，请参阅 sys.hash_indexes ([Transact-SQL)。 ](https://docs.microsoft.com/zh-cn/sql/relational-databases/system-catalog-views/sys-hash-indexes-transact-sql?view=sql-server-ver15)**适用于**：SQL Server 2014 (12.x) 及更高版本。 |
| **is_unique**                   | **bit**           | 1 = 索引是唯一的。  0 = 索引不是唯一的。  对于聚集列存储索引始终为 0。 |
| **data_space_id**               | **int**           | 此索引的数据空间的 ID。 数据空间是文件组或分区方案。  0 = **object_id** 是表值函数或内存中索引。 |
| **ignore_dup_key**              | **bit**           | 1 = IGNORE_DUP_KEY 是 ON。  0 = IGNORE_DUP_KEY 是 OFF。      |
| **is_primary_key**              | **bit**           | 1 = 索引是 PRIMARY KEY 约束的一部分。  对于聚集列存储索引始终为 0。 |
| **is_unique_constraint**        | **bit**           | 1 = 索引是 UNIQUE 约束的一部分。  对于聚集列存储索引始终为 0。 |
| **fill_factor**                 | **tinyint**       | > 0 = 创建或重新生成索引时使用的 FILLFACTOR 百分比。  0 = 默认值  对于聚集列存储索引始终为 0。 |
| **is_padded**                   | **bit**           | 1 = PADINDEX 是 ON。  0 = PADINDEX 是 OFF。  对于聚集列存储索引始终为 0。 |
| **is_disabled**                 | **bit**           | 1 = 禁用索引。  0 = 不禁用索引。                             |
| **is_hypothetical**             | **bit**           | 1 = 索引是假设的，不能直接用作数据访问路径。 假设的索引包含列级统计信息。  0 = 索引不是假设的。 |
| **allow_row_locks**             | **bit**           | 1 = 索引允许行锁。  0 = 索引不允许行锁。  对于聚集列存储索引始终为 0。 |
| **allow_page_locks**            | **bit**           | 1 = 索引允许页锁。  0 = 索引不允许页锁。  对于聚集列存储索引始终为 0。 |
| **has_filter**                  | **bit**           | 1 = 索引具有一个筛选器，且仅包含符合筛选器定义的行。  0 = 索引不具有筛选器。 |
| **filter_definition**           | **nvarchar(max)** | 包含在筛选索引中的行子集的表达式。  对于堆、未筛选索引或表权限不足，为 NULL。 |
| **compression_delay**           | **int**           | > 0 = 以分钟数指定的列存储索引压缩延迟。  NULL = 自动管理列存储索引行组压缩延迟。 |
| **suppress_dup_key_messages**   | **bit**           | 1 = 索引配置为在索引重新生成操作期间禁止重复键消息。  **0** = 索引未配置为在索引重新生成操作期间禁止显示重复键消息。  **适用于：** SQL Server (从 SQL Server 2017 (14.x)) 、 Azure SQL 数据库 和 开始 Azure SQL 托管实例 |
| **auto_created**                | **bit**           | 1 = 索引是由自动优化创建的。  0 = 索引由用户创建。  **适用于：** Azure SQL 数据库 |
| **optimize_for_sequential_key** | **bit**           | 1 = 索引已启用最后一页插入优化。  0 = 默认值。 索引已禁用最后一页插入优化。  **适用于：** SQL Server (从 SQL Server 2019 (15.x)) 、 Azure SQL 数据库 和 开始 Azure SQL 托管实例 |

#### 常见查询

- 查询主键

  ```
  select * from sys.indexes where object_id = 1 and is_primary_key = 1
  ```



### sys.index_columns

> 记录索引中的字段。
>
> 关联索引表使用。

| 列名称                                                       | 数据类型    | 说明                                                         |
| :----------------------------------------------------------- | :---------- | :----------------------------------------------------------- |
| object_id                                                    | **int**     | 定义索引所依据的对象的 ID。                                  |
| index_id                                                     | **int**     | 定义了列的索引的 ID。                                        |
| **index_column_id**                                          | **int**     | 索引列的 ID。 **index_column_id** 仅在 **index_id** 中是唯一的。 |
| column_id                                                    | **int**     | **Object_id** 中的列的 ID。  0 = 非聚集索引中的行标识符 (RID)。  **column_id** 仅在 **object_id** 中是唯一的。 |
| **key_ordinal**                                              | **tinyint** | 键列集内的序数（从 1 开始）。  0 = 不是键列，或者是 XML 索引、列存储索引或空间索引。  注意： XML 索引或空间索引不能是键，因为基础列不是可比较的，这意味着不能对其值进行排序。 |
| **partition_ordinal**                                        | **tinyint** | 分区列集内的序数（从 1 开始）。 聚集列存储索引可以具有最多 1 个分区列。  0 = 非分区列。 |
| **is_descending_key**                                        | **bit**     | 1 = 索引键列采用降序排序。  0 = 索引键列的排序方向为升序，或者列是列存储或哈希索引的一部分。 |
| **is_included_column**                                       | **bit**     | 1 = 列是使用 CREATE INDEX INCLUDE 子句添加到索引的非键列，或者列是列存储索引的一部分。  0 = 列不是包含列。  因为列是聚集键的一部分而隐式添加的列未在 **sys.index_columns** 中列出。  由于是分区列而隐式添加的列作为 0 返回。 |
| **column_store_order_ordinal** 适用于： Azure Synapse Analytics (预览版) | **tinyint** | 排序的聚集列存储索引中顺序列组内基于 1 (的) 。               |



### sys.syslockinfo

> 包含有关所有已授权、正在转换和正在等待的锁请求的信息。

| 列名称                 | 数据类型             | 说明                                                         |
| :--------------------- | :------------------- | :----------------------------------------------------------- |
| **rsc_text**           | **nchar(32)**        | 锁资源的文本化描述。 包含资源名称的一部分。                  |
| **rsc_bin**            | **binary(16)**       | 二进制锁资源。 包含锁管理器中所含的实际锁资源。 对于知道用于生成其自己的格式化锁资源的锁资源格式，以及如何在 **syslockinfo** 上执行自联接的工具，将包括此列。 |
| **rsc_valblk**         | **binary(16)**       | 锁值块。 有些资源类型可以在特定的锁资源中包含附加数据，锁管理器不对这类锁资源进行哈希运算以决定具体某个锁资源的所有关系。 例如，页锁不归具体的对象 ID 所有。 但是，对于锁升级和出于其他目的， 页锁的对象 ID 可以包括在锁值块中。 |
| **rsc_dbid**           | **smallint**         | 与资源关联的数据库 ID。                                      |
| **rsc_indid**          | **smallint**         | 与资源关联的索引 ID（如果适合）。                            |
| **rsc_objid**          | **int**              | 与资源关联的对象 ID（如果适合）。                            |
| **rsc_type**           | **tinyint**          | 资源类型：  1 = NULL 资源（未使用）  2 = 数据库  3 = 文件  4 = 索引  5 = 表  6 = 页  7 = 键  8 = 区  9 = RID（行 ID）  10 = 应用程序 |
| **rsc_flag**           | **tinyint**          | 内部资源标志。                                               |
| **req_mode**           | **tinyint**          | 锁请求模式。 该列是请求者的锁模式，并且代表已授权模式，或代表转换或等待模式。  0 = NULL。 不授权访问资源。 用作占位符。  1 = Sch-S（架构稳定性）。 确保在任何会话持有对架构元素（例如表或索引）的架构稳定性锁时，不删除该架构元素。  2 = Sch-M（架构修改）。 必须由要更改指定资源架构的任何会话持有。 确保没有其他会话正在引用所指示的对象。  3 = S（共享）。 授予持有锁的会话对资源的共享访问权限。  4 = U（更新）。 指示对最终可能更新的资源获取的更新锁。 用于防止常见形式的死锁，这类死锁在多个会话锁定资源并且稍后可能更新资源时发生。  5 = X（排他）。 授予持有锁的会话对资源的独占访问权限。  6 = IS（意向共享）。 指示有意将 S 锁放置在锁层次结构中的某个从属资源上。  7 = IU（意向更新）。 指示有意将 U 锁放置在锁层次结构中的某个从属资源上。  8 = IX（意向排他）。 指示有意将 X 锁放置在锁层次结构中的某个从属资源上。  9 = SIU（共享意向更新）。 指示对有意在锁层次结构中的从属资源上获取更新锁的资源进行共享访问。  10 = SIX（共享意向排他）。 指示对有意在锁层次结构中的从属资源上获取排他锁的资源进行共享访问。  11 = UIX（更新意向排他）。 指示对有意在锁层次结构中的从属资源上获取排他锁的资源持有的更新锁。  12 = BU。 用于大容量操作。  13 = RangeS_S（共享键范围和共享资源锁）。 指示可串行范围扫描。  14 = RangeS_U（共享键范围和更新资源锁）。 指示可串行更新扫描。  15 = RangeI_N（插入键范围和空资源锁）。 用于在将新键插入索引前测试范围。  16 = RangeI_S。 通过 RangeI_N 和 S 锁的重叠创建的键范围转换锁。  17 = RangeI_U。 通过 RangeI_N 和 U 锁的重叠创建的键范围转换锁。  18 = RangeI_X。 通过 RangeI_N 和 X 锁的重叠创建的键范围转换锁。  19 = RangeX_S。 通过 RangeI_N 和 RangeS_S 锁的重叠创建的键范围转换锁 住.  20 = RangeX_U。 通过 RangeI_N 和 RangeS_U 锁的重叠创建的键范围转换锁。  21 = RangeX_X（排他键范围和排他资源锁）。 这是在更新范围中的键时使用的转换锁。 |
| **req_status**         | **tinyint**          | 锁请求的状态：  1 = 已授予  2 = 正在转换  3 = 正在等待       |
| **req_refcnt**         | **smallint**         | 锁引用计数。 事务每次请求具体某个资源上的锁时，引用计数便会增加。 直到引用计数等于 0 时才能释放锁。 |
| **req_cryrefcnt**      | **smallint**         | 保留以供将来使用。 总是设置为 0。                            |
| **req_lifetime**       | **int**              | 锁生存期位图。 在某些查询处理策略的过程中，必须维护资源上的锁，直到查询处理器已完成查询的某个具体阶段为止。 查询处理器和事务管理器用锁生存期位图指示在查询结束运行的某个阶段时可以释放的锁组。 位图内的某些位用于指示即使锁的引用计数等于 0，也必须到事务结束时才释放的锁。 |
| **req_spid**           | **int**              | 请求 Microsoft SQL Server 数据库引擎 锁的会话的内部进程 ID。 |
| **req_ecid**           | **int**              | 执行上下文 ID (ECID)。 用于指示并行操作内拥有具体某个锁的线程。 |
| **req_ownertype**      | **smallint**         | 与锁关联的对象类型：  1 = 事务  2 = 游标  3 = 会话  4 = ExSession  注意，3 和 4 代表会话锁的特殊版本，分别跟踪数据库锁和文件组锁。 |
| **req_transactionID**  | **bigint**           | 在 **syslockinfo** 和探查器事件中使用的唯一事务 ID           |
| **req_transactionUOW** | **uniqueidentifier** | 标识 DTC 事务的工作单元 ID (UOW)。 对于非 MS DTC 事务，UOW 设置为 0。 |





### sys.systypes

> 为数据库中定义的每种系统提供的数据类型和每种用户定义的数据类型返回一行。
>
> 主要管理列信息。

#### 主要列信息

| 列名称          | 数据类型     | 说明                                                         |
| :-------------- | :----------- | :----------------------------------------------------------- |
| name            | **sysname**  | 数据类型名称。                                               |
| **xtype**       | **tinyint**  | 物理存储类型。                                               |
| **xusertype**   | **smallint** | 扩展用户类型。 如果数据类型的数字超过 32,767，则溢出或返回 NULL。 |
| **length**      | **smallint** | 数据类型的物理长度。                                         |
| **xprec**       | **tinyint**  | 服务器使用的内部精度。 不在查询中使用。                      |
| **xscale**      | **tinyint**  | 服务器使用的内部小数位数。 不在查询中使用。                  |
| **tdefault**    | **int**      | 特定存储过程的 ID，此存储过程包含对该数据类型的完整性检查功能。 |
| **collationid** | **int**      | 如果基于字符，则 **collationid** 是当前数据库的排序规则的 id;否则为 NULL。 |
| **usertype**    | **smallint** | 用户类型 ID。 如果数据类型的数字超过 32,767，则溢出或返回 NULL。 |
| variable        | **bit**      | 可变长度数据类型。  1 = True  0 = False                      |
| **allownulls**  | **bit**      | 指示此数据类型的默认为空性。 如果使用 [CREATE TABLE](https://docs.microsoft.com/zh-cn/sql/t-sql/statements/create-table-transact-sql?view=sql-server-ver15) 或 [ALTER TABLE](https://docs.microsoft.com/zh-cn/sql/t-sql/statements/alter-table-transact-sql?view=sql-server-ver15)指定了可为 null 性，则会重写此默认值。 |
| type            | **tinyint**  | 物理存储数据类型。                                           |
| **prec**        | **smallint** | 此数据类型的精度级别。  -1 = **xml** 或大值类型。            |
| **scale**       | **tinyint**  | 此数据类型根据精度确定的小数位数。  NULL = 数据类型不是数值。 |



### sys.triggers

> 记录系统中的触发器

| 列名称                     | 数据类型         | 说明                                                         |
| :------------------------- | :--------------- | :----------------------------------------------------------- |
| name                       | **sysname**      | 触发器名称。 DML 触发器名称的架构范围。 DDL 触发器名称的作用域取决于父实体。 |
| object_id                  | **int**          | 对象标识号。 在数据库中是唯一的。                            |
| **parent_class**           | **tinyint**      | 触发器的父类。  0 = DDL 触发器的数据库。  1 = DML 触发器的对象或列。 |
| **parent_class_desc**      | **nvarchar(60)** | 触发器的父类的说明。  DATABASE  OBJECT_OR_COLUMN             |
| **parent_id**              | **int**          | 触发器的父实体的 ID，如下所示：  0 = 父实体为数据库的触发器。  对于 DML 触发器，这是定义 DML 触发器的表或视图的 **object_id** 。 |
| type                       | **char(2)**      | 对象类型：  TA = 程序集 (CLR) 触发器  TR = SQL 触发器        |
| **type_desc**              | **nvarchar(60)** | 对象类型的说明。  CLR_TRIGGER  SQL_TRIGGER                   |
| create_date                | **datetime**     | 触发器的创建日期。                                           |
| modify_date                | **datetime**     | 上次使用 ALTER 语句修改对象的日期。                          |
| is_ms_shipped              | **bit**          | 由内部 SQL Server 组件代表用户创建的触发器。                 |
| **is_disabled**            | **bit**          | 触发器被禁用。                                               |
| **is_not_for_replication** | **bit**          | 触发器是作为 NOT FOR REPLICATION 创建的。                    |
| **is_instead_of_trigger**  | **bit**          | 1 = INSTEAD OF 触发器。  0 = AFTER 触发器。                  |
