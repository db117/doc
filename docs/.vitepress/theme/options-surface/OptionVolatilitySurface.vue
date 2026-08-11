<script setup lang="ts">
import {computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch} from 'vue'
import type {ECharts} from 'echarts'
import {BridgeError, FutuBridgeClient} from '../options-strategy/bridge-client'
import type {OptionChain, OptionType} from '../options-strategy/types'
import {
  buildVolatilitySurface,
  collectOpenInterest,
  selectSurfaceExpirations,
} from './surface'
import {formatNumber, formatPercent, renderSurfaceChart} from './chart'

const DEFAULT_BRIDGE_URL = 'http://127.0.0.1:8765'
const DEFAULT_SYMBOL = 'US.MU'

// 图表容器与实例
const chartElement = ref<HTMLElement | null>(null)
const chart = shallowRef<ECharts | null>(null)

// Bridge 连接与曲面查询条件
const bridgeUrl = ref(DEFAULT_BRIDGE_URL)
const bridgeInput = ref(DEFAULT_BRIDGE_URL)
const symbolInput = ref('MU')
const selectedSymbol = ref(DEFAULT_SYMBOL)
const optionType = ref<OptionType>('CALL')
const showOpenInterest = ref(false)
const expiryHorizon = ref(180)
const strikeRange = ref(.2)
const chains = shallowRef<OptionChain[]>([])

// 行情读取反馈
const loading = ref(true)
const errorMessage = ref('')
const failedExpiries = ref(0)
const lastUpdated = ref<Date | null>(null)

// 图表生命周期和并发请求协调
let resizeObserver: ResizeObserver | null = null
let themeObserver: MutationObserver | null = null
let requestId = 0

// 原始期权链是唯一数据源，切换 Call/Put 或行权价范围只在浏览器内重新计算。
// 曲面、持仓量和无障碍摘要派生状态
const surface = computed(() => buildVolatilitySurface(chains.value, optionType.value, strikeRange.value))
const openInterest = computed(() => surface.value
    ? collectOpenInterest(chains.value, surface.value.strikeMin, surface.value.strikeMax)
    : [])
const lastUpdatedLabel = computed(() => lastUpdated.value?.toLocaleTimeString('zh-CN', {hour12: false}) ?? '暂无')
const ivRangeLabel = computed(() => surface.value
    ? `${formatPercent(surface.value.ivMin)} 至 ${formatPercent(surface.value.ivMax)}`
    : '暂无')
const maxDte = computed(() => surface.value
    ? Math.max(...surface.value.cells.map(cell => cell.value[1]))
    : 0)
const chartSummary = computed(() => surface.value
    ? `${selectedSymbol.value} ${optionType.value} 隐含波动率曲面，共 ${surface.value.expiryCount} 个期限，最远 ${maxDte.value} 天，${surface.value.strikeCount} 个行权价，波动率范围 ${ivRangeLabel.value}。`
    : '暂无可展示的隐含波动率数据。')

/** 将未知异常转换为可展示的行情错误信息。 */
function describeError(error: unknown): string {
  if (error instanceof BridgeError) return error.message
  return error instanceof Error ? error.message : '本地行情服务发生未知错误。'
}

/** 将用户输入规范化为富途美股代码。 */
function normalizedSymbol(): string {
  const ticker = symbolInput.value.trim().toUpperCase().replace(/^US\./, '')
  if (!/^[A-Z][A-Z0-9.-]{0,9}$/.test(ticker)) throw new Error('请输入有效的美股代码，例如 MU 或 AAPL。')
  return `US.${ticker}`
}

/** 从 Bridge 读取多个期限并刷新曲面数据源。 */
async function loadSurface(): Promise<void> {
  // 用户可在前一次请求完成前再次查询；requestId 防止旧响应覆盖新标的。
  const id = ++requestId
  loading.value = true
  errorMessage.value = ''
  failedExpiries.value = 0
  try {
    const symbol = normalizedSymbol()
    const nextBridgeUrl = bridgeInput.value.trim()
    const client = new FutuBridgeClient(nextBridgeUrl)
    await client.health()
    const expirations = await client.expirations(symbol)
    if (id !== requestId) return
    // OpenD 每 30 秒最多查询 10 次期权链，采样器会在所选 DTE 范围保留近端和远端。
    const selected = selectSurfaceExpirations(expirations, expiryHorizon.value).map(item => item.date)
    if (!selected.length) throw new Error('该标的没有可用的期权到期日。')

    const result = await client.optionChains(symbol, selected)
    if (id !== requestId) return
    const loaded = result.chains
    failedExpiries.value = result.failureCount
    selectedSymbol.value = symbol
    chains.value = loaded
    bridgeUrl.value = nextBridgeUrl
    localStorage.setItem('options-strategy.bridge-url', bridgeUrl.value)
    lastUpdated.value = new Date()
  } catch (error) {
    if (id === requestId) errorMessage.value = describeError(error)
  } finally {
    if (id === requestId) loading.value = false
  }
}

