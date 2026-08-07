<script setup lang="ts">
import {computed, nextTick, onBeforeUnmount, onMounted, ref, watch} from 'vue'
import {useData} from 'vitepress'
import type {ECharts, EChartsCoreOption} from 'echarts/core'
import {init, use} from 'echarts/core'
import {PieChart} from 'echarts/charts'
import {LegendComponent, TooltipComponent} from 'echarts/components'
import {CanvasRenderer} from 'echarts/renderers'
import {
  installmentBalance,
  latestBalance,
  multiplyAmountByRate,
  rateForRecord,
  summarize,
  todayMonthISO,
  type Account,
  type Ledger,
} from './ledger'
import {formatCny, formatOriginal, rowIsStale} from './format'

use([PieChart, LegendComponent, TooltipComponent, CanvasRenderer])

// 组件由 v-show 常驻；active 用于在重新显示时恢复 ECharts 尺寸。
const props = defineProps<{ ledger: Ledger; active: boolean; selectedAccountId: string | null }>()
const emit = defineEmits<{ newAccount: []; openAccount: [account: Account] }>()
const {isDark} = useData()
const assetPieRoot = ref<HTMLElement | null>(null)
let assetPieChart: ECharts | undefined
let assetPieObserver: ResizeObserver | undefined

const summary = computed(() => summarize(props.ledger))
// 每个账户只展示截至当前月的最新一条记录，停用账户固定排在末尾。
const accountRows = computed(() => props.ledger.accounts
    .map(account => {
      const record = latestBalance(props.ledger, account.id, todayMonthISO())
      const rate = record ? rateForRecord(props.ledger, account, record) : null
      return {
        account,
        record,
        rate,
        cnyAmount: record && rate ? multiplyAmountByRate(record.amount, rate.cnyRate) : '0',
      }
    })
    .sort((a, b) => Number(a.account.status === 'inactive') - Number(b.account.status === 'inactive')
        || a.account.name.localeCompare(b.account.name, 'zh-CN')))
const assetRows = computed(() => accountRows.value.filter(row => row.account.type === 'asset'))
const liabilityRows = computed(() => accountRows.value.filter(row => row.account.type === 'liability'))
// 饼图只接受可折算的正资产；缺汇率和零余额不应制造误导扇区。
const assetPieData = computed(() => assetRows.value
    .filter(row => row.account.status === 'active' && row.record && row.rate)
    .map(row => ({name: row.account.name, value: Number(row.cnyAmount)}))
    .filter(item => Number.isFinite(item.value) && item.value > 0))
const assetPieOption = computed<EChartsCoreOption>(() => ({
  animation: !isDark.value,
  backgroundColor: 'transparent',
  tooltip: {
    trigger: 'item',
    confine: true,
    formatter: (params: unknown) => {
      const item = params as { name?: string; value?: number; percent?: number }
      return `${item.name ?? '账户'}<br><b>${formatCny(String(item.value ?? 0))}</b>（${(item.percent ?? 0).toFixed(1)}%）`
    },
  },
  legend: {
    type: 'scroll',
    orient: 'vertical',
    right: 0,
    top: 'middle',
    height: '80%',
    textStyle: {color: isDark.value ? '#a9b0ae' : '#68716f', fontSize: 11},
  },
  series: [{
    name: '资产分布',
    type: 'pie',
    center: ['34%', '50%'],
    radius: ['38%', '68%'],
    avoidLabelOverlap: true,
    itemStyle: {borderColor: isDark.value ? '#202425' : '#ffffff', borderWidth: 2},
    label: {show: false},
    emphasis: {label: {show: true, fontSize: 12, fontWeight: 700}},
    data: assetPieData.value,
  }],
}))

function renderAssetPie(): void {
  // 隐藏元素宽度为 0，等视图激活后再初始化或 resize 才能得到正确布局。
  if (!props.active || !assetPieRoot.value) return
  if (!assetPieChart) assetPieChart = init(assetPieRoot.value, undefined, {renderer: 'canvas'})
  if (!assetPieObserver) {
    assetPieObserver = new ResizeObserver(() => assetPieChart?.resize())
    assetPieObserver.observe(assetPieRoot.value)
  }
  assetPieChart.setOption(assetPieOption.value, {notMerge: true, lazyUpdate: true})
  assetPieChart.resize()
}

watch([assetPieData, isDark, () => props.active], () => nextTick(renderAssetPie), {deep: true})
watch(assetPieRoot, () => nextTick(renderAssetPie))
onMounted(() => renderAssetPie())
onBeforeUnmount(() => {
  assetPieObserver?.disconnect()
  assetPieChart?.dispose()
})
</script>

