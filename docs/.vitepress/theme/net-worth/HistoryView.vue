<script setup lang="ts">
import {computed, nextTick, onBeforeUnmount, onMounted, ref, watch} from 'vue'
import {useData} from 'vitepress'
import type {ECharts, EChartsCoreOption} from 'echarts/core'
import {init, use} from 'echarts/core'
import {LineChart} from 'echarts/charts'
import {GridComponent, LegendComponent, TooltipComponent} from 'echarts/components'
import {CanvasRenderer} from 'echarts/renderers'
import {
  accountHasBalances,
  accountIsEffective,
  latestBalance,
  multiplyAmountByRate,
  rateForRecord,
  summarize,
  todayMonthISO,
  type Account,
  type BalanceSource,
  type Ledger,
} from './ledger'
import {formatChartAxisCny, formatCny, formatMonthOverMonth, formatOriginal} from './format'

use([LineChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer])

// 月份选择与图表弹层由历史页内聚；父组件只处理会修改账本的事件。
const props = defineProps<{ ledger: Ledger; active: boolean }>()
const emit = defineEmits<{
  editBalance: [account: Account, date: string]
  deleteRecord: [accountId: string, date: string]
}>()
const {isDark} = useData()
const historyDate = ref(todayMonthISO())
const historyAccountId = ref<string | null>(null)
const accountHistoryChartId = ref<string | null>(null)
const historyChartRoot = ref<HTMLElement | null>(null)
const assetLiabilityChartRoot = ref<HTMLElement | null>(null)
const accountHistoryChartRoot = ref<HTMLElement | null>(null)
let historyChart: ECharts | undefined
let historyChartObserver: ResizeObserver | undefined
let assetLiabilityChart: ECharts | undefined
let assetLiabilityChartObserver: ResizeObserver | undefined
let accountHistoryChart: ECharts | undefined
let accountHistoryChartObserver: ResizeObserver | undefined

