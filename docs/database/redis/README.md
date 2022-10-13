---
title: redis
---
> [CRUG网站 (redis.cn)](http://www.redis.cn/)

## 备忘单

#### 连接服务

```
# 直接输入密码
redis-cli -h <host> -p <port> -a <password> -n 0（数据库）

# 先登录后输入密码
redis-cli -h <host> -p <port>
auth <password>

# 退出
quit
```



#### 锁

```
SET <key>  <value> NX EX <max-lock-time>
```



#### 字符串

```

```



#### 删除数据

```
# 使用 UNLINK 异步删除
# 看需要添加 host port password db
# ksys
redis-cli KEYS key* （查找条件） | xargs redis-cli UNLINK 

# 使用 scan
redis-cli scan 0 match "匹配内容" count 扫描数量 | xargs -t  redis-cli  UNLINK

```

网上搜的脚本

[redis如何优雅删除大量的key？_八号码农的博客-CSDN博客_redis 删除多个key](https://blog.csdn.net/wen3qin/article/details/120789060)

```
#!/bin/bash
#定义变量《根据个人需要填写》
redis_url=地址
redis_pass=密码
redis_db=操作DB
scan_patten=匹配字符串
scan_count=扫描数量

yb=0
#0：循环获取游标进行遍历
while 1>0
do

count=0
declare -a array

#1：扫描获取结果
declare -a result
for i in `redis-cli -h $redis_url -a $redis_pass -n $redis_db scan $yb match $scan_patten count $scan_count`;do
		result[${count}]=${i}
    count=$(expr ${count} + 1)
done

#2：设置游标值
yb=${result[0]}

#3：赋值array,打印寻找到的key值
for j in ${!result[@]}
do		
		if [ $j -gt 0 ]
    then echo ${result[$j]}
    array[${count}]=${result[$j]}
    fi
done    

#4：批量删除key值
		if [ ${#array[@]} -gt 0 ]
    then 
    #${result[$j]}
    echo ${array[@]} | xargs -t redis-cli -h $redis_url -a $redis_pass -n $redis_db del 
    fi

#5：判断条件结束循环
if [ $yb -eq 0 ]
then break
fi

unset result
unset array    
    
done
```

