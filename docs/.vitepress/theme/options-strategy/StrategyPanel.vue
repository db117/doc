<script setup lang="ts">
import {computed, ref} from 'vue'
import {formatMoney, formatNumber, formatPercent} from './format'
import ProfitLossChart from './ProfitLossChart.vue'
import type {ExpirationStatistics, ProfitLossPoint, StrategyLeg} from './types'

const props = defineProps<{
  legs: StrategyLeg[]
  statistics: ExpirationStatistics
  statisticsScope: 'expiry' | 'range'
  points: ProfitLossPoint[]
  currentPrice: number
  currentAtmIv: number | null
  scenarioIv: number
  scenarioIvMax: number
  ivEnabled: boolean
  scenarioDay: number
  totalDays: number
  scenarioDateLabel: string
  expiry: string
  rangePercent: number
  riskFreeRate: number
}>()

const emit = defineEmits<{
  edit: [code: string, field: 'quantity', value: number]
  reverse: [code: string]
  remove: [code: string]
  clear: []
  selectExpiry: [expiry: string]
  'update:scenarioIv': [value: number]
  'update:scenarioDay': [value: number]
  'update:rangePercent': [value: number]
  'update:riskFreeRate': [value: number]
}>()

const chart = ref<InstanceType<typeof ProfitLossChart> | null>(null)
const legGroups = computed(() => {
  // 固定按到期日升序展示，让最早一组与跨期情景截止日保持一致。
  const groups = new Map<string, StrategyLeg[]>()
  for (const leg of props.legs) {
    const group = groups.get(leg.expiry) ?? []
    group.push(leg)
    groups.set(leg.expiry, group)
  }
  return [...groups.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([expiry, legs]) => ({expiry, legs}))
})

/** 从数值输入事件中读取当前值。 */
function inputNumber(event: Event): number {
  return Number((event.target as HTMLInputElement).value)
}

/** 将组合净成本描述为支出或收入。 */
function describeNetCost(): string {
  if (Math.abs(props.statistics.netCost) < 0.005) return '$0'
  return `${formatMoney(Math.abs(props.statistics.netCost))} ${props.statistics.netCost > 0 ? '净支出' : '净收入'}`
}

/** 汇总并描述单个到期日分组的净成本。 */
function groupNetCost(legs: StrategyLeg[]): string {
  // quantity 已带多空符号：正数成本是支出，负数成本是卖权收入。
  const cost = legs.reduce((total, leg) => total + leg.quantity * leg.entryPrice * leg.multiplier, 0)
  if (Math.abs(cost) < 0.005) return '$0'
  return `${formatMoney(Math.abs(cost))} ${cost > 0 ? '支出' : '收入'}`
}

/** 计算到期日距离本地今天的非负天数。 */
function daysToExpiry(expiry: string): number {
  // 与日期栏使用同一“本地中午”口径，避免同一到期日在两处显示不同 DTE。
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const target = new Date(`${expiry}T12:00:00`)
  return Math.max(0, Math.round((target.getTime() - today.getTime()) / 86_400_000))
}

/** 恢复默认情景价格范围和图表缩放。 */
function resetRange(): void {
  emit('update:rangePercent', 12)
  chart.value?.resetZoom()
}
</script>

