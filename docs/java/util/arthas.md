---
title: arthas 诊断工具
---

> [Arthas 应用诊断利器 (aliyun.com)](https://arthas.aliyun.com/zh-cn/)
>
> [alibaba/arthas: Alibaba Java Diagnostic Tool Arthas/Alibaba Java诊断利器Arthas (github.com)](https://github.com/alibaba/arthas)

### 备忘单

#### 基础命令

```
# 启动
curl -O https://arthas.aliyun.com/arthas-boot.jar
java -jar arthas-boot.jar

# 仪表板
dashboard

# 反编译
jad demo.MathGame

# 通过watch命令来查看demo.MathGame#primeFactors函数的返回值
watch demo.MathGame primeFactors returnObj

# 退出
quit
exit
# 完全退出arthas
stop
```

#### jvm相关

```
# 线程相关
# 当前最忙的前N个线程并打印堆栈
thread -n 3
# 当前阻塞其他线程的线程
thread -b
# 统计最近1000ms内的线程CPU时间
thread -i 1000
# 列出1000ms内最忙的3个线程栈
thread -n 3 -i 1000
# 查看指定状态的线程
thread --state WAITING

# 查看当前JVM信息
jvm
# 查看当前JVM的系统属性
sysprop
# 查看单个属性
sysprop user.country
# 修改单个属性
sysprop user.country CN
# 查看当前JVM的环境属性
sysenv
# 查看单个环境变量
sysenv JAVA_HOME

# 查看VM诊断相关的参数
vmoption
# 查看指定的option
vmoption PrintGC
# 更新指定的option
vmoption PrintGC true

# dump到指定文件
heapdump /tmp/dump.hprof
# 只dump live对象
heapdump --live /tmp/dump.hprof

# 强制GC
vmtool --action forceGc
# 查看前 10 个 String 对象实例
vmtool --action getInstances --className java.lang.String --limit 10
```

#### class/classloader相关

```
234# 模糊搜索
sc demo.*
# 打印类的详细信息
sc -d demo.MathGame
# 打印出类的Field信息
sc -d -f demo.MathGame
# 查看已加载类的方法信息
sm java.lang.String
# 查看指定方法详情
sm -d java.lang.String toString

# 反编译指定的类
jad java.lang.String
# 反编译指定的函数
jad java.lang.String toString

# 替换正在运行的类
# 反编译需要修改的类
jad --source-only com.example.demo.arthas.user.UserController > /tmp/UserController.java
# 编译修改完的类
mc /tmp/UserController.java -d /tmp
# 替换掉
retransform /tmp/com/example/demo/arthas/user/UserController.class
# 消除 retransform 的影响
retransform -l 					# 查看已经修改过的
retransform -d 1 				# 删除指定的
retransform --deleteAll	# 删除所有的

# 按类加载类型查看统计信息
classloader
# 按类加载实例查看统计信息
classloader -l
# 查看ClassLoader的继承树
classloader -t
```

#### 监控相关

> 请注意，这些命令，都通过字节码增强技术来实现的，会在指定类的方法中插入一些切面来实现数据统计和观测，因此在线上、预发使用时，请尽量明确需要观测的类、方法以及条件，诊断结束要执行 `stop` 或将增强过的类执行 `reset` 命令

```
# 监控方法执行情况
# 每 5 秒统计一次指定方法执行情况
monitor -c 5 demo.MathGame primeFactors
# 计算条件表达式过滤统计结果(方法执行完毕之后)
monitor -c 5 demo.MathGame primeFactors "params[0] <= 2"
# 计算条件表达式过滤统计结果(方法执行完毕之前)
monitor -b -c 5 com.test.testes.MathGame primeFactors "params[0] <= 2"

# 函数执行情况
# 观察函数调用返回时的参数、this对象和返回值，遍历深度 2
watch demo.MathGame primeFactors -x 2
# 观察函数调用入口的参数和返回值
watch demo.MathGame primeFactors "{params,returnObj}" -x 2 -b
# 同时观察函数调用前和函数返回后 2 次
watch demo.MathGame primeFactors "{params,target,returnObj}" -x 2 -b -s -n 2
# 观察异常信息
watch demo.MathGame primeFactors "{params[0],throwExp}" -e -x 2
# 按照耗时进行过滤
watch demo.MathGame primeFactors '{params, returnObj}' '#cost>200' -x 2
# 观察当前对象中的属性
watch demo.MathGame primeFactors 'target.illegalArgumentCount'

# 追踪方法执行，并限制捕捉次数
trace demo.MathGame run -n 1
# 包含jdk的函数
trace --skipJDKMethod false demo.MathGame run
# 据调用耗时过滤
trace demo.MathGame run '#cost > 10'


# 输出当前方法被调用的调用路径
stack demo.MathGame primeFactors
# 据条件表达式来过滤
stack demo.MathGame primeFactors 'params[0]<0' -n 2
# 据执行时间来过滤
stack demo.MathGame primeFactors '#cost>5'
```



####  ognl

可以在表达式中直接使用

| 变量名    | 变量解释                                                     |
| --------- | ------------------------------------------------------------ |
| loader    | 本次调用类所在的 ClassLoader                                 |
| clazz     | 本次调用类的 Class 引用                                      |
| method    | 本次调用方法反射引用                                         |
| target    | 本次调用类的实例                                             |
| params    | 本次调用参数列表，这是一个数组，如果方法是无参方法则为空数组 |
| returnObj | 本次调用返回的对象。当且仅当 `isReturn==true` 成立时候有效，表明方法调用是以正常返回的方式结束。如果当前方法无返回值 `void`，则值为 null |
| throwExp  | 本次调用抛出的异常。当且仅当 `isThrow==true` 成立时有效，表明方法调用是以抛出异常的方式结束。 |
| isBefore  | 辅助判断标记，当前的通知节点有可能是在方法一开始就通知，此时 `isBefore==true` 成立，同时 `isThrow==false` 和 `isReturn==false`，因为在方法刚开始时，还无法确定方法调用将会如何结束。 |
| isThrow   | 辅助判断标记，当前的方法调用以抛异常的形式结束。             |
| isReturn  | 辅助判断标记，当前的方法调用以正常返回的形式结束。           |

```

```

