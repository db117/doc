---
title: 美股期权策略构建器
description: 使用本地富途 OpenD 行情构建单到期日美股期权组合，并交互分析理论盈亏。
pageClass: options-strategy-page
aside: false
outline: false
sidebar: false
---

<script setup>
import OptionsStrategyBuilder from '../.vitepress/theme/options-strategy/OptionsStrategyBuilder.vue'
</script>

# 美股期权策略构建器

从本地只读 Bridge 获取富途行情，点击期权链即可组合策略，并拖动日期、IV 与价格范围查看理论盈亏。

<ClientOnly>
  <OptionsStrategyBuilder />
</ClientOnly>

::: warning 使用前准备 请先启动本机富途 OpenD 和 `futu_bridge`。本工具不包含交易能力；模型结果仅供策略研究，不构成投资建议。
:::