/** 将当前曲面状态绘制到 ECharts 实例。 */
function renderChart(): void {
  if (!chart.value || !surface.value || !chartElement.value) {
    chart.value?.clear()
    return
  }
  renderSurfaceChart(chart.value, {
    data: surface.value,
    openInterest: openInterest.value,
    showOpenInterest: showOpenInterest.value,
    selectedSymbol: selectedSymbol.value,
    optionType: optionType.value,
    compact: chartElement.value.clientWidth < 540,
    dark: document.documentElement.classList.contains('dark'),
  })
}

watch([surface, showOpenInterest], () => void nextTick(renderChart))

onMounted(async () => {
  const stored = localStorage.getItem('options-strategy.bridge-url')
  if (stored) bridgeUrl.value = bridgeInput.value = stored
  showOpenInterest.value = window.matchMedia('(min-width: 761px)').matches
  const echarts = await import('echarts')
  // echarts-gl 通过副作用注册 3D 图表，v2.1.0 本身未提供 TypeScript 声明。
  // @ts-expect-error 该导入不读取模块导出，只执行注册副作用。
  await import('echarts-gl')
  if (!chartElement.value) return
  chart.value = echarts.init(chartElement.value, undefined, {renderer: 'canvas'})
  resizeObserver = new ResizeObserver(() => {
    chart.value?.resize()
    renderChart()
  })
  resizeObserver.observe(chartElement.value)
  themeObserver = new MutationObserver(renderChart)
  themeObserver.observe(document.documentElement, {attributes: true, attributeFilter: ['class']})
  await loadSurface()
  renderChart()
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  themeObserver?.disconnect()
  chart.value?.dispose()
})
</script>

<template>
  <section class="surface-workbench" aria-label="期权隐含波动率曲面">
    <form class="surface-toolbar" @submit.prevent="loadSurface">
      <label>
        <span>美股代码</span>
        <input v-model="symbolInput" type="text" autocomplete="off" spellcheck="false" placeholder="MU">
      </label>
      <label>
        <span>期限范围</span>
        <select v-model.number="expiryHorizon">
          <option :value="30">未来 30 天</option>
          <option :value="90">未来 90 天</option>
          <option :value="180">未来 180 天</option>
          <option :value="365">未来 365 天</option>
        </select>
      </label>
      <label>
        <span>行权价范围</span>
        <select v-model.number="strikeRange">
          <option :value=".2">现价上下 20%</option>
          <option :value=".3">现价上下 30%</option>
          <option :value=".5">现价上下 50%</option>
        </select>
      </label>
      <button type="submit" :disabled="loading">{{ loading ? '读取中' : '更新曲面' }}</button>

      <details class="surface-settings">
        <summary>连接设置</summary>
        <div>
          <label for="surface-bridge-url">Bridge Base URL</label>
          <input id="surface-bridge-url" v-model="bridgeInput" type="url" spellcheck="false">
          <p>只访问本机只读 Bridge，不包含交易接口。</p>
        </div>
      </details>
    </form>

    <div v-if="errorMessage" class="surface-error" role="alert">
      <div><strong>无法生成曲面</strong><span>{{ errorMessage }}</span></div>
      <button type="button" @click="loadSurface">重试</button>
    </div>

    <div class="surface-meta">
      <div class="surface-side" role="group" aria-label="期权类型">
        <button type="button" :aria-pressed="optionType === 'CALL'" @click="optionType = 'CALL'">Call</button>
        <button type="button" :aria-pressed="optionType === 'PUT'" @click="optionType = 'PUT'">Put</button>
      </div>
      <button
          class="interest-toggle"
          type="button"
          :aria-pressed="showOpenInterest"
          aria-label="显示持仓量柱"
          @click="showOpenInterest = !showOpenInterest"
      ><i class="call-dot"/><i class="put-dot"/>持仓量
      </button>
      <dl>
        <div>
          <dt>标的现价</dt>
          <dd>{{ formatNumber(surface?.spot ?? null) }}</dd>
        </div>
        <div>
          <dt>有效期限</dt>
          <dd>{{ surface?.expiryCount ?? 0 }} 期 · 最远 {{ maxDte }} 天</dd>
        </div>
        <div>
          <dt>曲面点位</dt>
          <dd>{{ surface?.cells.length ?? 0 }}</dd>
        </div>
        <div>
          <dt>IV 区间</dt>
          <dd>{{ ivRangeLabel }}</dd>
        </div>
      </dl>
      <div class="surface-freshness">
        <span><i/>OpenD 本地行情</span>
        <small>更新 {{ lastUpdatedLabel }}</small>
      </div>
    </div>

    <div class="surface-stage" :aria-busy="loading">
      <div ref="chartElement" class="surface-chart" role="img" :aria-label="chartSummary"/>
      <div v-if="loading" class="surface-loading"><span/>正在读取多个到期日</div>
      <div v-else-if="!surface && !errorMessage" class="surface-empty">没有足够的有效 IV 数据生成曲面。</div>
      <p class="surface-help">
        拖动旋转，滚轮或双指缩放。紫线表示现价；
        <template v-if="showOpenInterest">绿柱为 Call、红柱为 Put，柱高按当前最大持仓量归一化；</template>
        不含当日到期及 IV 超过 300% 的异常点。
      </p>
    </div>

    <p v-if="failedExpiries" class="surface-warning">{{ failedExpiries }} 个到期日读取失败，当前曲面使用其余有效数据。</p>
  </section>
</template>

<style scoped src="./OptionVolatilitySurface.css"></style>