<template>
  <div class="overview-view">
    <section class="summary-strip" aria-label="净资产摘要">
      <div><span>净资产</span><strong class="net-worth-value">{{ formatCny(summary.netWorthCny) }}</strong></div>
      <div><span>资产</span><strong>{{ formatCny(summary.assetsCny) }}</strong></div>
      <div><span>负债</span><strong class="liability-value">{{ formatCny(summary.liabilitiesCny) }}</strong></div>
    </section>

    <div v-if="summary.missingRateAccounts.length" class="notice warning" role="status">
      {{ summary.missingRateAccounts.length }} 个账户缺少汇率，暂未计入人民币折算，请补充汇率。
    </div>

    <section v-if="!ledger.accounts.length" class="empty-state">
      <div class="empty-mark">+</div>
      <h2>先添加一个账户</h2>
      <p>账户余额保存在当前浏览器。你可以稍后再连接 OneDrive 备份。</p>
      <button class="primary-button" type="button" @click="emit('newAccount')">新增第一个账户</button>
    </section>

    <div v-else class="workspace">
      <main class="account-column">
        <section class="distribution-panel" aria-labelledby="asset-distribution-heading">
          <div class="section-heading compact">
            <div><h2 id="asset-distribution-heading">资产分布</h2>
              <p>按各资产账户当前最新余额的 CNY 金额计算。</p></div>
          </div>
          <div v-if="assetPieData.length" ref="assetPieRoot" class="asset-pie-chart" role="img"
               aria-label="资产账户分布饼图"/>
          <div v-else class="distribution-empty">暂无可折算的资产余额</div>
        </section>
        <div class="section-heading">
          <div><h2>账户</h2>
            <p>{{ ledger.accounts.filter(account => account.status === 'active').length }} 个启用账户 ·
              汇总取各账户最新记录</p></div>
          <button class="quiet-button" type="button" @click="emit('newAccount')">＋账户</button>
        </div>

        <section v-if="assetRows.length" class="account-group" aria-labelledby="asset-heading">
          <h3 id="asset-heading">资产账户</h3>
          <div class="account-table">
            <div class="account-table-head">
              <span>账户名称</span><span>原币余额</span><span>CNY 金额</span><span>最后更新</span>
            </div>
            <div v-for="row in assetRows" :key="row.account.id" class="account-row"
                 :class="{selected: selectedAccountId === row.account.id, inactive: row.account.status === 'inactive'}"
                 @click="emit('openAccount', row.account)">
              <div class="account-name"><span class="account-dot asset-dot"/> <span>{{ row.account.name }}<small>{{
                  row.account.status === 'inactive' ? '已停用 · 不计入当前汇总' : (row.account.institution || row.account.category)
                }}</small></span></div>
              <span class="amount">{{
                  row.account.status === 'inactive' ? '—' : (row.record ? formatOriginal(row.record.amount, row.account.currency) : '未录入')
                }}</span>
              <span class="cny-amount">{{
                  row.account.status === 'inactive' ? '不计入' : (row.record && row.rate ? formatCny(row.cnyAmount) : '—')
                }}</span>
              <span class="updated" :class="{stale: rowIsStale(row.record?.date)}">{{
                  row.record?.date ?? '未录入'
                }}</span>
            </div>
          </div>
        </section>

        <section v-if="liabilityRows.length" class="account-group liabilities" aria-labelledby="liability-heading">
          <h3 id="liability-heading">负债账户</h3>
          <div class="account-table">
            <div class="account-table-head">
              <span>账户名称</span><span>原币余额</span><span>CNY 金额</span><span>最后更新</span>
            </div>
            <div v-for="row in liabilityRows" :key="row.account.id" class="account-row"
                 :class="{selected: selectedAccountId === row.account.id, inactive: row.account.status === 'inactive'}"
                 @click="emit('openAccount', row.account)">
              <div class="account-name"><span class="account-dot liability-dot"/> <span>{{ row.account.name }}<small
                  v-if="row.account.status === 'inactive'">已停用 · 不计入当前汇总</small><small
                  v-else-if="row.account.installment">剩余 {{ formatCny(installmentBalance(row.account.installment)) }} ·
                  {{ row.account.installment.remainingPeriods }}/{{ row.account.installment.totalPeriods }} 期 · 到期
                  {{ row.account.installment.maturityDate }}</small><small
                  v-else>{{ row.account.institution || row.account.category }}</small></span></div>
              <span class="amount liability-value">{{
                  row.account.status === 'inactive' ? '—' : (row.record ? `-${formatOriginal(row.record.amount, row.account.currency)}` : '未录入')
                }}</span>
              <span class="cny-amount liability-value">{{
                  row.account.status === 'inactive' ? '不计入' : (row.record && row.rate ? `-${formatCny(row.cnyAmount)}` : '—')
                }}</span>
              <span class="updated" :class="{stale: rowIsStale(row.record?.date)}">{{
                  row.record?.date ?? '未录入'
                }}</span>
            </div>
          </div>
        </section>
      </main>
    </div>

    <p class="storage-note">数据保存在当前浏览器 IndexedDB。清除站点数据前，请先下载或备份账本。</p>
  </div>
</template>

<style scoped src="./OverviewView.css"></style>
