<script setup lang="ts">
import {computed, nextTick, onBeforeUnmount, onMounted, ref, watch} from 'vue'
import {formatCompact, formatNumber, formatPercent} from './format'
import type {OptionChain, OptionQuote} from './types'

const props = defineProps<{
  chain: OptionChain
  quantities: ReadonlyMap<string, number>
}>()

const emit = defineEmits<{
  trade: [option: OptionQuote, side: 'ask' | 'bid']
}>()

// 虚拟列表依赖固定行高；修改这里时必须同步表格单元格的 CSS 高度。
const ROW_HEIGHT = 35
const OVERSCAN = 8
// T 型链的固定顺序是 10 列 Call + 行权价 + 10 列 Put；表头、表体和居中计算必须同步。
const QUOTE_COLUMN_WIDTH = 68
const CALL_COLUMN_COUNT = 10
const STRIKE_COLUMN_WIDTH = 112

// 虚拟列表容器、滚动位置和可视高度
const scroller = ref<HTMLElement | null>(null)
const headerScroller = ref<HTMLElement | null>(null)
const scrollTop = ref(0)
const viewportHeight = ref(560)
let observer: ResizeObserver | undefined

// 可见窗口和现价定位锚点
const startIndex = computed(() => Math.max(0, Math.floor(scrollTop.value / ROW_HEIGHT) - OVERSCAN))
const visibleCount = computed(() => Math.ceil(viewportHeight.value / ROW_HEIGHT) + OVERSCAN * 2)
const endIndex = computed(() => Math.min(props.chain.rows.length, startIndex.value + visibleCount.value))
const visibleRows = computed(() => props.chain.rows.slice(startIndex.value, endIndex.value))
const topSpacer = computed(() => startIndex.value * ROW_HEIGHT)
const bottomSpacer = computed(() => Math.max(0, (props.chain.rows.length - endIndex.value) * ROW_HEIGHT))
const spot = computed(() => props.chain.underlying.last)
const spotRowIndex = computed(() => {
  if (spot.value === null || props.chain.rows.length === 0) return -1
  // 现价通常不等于离散行权价，因此以最近一档作为定位锚点。
  let best = 0
  for (let index = 1; index < props.chain.rows.length; index += 1) {
    if (Math.abs(props.chain.rows[index].strike - spot.value) < Math.abs(props.chain.rows[best].strike - spot.value)) best = index
  }
  return best
})

/** 将虚拟期权链滚动到最接近标的现价的行。 */
function scrollToSpot(): void {
  if (!scroller.value || spotRowIndex.value < 0) return
  scroller.value.scrollTop = Math.max(0, spotRowIndex.value * ROW_HEIGHT - scroller.value.clientHeight / 2)
  centerStrikeColumn()
}

/** 将 T 型链的行权价中轴水平居中。 */
function centerStrikeColumn(): void {
  if (!scroller.value) return
  // 初始只把中轴行权价居中；不使用 sticky 覆盖相邻报价，横向比较时不会遮挡数据。
  const strikeCenter = CALL_COLUMN_COUNT * QUOTE_COLUMN_WIDTH + STRIKE_COLUMN_WIDTH / 2
  scroller.value.scrollLeft = Math.max(0, strikeCenter - scroller.value.clientWidth / 2)
  if (headerScroller.value) headerScroller.value.scrollLeft = scroller.value.scrollLeft
}

/** 同步虚拟列表纵向位置和固定表头横向位置。 */
function onScroll(event: Event): void {
  const target = event.currentTarget as HTMLElement
  scrollTop.value = target.scrollTop
  // 表头与表体拆开以固定表头，只同步横向滚动，纵向交给虚拟列表处理。
  if (headerScroller.value) headerScroller.value.scrollLeft = target.scrollLeft
}

/** 读取指定合约当前已加入策略的有符号数量。 */
function quantity(option: OptionQuote | null): number {
  return option ? props.quantities.get(option.code) ?? 0 : 0
}

/** 将有效买卖报价转换为一笔策略操作。 */
function trade(option: OptionQuote | null, side: 'ask' | 'bid'): void {
  if (!option || (side === 'ask' ? option.ask : option.bid) === null) return
  emit('trade', option, side)
}

watch(() => [props.chain.symbol, props.chain.expiry], async () => {
  // 等新链 DOM 完成后再定位，否则会使用上一条链的尺寸与滚动范围。
  await nextTick()
  scrollToSpot()
})

onMounted(() => {
  if (!scroller.value) return
  observer = new ResizeObserver(([entry]) => {
    viewportHeight.value = entry.contentRect.height
  })
  observer.observe(scroller.value)
  nextTick(scrollToSpot)
})

onBeforeUnmount(() => observer?.disconnect())

defineExpose({scrollToSpot})
</script>

