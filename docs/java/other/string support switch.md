---
java中switch对String支持方式
---

## 源码

```java
public static void main(String[] args) {
        String str = "cccc";
        switch (str) {
            case "AaAa":
                System.out.println("AaAa");
                break;
            case "BBBB":
                System.out.println("BBBB");
                break;
            case "AaBB":
                System.out.println("AaBB");
                break;
            default:
                System.out.println(str);
                break;
        }
}
```

## 反编译之后

```java
 public static void main(String[] args) {
        String str = "cccc";
        byte var3 = -1;
        switch(str.hashCode()) {
        case 2031744:
            if (str.equals("AaBB")) {
                var3 = 2;
            } else if (str.equals("BBBB")) {
                var3 = 1;
            } else if (str.equals("AaAa")) {
                var3 = 0;
            }
        default:
            switch(var3) {
            case 0:
                System.out.println("AaAa");
                break;
            case 1:
                System.out.println("BBBB");
                break;
            case 2:
                System.out.println("AaBB");
                break;
            default:
                System.out.println(str);
            }

        }
}
```

编译器会在同一个hashcode下面，再通过if else来进行判断,先在第一个switch中判断要进入的分支然后在第二个分支中执行操作.

switch本质上都是转换为数字后进行操作