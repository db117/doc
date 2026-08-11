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

<style scoped>
.strategy-panel {
  min-width: 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg);
  overflow: hidden;
}

.panel-heading, .section-heading, .chart-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel-heading {
  min-height: 58px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--vp-c-divider);
}

h2 {
  margin: 0;
  border: 0;
  font-size: .9375rem;
  line-height: 1.4;
}

.panel-heading p {
  margin: 2px 0 0;
  color: var(--vp-c-text-3);
  font-size: .75rem;
}

.empty-state {
  padding: 52px 28px;
  text-align: center;
}

.empty-state strong {
  font-size: .9375rem;
}

.empty-state p {
  max-width: 58ch;
  margin: 8px auto 0;
  color: var(--vp-c-text-2);
  font-size: .8125rem;
  line-height: 1.7;
}

.statistics-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin: 0;
  border-bottom: 1px solid var(--vp-c-divider);
}

.statistics-grid div {
  min-width: 0;
  padding: 10px 14px;
  border-right: 1px solid var(--vp-c-divider);
}

.statistics-grid div:last-child {
  border-right: 0;
}

dt {
  color: var(--vp-c-text-3);
  font-size: .6875rem;
}

dd {
  margin: 3px 0 0;
  overflow: hidden;
  font-size: .875rem;
  font-weight: 650;
  font-variant-numeric: tabular-nums;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.scope-note {
  margin: 0;
  padding: 7px 14px;
  color: var(--vp-c-text-2);
  background: var(--vp-c-warning-soft);
  font-size: .6875rem;
}

.analysis-grid {
  display: grid;
  grid-template-columns: minmax(360px, 2fr) minmax(520px, 3fr);
  min-width: 0;
}

.legs-column {
  min-width: 0;
  border-right: 1px solid var(--vp-c-divider);
}

.section-heading, .chart-heading {
  min-height: 48px;
  padding: 8px 14px;
  border-bottom: 1px solid var(--vp-c-divider);
}

.section-heading div, .chart-heading div {
  display: grid;
}

.section-heading strong, .chart-heading strong {
  font-size: .8125rem;
}

.section-heading small, .chart-heading small {
  color: var(--vp-c-text-3);
  font-size: .625rem;
}

.leg-groups {
  max-height: 410px;
  overflow: auto;
}

.leg-group + .leg-group {
  border-top: 1px solid var(--vp-c-divider);
}

.leg-group-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 36px;
  padding: 4px 10px 4px 12px;
  background: var(--vp-c-bg-soft);
}

.leg-group-heading button {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 4px 3px;
  border: 0;
  color: var(--vp-c-brand-1);
  background: transparent;
  cursor: pointer;
  font: inherit;
}

.leg-group-heading button:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.leg-group-heading button:focus-visible, .text-button:focus-visible, .remove-button:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
}

.leg-group-heading button strong {
  font-size: .75rem;
}

.leg-group-heading button span, .leg-group-heading > small {
  color: var(--vp-c-text-3);
  font-size: .625rem;
  font-variant-numeric: tabular-nums;
}

.leg-row {
  display: grid;
  grid-template-columns: minmax(130px, 1fr) 64px 78px 28px;
  gap: 7px;
  align-items: center;
  min-height: 56px;
  padding: 7px 12px;
  border-top: 1px solid var(--vp-c-divider);
}

.leg-name {
  min-width: 0;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 2px 6px;
  align-items: center;
}

.direction-button {
  grid-row: 1 / 3;
  display: inline-grid;
  width: 24px;
  height: 24px;
  padding: 0;
  place-items: center;
  border: 0;
  border-radius: 5px;
  color: white;
  cursor: pointer;
  font: inherit;
  font-size: .6875rem;
  font-weight: 700;
  transition: filter 160ms ease-out, transform 160ms ease-out;
}

.leg-name .long { background: #19866c; }
.leg-name .short { background: #c24157; }

.direction-button:hover { filter: brightness(.9); }
.direction-button:active { transform: scale(.92); }
.direction-button:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
}

.leg-name strong { font-size: .75rem; }

.leg-name small {
  overflow: hidden;
  color: var(--vp-c-text-3);
  font-size: .625rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.leg-row label {
  color: var(--vp-c-text-3);
  font-size: .5625rem;
}

.leg-row input, .quote-price, .model-settings input {
  box-sizing: border-box;
  width: 100%;
  height: 28px;
  margin-top: 2px;
  padding: 0 5px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 5px;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg);
  font: inherit;
  font-size: .6875rem;
  font-variant-numeric: tabular-nums;
}

.quote-price {
  display: flex;
  align-items: center;
  cursor: default;
}

.leg-row input:focus-visible, .model-settings input:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 1px;
}

.remove-button {
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 5px;
  color: var(--vp-c-text-3);
  background: transparent;
  cursor: pointer;
  font-size: 1.25rem;
}

.remove-button:hover {
  color: var(--vp-c-danger-1);
  background: var(--vp-c-danger-soft);
}

.chart-column { min-width: 0; }

.text-button {
  min-height: 30px;
  padding: 0 4px;
  border: 0;
  color: var(--vp-c-brand-1);
  background: transparent;
  cursor: pointer;
  font-size: .75rem;
}

.text-button.danger { color: var(--vp-c-danger-1); }

@media (prefers-reduced-motion: reduce) {
  .direction-button { transition: none; }
}

.scenario-controls {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  padding: 10px 14px 14px;
  border-top: 1px solid var(--vp-c-divider);
}

.range-label > span, .range-label > small {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.range-label strong, .range-label output { font-size: .6875rem; }

.range-label output {
  overflow: hidden;
  color: var(--vp-c-brand-1);
  font-variant-numeric: tabular-nums;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.range-label input[type='range'] {
  width: 100%;
  margin: 7px 0 3px;
  accent-color: var(--vp-c-brand-2);
}

.range-label small {
  color: var(--vp-c-text-3);
  font-size: .5625rem;
}

.range-label.disabled { opacity: .55; }

.model-settings {
  padding: 9px 14px;
  border-top: 1px solid var(--vp-c-divider);
  font-size: .6875rem;
}

.model-settings summary {
  cursor: pointer;
  color: var(--vp-c-text-2);
  font-weight: 600;
}

.model-settings label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 9px;
}

.model-settings label span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.model-settings input {
  width: 70px;
  margin: 0;
}

.model-settings p, .disclosure {
  margin: 7px 0 0;
  color: var(--vp-c-text-3);
  line-height: 1.5;
}

.disclosure {
  padding: 0 14px 12px;
  font-size: .625rem;
}

@media (max-width: 1050px) {
  .analysis-grid { grid-template-columns: 1fr; }
  .legs-column { border-right: 0; border-bottom: 1px solid var(--vp-c-divider); }
  .statistics-grid { grid-template-columns: 1fr 1fr; }
  .statistics-grid div:nth-child(2) { border-right: 0; }
  .statistics-grid div:nth-child(-n+2) { border-bottom: 1px solid var(--vp-c-divider); }
}

@media (max-width: 700px) {
  .scenario-controls { grid-template-columns: 1fr; gap: 12px; }
}
</style>