<template>
  <section class="chain-panel" aria-labelledby="option-chain-heading">
    <header class="chain-heading">
      <div>
        <h2 id="option-chain-heading">期权链</h2>
        <p>{{ chain.rows.length }} 个行权价 · Call 看涨 / Put 看跌</p>
      </div>
      <button class="quiet-button" type="button" @click="scrollToSpot">定位现价</button>
    </header>

    <div ref="headerScroller" class="chain-header-scroller" aria-hidden="true">
      <table class="chain-table chain-header-table">
        <colgroup>
          <col v-for="column in 10" :key="`call-${column}`">
          <col class="strike-col">
          <col v-for="column in 10" :key="`put-${column}`">
        </colgroup>
        <thead>
        <tr class="side-headings">
          <th colspan="10" class="call-heading">Call 看涨</th>
          <th class="strike-spacer" aria-hidden="true"></th>
          <th colspan="10" class="put-heading">Put 看跌</th>
        </tr>
        <tr>
          <th>Vega</th>
          <th>Theta</th>
          <th>Gamma</th>
          <th>Delta</th>
          <th>成交量</th>
          <th>持仓</th>
          <th>IV</th>
          <th>最新</th>
          <th>卖价</th>
          <th>买价</th>
          <th class="strike-head">行权价</th>
          <th>买价</th>
          <th>卖价</th>
          <th>最新</th>
          <th>IV</th>
          <th>持仓</th>
          <th>成交量</th>
          <th>Delta</th>
          <th>Gamma</th>
          <th>Theta</th>
          <th>Vega</th>
        </tr>
        </thead>
      </table>
    </div>

    <div ref="scroller" class="chain-scroller" tabindex="0" @scroll="onScroll">
      <table class="chain-table">
        <caption class="sr-only">{{ chain.symbol }} {{ chain.expiry }} T 型期权链</caption>
        <colgroup>
          <col v-for="column in 10" :key="`body-call-${column}`">
          <col class="strike-col">
          <col v-for="column in 10" :key="`body-put-${column}`">
        </colgroup>
        <tbody>
        <tr v-if="topSpacer" aria-hidden="true">
          <td :colspan="21" :style="{ height: `${topSpacer}px` }"/>
        </tr>
        <tr
            v-for="(row, visibleIndex) in visibleRows"
            :key="row.strike"
            :class="{ 'spot-row': startIndex + visibleIndex === spotRowIndex }"
        >
          <td>{{ formatNumber(row.call?.vega, 3) }}</td>
          <td>{{ formatNumber(row.call?.theta, 3) }}</td>
          <td>{{ formatNumber(row.call?.gamma, 4) }}</td>
          <td>{{ formatNumber(row.call?.delta, 3) }}</td>
          <td>{{ formatCompact(row.call?.volume) }}</td>
          <td>{{ formatCompact(row.call?.openInterest) }}</td>
          <td>{{ formatPercent(row.call?.iv) }}</td>
          <td>{{ formatNumber(row.call?.last) }}</td>
          <td class="ask-cell" :class="{ selected: quantity(row.call) > 0 }">
            <button type="button" :disabled="row.call?.ask === null" :aria-label="`买入 Call ${row.strike}`"
                    @click="trade(row.call, 'ask')">
              {{ formatNumber(row.call?.ask) }}<small v-if="quantity(row.call) > 0">+{{ quantity(row.call) }}</small>
            </button>
          </td>
          <td class="bid-cell" :class="{ selected: quantity(row.call) < 0 }">
            <button type="button" :disabled="row.call?.bid === null" :aria-label="`卖出 Call ${row.strike}`"
                    @click="trade(row.call, 'bid')">
              {{ formatNumber(row.call?.bid) }}<small v-if="quantity(row.call) < 0">{{ quantity(row.call) }}</small>
            </button>
          </td>
          <th scope="row" class="strike-cell">
            {{ formatNumber(row.strike) }}
            <span v-if="startIndex + visibleIndex === spotRowIndex" class="spot-label">现价 {{
                formatNumber(spot)
              }}</span>
          </th>
          <td class="bid-cell" :class="{ selected: quantity(row.put) < 0 }">
            <button type="button" :disabled="row.put?.bid === null" :aria-label="`卖出 Put ${row.strike}`"
                    @click="trade(row.put, 'bid')">
              {{ formatNumber(row.put?.bid) }}<small v-if="quantity(row.put) < 0">{{ quantity(row.put) }}</small>
            </button>
          </td>
          <td class="ask-cell" :class="{ selected: quantity(row.put) > 0 }">
            <button type="button" :disabled="row.put?.ask === null" :aria-label="`买入 Put ${row.strike}`"
                    @click="trade(row.put, 'ask')">
              {{ formatNumber(row.put?.ask) }}<small v-if="quantity(row.put) > 0">+{{ quantity(row.put) }}</small>
            </button>
          </td>
          <td>{{ formatNumber(row.put?.last) }}</td>
          <td>{{ formatPercent(row.put?.iv) }}</td>
          <td>{{ formatCompact(row.put?.openInterest) }}</td>
          <td>{{ formatCompact(row.put?.volume) }}</td>
          <td>{{ formatNumber(row.put?.delta, 3) }}</td>
          <td>{{ formatNumber(row.put?.gamma, 4) }}</td>
          <td>{{ formatNumber(row.put?.theta, 3) }}</td>
          <td>{{ formatNumber(row.put?.vega, 3) }}</td>
        </tr>
        <tr v-if="bottomSpacer" aria-hidden="true">
          <td :colspan="21" :style="{ height: `${bottomSpacer}px` }"/>
        </tr>
        </tbody>
      </table>
    </div>
    <p class="chain-hint">点击卖价买入 1 张，点击买价卖出 1 张。再次点击会累加，同一合约反向操作会抵消。</p>
  </section>
</template>

<style scoped src="./OptionChainTable.css"></style>
