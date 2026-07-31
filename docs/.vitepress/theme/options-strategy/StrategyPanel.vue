<script setup lang="ts">
import {computed, ref} from 'vue'
import {formatMoney, formatNumber, formatPercent} from './format'
import ProfitLossChart from './ProfitLossChart.vue'
import type {ExpirationStatistics, ProfitLossPoint, StrategyLeg} from './types'

const props = defineProps<{
  legs: StrategyLeg[]
  statistics: ExpirationStatistics
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
  edit: [code: string, field: 'quantity' | 'entryPrice', value: number]
  remove: [code: string]
  clear: []
  'update:scenarioIv': [value: number]
  'update:scenarioDay': [value: number]
  'update:rangePercent': [value: number]
  'update:riskFreeRate': [value: number]
}>()

const chart = ref<InstanceType<typeof ProfitLossChart> | null>(null)
const estimatedMultiplier = computed(() => props.legs.some(leg => leg.multiplierEstimated))

function inputNumber(event: Event): number {
  return Number((event.target as HTMLInputElement).value)
}

function describeNetCost(): string {
  if (Math.abs(props.statistics.netCost) < 0.005) return '$0'
  return `${formatMoney(Math.abs(props.statistics.netCost))} ${props.statistics.netCost > 0 ? '净支出' : '净收入'}`
}

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
        <p>到期收益与情景理论价格</p>
      </div>
      <button v-if="legs.length" class="text-button danger" type="button" @click="emit('clear')">清空</button>
    </header>

    <div v-if="!legs.length" class="empty-state">
      <strong>还没有策略腿</strong>
      <p>从期权链点击卖价买入，或点击买价卖出。组合的成本、风险和盈亏曲线会在这里实时计算。</p>
    </div>

    <template v-else>
      <dl class="statistics-grid">
        <div>
          <dt>净成本</dt>
          <dd>{{ describeNetCost() }}</dd>
        </div>
        <div>
          <dt>最大盈利</dt>
          <dd>{{ statistics.maxProfit === null ? '无限' : formatMoney(statistics.maxProfit) }}</dd>
        </div>
        <div>
          <dt>最大亏损</dt>
          <dd>{{ statistics.maxLoss === null ? '无限' : formatMoney(statistics.maxLoss) }}</dd>
        </div>
        <div>
          <dt>到期盈亏平衡</dt>
          <dd>{{
              statistics.breakevens.length ? statistics.breakevens.map(value => formatNumber(value)).join(' / ') : '—'
            }}
          </dd>
        </div>
      </dl>

      <div class="legs" aria-label="策略腿">
        <div v-for="leg in legs" :key="leg.code" class="leg-row">
          <div class="leg-name">
            <span :class="leg.quantity > 0 ? 'long' : 'short'">{{ leg.quantity > 0 ? '买' : '卖' }}</span>
            <strong>{{ formatNumber(leg.strike) }} {{ leg.type === 'CALL' ? 'Call' : 'Put' }}</strong>
            <small>IV {{ formatPercent(leg.marketIv) }} · ×{{ leg.multiplier }}{{
                leg.multiplierEstimated ? '*' : ''
              }}</small>
          </div>
          <label>数量<input type="number" step="1" :value="leg.quantity"
                            @change="emit('edit', leg.code, 'quantity', inputNumber($event))"></label>
          <label>成本<input type="number" min="0" step="0.01" :value="leg.entryPrice"
                            @change="emit('edit', leg.code, 'entryPrice', inputNumber($event))"></label>
          <button class="remove-button" type="button" :aria-label="`删除 ${leg.strike} ${leg.type}`"
                  @click="emit('remove', leg.code)">×
          </button>
        </div>
      </div>
      <p v-if="estimatedMultiplier" class="inline-warning">* 合约缺少乘数，暂按 100 计算。</p>

      <div class="chart-heading">
        <div><strong>理论盈亏</strong><small>{{ scenarioDateLabel }} · 标的范围 ±{{ rangePercent }}%</small></div>
        <button class="text-button" type="button" @click="resetRange">重置视图</button>
      </div>
      <ProfitLossChart ref="chart" :points="points" :current-price="currentPrice" :breakevens="statistics.breakevens"/>

      <div class="scenario-controls">
        <label class="range-label" :class="{ disabled: !ivEnabled }">
          <span><strong>日期</strong><output>{{ ivEnabled ? scenarioDateLabel : '仅到期日' }}</output></span>
          <input type="range" min="0" :max="totalDays" step="1" :value="scenarioDay" :disabled="!ivEnabled"
                 @input="emit('update:scenarioDay', inputNumber($event))">
          <small><span>今天</span><span>到期 {{ expiry }}</span></small>
        </label>
        <label class="range-label" :class="{ disabled: !ivEnabled }">
          <span><strong>情景 ATM IV</strong><output>{{
              ivEnabled ? `${formatNumber(scenarioIv, 1)}%` : '无 IV 数据'
            }}</output></span>
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
      <p class="disclosure">未计交易费用。所有最大盈亏与盈亏平衡点均按到期日计算，不会随日期或 IV 滑块变化。</p>
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

