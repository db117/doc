---
title: java集合
---

<iframe id="embed_dom" name="embed_dom" frameborder="0" style="display:block;width:725px; height:245px;" src="https://www.processon.com/embed/60e5834f6376892c1ec611af"></iframe>

## List

### ArrayList

> `java.util.ArrayList`
>
> 最常用的集合,实现方式为数组

```
public class ArrayList<E> extends AbstractList<E>
        implements List<E>, RandomAccess, Cloneable, java.io.Serializable
```

- 使用`transient Object[] elementData;`来保存数据，默认大小为10

- 每一次扩容为之前的1.5倍`int newCapacity = oldCapacity + (oldCapacity >> 1);`

- 标记为java.util.RandomAccess，可进行随机访问

- 删除元素需要调用 `System.arraycopy()` 将 index+1 后面的元素都复制到 index 位置上，该操作的时间复杂度为 O(N)

- subList

  > 访问时通过从定向index来实现，添加修改会改变原来的List

- `java.util.Arrays.ArrayList`为`Arrays`的实现，不能修改。但是可以get，set

### LinkedList

```
public class LinkedList<E>
    extends AbstractSequentialList<E>
    implements List<E>, Deque<E>, Cloneable, java.io.Serializable
```

> `java.util.LinkedList`
>
> 相比ArrayList多实现了java.util.Deque接口
>
> 使用双向链表来保存数据

- 不要通过index进行操作，会遍历链表

### Vector(线程安全)

```
public class Vector<E>
    extends AbstractList<E>
    implements List<E>, RandomAccess, Cloneable, java.io.Serializable
```

> `java.util.Vector`
>
> 跟java.util.ArrayList类似，不过接口通过synchronized来保证并发安全

- 扩容直接翻倍

```
// 容量满了后，如果设置了capacityIncrement这按照设置的数量进行增加，否则翻倍
int newCapacity = oldCapacity + ((capacityIncrement > 0) ?
                                 capacityIncrement : oldCapacity);
```

### Stack(线程安全)

```
public class Stack<E> extends Vector<E> 
```

> `java.util.Stack`
>
> 直接继承自`java.util.Vector`
>
> 实现stack数据结构

### CopyOnWriteArrayList(线程安全)

```
public class CopyOnWriteArrayList<E>
    implements List<E>, RandomAccess, Cloneable, java.io.Serializable 
    
    // 不存在才加入
    // 比其他 list 多的 api 
    public boolean addIfAbsent(E e)
```

> `java.util.concurrent.CopyOnWriteArrayList`

- 和ArrayList一样，其底层数据结构也是数组，加上transient不让其被序列化，加上volatile修饰来保证多线程下的其可见性和有序性
- CopyOnWriteArrayList适合于多线程场景下使用，其采用读写分离的思想，读操作不上锁，写操作上锁，且写操作效率较低
- CopyOnWriteArrayList基于fail-safe机制，每次修改都会在原先基础上复制一份，修改完毕后在进行替换
- CopyOnWriteArrayList在1.8中采用的是ReentrantLock进行上锁。jdk11中采用的是synchronized进行加锁
- **不能保证实时一致性**，只能保证最终一致性
- 迭代器使用数组快照。



## map

### HashMap

> 最常用的map，使用拉链发解决 hash 冲突
>
> 在 1.8 后链表长度过长会转换为红黑树

```
public class HashMap<K,V> extends AbstractMap<K,V>
    implements Map<K,V>, Cloneable, Serializable 
    
   
 static final int DEFAULT_INITIAL_CAPACITY = 1 << 4;// 默认容量
 static final float DEFAULT_LOAD_FACTOR = 0.75f;// 扩容阈值
 static final int TREEIFY_THRESHOLD = 8;// 链表改红黑树阈值
 static final int UNTREEIFY_THRESHOLD = 6;// 红黑树改链表阈值
 
 transient Node<K,V>[] table;// 存数据的数组
 transient int size;// map的数量
 transient int modCount;// 线程不安全是.快速失败
 
 static class Node<K,V> implements Map.Entry<K,V> {
        final int hash;//对key的hashcode值进行hash运算后得到的值，存储在Entry，避免重复计算
        final K key;
        V value;
        Node<K,V> next;//存储指向下一个Entry的引用，单链表结构
 }
 
 // 高低位异或,减小冲突
 static final int hash(Object key) {
        int h;
        return (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16);
}
```