const historyDates = computed(() => [...new Set(props.ledger.balances.map(record => record.date))].sort())
const historyAccountOptions = computed(() => props.ledger.accounts
    .filter(account => accountHasBalances(props.ledger, account.id))
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN')))
const historyAccount = computed(() => historyAccountOptions.value.find(account => account.id === historyAccountId.value)
    ?? historyAccountOptions.value[0]
    ?? null)
const historyAccountRows = computed(() => {
  const account = historyAccount.value
  if (!account) return []
  return props.ledger.balances
      .filter(record => record.accountId === account.id)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(record => {
        const rate = rateForRecord(props.ledger, account, record)
        return {record, rate, cnyAmount: rate ? multiplyAmountByRate(record.amount, rate.cnyRate) : '0'}
      })
})
const historySummary = computed(() => summarize(props.ledger, historyDate.value))
// 目标月份状态采用“账户当时有效 + 截至当月最新余额”的历史快照口径。
const historyRows = computed(() => props.ledger.accounts
    .filter(account => accountIsEffective(account, historyDate.value))
    .flatMap(account => {
      const record = latestBalance(props.ledger, account.id, historyDate.value)
      if (!record) return []
      const rate = rateForRecord(props.ledger, account, record)
      return [{
        account,
        record,
        rate,
        cnyAmount: rate ? multiplyAmountByRate(record.amount, rate.cnyRate) : '0',
      }]
    })
    .sort((a, b) => Number(!a.rate) - Number(!b.rate)
        || Number(b.cnyAmount) - Number(a.cnyAmount)
        || a.account.name.localeCompare(b.account.name, 'zh-CN')))
// 趋势只绘制实际存在余额记录的月份，不虚构没有采样的数据点。
const historyPoints = computed(() => historyDates.value.map(date => {
  const summary = summarize(props.ledger, date)
  return {date, netWorth: summary.netWorthCny, assets: summary.assetsCny, liabilities: summary.liabilitiesCny}
}))
const accountHistoryChartAccount = computed(() => props.ledger.accounts.find(account => account.id === accountHistoryChartId.value) ?? null)
const accountHistoryChartPoints = computed(() => {
  const account = accountHistoryChartAccount.value
  if (!account) return []
  return props.ledger.balances
      .filter(record => record.accountId === account.id)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(record => {
        const rate = rateForRecord(props.ledger, account, record)
        return {record, rate, cnyAmount: rate ? multiplyAmountByRate(record.amount, rate.cnyRate) : null}
      })
      .filter(point => point.cnyAmount !== null)
})

/** 将余额来源代码转换为历史表中的中文标签。 */
function balanceSourceLabel(source: BalanceSource): string {
  return source === 'manual' ? '手动'
      : source === 'installment-setup' ? '分期设置'
          : source === 'installment-confirmation' ? '本月确认'
              : source === 'installment-backfill' ? '跨月补记'
                  : source === 'installment-correction' ? '进度修正'
                      : '分期终止'
}

// 折线图共享坐标轴规范，保证金额单位和暗色主题表现一致。
const chartAxes = computed(() => ({
  xAxis: {
    type: 'category',
    boundaryGap: false,
    name: '月份',
    nameLocation: 'middle',
    nameGap: 30,
    axisLine: {lineStyle: {color: isDark.value ? '#555d5b' : '#cfd6d4'}},
    axisLabel: {color: isDark.value ? '#a9b0ae' : '#68716f'},
    axisTick: {alignWithLabel: true},
  },
  yAxis: {
    type: 'value',
    name: '金额（CNY）',
    nameLocation: 'middle',
    nameGap: 56,
    axisLabel: {color: isDark.value ? '#a9b0ae' : '#68716f', formatter: (value: number) => formatChartAxisCny(value)},
    splitLine: {lineStyle: {color: isDark.value ? '#303635' : '#edf0ef'}},
  },
}))
const historyChartOption = computed<EChartsCoreOption>(() => ({
  animation: !isDark.value,
  backgroundColor: 'transparent',
  grid: {top: 24, right: 20, bottom: 48, left: 76, containLabel: true},
  tooltip: {
    trigger: 'axis',
    confine: true,
    axisPointer: {type: 'cross', lineStyle: {color: isDark.value ? '#84908d' : '#8a9692'}},
    formatter: (params: unknown) => {
      const item = (Array.isArray(params) ? params[0] : params) as { dataIndex?: number; axisValue?: string; value?: number | string }
      const index = item.dataIndex ?? 0
      const point = historyPoints.value[index]
      return `${item.axisValue ?? ''}<br>净资产 <b>${formatCny(String(item.value ?? 0))}</b><br>较上月 <b>${formatMonthOverMonth(point?.netWorth ?? 0, historyPoints.value[index - 1]?.netWorth)}</b>`
    },
  },
  xAxis: {...chartAxes.value.xAxis, data: historyPoints.value.map(point => point.date)},
  yAxis: chartAxes.value.yAxis,
  series: [{
    name: '净资产',
    type: 'line',
    data: historyPoints.value.map(point => Number(point.netWorth)),
    showSymbol: true,
    symbol: 'circle',
    symbolSize: 8,
    lineStyle: {width: 3, color: '#2f9e93'},
    itemStyle: {color: '#2f9e93', borderColor: isDark.value ? '#202425' : '#ffffff', borderWidth: 2},
    areaStyle: {color: '#2f9e93', opacity: isDark.value ? 0.14 : 0.1},
  }],
}))
const assetLiabilityChartOption = computed<EChartsCoreOption>(() => ({
  animation: !isDark.value,
  backgroundColor: 'transparent',
  grid: {top: 50, right: 20, bottom: 48, left: 76, containLabel: true},
  legend: {top: 8, textStyle: {color: isDark.value ? '#a9b0ae' : '#68716f'}},
  tooltip: {
    trigger: 'axis',
    confine: true,
    axisPointer: {type: 'cross', lineStyle: {color: isDark.value ? '#84908d' : '#8a9692'}},
    formatter: (params: unknown) => {
      const items = (Array.isArray(params) ? params : [params]) as Array<{
        axisValue?: string
        marker?: string
        seriesName?: string
        value?: number | string
        dataIndex?: number
      }>
      return [items[0]?.axisValue ?? '', ...items.map(item => {
        const index = item.dataIndex ?? 0
        const field: 'assets' | 'liabilities' = item.seriesName === '总负债' ? 'liabilities' : 'assets'
        return `${item.marker ?? ''}${item.seriesName ?? ''} <b>${formatCny(String(item.value ?? 0))}</b><br>较上月 <b>${formatMonthOverMonth(historyPoints.value[index]?.[field] ?? 0, historyPoints.value[index - 1]?.[field])}</b>`
      })].join('<br>')
    },
  },
  xAxis: {...chartAxes.value.xAxis, data: historyPoints.value.map(point => point.date)},
  yAxis: chartAxes.value.yAxis,
  series: [
    {
      name: '总资产',
      type: 'line',
      data: historyPoints.value.map(point => Number(point.assets)),
      showSymbol: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: {width: 3, color: '#2f9e93'},
      itemStyle: {color: '#2f9e93', borderColor: isDark.value ? '#202425' : '#ffffff', borderWidth: 2},
    },
    {
      name: '总负债',
      type: 'line',
      data: historyPoints.value.map(point => Number(point.liabilities)),
      showSymbol: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: {width: 3, color: '#d76a5f'},
      itemStyle: {color: '#d76a5f', borderColor: isDark.value ? '#202425' : '#ffffff', borderWidth: 2},
    },
  ],
}))
const accountHistoryChartOption = computed<EChartsCoreOption>(() => ({
  animation: !isDark.value,
  backgroundColor: 'transparent',
  grid: {top: 24, right: 20, bottom: 48, left: 76, containLabel: true},
  tooltip: {
    trigger: 'axis',
    confine: true,
    axisPointer: {type: 'cross', lineStyle: {color: isDark.value ? '#84908d' : '#8a9692'}},
    formatter: (params: unknown) => {
      const item = (Array.isArray(params) ? params[0] : params) as { dataIndex?: number; axisValue?: string }
      const point = accountHistoryChartPoints.value[item.dataIndex ?? 0]
      if (!point) return item.axisValue ?? ''
      return `${point.record.date}<br>原币余额 <b>${formatOriginal(point.record.amount, accountHistoryChartAccount.value?.currency ?? 'CNY')}</b><br>CNY 金额 <b>${formatCny(point.cnyAmount ?? '0')}</b>`
    },
  },
  xAxis: {...chartAxes.value.xAxis, data: accountHistoryChartPoints.value.map(point => point.record.date)},
  yAxis: chartAxes.value.yAxis,
  series: [{
    name: '账户余额',
    type: 'line',
    data: accountHistoryChartPoints.value.map(point => Number(point.cnyAmount)),
    showSymbol: true,
    symbol: 'circle',
    symbolSize: 8,
    lineStyle: {width: 3, color: '#5b8def'},
    itemStyle: {color: '#5b8def', borderColor: isDark.value ? '#202425' : '#ffffff', borderWidth: 2},
    areaStyle: {color: '#5b8def', opacity: isDark.value ? 0.14 : 0.1},
  }],
}))

watch(historyDates, dates => {
  // 导入或删除数据后，如果原选择失效，回落到最新的可用月份。
  if (dates.length && !dates.includes(historyDate.value)) historyDate.value = dates[dates.length - 1]
}, {immediate: true})
watch(historyAccountOptions, options => {
  if (!options.some(account => account.id === historyAccountId.value)) historyAccountId.value = options[0]?.id ?? null
}, {immediate: true})

/** 初始化或刷新净资产历史折线图。 */
function renderHistoryChart(): void {
  // DOM 被条件移除时必须释放实例；仅 v-show 隐藏时保留实例和当前交互状态。
  if (!historyChartRoot.value) {
    historyChartObserver?.disconnect()
    historyChartObserver = undefined
    historyChart?.dispose()
    historyChart = undefined
    return
  }
  if (!props.active) return
  if (!historyChart) historyChart = init(historyChartRoot.value, undefined, {renderer: 'canvas'})
  if (!historyChartObserver) {
    historyChartObserver = new ResizeObserver(() => historyChart?.resize())
    historyChartObserver.observe(historyChartRoot.value)
  }
  historyChart.setOption(historyChartOption.value, {notMerge: true, lazyUpdate: true})
  historyChart.resize()
}

/** 初始化或刷新总资产与总负债折线图。 */
function renderAssetLiabilityChart(): void {
  if (!assetLiabilityChartRoot.value) {
    assetLiabilityChartObserver?.disconnect()
    assetLiabilityChartObserver = undefined
    assetLiabilityChart?.dispose()
    assetLiabilityChart = undefined
    return
  }
  if (!props.active) return
  if (!assetLiabilityChart) assetLiabilityChart = init(assetLiabilityChartRoot.value, undefined, {renderer: 'canvas'})
  if (!assetLiabilityChartObserver) {
    assetLiabilityChartObserver = new ResizeObserver(() => assetLiabilityChart?.resize())
    assetLiabilityChartObserver.observe(assetLiabilityChartRoot.value)
  }
  assetLiabilityChart.setOption(assetLiabilityChartOption.value, {notMerge: true, lazyUpdate: true})
  assetLiabilityChart.resize()
}

/** 初始化或刷新账户余额历史折线图。 */
function renderAccountHistoryChart(): void {
  // 账户弹层每次关闭都会移除容器，因此需销毁旧实例，重开时绑定新 DOM。
  if (!accountHistoryChartRoot.value) {
    accountHistoryChartObserver?.disconnect()
    accountHistoryChartObserver = undefined
    accountHistoryChart?.dispose()
    accountHistoryChart = undefined
    return
  }
  if (!props.active) return
  if (!accountHistoryChart) accountHistoryChart = init(accountHistoryChartRoot.value, undefined, {renderer: 'canvas'})
  if (!accountHistoryChartObserver) {
    accountHistoryChartObserver = new ResizeObserver(() => accountHistoryChart?.resize())
    accountHistoryChartObserver.observe(accountHistoryChartRoot.value)
  }
  accountHistoryChart.setOption(accountHistoryChartOption.value, {notMerge: true, lazyUpdate: true})
  accountHistoryChart.resize()
}

/** 打开指定账户的历史趋势弹层。 */
function openHistoryAccountChart(account: Account): void {
  accountHistoryChartId.value = account.id
}

/** 关闭当前账户历史趋势弹层。 */
function closeHistoryAccountChart(): void {
  accountHistoryChartId.value = null
}

// nextTick 确保 Vue 已完成显隐和尺寸更新，再让 ECharts 读取容器。
watch([historyPoints, isDark, () => props.active], () => nextTick(renderHistoryChart), {deep: true})
watch(historyChartRoot, () => nextTick(renderHistoryChart))
watch([historyPoints, isDark, () => props.active], () => nextTick(renderAssetLiabilityChart), {deep: true})
watch(assetLiabilityChartRoot, () => nextTick(renderAssetLiabilityChart))
watch([accountHistoryChartPoints, isDark, () => props.active], () => nextTick(renderAccountHistoryChart), {deep: true})
watch(accountHistoryChartRoot, () => nextTick(renderAccountHistoryChart))
onMounted(() => renderHistoryChart())
onBeforeUnmount(() => {
  historyChartObserver?.disconnect()
  historyChart?.dispose()
  assetLiabilityChartObserver?.disconnect()
  assetLiabilityChart?.dispose()
  accountHistoryChartObserver?.disconnect()
  accountHistoryChart?.dispose()
})
</script>

<template>
  <section class="history-view">
    <div class="section-heading history-heading">
      <div><h2>历史净资产</h2>
        <p>按每个账户截至目标月份的最后一条记录计算。</p></div>
      <label class="history-date-picker">查看月份<select v-model="historyDate" :disabled="!historyDates.length">
        <option v-for="date in historyDates" :key="date" :value="date">{{ date }}</option>
      </select></label>
    </div>
    <div v-if="!historyDates.length" class="empty-state">
      <div class="empty-mark">—</div>
      <h2>还没有历史记录</h2>
      <p>保存账户余额后，这里会显示净资产变化和每个账户的来源。</p>
    </div>
    <template v-else>
      <section class="summary-strip" aria-label="历史月份摘要">
        <div><span>净资产</span><strong class="net-worth-value">{{ formatCny(historySummary.netWorthCny) }}</strong>
        </div>
        <div><span>资产</span><strong>{{ formatCny(historySummary.assetsCny) }}</strong></div>
        <div><span>负债</span><strong class="liability-value">{{ formatCny(historySummary.liabilitiesCny) }}</strong>
        </div>
      </section>
      <section class="history-chart-panel">
        <div class="section-heading compact">
          <div><h2>净资产趋势</h2>
            <p>{{ historyPoints.length }} 个记录月份</p></div>
        </div>
        <div ref="historyChartRoot" class="history-chart" role="img"
             aria-label="净资产历史趋势图，可悬停查看月份、金额和环比"/>
      </section>
      <section class="history-chart-panel">
        <div class="section-heading compact">
          <div><h2>资产与负债趋势</h2>
            <p>总资产与总负债的月度对比</p></div>
        </div>
        <div ref="assetLiabilityChartRoot" class="history-chart" role="img"
             aria-label="总资产与总负债历史趋势图，可悬停查看月份、金额和环比"/>
      </section>
      <section class="history-table-panel">
        <div class="section-heading compact">
          <div><h2>{{ historyDate }} 的账户状态</h2>
            <p>每个账户每月只保留一条余额记录，修正会覆盖当月数据。</p></div>
        </div>
        <div class="history-table">
          <div class="history-table-head">
            <span>账户</span><span>记录月份</span><span>原币余额</span><span>CNY 金额</span><span>操作</span></div>
          <div v-for="row in historyRows" :key="row.account.id" class="history-row">
            <button class="history-account-link account-name" type="button"
                    @click="openHistoryAccountChart(row.account)">
              <span class="account-dot"
                    :class="row.account.type === 'liability' ? 'liability-dot' : 'asset-dot'"/>{{ row.account.name }}
            </button>
            <span>{{ row.record.date }}</span>
            <span>{{ formatOriginal(row.record.amount, row.account.currency) }}</span>
            <span :class="{'liability-value': row.account.type === 'liability'}">{{
                row.rate ? `${row.account.type === 'liability' ? '-' : ''}${formatCny(row.cnyAmount)}` : '缺少汇率'
              }}</span>
            <span class="history-actions">
              <button v-if="row.record.source === 'manual'" class="row-button" type="button"
                      @click="emit('editBalance', row.account, row.record.date)">修正</button>
              <button v-if="row.record.source === 'manual'" class="text-danger" type="button"
                      @click="emit('deleteRecord', row.account.id, row.record.date)">删除</button>
              <button v-else-if="!row.rate && row.account.currency !== 'CNY'" class="row-button" type="button"
                      @click="emit('editBalance', row.account, row.record.date)">补汇率</button>
              <small v-else>分期记录</small>
            </span>
          </div>
        </div>
      </section>
      <section class="history-table-panel account-history-panel">
        <div class="section-heading compact">
          <div><h2>账户历史</h2>
            <p>
              <button v-if="historyAccount" class="history-account-link" type="button"
                      @click="openHistoryAccountChart(historyAccount)">{{ historyAccount.name }}
              </button>
              的全部月度余额记录，不受上方查看月份限制。
            </p>
          </div>
          <label class="history-account-picker">账户<select v-model="historyAccountId">
            <option v-for="account in historyAccountOptions" :key="account.id" :value="account.id">{{
                account.name
              }}
            </option>
          </select></label>
        </div>
        <div v-if="!historyAccountRows.length" class="empty-state compact-empty">
          <div class="empty-mark">—</div>
          <p>这个账户还没有余额记录。</p></div>
        <div v-else class="history-table">
          <div class="account-history-head"><span>月份</span><span>原币余额</span><span>CNY 金额</span><span>来源</span><span>操作</span>
          </div>
          <div v-for="row in historyAccountRows" :key="row.record.date" class="account-history-row">
            <span>{{ row.record.date }}</span>
            <span>{{ formatOriginal(row.record.amount, historyAccount?.currency ?? 'CNY') }}</span>
            <span :class="{'liability-value': historyAccount?.type === 'liability'}">{{
                row.rate ? `${historyAccount?.type === 'liability' ? '-' : ''}${formatCny(row.cnyAmount)}` : '缺少汇率'
              }}</span>
            <span class="history-source">{{ balanceSourceLabel(row.record.source) }}</span>
            <span class="history-actions">
              <button v-if="row.record.source === 'manual'" class="row-button" type="button"
                      @click="historyAccount && emit('editBalance', historyAccount, row.record.date)">修正</button>
              <button v-if="row.record.source === 'manual'" class="text-danger" type="button"
                      @click="emit('deleteRecord', historyAccount?.id ?? '', row.record.date)">删除</button>
              <button v-else-if="!row.rate && historyAccount?.currency !== 'CNY'" class="row-button" type="button"
                      @click="historyAccount && emit('editBalance', historyAccount, row.record.date)">补汇率</button>
              <small v-else>自动记录</small>
            </span>
          </div>
        </div>
      </section>

      <div v-if="accountHistoryChartAccount" class="account-history-chart-backdrop"
           @click.self="closeHistoryAccountChart">
        <section class="account-history-chart-modal" role="dialog" aria-modal="true"
                 :aria-label="`${accountHistoryChartAccount.name} 余额趋势`">
          <div class="panel-heading">
            <div><span class="panel-kicker">账户历史趋势</span>
              <h2>{{ accountHistoryChartAccount.name }}</h2></div>
            <button class="close-button" type="button" aria-label="关闭" @click="closeHistoryAccountChart">×</button>
          </div>
          <div v-if="accountHistoryChartPoints.length" ref="accountHistoryChartRoot" class="account-history-chart"
               role="img" aria-label="账户余额历史折线图，可悬停查看月份和金额"/>
          <div v-else class="distribution-empty">暂无可折算的账户历史余额</div>
        </section>
      </div>
    </template>
  </section>
</template>

<style scoped src="./HistoryView.css"></style>
