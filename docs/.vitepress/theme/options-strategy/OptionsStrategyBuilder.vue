<script setup lang="ts">
import {computed, onBeforeUnmount, onMounted, ref, shallowRef} from 'vue'
import OptionChainTable from './OptionChainTable.vue'
import StrategyPanel from './StrategyPanel.vue'
import {BridgeError, FutuBridgeClient} from './bridge-client'
import {formatNumber} from './format'
import {atTheMoneyIv, expirationStatistics, theoreticalProfitLossCurve} from './statistics'
import {adjustLegAtQuote, editLeg, refreshLegMarketIv} from './strategy'
import type {OptionChain, OptionQuote, StockItem, StrategyLeg} from './types'

const DEFAULT_BRIDGE_URL = 'http://127.0.0.1:8765'
const DEFAULT_SYMBOL = 'US.MU'
const POLL_INTERVAL_MS = 5_000

const bridgeUrl = ref(DEFAULT_BRIDGE_URL)
const bridgeInput = ref(DEFAULT_BRIDGE_URL)
const client = shallowRef<FutuBridgeClient | null>(null)
const stocks = ref<StockItem[]>([])
const searchText = ref('MU')
const searchOpen = ref(false)
const selectedSymbol = ref(DEFAULT_SYMBOL)
const expirations = ref<string[]>([])
const selectedExpiry = ref('')
const chain = shallowRef<OptionChain | null>(null)
const legs = ref<StrategyLeg[]>([])
const loading = ref(true)
const refreshing = ref(false)
const loadingStocks = ref(false)
const errorMessage = ref('')
const stale = ref(false)
const lastUpdated = ref<Date | null>(null)
const scenarioIv = ref(0)
const ivTouched = ref(false)
const scenarioDay = ref(0)
const rangePercent = ref(12)
const riskFreeRate = ref(0.045)
let pollTimer: ReturnType<typeof setInterval> | undefined
let requestId = 0

const stockResults = computed(() => {
  const query = searchText.value.trim().toLowerCase().replace(/^us\./, '')
  if (!query) return stocks.value.slice(0, 30)
  const exact: StockItem[] = []
  const prefix: StockItem[] = []
  const contains: StockItem[] = []
  for (const stock of stocks.value) {
    const ticker = stock.code.slice(3).toLowerCase()
    const name = stock.name.toLowerCase()
    if (ticker === query) exact.push(stock)
    else if (ticker.startsWith(query)) prefix.push(stock)
    else if (ticker.includes(query) || name.includes(query)) contains.push(stock)
    if (exact.length + prefix.length + contains.length >= 60) break
  }
  return [...exact, ...prefix, ...contains].slice(0, 30)
})

const quantities = computed(() => new Map(legs.value.map(leg => [leg.code, leg.quantity])))
const currentPrice = computed(() => chain.value?.underlying.last ?? 0)
const currentAtmIv = computed(() => chain.value && currentPrice.value > 0
    ? atTheMoneyIv(chain.value.rows, currentPrice.value)
    : null)
const statistics = computed(() => expirationStatistics(legs.value))
const totalDays = computed(() => {
  if (!selectedExpiry.value) return 1
  const expiry = new Date(`${selectedExpiry.value}T16:00:00`)
  return Math.max(1, Math.ceil((expiry.getTime() - Date.now()) / 86_400_000))
})
const scenarioDateLabel = computed(() => {
  if (!currentAtmIv.value) return selectedExpiry.value
  const date = new Date()
  date.setHours(12, 0, 0, 0)
  date.setDate(date.getDate() + scenarioDay.value)
  return date.toLocaleDateString('zh-CN', {year: 'numeric', month: '2-digit', day: '2-digit'})
})
const timeToExpiry = computed(() => currentAtmIv.value
    ? Math.max(0, (totalDays.value - scenarioDay.value) / 365)
    : 0)
const scenarioIvMax = computed(() => Math.max(300, Math.ceil(((currentAtmIv.value ?? 1.5) * 200) / 25) * 25))
const curve = computed(() => {
  if (!chain.value || currentPrice.value <= 0 || legs.value.length === 0) return []
  const fraction = rangePercent.value / 100
  return theoreticalProfitLossCurve({
    legs: legs.value,
    minimumPrice: Math.max(0.01, currentPrice.value * (1 - fraction)),
    maximumPrice: currentPrice.value * (1 + fraction),
    points: 241,
    timeToExpiry: timeToExpiry.value,
    currentAtmIv: currentAtmIv.value,
    scenarioAtmIv: currentAtmIv.value ? scenarioIv.value / 100 : null,
    riskFreeRate: riskFreeRate.value,
    dividendYield: 0,
  })
})
const lastUpdatedLabel = computed(() => lastUpdated.value?.toLocaleTimeString('zh-CN', {hour12: false}) ?? '—')