### TreeMap

> TreeMap的实现是红黑树算法的实现
>
> 为有序map

```
public class TreeMap<K,V>
    extends AbstractMap<K,V>
    implements NavigableMap<K,V>, Cloneable, java.io.Serializable
    
    // 重要属性
    // 比较器，因为TreeMap是有序的
    private final Comparator<? super K> comparator;
    //TreeMap红-黑节点，为TreeMap的内部类
    private transient Entry<K,V> root = null;
    //容器大小
    private transient int size = 0;
    //TreeMap修改次数
    private transient int modCount = 0;
    //红黑树的节点颜色--红色
    private static final boolean RED = false;
    //红黑树的节点颜色--黑色
    private static final boolean BLACK = true;
```

### Hashtable(线程安全)

> 很古老的线程安全的map
>
> 可以简单粗暴的理解为对 hashmap 的修改方法加锁
>
> 推荐使用 `java.util.concurrent.ConcurrentHashMap` 

```
public class Hashtable<K,V>
    extends Dictionary<K,V>
    implements Map<K,V>, Cloneable, java.io.Serializable
```

### IdentityHashMap

> `Hashmap` 使用 equals 来比较是否相等，而`IdentityHashMap`使用 ==
>
> **不是Map的通用实现**，它有意违反了Map的常规协定。并且IdentityHashMap允许key和value都为null

```
public class IdentityHashMap<K,V>
    extends AbstractMap<K,V>
    implements Map<K,V>, java.io.Serializable, Cloneable
```

### LinkedHashMap

> 继承自`HashMap`，添加双向链表来保证迭代循序
>
> 通过重写 newNode 和 newTreeNode 来说实现添加数据放入队尾
>
> 可扩展实现 LRU 缓存

```
public class LinkedHashMap<K,V>
    extends HashMap<K,V>
    implements Map<K,V>
    
    // 双端列表头
    transient LinkedHashMap.Entry<K,V> head;

    // 双端列表尾
    transient LinkedHashMap.Entry<K,V> tail;

		// 链表顺序：{@code true}表示访问顺序，{@code false}表示插入顺序。
    final boolean accessOrder;
		
		// 扩展方法，可以实现 LRU 缓存
		// 返回 true 就会在插入数据的时候删除最老的 node
    protected boolean removeEldestEntry(Map.Entry<K,V> eldest) {
        return false;
    }

		// 对 hashmap 中下面三个方法进行重写
    // Callbacks to allow LinkedHashMap post-actions
    // accessOrder 为 true 时访问数据时会把  node 移动到链表尾部
    void afterNodeAccess(Node<K,V> p) { }
    // 符合条件会删除最老的 node
    void afterNodeInsertion(boolean evict) { }
    // 把 node 移动到队列尾部
    void afterNodeRemoval(Node<K,V> p) { }

```

### WeakHashMap

> 主要是用在内存敏感的系统中，当缓存使用

```
public class WeakHashMap<K,V>
    extends AbstractMap<K,V>
    implements Map<K,V> 
    
    // 准备被 gc 掉的key放入到队列中
    private final ReferenceQueue<Object> queue = new ReferenceQueue<>();
    
    // 每一次操作时删除掉在队列中的 key，当 key 被回收时会把 entry 放到队列里面
    private void expungeStaleEntries() {}
```

### EnumMap

> key 必须为`Eunm`的map

```
public class EnumMap<K extends Enum<K>, V> extends AbstractMap<K, V>
    implements java.io.Serializable, Cloneable
```

- 保存数据的数组大小为枚举的数量
- 操作数组使用`java.lang.Enum#ordinal`当index



### ConcurrentHashMap(线程安全)

> 最常用的线程安全map，主要结构跟 `hashmap`差不多。
>
> synchronized 只锁定当前链表或红⿊⼆叉树的⾸节点，这样只要 hash 不冲突，就不会产⽣并发，效率⼜提升 N 倍。

##### ConcurrentHashMap流程图

<iframe id="embed_dom" name="embed_dom" frameborder="0" style="display:block;width:725px; height:245px;" src="https://www.processon.com/embed/61b6ee4a1efad42237b9a3ac"></iframe>

