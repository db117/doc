import type {ECharts} from 'echarts'
import type {OptionType} from '../options-strategy/types'
import type {OpenInterestPoint, SurfaceCell, VolatilitySurface} from './surface'

/** ECharts 3D 持仓量柱使用的数据结构。 */
interface OpenInterestBar extends OpenInterestPoint {
    /** ECharts 柱坐标；高度是归一化视觉值，不代表真实 IV 或持仓量单位。 */
    value: [strike: number, dte: number, visualHeight: number]
}

/** 渲染隐含波动率曲面所需的完整界面状态。 */
export interface SurfaceChartInput {
    /** 已整理成矩形网格的 IV 曲面数据。 */
    data: VolatilitySurface
    /** 未归一化的 Call/Put 真实持仓量点。 */
    openInterest: OpenInterestPoint[]
    /** 是否在曲面底部绘制持仓量柱。 */
    showOpenInterest: boolean
    /** Tooltip 和序列名称使用的标准标的代码，例如 `US.SPY`。 */
    selectedSymbol: string
    /** 当前展示的曲面方向。 */
    optionType: OptionType
    /** 是否使用窄屏图表尺寸和精简轴刻度。 */
    compact: boolean
    /** 是否使用深色主题配色。 */
    dark: boolean
}

/** 格式化图表数值，无有效值时显示“暂无”。 */
export function formatNumber(value: number | null, digits = 2): string {
    return value === null || !Number.isFinite(value)
        ? '暂无'
        : new Intl.NumberFormat('zh-CN', {maximumFractionDigits: digits}).format(value)
}

/** 将小数比例格式化为一位百分数。 */
export function formatPercent(value: number): string {
    return `${(value * 100).toFixed(1)}%`
}

/** 生成曲面或持仓量数据点的 Tooltip 内容。 */
function tooltip(
    params: { seriesType?: string, data?: SurfaceCell | OpenInterestBar, value?: number[] },
    selectedSymbol: string,
    optionType: OptionType,
): string {
    if (params.seriesType === 'bar3D') {
        const bar = params.data as OpenInterestBar
        return `<strong>${bar.optionType === 'CALL' ? 'Call' : 'Put'} 持仓量</strong>
      <span>到期日 ${bar.expiry}，剩余 ${bar.dte} 天</span>
      <span>行权价 ${formatNumber(bar.strike)}</span>
      <b>${formatNumber(bar.openInterest, 0)} 张</b>`
    }
    const cell = params.data as SurfaceCell | undefined
    const value = params.value ?? cell?.value
    if (!cell || !value) return ''
    const details = cell.interpolated
        ? '<span>插值点</span>'
        : `<span>持仓量 ${formatNumber(cell.openInterest, 0)}</span><span>成交量 ${formatNumber(cell.volume, 0)}</span><span>Delta ${formatNumber(cell.delta, 3)}</span>`
    return `<strong>${selectedSymbol} ${optionType}</strong>
    <span>到期日 ${cell.expiry}，剩余 ${value[1]} 天</span>
    <span>行权价 ${formatNumber(value[0])}</span>
    <b>隐含波动率 ${formatPercent(value[2])}</b>${details}`
}

/**
 * 将曲面数据翻译为完整的 ECharts GL 配置。
 * Vue 页面只需提供业务状态，不必了解 OI 归一化、3D 布局或暗色主题细节。
 */