function describeError(error: unknown): string {
  if (error instanceof BridgeError) return error.message
  return error instanceof Error ? error.message : '本地行情服务发生未知错误。'
}

async function connect(): Promise<void> {
  const id = ++requestId
  loading.value = !chain.value
  errorMessage.value = ''
  try {
    const nextClient = new FutuBridgeClient(bridgeUrl.value)
    await nextClient.health()
    if (id !== requestId) return
    client.value = nextClient
    void loadStocks(nextClient)
    const items = await nextClient.expirations(selectedSymbol.value)
    if (id !== requestId) return
    if (!items.length) throw new Error('该标的没有可用的美股期权到期日。')
    expirations.value = items.map(item => item.date)
    if (!expirations.value.includes(selectedExpiry.value)) {
      // 首次连接选择最近到期日；重连后仅在原到期日失效时清空不兼容的策略腿。
      selectedExpiry.value = expirations.value[0]
      legs.value = []
    }
    refreshing.value = false
    await loadChain(false, id, !chain.value)
  } catch (error) {
    if (id !== requestId) return
    errorMessage.value = describeError(error)
    stale.value = Boolean(chain.value)
  } finally {
    if (id === requestId) loading.value = false
  }
}

async function loadStocks(activeClient: FutuBridgeClient): Promise<void> {
  loadingStocks.value = true
  try {
    const [stockItems, etfItems] = await Promise.all([activeClient.stocks('STOCK'), activeClient.stocks('ETF')])
    if (activeClient !== client.value) return
    stocks.value = [...stockItems, ...etfItems].sort((a, b) => a.code.localeCompare(b.code))
  } catch {
    // Stock search is optional; direct ticker entry remains available.
  } finally {
    loadingStocks.value = false
  }
}

async function loadSymbol(symbol: string, shouldConfirm = true, id = ++requestId): Promise<void> {
  if (!client.value) return
  if (shouldConfirm && legs.value.length && !window.confirm('切换标的会清空当前策略，确认继续吗？')) return
  const normalized = symbol.trim().toUpperCase().replace(/^US\./, '')
  if (!normalized) return
  const code = `US.${normalized}`
  errorMessage.value = ''
  loading.value = true
  try {
    const items = await client.value.expirations(code)
    if (id !== requestId) return
    if (!items.length) throw new Error('该标的没有可用的美股期权到期日。')
    selectedSymbol.value = code
    searchText.value = code.slice(3)
    expirations.value = items.map(item => item.date)
    selectedExpiry.value = expirations.value[0]
    legs.value = []
    chain.value = null
    await loadChain(false, id, true)
  } catch (error) {
    if (id === requestId) errorMessage.value = describeError(error)
  } finally {
    if (id === requestId) loading.value = false
  }
}

async function changeExpiry(expiry: string): Promise<void> {
  if (expiry === selectedExpiry.value) return
  if (legs.value.length && !window.confirm('切换到期日会清空当前策略，确认继续吗？')) return
  selectedExpiry.value = expiry
  legs.value = []
  chain.value = null
  loading.value = true
  const id = ++requestId
  await loadChain(false, id, true)
  loading.value = false
}

async function loadChain(background = false, id = requestId, resetScenario = false): Promise<void> {
  if (!client.value || !selectedExpiry.value || (background && refreshing.value)) return
  if (background) refreshing.value = true
  try {
    const nextChain = await client.value.optionChain(selectedSymbol.value, selectedExpiry.value)
    if (id !== requestId) return
    chain.value = nextChain
    const quotes = new Map<string, OptionQuote>()
    for (const row of nextChain.rows) {
      if (row.call) quotes.set(row.call.code, row.call)
      if (row.put) quotes.set(row.put.code, row.put)
    }
    legs.value = refreshLegMarketIv(legs.value, quotes)
    const atm = nextChain.underlying.last ? atTheMoneyIv(nextChain.rows, nextChain.underlying.last) : null
    if (resetScenario || !ivTouched.value) scenarioIv.value = (atm ?? 0) * 100
    if (resetScenario) {
      scenarioDay.value = totalDays.value
      ivTouched.value = false
    }
    stale.value = false
    errorMessage.value = ''
    lastUpdated.value = new Date()
  } catch (error) {
    if (id !== requestId) return
    errorMessage.value = describeError(error)
    stale.value = Boolean(chain.value)
  } finally {
    refreshing.value = false
  }
}