```
public class ConcurrentHashMap<K,V> extends AbstractMap<K,V>
    implements ConcurrentMap<K,V>, Serializable 
    
// node数组最大容量：2^30=1073741824
private static final int MAXIMUM_CAPACITY = 1 << 30;
// 默认初始值，必须是2的幕数
private static final int DEFAULT_CAPACITY = 16
//数组可能最大值，需要与toArray（）相关方法关联
static final int MAX_ARRAY_SIZE = Integer.MAX_VALUE - 8;
//并发级别，遗留下来的，为兼容以前的版本 在序列话时使用
private static final int DEFAULT_CONCURRENCY_LEVEL = 16;
private static final float LOAD_FACTOR = 0.75f;// 负载因子
static final int TREEIFY_THRESHOLD = 8;// 链表转红黑树阀值,> 8 链表转换为红黑树
//树转链表阀值，小于等于6（tranfer时，lc、hc=0两个计数器分别++记录原bin、新binTreeNode数量，<=UNTREEIFY_THRESHOLD 则untreeify(lo)）
static final int UNTREEIFY_THRESHOLD = 6;
// 需要转换红黑树的最小阈值 
static final int MIN_TREEIFY_CAPACITY = 64;
// 2^15-1，help resize的最大线程数
private static final int MAX_RESIZERS = (1 << (32 - RESIZE_STAMP_BITS)) - 1;
// 32-16=16，sizeCtl中记录size大小的偏移量
private static final int RESIZE_STAMP_SHIFT = 32 - RESIZE_STAMP_BITS

transient volatile Node<K,V>[] table;//存放node的数组

private transient volatile Node<K,V>[] nextTable;// 仅仅在扩容是非空

/*控制标识符，用来控制table的初始化和扩容的操作，不同的值有不同的含义
 *当为负数时：-1代表正在初始化，-N代表有N-1个线程正在 进行扩容
 *当为0时：代表当时的table还没有被初始化
 *当为正数时：表示初始化或者下一次进行扩容的大小
private transient volatile int sizeCtl;


// 特定 hash 值
static final int MOVED     = -1; // 正在扩容中
static final int TREEBIN   = -2; // 已经转换为红黑树了
static final int RESERVED  = -3; // compute，computeIfAbsent时用于标记正在处理，只会对数组节点为 null 时出现
static final int HASH_BITS = 0x7fffffff; // 会和 hash 进行 & 运算，保证 hash 不小于 0

// 当当前操作节点正在扩容时辅助扩容
final Node<K,V>[] helpTransfer(Node<K,V>[] tab, Node<K,V> f) {}
```

- 使用`synchronized`锁住链表头或红黑树根节点
- key 和 value 都不容许为 null
- Nod节点中value和next都用volatile修饰，保证并发的可见性
- 通过节点 hash 来分辨类型

#### 节点类型

##### Node

> 一个链表节点，如果转换成红黑树也会有链表结构

- hash：key 的 hash
- next：链表的下一个

##### TreeNode

> 红黑树节点
>
> `hash` 值为`key`的 hash值

##### TreeBin

> 不保存数据，指向红黑树的根节点。
>
> 提供一个简单的读写锁，保证同时只有一个线程会对当前红黑树进行修改
>
> `hash` 值为`-2`

```
TreeNode<K,V> root;            // 指向红黑树根节点
volatile TreeNode<K,V> first;  // 保证根节点变化后其他线程的可见性
volatile Thread waiter;        // 等待的线程
volatile int lockState;        // 锁状态

static final int WRITER = 1;   // 有线程在修改
static final int WAITER = 2;   // 有线程在等待
static final int READER = 4;   // 有线程在读的时候对 lockState 的累加值
```

##### ForwardingNode

> 不保存数据，只有一个 `nextTable` 的引用。
>
> 标记当前节点已经迁移完成，提供一个 `find` 方法，会到 `nextTable` 中查找节点。
>
> `hash` 值为`-1`

##### ReservationNode

> `hash` 值为`-3`
>
> compute，computeIfAbsent时用于标记正在处理，只会对数组节点为 null 时出现





### ConcurrentSkipListMap(线程安全)

> 提供了一种线程安全的并发访问的排序映射表。内部是SkipList（跳表）结构实现，在理论上能够O(log(n))时间内完成查找、插入、删除操作。

