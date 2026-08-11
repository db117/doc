<script setup lang="ts">
import {computed, onBeforeUnmount, onMounted, ref, shallowRef, watch} from 'vue'
import ExpirationRail from './ExpirationRail.vue'
import OptionChainTable from './OptionChainTable.vue'
import StrategyPanel from './StrategyPanel.vue'
import {BridgeError, FutuBridgeClient} from './bridge-client'
import {formatNumber} from './format'
import {atTheMoneyIv, curveStatistics, expirationStatistics, theoreticalProfitLossCurve} from './statistics'
import {adjustLegAtQuote, editLeg, refreshLegMarketData, reverseLeg} from './strategy'
import type {OptionChain, OptionQuote, StockItem, StrategyLeg} from './types'

const DEFAULT_BRIDGE_URL = 'http://127.0.0.1:8765'
const DEFAULT_SYMBOL = 'US.MU'
// 页面只通过本机只读 Bridge 取行情；轮询由页面统一调度，避免客户端重试叠加请求。
const POLL_INTERVAL_MS = 5_000

// Bridge 连接与标的搜索状态
const bridgeUrl = ref(DEFAULT_BRIDGE_URL)
const bridgeInput = ref(DEFAULT_BRIDGE_URL)
const client = shallowRef<FutuBridgeClient | null>(null)
const stocks = ref<StockItem[]>([])
const searchText = ref('MU')
const searchOpen = ref(false)

// 当前标的、期权链和策略腿
const selectedSymbol = ref(DEFAULT_SYMBOL)
const expirations = ref<string[]>([])
const selectedExpiry = ref('')
const chain = shallowRef<OptionChain | null>(null)
const legs = ref<StrategyLeg[]>([])
// 缓存已加载到期日的合约报价，供跨期腿同步和方向反转即时取价；切换标的时整体清空。
const quoteCache = shallowRef<ReadonlyMap<string, OptionQuote>>(new Map())

// 行情请求与页面反馈状态
const loading = ref(true)
const refreshing = ref(false)
const loadingStocks = ref(false)
const errorMessage = ref('')
const stale = ref(false)
const lastUpdated = ref<Date | null>(null)

// 盈亏情景输入
const scenarioIv = ref(0)
const ivTouched = ref(false)
const scenarioDay = ref(0)
const rangePercent = ref(12)
const riskFreeRate = ref(0.045)

// 宽屏模式、轮询和并发请求协调
const wideMode = ref(false)
let pollTimer: ReturnType<typeof setInterval> | undefined
// 标的、到期日切换可能并发；只有最后一次请求可以提交状态，防止慢响应覆盖新选择。
let requestId = 0