function selectStock(stock: StockItem): void {
  searchOpen.value = false
  void loadSymbol(stock.code)
}

function submitSearch(): void {
  searchOpen.value = false
  const exact = stockResults.value.find(stock => stock.code.slice(3).toLowerCase() === searchText.value.trim().toLowerCase().replace(/^us\./, ''))
  void loadSymbol(exact?.code ?? searchText.value)
}

function addTrade(option: OptionQuote, side: 'ask' | 'bid'): void {
  const price = side === 'ask' ? option.ask : option.bid
  if (price === null) return
  legs.value = adjustLegAtQuote(legs.value, option, side === 'ask' ? 1 : -1, price)
}

function editStrategyLeg(code: string, field: 'quantity' | 'entryPrice', value: number): void {
  legs.value = editLeg(legs.value, code, {[field]: value})
}

function removeLeg(code: string): void {
  legs.value = legs.value.filter(leg => leg.code !== code)
}

function clearLegs(): void {
  legs.value = []
}

function applyBridgeUrl(): void {
  bridgeUrl.value = bridgeInput.value.trim()
  localStorage.setItem('options-strategy.bridge-url', bridgeUrl.value)
  void connect()
}

function updateScenarioIv(value: number): void {
  scenarioIv.value = value
  ivTouched.value = true
}

function updateScenarioDay(value: number): void {
  if (currentAtmIv.value) scenarioDay.value = value
}

function onVisibilityChange(): void {
  if (!document.hidden) void loadChain(true)
}

onMounted(() => {
  const stored = localStorage.getItem('options-strategy.bridge-url')
  if (stored) bridgeUrl.value = bridgeInput.value = stored
  void connect()
  pollTimer = setInterval(() => {
    if (!document.hidden) void loadChain(true)
  }, POLL_INTERVAL_MS)
  document.addEventListener('visibilitychange', onVisibilityChange)
})

onBeforeUnmount(() => {
  if (pollTimer) clearInterval(pollTimer)
  document.removeEventListener('visibilitychange', onVisibilityChange)
})
</script>

