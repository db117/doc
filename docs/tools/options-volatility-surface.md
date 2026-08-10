---
title: 美股期权 3D 波动率曲面
description: 读取本地富途 OpenD 的多期限期权链，绘制可旋转的 Call 或 Put 隐含波动率曲面。
pageClass: options-surface-page
aside: false
outline: false
---

<script setup>
import OptionVolatilitySurface from '../.vitepress/theme/options-surface/OptionVolatilitySurface.vue'
</script>

# 美股期权 3D 波动率曲面

横轴为行权价，纵轴为剩余期限，高度和颜色均表示隐含波动率。支持切换 Call、Put、DTE 范围和行权价范围。

对于 SPY 等密集到期标的，工具会在所选 DTE 范围内均匀抽取最多 10
期，同时保留近端和远端，以符合 [OpenD 每 30 秒最多查询 10 次期权链](https://openapi.futunn.com/futu-api-doc/quote/get-option-chain.html)
的限制。

::: warning 使用前准备 请先按照[本地使用指南](./options-strategy-local-setup.md)安装并登录 Futu OpenD，再启动
`futu_bridge`。本工具只读取行情，不包含交易能力；数据仅供研究，不构成投资建议。
:::

<ClientOnly>
  <OptionVolatilitySurface />
</ClientOnly>
