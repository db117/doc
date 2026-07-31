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

const ROW_HEIGHT = 35
const OVERSCAN = 8
const QUOTE_COLUMN_WIDTH = 68
const CALL_COLUMN_COUNT = 10
const STRIKE_COLUMN_WIDTH = 112
const scroller = ref<HTMLElement | null>(null)
const headerScroller = ref<HTMLElement | null>(null)
const scrollTop = ref(0)
const viewportHeight = ref(560)
let observer: ResizeObserver | undefined

const startIndex = computed(() => Math.max(0, Math.floor(scrollTop.value / ROW_HEIGHT) - OVERSCAN))
const visibleCount = computed(() => Math.ceil(viewportHeight.value / ROW_HEIGHT) + OVERSCAN * 2)
const endIndex = computed(() => Math.min(props.chain.rows.length, startIndex.value + visibleCount.value))
const visibleRows = computed(() => props.chain.rows.slice(startIndex.value, endIndex.value))
const topSpacer = computed(() => startIndex.value * ROW_HEIGHT)
const bottomSpacer = computed(() => Math.max(0, (props.chain.rows.length - endIndex.value) * ROW_HEIGHT))
const spot = computed(() => props.chain.underlying.last)
const spotRowIndex = computed(() => {
  if (spot.value === null || props.chain.rows.length === 0) return -1
  let best = 0
  for (let index = 1; index < props.chain.rows.length; index += 1) {
    if (Math.abs(props.chain.rows[index].strike - spot.value) < Math.abs(props.chain.rows[best].strike - spot.value)) best = index
  }
  return best
})

function scrollToSpot(): void {
  if (!scroller.value || spotRowIndex.value < 0) return
  scroller.value.scrollTop = Math.max(0, spotRowIndex.value * ROW_HEIGHT - scroller.value.clientHeight / 2)
  centerStrikeColumn()
}

function centerStrikeColumn(): void {
  if (!scroller.value) return
  // Keep the T-shaped chain centered initially without overlaying adjacent quotes.
  const strikeCenter = CALL_COLUMN_COUNT * QUOTE_COLUMN_WIDTH + STRIKE_COLUMN_WIDTH / 2
  scroller.value.scrollLeft = Math.max(0, strikeCenter - scroller.value.clientWidth / 2)
  if (headerScroller.value) headerScroller.value.scrollLeft = scroller.value.scrollLeft
}

function onScroll(event: Event): void {
  const target = event.currentTarget as HTMLElement
  scrollTop.value = target.scrollTop
  if (headerScroller.value) headerScroller.value.scrollLeft = target.scrollLeft
}

function quantity(option: OptionQuote | null): number {
  return option ? props.quantities.get(option.code) ?? 0 : 0
}

function trade(option: OptionQuote | null, side: 'ask' | 'bid'): void {
  if (!option || (side === 'ask' ? option.ask : option.bid) === null) return
  emit('trade', option, side)
}

watch(() => [props.chain.symbol, props.chain.expiry], async () => {
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

<style scoped>
.chain-panel {
  min-width: 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg);
  overflow: hidden;
}

.chain-heading {
  min-height: 58px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--vp-c-divider);
}

h2 {
  margin: 0;
  border: 0;
  font-size: 15px;
  line-height: 1.4;
}

.chain-heading p, .chain-hint {
  margin: 2px 0 0;
  color: var(--vp-c-text-3);
  font-size: 12px;
}

.chain-header-scroller {
  overflow: hidden;
  border-bottom: 1px solid var(--vp-c-divider);
  scrollbar-gutter: stable;
}

.chain-scroller {
  height: min(66vh, 720px);
  min-height: 480px;
  overflow: auto;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
}

.chain-scroller:focus-visible {
  outline: 2px solid var(--vp-c-brand-2);
  outline-offset: -2px;
}

.chain-table {
  width: 100%;
  min-width: 1510px;
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: 0;
  font-variant-numeric: tabular-nums;
  font-size: 11px;
  line-height: 1;
}

col {
  width: 68px;
}

col.strike-col {
  width: 112px;
}

th, td {
  height: 35px;
  padding: 0 5px;
  text-align: right;
  white-space: nowrap;
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
}

thead th {
  height: 30px;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg-soft);
  font-weight: 600;
}

.chain-header-table {
  margin-bottom: -1px;
}

.side-headings th {
  height: 27px;
  text-align: center;
  font-size: 12px;
}

.call-heading {
  color: #c24157;
}

.put-heading {
  color: #19866c;
}

.strike-head, .strike-spacer, .strike-cell {
  text-align: center;
  box-shadow: -1px 0 var(--vp-c-divider), 1px 0 var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
}

.strike-cell {
  color: var(--vp-c-text-1);
  font-size: 12px;
  font-weight: 650;
}

.spot-row td, .spot-row .strike-cell {
  border-top: 2px solid var(--vp-c-brand-2);
}

.spot-label {
  display: block;
  margin-top: 2px;
  color: var(--vp-c-brand-1);
  font-size: 9px;
}

td button {
  width: 100%;
  min-height: 27px;
  padding: 0 4px;
  border: 0;
  border-radius: 5px;
  color: inherit;
  background: transparent;
  font: inherit;
  font-weight: 650;
  cursor: pointer;
}

td button:focus-visible {
  outline: 2px solid var(--vp-c-brand-2);
}

td button:disabled {
  color: var(--vp-c-text-3);
  cursor: default;
}

.ask-cell button {
  color: #b2354c;
  background: color-mix(in srgb, #df5269 12%, transparent);
}

.bid-cell button {
  color: #14745e;
  background: color-mix(in srgb, #2aaf89 12%, transparent);
}

.selected button {
  box-shadow: inset 0 0 0 2px currentColor;
}

small {
  display: block;
  font-size: 9px;
  line-height: 9px;
}

.chain-hint {
  padding: 8px 12px;
  border-top: 1px solid var(--vp-c-divider);
}

.quiet-button {
  min-height: 32px;
  padding: 0 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg);
  cursor: pointer;
}

.quiet-button:hover {
  border-color: var(--vp-c-brand-2);
  color: var(--vp-c-brand-1);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 1099px) {
  .chain-scroller {
    height: 660px;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    scroll-behavior: auto !important;
  }
}
</style>
