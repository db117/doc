---
title: JUnit
---

> [JUnit 5](https://junit.org/junit5/)
>
> [junit-team/junit5: ✅ The 5th major version of the programmer-friendly testing framework for Java and the JVM (github.com)](https://github.com/junit-team/junit5)

### 使用

#### 常用注解

| Annotation               | Description                                                  |
| :----------------------- | :----------------------------------------------------------- |
| `@Test`                  | 标记为测试方法                                               |
| `@ParameterizedTest`     | 标记为参数化测试                                             |
| `@RepeatedTest`          | 多次执行                                                     |
| `@TestFactory`           | 动态创建 Test。方法需返回`DynamicNode`                       |
| `@TestClassOrder`        | 有多个嵌套测试类，标记需要排序。                             |
| `@TestMethodOrder`       | 有多个嵌套测试方法，标记需要排序                             |
| `@DisplayName`           | 定义该测试名称                                               |
| `@DisplayNameGeneration` | 指定测试名称生成类                                           |
| `@BeforeEach`            | 在标记`@Test`, `@RepeatedTest`, `@ParameterizedTest`,  `@TestFactory` 的方法执行前执行 |
| `@AfterEach`             | 在标记`@Test`, `@RepeatedTest`, `@ParameterizedTest`,  `@TestFactory` 的方法执行后执行 |
| `@BeforeAll`             | 在所有测试方法执行前执行                                     |
| `@AfterAll`              | 在所有测试方法执行后执行                                     |
| `@Nested`                | 标记为嵌套测试                                               |
| `@Tag`                   | 打个标记，再使用插件是可以过滤。                             |
| `@Disabled`              | 忽略该测试                                                   |
| `@Timeout`               | 指定超时时间                                                 |
| `@TempDir`               | 临时目录                                                     |
| `@Order`                 | 执行顺序                                                     |

#### 断言

- Equals
  - 断言是否相等 `assertEquals`，`assertArrayEquals`，`assertNotEquals`
- Boolean
  - 断言 Boolean 类型 `assertFalse`，`assertTrue`
- Throw
  - 判断是否有异常 `assertDoesNotThrow`，`assertThrows`
  - `assertThrowsExactly`判断完全异常是否完全相等
- Timeout
  - 是否超时 `assertTimeout`（超时不会中断）
  - `assertTimeoutPreemptively` 超时时会中断

#### Conditional

- `@EnabledOnOs`，根据操作系统判断

- `@EnabledForJreRange`，`@EnabledOnJre` ,`@DisabledForJreRange`,`@DisabledOnJre`根据Java运行环境
- `@DisabledInNativeImage`,`@DisabledInNativeImage`判断是否在`GraalVM`中
- `@EnabledIfSystemProperty`，`@DisabledIfSystemProperty` 根据系统参数判断
- `@EnabledIfEnvironmentVariable`，`@DisabledIfEnvironmentVariable` 根据环境变量判断



#### 参数测试

> 使用不同的参数进行测试，使用`@ParameterizedTest`标记。

- `@NullSource` null对象，不能对基础数据类型使用
- `@EmptySource` 一个空值
- `@NullAndEmptySource` 包含`@NullSource`，`@EmptySource` 
- `@ValueSource` 一组参数
- `@EnumSource` 一组枚举
- `@MethodSource` 自定义方法返回参数，但是需要限定返回对象为
  - java.util.stream.Stream 
   - java.util.stream.DoubleStream
   -  java.util.stream.LongStream
   - java.util.stream.IntStream
   - java.util.Collection
   - java.util.Iterator
   - java.lang.Iterable
   - org.junit.jupiter.params.provider.Arguments
   - String[]
- `@CsvSource` 使用 csv 格式的测试数据
- `@CsvFileSource` 使用 csv 格式的测试数据

#### 参数配置

配置方式

- 通过构建工具的插件配置参数
- 通过 `JVM system properties`
- `junit-platform.properties`文件

