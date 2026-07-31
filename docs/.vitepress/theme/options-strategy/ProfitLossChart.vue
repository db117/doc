<script setup lang="ts">
import {computed, nextTick, onBeforeUnmount, onMounted, ref, watch} from 'vue'
import {useData} from 'vitepress'
import type {ECharts, EChartsCoreOption} from 'echarts/core'
import {init, use} from 'echarts/core'
import {LineChart} from 'echarts/charts'
import {DataZoomComponent, GridComponent, MarkLineComponent, TooltipComponent} from 'echarts/components'
import {CanvasRenderer} from 'echarts/renderers'
import {formatMoney, formatNumber} from './format'
import type {ProfitLossPoint} from './types'

use([LineChart, GridComponent, TooltipComponent, DataZoomComponent, MarkLineComponent, CanvasRenderer])

const props = defineProps<{
  points: ProfitLossPoint[]
  currentPrice: number
  breakevens: number[]
}>()

const root = ref<HTMLElement | null>(null)
const {isDark} = useData()
let chart: ECharts | undefined
let observer: ResizeObserver | undefined
const reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const option = computed<EChartsCoreOption>(() => ({
  animation: !reducedMotion,
  animationDuration: 180,
  backgroundColor: 'transparent',
  grid: {top: 18, right: 14, bottom: 38, left: 58, containLabel: false},
  tooltip: {
    trigger: 'axis',
    confine: true,
    backgroundColor: isDark.value ? '#202425' : '#ffffff',
    borderColor: isDark.value ? '#454b4d' : '#d7dddc',
    textStyle: {color: isDark.value ? '#e7e9e8' : '#202524', fontSize: 12},
    formatter: (items: unknown) => {
      const item = Array.isArray(items)
          ? (items as { value?: [number, number | null] }[]).find(candidate => candidate.value?.[1] !== null)
          : undefined
      const value = item?.value
      return value && value[1] !== null ? `标的价格 ${formatNumber(value[0])}<br>理论盈亏 <b>${formatMoney(value[1])}</b>` : ''
    },
  },
  xAxis: {
    type: 'value',
    scale: true,
    axisLine: {lineStyle: {color: isDark.value ? '#555d5b' : '#cfd6d4'}},
    axisLabel: {color: isDark.value ? '#a9b0ae' : '#68716f', formatter: (value: number) => formatNumber(value, 0)},
    splitLine: {show: false},
  },
  yAxis: {
    type: 'value',
    axisLabel: {
      color: isDark.value ? '#a9b0ae' : '#68716f',
      formatter: (value: number) => `$${Intl.NumberFormat('en', {notation: 'compact'}).format(value)}`
    },
    splitLine: {lineStyle: {color: isDark.value ? '#303635' : '#edf0ef'}},
  },
  dataZoom: [{
    type: 'inside',
    filterMode: 'none',
    zoomOnMouseWheel: true,
    moveOnMouseMove: true,
    moveOnMouseWheel: false
  }],
  series: [
    {
      name: '盈利',
      type: 'line',
      data: props.points.map(point => [point.price, point.profitLoss >= 0 ? point.profitLoss : null]),
      showSymbol: false,
      connectNulls: false,
      lineStyle: {width: 2, color: '#1b9a72'},
      areaStyle: {color: '#1b9a72', opacity: isDark.value ? 0.1 : 0.12},
      markLine: {
        silent: true,
        symbol: ['none', 'none'],
        label: {color: isDark.value ? '#b7bfbd' : '#5b6562', fontSize: 10},
        data: [
          {yAxis: 0, label: {show: false}, lineStyle: {color: isDark.value ? '#67706e' : '#aeb7b5', type: 'solid'}},
          {
            xAxis: props.currentPrice,
            name: `现价 ${formatNumber(props.currentPrice)}`,
            lineStyle: {color: '#2f9e93', type: 'dashed'}
          },
          ...props.breakevens.map(price => ({
            xAxis: price,
            name: `盈亏平衡 ${formatNumber(price)}`,
            lineStyle: {color: '#c58a27', type: 'dotted'}
          })),
        ],
      },
    },
    {
      name: '亏损',
      type: 'line',
      data: props.points.map(point => [point.price, point.profitLoss <= 0 ? point.profitLoss : null]),
      showSymbol: false,
      connectNulls: false,
      lineStyle: {width: 2, color: '#d64c63'},
      areaStyle: {color: '#d64c63', opacity: isDark.value ? 0.1 : 0.12},
    },
  ],
}))

function render(): void {
  if (!root.value) return
  if (!chart) chart = init(root.value, undefined, {renderer: 'canvas'})
  chart.setOption(option.value, {notMerge: true, lazyUpdate: true})
}

function resetZoom(): void {
  chart?.dispatchAction({type: 'dataZoom', start: 0, end: 100})
}

watch(option, () => nextTick(render), {deep: true})
onMounted(() => {
  render()
  if (root.value) {
    observer = new ResizeObserver(() => chart?.resize())
    observer.observe(root.value)
  }
})
onBeforeUnmount(() => {
  observer?.disconnect()
  chart?.dispose()
})

defineExpose({resetZoom})
</script>

<template>
  <div ref="root" class="profit-chart" role="img" aria-label="策略理论盈亏曲线，可使用鼠标滚轮缩放并拖动平移"/>
</template>

<style scoped>
.profit-chart {
  width: 100%;
  height: 280px;
}

@media (max-width: 540px) {
  .profit-chart {
    height: 240px;
  }
}
</style>