// 标的搜索结果
const stockResults = computed(() => {
  const query = searchText.value.trim().toLowerCase().replace(/^us\./, '')
  if (!query) return stocks.value.slice(0, 30)
  // 搜索结果固定按“完全匹配、代码前缀、代码或名称包含”排列，代码直达优先于模糊名称。
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

// 策略腿数量与到期日分组
const quantities = computed(() => new Map(legs.value.map(leg => [leg.code, leg.quantity])))
const legCountsByExpiry = computed(() => {
  const counts = new Map<string, number>()
  for (const leg of legs.value) counts.set(leg.expiry, (counts.get(leg.expiry) ?? 0) + 1)
  return counts
})

// 当前行情和情景期限派生状态
const currentPrice = computed(() => chain.value?.underlying.last ?? 0)
const currentAtmIv = computed(() => chain.value && currentPrice.value > 0
    ? atTheMoneyIv(chain.value.rows, currentPrice.value)
    : null)
const analysisExpiry = computed(() => {
  // 跨期情景只推进到最早到期腿；再往后需要假设平仓/行权后的路径，不属于本工具边界。
  const dates = [...new Set(legs.value.map(leg => leg.expiry))].sort()
  return dates[0] ?? selectedExpiry.value
})
const sameExpiryStrategy = computed(() => new Set(legs.value.map(leg => leg.expiry)).size <= 1)
const totalDays = computed(() => {
  if (!analysisExpiry.value) return 0
  // 日期统一落在本地中午，避免午夜附近的时区或夏令时切换造成天数偏差。
  const expiry = new Date(`${analysisExpiry.value}T12:00:00`)
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  return Math.max(0, Math.round((expiry.getTime() - today.getTime()) / 86_400_000))
})
const scenarioDate = computed(() => {
  const date = new Date()
  date.setHours(12, 0, 0, 0)
  date.setDate(date.getDate() + scenarioDay.value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
})
const scenarioDateLabel = computed(() => {
  if (!currentAtmIv.value) return analysisExpiry.value
  const date = new Date(`${scenarioDate.value}T12:00:00`)
  return date.toLocaleDateString('zh-CN', {year: 'numeric', month: '2-digit', day: '2-digit'})
})
const scenarioIvMax = computed(() => Math.max(300, Math.ceil(((currentAtmIv.value ?? 1.5) * 200) / 25) * 25))
const curve = computed(() => {
  if (!chain.value || currentPrice.value <= 0 || legs.value.length === 0) return []
  const fraction = rangePercent.value / 100
  return theoreticalProfitLossCurve({
    legs: legs.value,
    minimumPrice: Math.max(0.01, currentPrice.value * (1 - fraction)),
    maximumPrice: currentPrice.value * (1 + fraction),
    points: 241,
    scenarioDate: scenarioDate.value,
    currentAtmIv: currentAtmIv.value,
    scenarioAtmIv: currentAtmIv.value ? scenarioIv.value / 100 : null,
    riskFreeRate: riskFreeRate.value,
    dividendYield: 0,
  })
})
// 同到期组合可精确分析分段线性到期收益；跨期仍有时间价值，只统计当前采样价格区间。
const statistics = computed(() => sameExpiryStrategy.value
    ? expirationStatistics(legs.value)
    : curveStatistics(legs.value, curve.value))
const lastUpdatedLabel = computed(() => lastUpdated.value?.toLocaleTimeString('zh-CN', {hour12: false}) ?? '—')

/** 将未知异常转换为可展示的 Bridge 错误信息。 */
function describeError(error: unknown): string {
  if (error instanceof BridgeError) return error.message
  return error instanceof Error ? error.message : '本地行情服务发生未知错误。'
}

/** 将一条期权链展开为按合约代码索引的报价表。 */
function quotesFromChain(source: OptionChain): Map<string, OptionQuote> {
  const quotes = new Map<string, OptionQuote>()
  for (const row of source.rows) {
    if (row.call) quotes.set(row.call.code, row.call)
    if (row.put) quotes.set(row.put.code, row.put)
  }
  return quotes
}

/** 合并最新报价缓存并刷新已有策略腿市场数据。 */
function applyQuotes(quotes: ReadonlyMap<string, OptionQuote>): void {
  const merged = new Map(quoteCache.value)
  for (const [code, quote] of quotes) merged.set(code, quote)
  quoteCache.value = merged
  legs.value = refreshLegMarketData(legs.value, quotes)
}

/** 刷新当前未展示到期日中的跨期策略腿报价。 */
async function refreshOtherExpiryLegs(activeClient: FutuBridgeClient, id: number): Promise<void> {
  const otherExpiries = [...new Set(legs.value.map(leg => leg.expiry))]
      .filter(expiry => expiry !== selectedExpiry.value)
  if (!otherExpiries.length) return

  // 跨期报价并行拉取且逐个隔离失败：一个到期日不可用时，其余腿仍能同步最新价格。
  const results = await Promise.allSettled(
      otherExpiries.map(expiry => activeClient.optionChain(selectedSymbol.value, expiry)),
  )
  if (id !== requestId || activeClient !== client.value) return
  for (const result of results) {
    if (result.status === 'fulfilled') applyQuotes(quotesFromChain(result.value))
  }
}

/** 连接本机 Bridge 并加载当前标的的初始行情。 */
async function connect(): Promise<void> {
  const id = ++requestId
  loading.value = !chain.value
  errorMessage.value = ''
  try {
    const nextClient = new FutuBridgeClient(bridgeUrl.value)
    // 健康检查通过后才替换活动客户端，避免失败配置影响仍在运行的页面状态。
    await nextClient.health()
    if (id !== requestId) return
    client.value = nextClient
    quoteCache.value = new Map()
    void loadStocks(nextClient)
    const items = await nextClient.expirations(selectedSymbol.value)
    if (id !== requestId) return
    if (!items.length) throw new Error('该标的没有可用的美股期权到期日。')
    expirations.value = items.map(item => item.date)
    if (!expirations.value.includes(selectedExpiry.value)) {
      // 首次连接选最近日期；重连仅在原日期失效时清腿，避免把旧合约错误绑定到新日期。
      selectedExpiry.value = expirations.value[0]
      legs.value = []
    }
    refreshing.value = false
    await loadChain(false, id, !chain.value)
  } catch (error) {
    if (id !== requestId) return
    errorMessage.value = describeError(error)
    // 已有链可继续查看但必须标记过期；首次加载失败则保持空态，不能伪装成有效行情。
    stale.value = Boolean(chain.value)
  } finally {
    if (id === requestId) loading.value = false
  }
}

/** 后台加载可搜索的美股正股和 ETF 列表。 */
async function loadStocks(activeClient: FutuBridgeClient): Promise<void> {
  loadingStocks.value = true
  try {
    const [stockItems, etfItems] = await Promise.all([activeClient.stocks('STOCK'), activeClient.stocks('ETF')])
    if (activeClient !== client.value) return
    stocks.value = [...stockItems, ...etfItems].sort((a, b) => a.code.localeCompare(b.code))
  } catch {
    // 股票目录只是搜索增强；失败不阻断用户直接输入代码查询。
  } finally {
    loadingStocks.value = false
  }
}

/** 切换标的并加载其最近期权链。 */
async function loadSymbol(symbol: string, shouldConfirm = true, id = ++requestId): Promise<void> {
  if (!client.value) return
  // 策略不支持跨标的组合；切换标的必须显式确认并清空原有合约腿。
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
    quoteCache.value = new Map()
    chain.value = null
    await loadChain(false, id, true)
  } catch (error) {
    if (id === requestId) errorMessage.value = describeError(error)
  } finally {
    if (id === requestId) loading.value = false
  }
}

/** 保留策略腿并切换当前浏览的到期日。 */
async function changeExpiry(expiry: string): Promise<void> {
  if (expiry === selectedExpiry.value) return
  selectedExpiry.value = expiry
  // 切日期时保留跨期策略腿，但先移除旧链，避免新日期标题下误点旧日期报价。
  chain.value = null
  loading.value = true
  const id = ++requestId
  await loadChain(false, id, true)
  loading.value = false
}

/** 读取当前到期日行情并同步情景与跨期策略腿。 */
async function loadChain(background = false, id = requestId, resetScenario = false): Promise<void> {
  // 后台刷新不并发；主动切换仍由 requestId 隔离过期响应。
  if (!client.value || !selectedExpiry.value || (background && refreshing.value)) return
  if (background) refreshing.value = true
  try {
    const activeClient = client.value
    const nextChain = await activeClient.optionChain(selectedSymbol.value, selectedExpiry.value)
    if (id !== requestId) return
    chain.value = nextChain
    // 当前链先提交，保证可见报价及时更新；策略中的其他到期日随后独立刷新。
    applyQuotes(quotesFromChain(nextChain))
    const atm = nextChain.underlying.last ? atTheMoneyIv(nextChain.rows, nextChain.underlying.last) : null
    // 初次/切链采用新 ATM IV；用户手动调整后，后台报价刷新不覆盖其情景假设。
    if (resetScenario || !ivTouched.value) scenarioIv.value = (atm ?? 0) * 100
    if (resetScenario) {
      scenarioDay.value = totalDays.value
      ivTouched.value = false
    }
    stale.value = false
    errorMessage.value = ''
    lastUpdated.value = new Date()
    await refreshOtherExpiryLegs(activeClient, id)
  } catch (error) {
    if (id !== requestId) return
    errorMessage.value = describeError(error)
    // 后台刷新失败保留旧链并标记过期；主动切日期已清链，不回退到错误日期的数据。
    stale.value = Boolean(chain.value)
  } finally {
    refreshing.value = false
  }
}

/** 从搜索结果选择并加载标的。 */
function selectStock(stock: StockItem): void {
  searchOpen.value = false
  void loadSymbol(stock.code)
}

/** 根据搜索框内容加载完全匹配或直接输入的标的。 */
function submitSearch(): void {
  searchOpen.value = false
  const exact = stockResults.value.find(stock => stock.code.slice(3).toLowerCase() === searchText.value.trim().toLowerCase().replace(/^us\./, ''))
  void loadSymbol(exact?.code ?? searchText.value)
}

/** 将期权链中的买卖报价加入当前策略。 */
function addTrade(option: OptionQuote, side: 'ask' | 'bid'): void {
  // 按真实可成交方向记账：点卖价代表买入，点买价代表卖出。
  const price = side === 'ask' ? option.ask : option.bid
  if (price === null) return
  legs.value = adjustLegAtQuote(legs.value, option, side === 'ask' ? 1 : -1, price, selectedExpiry.value)
}

/** 修改策略腿数量并立即同步新方向报价。 */
function editStrategyLeg(code: string, field: 'quantity', value: number): void {
  const edited = editLeg(legs.value, code, {[field]: value})
  // 数量手工跨过零轴时，立即切换到新方向的 Bid/Ask，不等待下一轮轮询。
  legs.value = refreshLegMarketData(edited, quoteCache.value)
}

/** 反转策略腿方向并采用当前方向对应报价。 */
function reverseStrategyLeg(code: string): void {
  legs.value = reverseLeg(legs.value, code, quoteCache.value.get(code))
}

/** 从当前策略移除指定合约腿。 */
function removeLeg(code: string): void {
  legs.value = legs.value.filter(leg => leg.code !== code)
}

/** 清空当前策略的全部合约腿。 */
function clearLegs(): void {
  legs.value = []
}

/** 保存新的 Bridge 地址并重新连接。 */
function applyBridgeUrl(): void {
  bridgeUrl.value = bridgeInput.value.trim()
  localStorage.setItem('options-strategy.bridge-url', bridgeUrl.value)
  void connect()
}

/** 更新情景隐含波动率并标记为用户输入。 */
function updateScenarioIv(value: number): void {
  scenarioIv.value = value
  ivTouched.value = true
}

/** 在情景分析可用时更新情景天数。 */
function updateScenarioDay(value: number): void {
  if (currentAtmIv.value) scenarioDay.value = value
}

/** 页面重新可见时触发一次后台行情刷新。 */
function onVisibilityChange(): void {
  if (!document.hidden) void loadChain(true)
}

watch(totalDays, value => {
  if (scenarioDay.value > value) scenarioDay.value = value
})

/** 切换策略构建器的宽屏展示模式。 */
function setWideMode(enabled: boolean): void {
  wideMode.value = enabled
  document.documentElement.classList.toggle('options-strategy-wide', enabled)
}

/** 使用 Escape 键退出宽屏展示。 */
function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && wideMode.value) setWideMode(false)
}