.panel-heading {
  min-height: 58px;
  padding: 10px 14px;
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

.panel-heading p {
  margin: 2px 0 0;
  color: var(--vp-c-text-3);
  font-size: 12px;
}

.empty-state {
  padding: 48px 28px;
  text-align: center;
}

.empty-state strong {
  font-size: 15px;
}

.empty-state p {
  max-width: 44ch;
  margin: 8px auto 0;
  color: var(--vp-c-text-2);
  font-size: 13px;
  line-height: 1.7;
}

.statistics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  margin: 0;
  border-bottom: 1px solid var(--vp-c-divider);
}

.statistics-grid div {
  padding: 10px 14px;
  border-right: 1px solid var(--vp-c-divider);
  border-bottom: 1px solid var(--vp-c-divider);
}

.statistics-grid div:nth-child(2n) {
  border-right: 0;
}

.statistics-grid div:nth-last-child(-n+2) {
  border-bottom: 0;
}

dt {
  color: var(--vp-c-text-3);
  font-size: 11px;
}

dd {
  margin: 3px 0 0;
  font-size: 14px;
  font-weight: 650;
  font-variant-numeric: tabular-nums;
}

.legs {
  max-height: 220px;
  overflow: auto;
  border-bottom: 1px solid var(--vp-c-divider);
}

.leg-row {
  display: grid;
  grid-template-columns: minmax(130px, 1fr) 64px 78px 28px;
  gap: 7px;
  align-items: center;
  min-height: 56px;
  padding: 7px 12px;
  border-bottom: 1px solid var(--vp-c-divider);
}

.leg-row:last-child {
  border-bottom: 0;
}

.leg-name {
  min-width: 0;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 2px 6px;
  align-items: center;
}

.leg-name > span {
  grid-row: 1 / 3;
  display: inline-grid;
  width: 24px;
  height: 24px;
  place-items: center;
  border-radius: 5px;
  color: white;
  font-size: 11px;
  font-weight: 700;
}

.leg-name .long {
  background: #19866c;
}

.leg-name .short {
  background: #c24157;
}

.leg-name strong {
  font-size: 12px;
}

.leg-name small {
  overflow: hidden;
  color: var(--vp-c-text-3);
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.leg-row label {
  color: var(--vp-c-text-3);
  font-size: 9px;
}

.leg-row input, .model-settings input {
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
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

.remove-button {
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 5px;
  color: var(--vp-c-text-3);
  background: transparent;
  cursor: pointer;
  font-size: 20px;
}

.remove-button:hover {
  color: var(--vp-c-danger-1);
  background: var(--vp-c-danger-soft);
}

.inline-warning {
  margin: 0;
  padding: 6px 12px;
  color: var(--vp-c-warning-1);
  background: var(--vp-c-warning-soft);
  font-size: 11px;
}

.chart-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px 0;
}

.chart-heading div {
  display: grid;
}

.chart-heading strong {
  font-size: 13px;
}

.chart-heading small {
  color: var(--vp-c-text-3);
  font-size: 10px;
}

.text-button {
  min-height: 30px;
  padding: 0 4px;
  border: 0;
  color: var(--vp-c-brand-1);
  background: transparent;
  cursor: pointer;
  font-size: 12px;
}

.text-button.danger {
  color: var(--vp-c-danger-1);
}

.scenario-controls {
  display: grid;
  gap: 12px;
  padding: 10px 14px 14px;
  border-top: 1px solid var(--vp-c-divider);
}

.range-label > span, .range-label > small {
  display: flex;
  justify-content: space-between;
}

.range-label strong, .range-label output {
  font-size: 11px;
}

.range-label output {
  color: var(--vp-c-brand-1);
  font-variant-numeric: tabular-nums;
}

.range-label input[type='range'] {
  width: 100%;
  margin: 7px 0 3px;
  accent-color: var(--vp-c-brand-2);
}

.range-label small {
  color: var(--vp-c-text-3);
  font-size: 9px;
}

.range-label.disabled {
  opacity: .55;
}

.model-settings {
  padding: 9px 14px;
  border-top: 1px solid var(--vp-c-divider);
  font-size: 11px;
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
  font-size: 10px;
}

@media (max-width: 430px) {
  .leg-row {
    grid-template-columns: minmax(110px, 1fr) 55px 68px 28px;
    padding-inline: 8px;
  }
}
</style>
