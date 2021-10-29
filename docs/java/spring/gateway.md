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

  就是配置文件的东西