```
public class ConcurrentSkipListMap<K,V> extends AbstractMap<K,V>
    implements ConcurrentNavigableMap<K,V>, Cloneable, Serializable
    
    // 使用 node 来保存数据，不参与构建跳表结构
    // 有序的链表
     static final class Node<K,V> {
        final K key; 
        V val;
        Node<K,V> next;
    }
    
    // 实现跳表结构
    static final class Index<K,V> {
        final Node<K,V> node; // 实际保存的数据
        final Index<K,V> down;// 指向下一级
        Index<K,V> right;			// 指向右边链表
    }
```



## set

### HashSet

> 就是封装 `Hashmap`，value 为一个空对象

```
public class HashSet<E>
    extends AbstractSet<E>
    implements Set<E>, Cloneable, java.io.Serializable
    
    // 一个特殊的构造器，dummy 主要是区分其他构造器
    // 使用 LinkedHashMap 来保存数据
    HashSet(int initialCapacity, float loadFactor, boolean dummy) {
        map = new LinkedHashMap<>(initialCapacity, loadFactor);
    }
```



### TreeSet

> 默认使用 `TreeMap`，可以是用其他 `java.util.NavigableMap`

```
public class TreeSet<E> extends AbstractSet<E>
    implements NavigableSet<E>, Cloneable, java.io.Serializable
```

### LinkedHashSet

> 相对于 `HashSet` 主要是在迭代时是按照插入顺序

```
public class LinkedHashSet<E>
    extends HashSet<E>
    implements Set<E>, Cloneable, java.io.Serializable 
```



### ConcurrentSkipListSet(线程安全)

> 封装 `ConcurrentSkipListMap`

```
public class ConcurrentSkipListSet<E>
    extends AbstractSet<E>
    implements NavigableSet<E>, Cloneable, java.io.Serializable
```



### CopyOnWriteArraySet(线程安全)

> 与其他的set最大的区别是封装 `CopyOnWriteArrayList`，而其他set都是封装的 map。
>
> 主要是调用 

```
public class CopyOnWriteArraySet<E> extends AbstractSet<E>
        implements java.io.Serializable
        
    // 核心方法，就是掉用 CopyOnWriteArrayList 的 addIfAbsent
    public boolean add(E e) {
        return al.addIfAbsent(e);
    }
```



## Qeque

```
public interface Queue<E> extends Collection<E> 
```

### PriorityQueue

> 基于优先堆的一个无界队列，这个优先队列中的元素可以默认自然排序或者通过提供的比较器在队列实例化的时排序。

```
public class PriorityQueue<E> extends AbstractQueue<E>
    implements java.io.Serializable {
```

- 使用最小堆实现
- 插入数据不能为null，即不能排序
- 扩容的时候如果容量小于 64 ，则翻倍。否则增加 50%

### SynchronousQueue（线程安全）

> 其内部是没有容器的，所以生产者生产一个数据，就堵塞了，必须等消费者消费后，生产者才能再次生产。

```
public class SynchronousQueue<E> extends AbstractQueue<E>
    implements BlockingQueue<E>, java.io.Serializable {
    
    // 有公平，非公平
     public SynchronousQueue(boolean fair)
```

### LinkedBlockingQueue（线程安全）

> 基于双向链表来实现阻塞队列。

```
public class LinkedBlockingQueue<E> extends AbstractQueue<E>
        implements BlockingQueue<E>, java.io.Serializable {
        
        
        
   /** 最大容量, 没有设置则为 Integer.MAX_VALUE*/
    private final int capacity;

    /** 当前元素数量 */
    private final AtomicInteger count = new AtomicInteger();

		// 双端队列头元素
    transient Node<E> head;

    // 双端队列队尾元素
    private transient Node<E> last;

    /** 出队使用的锁 take, poll, etc */
    private final ReentrantLock takeLock = new ReentrantLock();

    /** 出队等待队列 */
    private final Condition notEmpty = takeLock.newCondition();

    /** 入队使用的锁 put, offer, etc */
    private final ReentrantLock putLock = new ReentrantLock();

    /** 入队等待队列 */
    private final Condition notFull = putLock.newCondition();
```

- 大小可以初始化设置，如果不设置，默认设置大小为Integer.MAX_VALUE
- 有两个锁对象，可以并行处理
- 因为有两把锁，所以不能选择公平锁

### ArrayBlockingQueue（线程安全）

> 底层以数组的形式保存数据(实际上可看作一个循环数组)。

