####ORACLE表空间
*   1、查看所有的表空间：SELECT * FROM DBA_TABLESPACES;
*   2、查看某个用户的默认表空间：SELECT DEFAULT_TABLESPACE,USERNAME FROM DBA_USERS WHERE USERNAME='username';
*   3、查看表空间剩余容量：SELECT TABLESPACE_NAME,SUM(BYTES) FROM DBA_FREE_SPACE GROUP BY TABLESPACE_NAME;
*   4、查看表空间数据文件的信息：SELECT * FROM DBA_DATA_FILES;
*   5、创建表空间：CREATE TABLESPACE ODI  DATAFILE 'D:\ORACLE\PRODUCT\10.2.0\ORADATA\ORCL\ODI.DBF ' SIZE 50M AUTOEXTEND ON NEXT 10M PERMANENT EXTENT MANAGEMENT LOCAL;
*   完整的建表空间语句：CREATE TABLESPACE tablespace_name DATAFILE 'filename' SIZE size [AUTOEXTEND [ON NEXT size | OFF]] [MAXSIZE size][PERMANENT  | TEMPORARY][EXTENT MANAGEMENT DICTIONARY | LOCAL];
*   6、重命名表空间：ALTER TABLESPACE oldname RENAME TO newname;
*   7、设置表空间的读写状态：ALTER TABLESPACE tablespace_name READ ONLY | WRITE;
*   8、设置表空间的可用状态：ALTER TABLESPACE tablespace_name ONLINE | OFFLINE [NORAML | TEMPORARY | IMMEDIATE];如果是联机状态，那么表空间就可以被用户操作，反之设置成脱机状态，表空间就不是不可用的，脱机状态还包括3种方式。
*   9、建立大文件表空间：CREATE BIGFILE TABLESPACE tablespace_name DATAFILE 'filename' SIZE size;
*   10、删除表空间：DROP TABLESPACE tablespace_name [INCLUDING CONTENTS][CASCADE CONSTRAINTS];INCLUDING CONTENTS表示把表空间里的数据文件也删除，CASCADE CONSTRAINTS会把表空间中的完整性也删除。
*   11、临时表空间一般是指在数据库中存储数据，当内存不够时写入的空间，这个空间并不像一般的表空间，当执行完对数据库的操作后，该空间的内容自动清空。
*   12、创建临时表空间：CREATE TEMPORARY TABLESPACE tablespace_name TEMPFILE 'filename' SIZE size;
*   13、设置临时表空间为默认表空间：ALTER DATABASE DEFAULT TEMPORARY TABLESPACE tablespace_name;
*   14、查询临时表空间：SELECT * FROM DBA_TMP_FILES;
*   15、创建临时表空间组：CREATE TEMPORARY TABLESPACE tablespace_name TMPFILE 'filename' SIZE size TABLESPACE GROUP group_name;
*   16、移动临时表空间到表空间组：ALTER TABLESPACE tablespace_name TABLESPACE GROUP group_name;
*   17、查询临时表空间组：SELECT * FROM DBA_TABLESPACE_GROUPS;
*   18、删除临时表空间：DROP TABLESPACE tablespace_name INCLUDING CONTENTS AND DATAFILES;
*   19、删除表空间中的数据文件：ALTER TABLESPACE tablespace_name DROP DATAFILE 'filename';
*   20、向表空间里增加数据文件：ALTER TABLESPACE tablespace_name ADD DATAFILE 'filename' SIZE size;
*   21、向表空间里新增数据文件，并且允许数据文件自动增长：ALTER TABLESPACE tablespace_name ADD DATAFILE 'filename' SIZE 50M AUTOEXTEND ON NEXT 5M MAXSIZE 100M;
*   22、允许已存在的数据文件自动增长：ALTER DATABASE DATAFILE 'filename' AUTOEXTEND ON NEXT 5M MAXSIZE 100M;
*   23、手工改变已存在数据文件的大小：ALTER DATABASE DATAFILE 'filename' RESIZE 100M;