<template>
  <div class="options-workbench">
    <div class="workbench-toolbar">
      <form class="symbol-search" role="search" @submit.prevent="submitSearch">
        <label for="option-symbol">标的</label>
        <div class="search-field">
          <input
              id="option-symbol"
              v-model="searchText"
              type="search"
              autocomplete="off"
              role="combobox"
              :aria-expanded="searchOpen"
              aria-controls="stock-results"
              placeholder="MU 或公司名称"
              @focus="searchOpen = true"
              @input="searchOpen = true"
              @keydown.esc="searchOpen = false"
          >
          <button type="submit">查询</button>
          <ul v-if="searchOpen && (stockResults.length || loadingStocks)" id="stock-results" role="listbox"
              class="search-results">
            <li v-if="loadingStocks && !stocks.length" class="search-note">正在加载美股列表…</li>
            <li v-for="stock in stockResults" :key="stock.code">
              <button type="button" role="option" @mousedown.prevent="selectStock(stock)">
                <strong>{{ stock.code.slice(3) }}</strong><span>{{
                  stock.name
                }}</span><small>{{ stock.stockType === 'ETF' ? 'ETF' : '股票' }}</small>
              </button>
            </li>
          </ul>
        </div>
      </form>

      <label class="expiry-field">到期日
        <select :value="selectedExpiry" :disabled="!expirations.length"
                @change="changeExpiry(($event.target as HTMLSelectElement).value)">
          <option v-for="expiry in expirations" :key="expiry" :value="expiry">{{ expiry }}</option>
        </select>
      </label>

      <div v-if="chain" class="underlying-quote">
        <span>{{ chain.underlying.name || selectedSymbol }}</span>
        <strong>{{ formatNumber(chain.underlying.last) }}</strong>
        <small>{{ selectedSymbol }} · {{ chain.underlying.updateTime || '实时快照' }}</small>
      </div>

      <div class="refresh-status" :class="{ stale }">
        <span><i/>{{ stale ? '行情已过期' : '本地行情' }}</span>
        <small>更新 {{ lastUpdatedLabel }}</small>
      </div>
      <button class="icon-button" type="button" :disabled="refreshing || !chain" aria-label="立即刷新"
              @click="loadChain(true)">{{ refreshing ? '刷新中' : '刷新' }}
      </button>

      <details class="bridge-settings">
        <summary>连接设置</summary>
        <div>
          <label for="bridge-url">Bridge Base URL</label>
          <input id="bridge-url" v-model="bridgeInput" type="url" spellcheck="false">
          <button type="button" @click="applyBridgeUrl">重新连接</button>
          <p>浏览器只会发起只读查询，不包含下单接口。</p>
        </div>
      </details>
    </div>

    <div v-if="errorMessage" class="status-message" :class="{ compact: chain }" role="alert">
      <div><strong>{{ chain ? '行情刷新失败' : '无法连接本地行情服务' }}</strong><span>{{ errorMessage }}</span></div>
      <button type="button" @click="chain ? loadChain(true) : connect()">重试</button>
    </div>

    <div v-if="loading && !chain" class="loading-layout" aria-label="正在加载期权数据" aria-busy="true">
      <div class="skeleton chain-skeleton"/>
      <div class="skeleton panel-skeleton"/>
    </div>

    <div v-else-if="chain" class="workbench-layout">
      <OptionChainTable :chain="chain" :quantities="quantities" @trade="addTrade"/>
      <StrategyPanel
          :legs="legs"
          :statistics="statistics"
          :points="curve"
          :current-price="currentPrice"
          :current-atm-iv="currentAtmIv"
          :scenario-iv="scenarioIv"
          :scenario-iv-max="scenarioIvMax"
          :iv-enabled="currentAtmIv !== null"
          :scenario-day="scenarioDay"
          :total-days="totalDays"
          :scenario-date-label="scenarioDateLabel"
          :expiry="selectedExpiry"
          :range-percent="rangePercent"
          :risk-free-rate="riskFreeRate"
          @edit="editStrategyLeg"
          @remove="removeLeg"
          @clear="clearLegs"
          @update:scenario-iv="updateScenarioIv"
          @update:scenario-day="updateScenarioDay"
          @update:range-percent="rangePercent = $event"
          @update:risk-free-rate="riskFreeRate = $event"
      />
    </div>
  </div>
</template>

<style scoped>
.options-workbench {
  --control-height: 36px;
  margin-top: 20px;
  color: var(--vp-c-text-1);
}

.workbench-toolbar {
  position: relative;
  z-index: 20;
  display: flex;
  align-items: end;
  gap: 10px;
  min-height: 62px;
  padding: 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg-soft);
}

.workbench-toolbar label, .bridge-settings label {
  display: grid;
  gap: 4px;
  color: var(--vp-c-text-3);
  font-size: 10px;
  font-weight: 600;
}

.symbol-search {
  display: flex;
  align-items: end;
  gap: 6px;
}

.symbol-search > label {
  padding-bottom: 11px;
}

.search-field {
  position: relative;
  display: flex;
}

input, select, button {
  font: inherit;
}

.search-field input, .expiry-field select, .bridge-settings input {
  box-sizing: border-box;
  height: var(--control-height);
  border: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg);
}

.search-field input {
  width: 190px;
  padding: 0 10px;
  border-radius: 6px 0 0 6px;
}

.search-field > button, .bridge-settings button {
  height: var(--control-height);
  padding: 0 12px;
  border: 0;
  border-radius: 0 6px 6px 0;
  color: white;
  background: var(--vp-c-brand-3);
  cursor: pointer;
  font-weight: 650;
}

.search-results {
  position: absolute;
  z-index: 50;
  top: calc(100% + 4px);
  left: 0;
  width: 340px;
  max-height: 340px;
  margin: 0;
  padding: 4px;
  overflow: auto;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg);
  box-shadow: var(--vp-shadow-3);
  list-style: none;
}

.search-results li {
  margin: 0;
}

