---
title: gateway
---

> 基于spring-webflux，netty，springCloud的一个反应式网关。

<iframe id="embed_dom" name="embed_dom" frameborder="0" style="display:block;width:725px; height:245px;" src="https://www.processon.com/embed/616fc00e1efad42eb5ebffb5"></iframe>

### 基础组件

- **route**

  由一个id，一个目标URL，一组谓词（**Predicate**），和一组过滤器（**Filter**）组成

  ```
  org.springframework.cloud.gateway.route.Route
    private final String id;
  
  	private final URI uri;
  
  	private final int order;
  
  	private final AsyncPredicate<ServerWebExchange> predicate;
  
  	private final List<GatewayFilter> gatewayFilters;
  
  	private final Map<String, Object> metadata;
  ```

- **Predicate**

  继承与`java.util.function.Predicate`，入参为 `org.springframework.web.server.ServerWebExchange`，通过 `test（）`方法判断是否匹配

  ```
  public interface GatewayPredicate extends Predicate<ServerWebExchange>
  ```

- **Filter**

  形成过滤器调用链，处理请求值，返回值。

### 默认配置

> 介绍一下主要的配置信息 `org.springframework.cloud.gateway.config.GatewayAutoConfiguration`

- **CompositeRouteDefinitionLocator**

  一个`org.springframework.cloud.gateway.route.RouteDefinitionLocator`合集，主要获取route。集成了一下几个

  - CachingRouteDefinitionLocator：缓存如有信息
  - DiscoveryClientRouteDefinitionLocator：通过服务发现加载路由
  - InMemoryRouteDefinitionRepository：通过api管理的路由信息
  - PropertiesRouteDefinitionLocator：配置文件的路由信息

- **CachingRouteLocator**

  获取所有`RouteLocator`，通过`RouteDefinitionLocator`获取路由配置信息，生成路由并缓存。

  发生`RefreshRoutesEvent`事件时刷新缓存

- **RouteRefreshListener**

  监听`ContextRefreshedEvent`，`RefreshScopeRefreshedEvent`，`InstanceRegisteredEvent`，`ParentHeartbeatEvent`，`HeartbeatEvent`等事件。发送`RefreshRoutesEvent`事件。

- **FilteringWebHandler**

  Gateway入口，由webflux核心`DispatcherHandler`调用，主要工作就是把GlobalFilter通过`GatewayFilterAdapter`适配成`GatewayFilter`并生成调用链`org.springframework.cloud.gateway.handler.FilteringWebHandler.DefaultGatewayFilterChain`。

- **RoutePredicateHandlerMapping**

  主要负责找到执行的路由，通过调用路由的`AsyncPredicate`判断。

- GatewayProperties

  就是配置文件`spring.cloud.gateway`的东西

- **HttpClient**

  netty发起请求的客户端

- HttpClientProperties

  `spring.cloud.gateway.httpclient`下的配置

#### PredicateFactory

> 通过一下形式进行配置，会在系统加载的时候进行创建并组装到route中。
>
> 名称为下面的名称去掉`RoutePredicateFactory`，参数逗号分隔。
>
> 格式为 `- <name>=arg,arg...`  或者 kv形式的

```
predicates:
- Cookie=mycookie, mycookievalue
- name: Cookie
  args:
    name: mycookie
    regexp: mycookievalue
```

- AfterRoutePredicateFactory

  在某个时间段后，入参为`datetime`

- BeforeRoutePredicateFactory

  在某个时间段前，入参为`datetime`

- BetweenRoutePredicateFactory

  在某个时间段之间，入参为`datetime1`，`datetime1`

- CookieRoutePredicateFactory

  判断cookies是否满足正则匹配规则，入参为`name`，`regexp`

- HeaderRoutePredicateFactory

  判断Header是否满足正则匹配规则，入参为`header`，`regexp`

- HostRoutePredicateFactory

  进行host匹配判断，入参为`patterns`集合（逗号分隔）

- MethodRoutePredicateFactory

  通过请求方法进行判断，入参为`methods`集合（逗号分隔）

- PathRoutePredicateFactory

  根据path判断，入参为`patterns`集合，最后一个参数可以为布尔类型`matchTrailingSlash`是否匹配反斜杠，默认为

  可在配置文件中添加{segment}，在filter中通过以下代码获取

  ```
  predicates:
  - Path=/red/{segment},/blue/{segment}
  
  
  Map<String, String> uriVariables = ServerWebExchangeUtils.getPathPredicateVariables(exchange);
  
  String segment = uriVariables.get("segment");
  ```

- QueryRoutePredicateFactory

  通过查询参数来搬到判断，入参为`param`，`regexp`

- RemoteAddrRoutePredicateFactory

  通过远程地址来判断，入参为`sources`

#### GatewayFilterFactory

> 网关过滤器，和PredicateFactory配置模式基本上一致
>
> 详细查看 [Spring Cloud Gateway](https://docs.spring.io/spring-cloud-gateway/docs/current/reference/html/#gatewayfilter-factories)

#### GlobalFilter

> 所有请求都走的过滤器，与`gatewayFilter`的接口签名一致。在执行是会转换成`gatewayFilter`即`org.springframework.cloud.gateway.handler.FilteringWebHandler.GatewayFilterAdapter`，形成一个调用链。
>
> 以下介绍主要的过滤器，按照优先级进行排列

- RemoveCachedBodyFilter

  优先级为`Integer.MIN_VALUE`，作用为所有操作完成后执行回调，清除缓存。缓存是通过`org.springframework.cloud.gateway.support.ServerWebExchangeUtils#cacheRequestBodyAndRequest`添加的。

- NettyWriteResponseFilter

  **优先级为-1**，会调用`org.springframework.http.ReactiveHttpOutputMessage#writeWith`或`writeAndFlushWith`把连接返回值写入到http层。

  **如需加入修改返回值的过滤器，优先级一定要比-1小，才会生效。**比如`org.springframework.cloud.gateway.filter.factory.rewrite.ModifyResponseBodyGatewayFilterFactory.ModifyResponseGatewayFiltery`优先级为-2。

- ForwardPathFilter

  优先级为0，对forward请求修改请求path。

- RouteToRequestUrlFilter

  优先级为`10000`，获取路由并修改请求地址为路由地址。路由在`org.springframework.cloud.gateway.handler.RoutePredicateHandlerMapping#getHandlerInternal`中添加。

- ReactiveLoadBalancerClientFilter

  优先级为`10150`，对`lb`进行负载均衡获取实例，并把实际请求路径写入到属性中。

- NettyRoutingFilter

  优先级为`Integer.MAX_VALUE`，实际转发请求的地方，并把返回信息保存到参数信息中。所有需要修改请求信息的都在它之前。