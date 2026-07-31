---
title: 美股期权策略构建器
description: 使用本地富途 OpenD 行情构建单期或跨期美股期权组合，并交互分析理论盈亏。
pageClass: options-strategy-page
aside: false
outline: false
---

<script setup>
import OptionsStrategyBuilder from '../.vitepress/theme/options-strategy/OptionsStrategyBuilder.vue'
</script>

# 美股期权策略构建器

从本地只读 Bridge 获取富途行情，点击期权链即可组合单期或跨期策略，并拖动日期、IV 与价格范围查看理论盈亏。

到期日使用月份分组的横向轨道。切换日期只会更换当前期权链，已经添加的策略腿会按到期日保留；日期右上角的数字表示该到期日已有的策略腿数量。跨期组合以最近一腿的到期日作为情景分析上限，远期腿会保留当时的剩余时间价值。

::: warning 使用前准备 请先按照[本地使用指南](./options-strategy-local-setup.md)安装并登录 Futu OpenD，再启动
`futu_bridge`。本工具不包含交易能力；模型结果仅供策略研究，不构成投资建议。
:::

<ClientOnly>
  <OptionsStrategyBuilder />
</ClientOnly>