- 初始化时设置数组长度
- 是一个有界队列
- 只有一个锁对象
- 可以选择公平锁

```
public class ArrayBlockingQueue<E> extends AbstractQueue<E>
        implements BlockingQueue<E>, java.io.Serializable {
        
   /** 存放元素 */
    final Object[] items;

    /**下一次操作位置，即队列最前面元素 take, poll, peek，remove */
    int takeIndex;

    /** 下一次添加位置 put, offer, add */
    int putIndex;

    /** 当前数量 */
    int count;

    /** 所有操作使用的锁 */
    final ReentrantLock lock;

    /** 出队等待队列 */
    private final Condition notEmpty;

    /** 入队等待队列 */
    private final Condition notFull;
    
    // 可选择公平锁
    public ArrayBlockingQueue(int capacity, boolean fair) 
```



### LinkedTransferQueue（线程安全）

> `LinkedTransferQueue`是 `SynchronousQueue` 和 `LinkedBlockingQueue` 的合体，性能比 `LinkedBlockingQueue` 更高（没有锁操作），比 `SynchronousQueue`能存储更多的元素。
>
> 当 `put` 时，如果有等待的线程，就直接将元素 “交给” 等待者， 否则直接进入队列。
>
> `put`和 `transfer` 方法的区别是，put 是立即返回的， transfer 是阻塞等待消费者拿到数据才返回。`transfer`方法和 `SynchronousQueue`的 put 方法类似。

```
public class LinkedTransferQueue<E> extends AbstractQueue<E>
    implements TransferQueue<E>, java.io.Serializable {
```

### PriorityBlockingQueue（线程安全）

- 基于优先级的一个无界队列
- 底层是基于数组存储元素的
- 元素按照优选级顺序存储，优先级是通过Comparable的compareTo方法来实现的（自然排序）
- 其只会堵塞消费者，**不会堵塞生产者，数组会不断扩容**，使用时要谨慎。
- 在扩容时会先释放锁，保证其他元素可以正常出队，然后使用 CAS 操作确保只有一个线程可以执行扩容逻辑，在扩容结束时会从新获取锁替换数组并复制数据
- 使用 `contains` `remove`方法需要遍历所有值。

```
public class PriorityBlockingQueue<E> extends AbstractQueue<E>
    implements BlockingQueue<E>, java.io.Serializable {
    
    // 扩容
    // 实际只有一个线程会进行实际扩容，其他线程一直等，但不影响出队操作
     private void tryGrow(Object[] array, int oldCap) 
```

### DelayQueue（线程安全）

- 基于优先级的一个无界队列
- 队列元素必须实现Delayed接口
- 支持延迟获取
- 元素按照时间排序
- 只有元素到期后，消费者才能从队列中取出

```
public class DelayQueue<E extends Delayed> extends AbstractQueue<E>
    implements BlockingQueue<E> {
```

### ConcurrentLinkedQueue（线程安全）

> 基于链接节点的无界线程安全的队列，使用cas保证线程安全

- 不允许null入列
- 删除节点是将item设置为null, 队列迭代时跳过item为null节点
- head节点跟tail不一定指向头节点或尾节点，可能存在滞后性
- 入列出列线程安全，遍历不安全
- 使用 cas 保证线程安全

```
public class ConcurrentLinkedQueue<E> extends AbstractQueue<E>
        implements Queue<E>, java.io.Serializable {
```

## Deque

```
public interface Deque<E> extends Queue<E>
```



### ArrayDeque

> 通过循环数组来实现队列。

- 不能添加null值
- 每次扩容都是2的n次方

```
public class ArrayDeque<E> extends AbstractCollection<E>
                           implements Deque<E>, Cloneable, Serializable
```

### ConcurrentLinkedDeque（线程安全）

> 与 `ConcurrentLinkedQueue` 的区别是该阻塞队列同时支持FIFO和FILO两种操作方式

```
public class ConcurrentLinkedDeque<E>
    extends AbstractCollection<E>
    implements Deque<E>, java.io.Serializable {
```

### LinkedBlockingDeque（线程安全）

> 与 `LinkedBlockingQueue`的区别是该阻塞队列同时支持FIFO和FILO两种操作方式

```
public class LinkedBlockingDeque<E>
    extends AbstractQueue<E>
    implements BlockingDeque<E>, java.io.Serializable {
```