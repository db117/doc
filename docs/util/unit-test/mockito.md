---
title: mockito
---

> 一个在 Java 单元测试中模拟校验数据的框架 
>
> [mockito/mockito: Most popular Mocking framework for unit tests written in Java (github.com)](https://github.com/mockito/mockito)
>
> [Mockito framework site](https://site.mockito.org/)

### 使用

#### mock 和 spy 区别

- mock 出的对象是 null 的上面都没有，没有插桩返回默认值
- spy 出的对象是真实的对象、在没有插桩的情况下执行真实的方法
- spy 在执行 `when().return()`时会先执行真实方法,再执行插桩的方法,需用 `doReturn().when()`
- `Answer`和`Throw`同上

#### 模拟数据

> 有多种方式实现，但是常用注解方式。

在需要插桩的对象、接口上面添加注解`@Mock`、`@Spy`、`Captor`，在需要测试的对象上添加注解`@InjectMocks`然后调用`MockitoAnnotations#openMocks()`。

```
org.mockito.internal.stubbing.defaultanswers.ReturnsEmptyValues#returnValueFor
```



#### 常用api

- mock
  - 参数带 `Class ` 的是通过参数来获取具体对象类型的
  - 参数没有带 `Class ` 的是用来返回值的泛型来获取对象类型的
- mockConstruction
  - 模拟构造函数，很少使用
- mockStatic
  - 模拟静态方法
- spy
  - 模拟对象，再没有插桩下调用的是真实方法
  - spy 在执行 `when().return()`时会先执行真实方法,再执行插桩的方法,需用 `doReturn().when()`
- when
  - 核心api，开启插桩。

##### 执行插桩

- doReturn

  - 最常用的方法，模拟返回值。

  - 可以传入多个返回值，依次返回。

  - ```
    		doReturn("foo", "bar")
                    .doThrow(new RuntimeException())
                    .doReturn(430L, new byte[0], "qix")
                    .when(mock)
                    .objectReturningMethodNoArgs();
    
            assertThat(mock.objectReturningMethodNoArgs()).isEqualTo("foo");
            assertThat(mock.objectReturningMethodNoArgs()).isEqualTo("bar");
            try {
                mock.objectReturningMethodNoArgs();
                fail("exception not raised");
            } catch (RuntimeException expected) {
            }
    
            assertThat(mock.objectReturningMethodNoArgs()).isEqualTo(430L);
            assertThat(mock.objectReturningMethodNoArgs()).isEqualTo(new byte[0]);
            assertThat(mock.objectReturningMethodNoArgs()).isEqualTo("qix");
            assertThat(mock.objectReturningMethodNoArgs()).isEqualTo("qix");
    ```
- ​	doThrow

  - 同 doReturn
- doNothing

  - 常见于`void`返回值的方法，模拟一次调用。

  - ```
       doNothing().
       doThrow(new RuntimeException())
       .when(mock).returnVoidMethod();
    
       // 第一次调用，什么都没有执行
       mock.returnVoidMethod();
    
       // 第二次抛出异常
       mock.returnVoidMethod();
    ```
- doCallRealMethod

  - 调用真实方法，只有在历史代码上面才会这么干。属于填坑

- doAnswer
  - 通过`org.mockito.stubbing.Answer`构造返回值
  - 再模拟返回 `void`的方法时需要返回 null

##### 验证

- after

  - 需要在后面接上验证模式

  - 在指定时间内进行校验，如果校验失败则直接抛出异常

  - 在指定时间结束时，未满足条件也会抛出异常

  - ```
       // 100ms 内，被调用 1 次
       verify(mock, after(100)).someMethod();
       // 100ms 内，被调用 1 次
       verify(mock, after(100).times(1)).someMethod();
    
       // 100ms 内，被调用 2 次
       verify(mock, after(100).times(2)).someMethod();
    
       // 100ms 内，被调用 0 次
       verify(mock, after(100).never()).someMethod();
    ```

- timeout

  - 使用方式和`after`一样

  - 但是timeout再满足条件后直接返回`success`，但是`after`需要等到时间结束才返回

  - ```
       //1.
       mock.foo();
       verify(mock, after(1000)).foo();
       // 等 1000 ms
    
       //2.
       mock.foo();
       verify(mock, timeout(1000)).foo();
       // 直接返回
    ```

    

- atLeast，atLeastOnce

  - 最少调用次数

- atMostOnce，atMost

  - 最多调用次数

- times

  - 指定调用次数

- only

  - 是否是唯一调用的方法
  - 和`verifyNoMoreInteractions`有相同的功能。

- verifyNoInteractions

  - 验证没有插桩的方法被调用

- verifyNoMoreInteractions

  - 验证没有非插桩方法被调用

- inOrder
  - 验证方法调用顺序
- calls
  - 指定调用次数
  - 只能在`inOrder`使用

##### 参数捕捉

> 使用`@Captor`标记在`ArgumentCaptor`上。 
>
> 在每一个插桩的方法都有一个栈来保存方法执行的参数，参数捕捉就是直接获取栈顶的数据。



         @Captor ArgumentCaptor<Person> captor;
         
         // when
         createPerson("Wes", "Williams");
            
        // then
        ArgumentCaptor<Person> captor = ArgumentCaptor.forClass(Person.class);
        verify(peopleRepository).save(captor.capture());
        assertEquals("Wes", captor.getValue().getName());
        assertEquals("Williams", captor.getValue().getSurname());
