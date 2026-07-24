---
title: giffgaff eSIM 开通与保号记录
---

# giffgaff eSIM 开通与保号记录

本文整理自一套 Android 设备上的实操记录：通过可写入 eSIM 的实体卡安装 giffgaff eSIM。它不是 giffgaff 的官方操作指南，也不保证适用于所有手机、eSIM 卡或地区。

> 第三方 APK、写卡操作和运营商规则都有风险。安装前应确认来源、校验文件完整性，并自行承担兼容性和账户风险；套餐、充值金额、保号条件及可用性以 [giffgaff 官网](https://www.giffgaff.com/) 和 [官方条款](https://www.giffgaff.com/terms) 为准。

## 前置条件

- Android 手机。
- 一张支持写入 eSIM 的实体卡；原始记录使用 `estkme`。
- 可用于支付的 Visa 或 MasterCard 银行卡。

## 工具与下载地址

下列工具均来自原始记录。其中 giffgaff Android 安装包链接为第三方分发页，优先选择官方应用商店或 giffgaff 官方提供的安装方式。

| 工具 | 用途 | 链接 |
| --- | --- | --- |
| 元萝卜 | 用于从管理器安装其他 APK | [下载页](https://www.die.lu/) · [SPatch-Update](https://github.com/Katana-Official/SPatch-Update) |
| Via 浏览器 | 注册与访问网页时使用 | [官网](https://viayoo.com/zh-cn/) · [APK](https://res.viayoo.com/v1/via-release-cn.apk) |
| HookEuicc | 原始记录中用于伪装 eSIM 支持并取得激活码 | [GitHub](https://github.com/Unicorn369/HookEuicc) |
| giffgaff | 官方运营商应用 | [第三方 APK 页面](https://mi9.com/package/com.giffgaffmobile.controller/) |
| 小叮当个人博客 | 原始视频演示的补充参考 | [techbigding.top](https://techbigding.top/) |

## 开通流程

### 1. 注册 giffgaff 账户

访问 [giffgaff 官网](https://www.giffgaff.com/) 并按页面提示注册。可使用网页或官方应用完成；支付、实名与地区要求以注册时页面为准。

### 2. 安装所需环境

1. 直接安装元萝卜 APK。
2. 在元萝卜中依次进入“配置” → “从管理器安装软体”，选择并安装 giffgaff、Via 浏览器和 HookEuicc 的 APK。
3. 在 HookEuicc 中开启伪装功能；若应用提示异常，可按原始记录尝试关闭后重新打开。

### 3. 购买 eSIM

在 giffgaff 的下单流程中选择 eSIM。原始记录的做法是暂不选择套餐、先充值 `10` 欧元完成开通；该金额、可选套餐和支付条件可能变动，应以结算页显示为准。

### 4. 获取并写入 eSIM

1. 在 giffgaff 中选择 `Install eSIM`，按提示取得激活字符串。
2. 复制该字符串。
3. 在 eSIM 卡管理工具中添加该激活信息，并按工具提示完成写入。

写入前确认实体 eSIM 卡有可用空间；写入后可在手机网络设置中检查是否识别到 giffgaff 配置文件。若无法激活，不要反复尝试写入，应先确认设备、eSIM 卡和账号状态是否兼容。

## 保号

原始记录写明：每 `180` 天内让账户余额发生一次变动（消费或充值），可延长 `180` 天。可采用的方式包括：

- 发送一条短信；
- 使用一次移动数据；
- 拨打一通电话（不含紧急服务和官方客服热线）；
- 充值一次话费。

这项规则可能随运营商政策调整。执行保号前请通过 giffgaff 账户、帮助中心或客服确认当前失效周期和有效活动定义。

## 常用入口

- [充值](https://www.giffgaff.com/top-up)
- [话费与账单查询](https://www.giffgaff.com/profile/usage-statement)
- [eSIM 帮助中心](https://help.giffgaff.com/en/collections/626993-esim)
- [补卡工具](https://github.com/ssnhd/sim)
- [转入空卡（SIM Swap）](https://www.giffgaff.com/profile/details#simswap)
- [Wi-Fi Calling 与 VoLTE](https://help.giffgaff.com/en/articles/258841-wifi-calling-and-volte)
- [官方客服](https://www.giffgaff.com/boiler-plate/contact)
- [官方条款](https://www.giffgaff.com/terms)
