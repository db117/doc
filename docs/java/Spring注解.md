#springboot 注解整理
####bean的分类标识
*   @Service: 
    *   注解在类上，表示这是一个业务层bean
*   @Controller：
    *   注解在类上，表示这是一个控制层bean
*   @Repository: 
    *   注解在类上，表示这是一个数据访问层bean
*   @Component： 
    *   注解在类上，表示通用bean
####bean注入
*   @Autowired：
    *   按类型装配
*   @Resource： 
    *   按名称装配

####配置相关
*   @Configuration：
    *   注解在类上，表示这是一个IOC容器，相当于spring的配置文件，java配置的方式。 IOC容器的配置类
*   @Bean： 
    *   注解在方法上，声明当前方法返回一个Bean
*   @PostConstruct：
    *   注解在方法上，构造函数执行后执行。！！！！！！！！！！！！！！！！！！！！！！！！！！
*   @PreDestroy： 
    *   注解在方法上，在Bean销毁前执行。！！！！！！！！！！！！！！！！！！！！！！！！！！
*   @ComponentScan：
    *   注解在类上，扫描标注了@Controller等注解的类，注册为bean
*   @Lazy(true):　　
    *   延迟初始化

*   @Scope：
    *   注解在类上，描述spring容器如何创建Bean实例。
*   @Value：
    *   注解在变量上，从配置文件中读取。
*   @Profile：
    *   注解在方法 类上 在不同情况下选择实例化不同的Bean 特定环境下生效！！！！！！！！！！！！！！！！！
*   @SpringBootApplication：
    *   @SpringBootApplication=@ComponentScan+@Configuration+@EnableAutoConfiguration：约定优于配置
*   @WebServlet
    *   (name="Servlet3FirstDemo",value="/Servlet3FirstDemo")定义servlet
*   @WebFilter
    *   将一个实现了javax.servlet.Filte接口的类定义为过滤器
    
####控制层
*   @RestController 
    *   @RestController 是一个结合了 @ResponseBody 和 @Controller 的注解
*   @Controller
    *   控制层注解
*   @RequestBody
    *   请求数据
*   @ResponseBody
    *   返回json
*   @PathVariable
    *   restFul定位符
*   @RequestMapping　　　和请求报文是做对应的　　　
    *    value，指定请求的地址 
    *    method 请求方法类型 这个不写的话，自适应：get或者post
    *    consumes 请求的提交内容类型 
    *    produces 指定返回的内容类型 仅当request请求头中的(Accept)类型中包含该指定类型才返回
    *    params 指定request中必须包含某些参数值 
    *    headers 指定request中必须包含指定的header值
    
####实体类
*   @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    *   实体类保存格式转换