onMounted(() => {
  const stored = localStorage.getItem('options-strategy.bridge-url')
  if (stored) bridgeUrl.value = bridgeInput.value = stored
  void connect()
  // 页面隐藏时暂停轮询以降低本机 OpenD 压力；重新可见时由 visibilitychange 立即补刷。
  pollTimer = setInterval(() => {
    if (!document.hidden) void loadChain(true)
  }, POLL_INTERVAL_MS)
  document.addEventListener('visibilitychange', onVisibilityChange)
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  if (pollTimer) clearInterval(pollTimer)
  document.removeEventListener('visibilitychange', onVisibilityChange)
  document.removeEventListener('keydown', onKeydown)
  document.documentElement.classList.remove('options-strategy-wide')
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

      <button
          class="icon-button wide-mode-button"
          type="button"
          :aria-pressed="wideMode"
          :title="wideMode ? '退出宽屏模式（Esc）' : '隐藏侧边栏并展开工作区'"
          @click="setWideMode(!wideMode)"
      >{{ wideMode ? '退出宽屏' : '宽屏' }}
      </button>
    </div>

    <div v-if="errorMessage" class="status-message" :class="{ compact: chain }" role="alert">
      <div><strong>{{ chain ? '行情刷新失败' : '无法连接本地行情服务' }}</strong><span>{{ errorMessage }}</span></div>
      <button type="button" @click="chain ? loadChain(true) : connect()">重试</button>
    </div>

    <ExpirationRail
        v-if="expirations.length"
        :expirations="expirations"
        :selected-expiry="selectedExpiry"
        :leg-counts="legCountsByExpiry"
        :loading="loading"
        @select="changeExpiry"
    />

    <div class="workbench-layout">
      <div v-if="loading && !chain" class="skeleton chain-skeleton" aria-label="正在加载期权数据" aria-busy="true"/>
      <OptionChainTable v-else-if="chain" :chain="chain" :quantities="quantities" @trade="addTrade"/>
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
          :expiry="analysisExpiry"
          :statistics-scope="sameExpiryStrategy ? 'expiry' : 'range'"
          :range-percent="rangePercent"
          :risk-free-rate="riskFreeRate"
          @edit="editStrategyLeg"
          @reverse="reverseStrategyLeg"
          @remove="removeLeg"
          @clear="clearLegs"
          @select-expiry="changeExpiry"
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

.search-field input, .bridge-settings input {
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

.wide-mode-button[aria-pressed="true"] {
  border-color: var(--vp-c-brand-2);
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

.bridge-settings {
  position: relative;
}

.bridge-settings summary {
  display: grid;
  height: var(--control-height);
  margin: 0;
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

.workbench-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
  margin-top: 12px;
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

}

@media (max-width: 959px) {
  .wide-mode-button {
    display: none;
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