export function renderSurfaceChart(chart: Pick<ECharts, 'setOption'>, input: SurfaceChartInput): void {
    const {data, openInterest, showOpenInterest, selectedSymbol, optionType, compact, dark} = input
    const text = dark ? '#d9e2f2' : '#334155'
    const muted = dark ? '#8492a8' : '#64748b'
    const grid = dark ? 'rgba(148, 163, 184, .16)' : 'rgba(100, 116, 139, .18)'
    const surfaceFloor = Math.max(0, data.ivMin - (data.ivMax - data.ivMin || .05) * .18)
    const dtes = data.cells.map(cell => cell.value[1])
    const strikes = [...new Set(data.cells.map(cell => cell.value[0]))].sort((a, b) => a - b)
    const strikeStep = Math.min(...strikes.slice(1).map((strike, index) => strike - strikes[index]).filter(value => value > 0))
    const uniqueDtes = [...new Set(dtes)].sort((a, b) => a - b)
    const dteStep = Math.min(...uniqueDtes.slice(1).map((dte, index) => dte - uniqueDtes[index]).filter(value => value > 0))
    const visibleDtes = new Set(uniqueDtes)
    const interestPoints = showOpenInterest
        ? openInterest.filter(point => visibleDtes.has(point.dte))
        : []
    const maxOpenInterest = Math.max(1, ...interestPoints.map(point => point.openInterest))

    // OI 与 IV 单位不同：柱高只映射到底部 26% 的视觉区，Tooltip 始终展示真实张数。
    const barCeiling = data.ivMin * .26
    const barOffset = (Number.isFinite(strikeStep) ? strikeStep : (data.strikeMax - data.strikeMin) / 20) * .14
    const bars: OpenInterestBar[] = interestPoints.map(point => ({
        ...point,
        value: [
            point.strike + (point.optionType === 'CALL' ? -barOffset : barOffset),
            point.dte,
            point.openInterest / maxOpenInterest * barCeiling,
        ],
    }))
    const hasInterestBars = bars.length > 0
    const floor = hasInterestBars ? 0 : surfaceFloor

    chart.setOption({
        backgroundColor: 'transparent',
        animationDurationUpdate: 450,
        tooltip: {
            formatter: (params: Parameters<typeof tooltip>[0]) => tooltip(params, selectedSymbol, optionType),
            backgroundColor: dark ? '#111827' : '#ffffff',
            borderWidth: 0,
            textStyle: {color: text, fontSize: 12},
            extraCssText: 'box-shadow:0 4px 8px rgba(15,23,42,.16);border-radius:8px;line-height:1.7',
        },
        visualMap: {
            show: true,
            type: 'continuous',
            dimension: 2,
            seriesIndex: 0,
            min: data.ivMin,
            max: data.ivMax,
            right: compact ? 2 : 12,
            top: 'center',
            calculable: false,
            itemWidth: 14,
            itemHeight: compact ? 105 : 150,
            text: [formatPercent(data.ivMax), formatPercent(data.ivMin)],
            textStyle: {color: muted, fontSize: 11},
            inRange: {color: ['#2563eb', '#18b7d8', '#31d4a0', '#e4df4f', '#fb923c', '#ef4444']},
        },
        grid3D: {
            left: compact ? 4 : 44,
            right: compact ? 64 : 104,
            top: 10,
            bottom: 10,
            boxWidth: compact ? 105 : 155,
            boxHeight: compact ? 62 : 72,
            boxDepth: compact ? 72 : 105,
            environment: dark ? '#111827' : '#f8fafc',
            viewControl: {
                projection: 'perspective',
                alpha: 24,
                beta: compact ? -28 : -38,
                distance: compact ? 220 : 205,
                minDistance: 120,
                maxDistance: 320
            },
            light: {main: {intensity: 1.15, shadow: false}, ambient: {intensity: .58}},
            axisPointer: {lineStyle: {color: '#a855f7', width: 1}},
            splitLine: {lineStyle: {color: grid, width: 1}},
        },
        xAxis3D: {
            type: 'value',
            name: '行权价',
            min: data.strikeMin,
            max: data.strikeMax,
            splitNumber: compact ? 3 : 5,
            nameTextStyle: {color: text, fontSize: compact ? 10 : 12},
            axisLabel: {color: muted, fontSize: compact ? 9 : 12, formatter: (value: number) => formatNumber(value, 0)},
            axisLine: {lineStyle: {color: grid}},
            axisTick: {show: false},
        },
        yAxis3D: {
            type: 'value',
            name: '期限',
            min: Math.min(...dtes),
            max: Math.max(...dtes),
            splitNumber: compact ? 2 : 4,
            nameTextStyle: {color: text, fontSize: compact ? 10 : 12},
            axisLabel: {
                color: muted,
                fontSize: compact ? 9 : 12,
                formatter: (value: number) => `${Math.round(value)}天`
            },
            axisLine: {lineStyle: {color: grid}},
            axisTick: {show: false},
        },
        zAxis3D: {
            type: 'value', name: compact ? 'IV' : '隐含波动率', min: floor, splitNumber: compact ? 2 : 5,
            nameTextStyle: {color: text, fontSize: compact ? 10 : 12},
            axisLabel: {
                color: muted,
                fontSize: compact ? 9 : 12,
                formatter: (value: number) => hasInterestBars && value < data.ivMin * .75 ? '' : formatPercent(value),
            },
            axisLine: {lineStyle: {color: grid}}, axisTick: {show: false},
        },
        series: [
            {
                type: 'surface',
                name: `${optionType} IV`,
                data: data.cells,
                dataShape: [data.expiryCount, data.strikeCount],
                shading: 'lambert',
                silent: false,
                wireframe: {
                    show: true,
                    lineStyle: {color: dark ? 'rgba(226,232,240,.14)' : 'rgba(255,255,255,.34)', width: .5}
                },
                itemStyle: {opacity: .95},
            },
            ...(['CALL', 'PUT'] as OptionType[]).flatMap(type => {
                const typeBars = bars.filter(bar => bar.optionType === type)
                return typeBars.length ? [{
                    type: 'bar3D',
                    name: `${type} 持仓量`,
                    data: typeBars,
                    barSize: [
                        (Number.isFinite(strikeStep) ? strikeStep : 1) * .22,
                        (Number.isFinite(dteStep) ? dteStep : 1) * .2,
                    ],
                    shading: 'lambert',
                    itemStyle: {color: type === 'CALL' ? '#19c89a' : '#ff5263', opacity: .92},
                    emphasis: {label: {show: false}},
                }] : []
            }),
            ...(data.spot ? [{
                type: 'line3D', name: '现价', silent: true,
                data: [[data.spot, Math.min(...dtes), floor], [data.spot, Math.max(...dtes), floor]],
                lineStyle: {color: '#a855f7', width: 4, opacity: .9},
            }] : []),
        ],
    }, true)
}