<template>
  <aside class="strategy-panel" aria-labelledby="strategy-heading">
    <header class="panel-heading">
      <div>
        <h2 id="strategy-heading">策略分析</h2>
        <p v-if="legGroups.length > 1">{{ legs.length }} 条策略腿，跨 {{ legGroups.length }} 个到期日</p>
        <p v-else>到期收益与情景理论价格</p>
      </div>
      <button v-if="legs.length" class="text-button danger" type="button" @click="emit('clear')">清空策略</button>
    </header>

    <div v-if="!legs.length" class="empty-state">
      <strong>还没有策略腿</strong>
      <p>先在上方选择到期日，再从期权链点击卖价买入或点击买价卖出。切换日期不会清空已经添加的腿。</p>
    </div>

    <template v-else>
      <dl class="statistics-grid">
        <div>
          <dt>净成本</dt>
          <dd>{{ describeNetCost() }}</dd>
        </div>
        <div>
          <dt>{{ statisticsScope === 'range' ? '区间最大盈利' : '最大盈利' }}</dt>
          <dd>{{ statistics.maxProfit === null ? '无限' : formatMoney(statistics.maxProfit) }}</dd>
        </div>
        <div>
          <dt>{{ statisticsScope === 'range' ? '区间最大亏损' : '最大亏损' }}</dt>
          <dd>{{ statistics.maxLoss === null ? '无限' : formatMoney(statistics.maxLoss) }}</dd>
        </div>
        <div>
          <dt>{{ statisticsScope === 'range' ? '情景盈亏平衡' : '到期盈亏平衡' }}</dt>
          <dd>{{ statistics.breakevens.length ? statistics.breakevens.map(value => formatNumber(value)).join(' / ') : '—' }}</dd>
        </div>
      </dl>

      <p v-if="statisticsScope === 'range'" class="scope-note">
        跨期组合按最近一腿到期日估值；区间最大值只覆盖当前价格范围。
      </p>

      <div class="analysis-grid">
        <section class="legs-column" aria-label="策略腿">
          <div class="section-heading">
            <div><strong>策略腿</strong><small>点击日期可切回对应期权链</small></div>
          </div>

          <div class="leg-groups">
            <section v-for="group in legGroups" :key="group.expiry" class="leg-group">
              <header class="leg-group-heading">
                <button type="button" @click="emit('selectExpiry', group.expiry)">
                  <strong>{{ group.expiry }}</strong><span>{{ daysToExpiry(group.expiry) }}D</span>
                </button>
                <small>小计 {{ groupNetCost(group.legs) }}</small>
              </header>

              <div v-for="leg in group.legs" :key="leg.code" class="leg-row">
                <div class="leg-name">
                  <button
                      type="button"
                      class="direction-button"
                      :class="leg.quantity > 0 ? 'long' : 'short'"
                      :aria-label="`${leg.strike} ${leg.type} 当前${leg.quantity > 0 ? '买入' : '卖出'}，点击反转为${leg.quantity > 0 ? '卖出' : '买入'}`"
                      :title="`点击反转为${leg.quantity > 0 ? '卖出' : '买入'}`"
                      @click="emit('reverse', leg.code)"
                  >{{ leg.quantity > 0 ? '买' : '卖' }}</button>
                  <strong>{{ formatNumber(leg.strike) }} {{ leg.type === 'CALL' ? 'Call' : 'Put' }}</strong>
                  <small>IV {{ formatPercent(leg.marketIv) }}</small>
                </div>
                <label>数量<input type="number" step="1" :value="leg.quantity"
                                  @change="emit('edit', leg.code, 'quantity', inputNumber($event))"></label>
                <label>价格<output class="quote-price">{{ formatNumber(leg.entryPrice) }}</output></label>
                <button class="remove-button" type="button" :aria-label="`删除 ${leg.expiry} ${leg.strike} ${leg.type}`"
                        @click="emit('remove', leg.code)">×</button>
              </div>
            </section>
          </div>
        </section>

        <section class="chart-column" aria-labelledby="profit-chart-heading">
          <div class="chart-heading">
            <div>
              <strong id="profit-chart-heading">理论盈亏</strong>
              <small>{{ scenarioDateLabel }} · 标的范围 ±{{ rangePercent }}%</small>
            </div>
            <button class="text-button" type="button" @click="resetRange">重置视图</button>
          </div>
          <ProfitLossChart ref="chart" :points="points" :current-price="currentPrice" :breakevens="statistics.breakevens"/>

          <div class="scenario-controls">
            <label class="range-label" :class="{ disabled: !ivEnabled }">
              <span><strong>日期</strong><output>{{ ivEnabled ? scenarioDateLabel : '仅到期日' }}</output></span>
              <input type="range" min="0" :max="totalDays" step="1" :value="scenarioDay" :disabled="!ivEnabled"
                     @input="emit('update:scenarioDay', inputNumber($event))">
              <small><span>今天</span><span>最近到期 {{ expiry }}</span></small>
            </label>
            <label class="range-label" :class="{ disabled: !ivEnabled }">
              <span><strong>情景 ATM IV</strong><output>{{ ivEnabled ? `${formatNumber(scenarioIv, 1)}%` : '无 IV 数据' }}</output></span>
              <input type="range" min="0" :max="scenarioIvMax" step="1" :value="scenarioIv" :disabled="!ivEnabled"
                     @input="emit('update:scenarioIv', inputNumber($event))">
              <small><span>0%</span><span>当前 {{ formatPercent(currentAtmIv) }}</span></small>
            </label>
            <label class="range-label">
              <span><strong>价格范围</strong><output>±{{ rangePercent }}%</output></span>
              <input type="range" min="5" max="100" step="1" :value="rangePercent"
                     @input="emit('update:rangePercent', inputNumber($event))">
              <small><span>±5%</span><span>±100%</span></small>
            </label>
          </div>

          <details class="model-settings">
            <summary>定价模型与参数</summary>
            <label>无风险年利率 <span><input type="number" min="0" max="100" step="0.1" :value="riskFreeRate * 100"
                                             @change="emit('update:riskFreeRate', inputNumber($event) / 100)">%</span></label>
            <p>Bjerksund–Stensland 2002 美式期权模型；分红率暂按 0。模型结果仅用于情景估算。</p>
          </details>
          <p class="disclosure">未计交易费用。跨期情景不会推断最近到期日之后的标的价格路径。</p>
        </section>
      </div>
    </template>
  </aside>
</template>

<style scoped src="./StrategyPanel.css"></style>
