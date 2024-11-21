---
title: IP 查询
---

> 使用 `java` 对 `IP` 进行查询
>
> [P3TERX/GeoLite.mmdb: MaxMind's GeoIP2 GeoLite2 Country, City, and ASN databases](https://github.com/P3TERX/GeoLite.mmdb)
>
> [mayaxcn/china-ip-list: 每小时更新中国IP范围列表，Update Mainland China ip‘s list in everyhour](https://github.com/mayaxcn/china-ip-list)
>
> [每日更新的电信IP段,联通IP段,移动IP段,铁通IP段,教育网IP段,长宽/鹏博士IP段 ISP IP - ╃苍狼山庄╃](https://ispip.clang.cn/)

## MaxMind

> [GeoLite2 Free Geolocation Data | MaxMind Developer Portal](https://dev.maxmind.com/geoip/geolite2-free-geolocation-data/#integration)

#### 数据库文件获取途经

- 去官网注册，并下载文件
- github有人下载好了[P3TERX/GeoLite.mmdb: MaxMind's GeoIP2 GeoLite2 Country, City, and ASN databases](https://github.com/P3TERX/GeoLite.mmdb)

#### maven

`jdk 8`，目前最高2.17.0

```
<dependency>
    <groupId>com.maxmind.geoip2</groupId>
    <artifactId>geoip2</artifactId>
    <version>2.17.0</version>
</dependency>
```

#### 使用

```
 // A File object pointing to your GeoIP2 or GeoLite2 database
File database = ResourceUtils.getFile("classpath:ip/GeoLite2-Country.mmdb");;

DatabaseReader reader = new DatabaseReader.Builder(database)
        .fileMode(Reader.FileMode.MEMORY)
        .withCache(new CHMCache()).build();

InetAddress ipAddress = InetAddress.getByName("103.75.152.102");

Optional<CountryResponse> triedCountry = reader.tryCountry(ipAddress);
triedCountry.ifPresent(x -> {
    System.out.println(x.getCountry().getIsoCode());
});
```

## ip2region 

> [lionsoul2014/ip2region: Ip2region (2.0 - xdb) is a offline IP address manager framework and locator, support billions of data segments, ten microsecond searching performance. xdb engine implementation for many programming languages](https://github.com/lionsoul2014/ip2region)
>
> 一个本地IP查询库

#### maven 仓库

```
<dependency>
    <groupId>org.lionsoul</groupId>
    <artifactId>ip2region</artifactId>
    <version>2.7.0</version>
</dependency>
```

#### 使用

```
public void ip2region() throws Exception {
    String dbPath = "C:\\ip2region.xdb";

    // 1、从 dbPath 加载整个 xdb 到内存。
    byte[] cBuff = Searcher.loadContentFromFile(dbPath);


    // 2、使用上述的 cBuff 创建一个完全基于内存的查询对象。
    Searcher searcher = Searcher.newWithBuffer(cBuff);


    // 3、查询
    String ip = "1.2.3.4";
    String region = searcher.search(ip);
    System.out.println(region);
}
```