.search-results button {
  display: grid;
  grid-template-columns: 60px minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
  width: 100%;
  min-height: 36px;
  padding: 4px 7px;
  border: 0;
  border-radius: 5px;
  color: var(--vp-c-text-1);
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.search-results button:hover {
  background: var(--vp-c-default-soft);
}

.search-results span {
  overflow: hidden;
  color: var(--vp-c-text-2);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search-results small {
  color: var(--vp-c-text-3);
}

.search-note {
  padding: 10px;
  color: var(--vp-c-text-3);
  font-size: 12px;
}

.expiry-field select {
  min-width: 132px;
  padding: 0 8px;
  border-radius: 6px;
}

.underlying-quote {
  display: grid;
  grid-template-columns: auto auto;
  gap: 0 8px;
  align-items: baseline;
  min-width: 150px;
  padding: 0 5px;
}

.underlying-quote span {
  overflow: hidden;
  max-width: 110px;
  color: var(--vp-c-text-2);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.underlying-quote strong {
  font-size: 18px;
  font-variant-numeric: tabular-nums;
}

.underlying-quote small {
  grid-column: 1 / -1;
  color: var(--vp-c-text-3);
  font-size: 9px;
}

.refresh-status {
  display: grid;
  margin-left: auto;
  font-size: 10px;
}

.refresh-status span {
  color: var(--vp-c-text-2);
}

.refresh-status i {
  display: inline-block;
  width: 7px;
  height: 7px;
  margin-right: 5px;
  border-radius: 50%;
  background: #1b9a72;
}

.refresh-status.stale i {
  background: #c58a27;
}

.refresh-status small {
  color: var(--vp-c-text-3);
}

.icon-button {
  height: var(--control-height);
  padding: 0 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg);
  cursor: pointer;
}

.icon-button:disabled {
  opacity: .5;
  cursor: wait;
}

.bridge-settings {
  position: relative;
}

.bridge-settings summary {
  display: grid;
  height: var(--control-height);
  padding: 0 8px;
  place-items: center;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg);
  cursor: pointer;
  font-size: 11px;
  list-style: none;
}

.bridge-settings summary::-webkit-details-marker {
  display: none;
}

.bridge-settings > div {
  position: absolute;
  z-index: 45;
  top: calc(100% + 5px);
  right: 0;
  width: 330px;
  padding: 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg);
  box-shadow: var(--vp-shadow-3);
}

.bridge-settings input {
  width: 100%;
  margin: 5px 0 8px;
  padding: 0 8px;
  border-radius: 6px;
}

.bridge-settings button {
  width: 100%;
  border-radius: 6px;
}

.bridge-settings p {
  margin: 8px 0 0;
  color: var(--vp-c-text-3);
  font-size: 10px;
}

.status-message {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-top: 12px;
  padding: 18px;
  border: 1px solid color-mix(in srgb, var(--vp-c-danger-1) 35%, var(--vp-c-divider));
  border-radius: 8px;
  background: var(--vp-c-danger-soft);
}

.status-message.compact {
  padding: 8px 12px;
}

.status-message div {
  display: grid;
}

.status-message strong {
  font-size: 13px;
}

.status-message span {
  color: var(--vp-c-text-2);
  font-size: 11px;
}

.status-message button {
  min-height: 32px;
  padding: 0 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg);
  cursor: pointer;
}

.workbench-layout, .loading-layout {
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(390px, 2fr);
  gap: 12px;
  align-items: start;
  margin-top: 12px;
}

.workbench-layout > :last-child {
  position: sticky;
  top: 76px;
}

.skeleton {
  border-radius: 10px;
  background: linear-gradient(90deg, var(--vp-c-bg-soft) 25%, var(--vp-c-default-soft) 50%, var(--vp-c-bg-soft) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite linear;
}

.chain-skeleton {
  height: 680px;
}

.panel-skeleton {
  height: 620px;
}

@keyframes shimmer {
  to {
    background-position: -200% 0;
  }
}

@media (max-width: 1099px) {
  .workbench-toolbar {
    flex-wrap: wrap;
  }

  .refresh-status {
    margin-left: 0;
  }

  .workbench-layout, .loading-layout {
    grid-template-columns: 1fr;
  }

  .workbench-layout > :last-child {
    grid-row: 1;
    position: static;
  }

  .panel-skeleton {
    grid-row: 1;
  }
}

@media (max-width: 680px) {
  .workbench-toolbar {
    align-items: stretch;
  }

  .symbol-search {
    width: 100%;
  }

  .symbol-search > label {
    display: none;
  }

  .search-field {
    flex: 1;
  }

  .search-field input {
    width: 100%;
  }

  .underlying-quote {
    order: -1;
    width: 100%;
  }

  .refresh-status {
    margin-left: auto;
  }

  .search-results {
    width: min(340px, calc(100vw - 48px));
  }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton {
    animation: none;
  }
}
</style>
