import {normalizeMonth, todayMonthISO, type Currency} from './ledger'

/** 将金额格式化为指定小数位的千分位文本。 */
function formatAmount(value: string, digits = 2): string {
    const number = Number(value)
    if (!Number.isFinite(number)) return '—'
    return new Intl.NumberFormat('zh-CN', {minimumFractionDigits: digits, maximumFractionDigits: digits}).format(number)
}

/** 将金额格式化为人民币展示文本。 */
export function formatCny(value: string): string {
    return `¥${formatAmount(value)}`
}

/** 将图表坐标轴金额压缩为万或亿单位。 */
export function formatChartAxisCny(value: number): string {
    const absolute = Math.abs(value)
    if (absolute >= 100_000_000) return `¥${(value / 100_000_000).toFixed(1)}亿`
    if (absolute >= 10_000) return `¥${(value / 10_000).toFixed(1)}万`
    return `¥${new Intl.NumberFormat('zh-CN', {maximumFractionDigits: 0}).format(value)}`
}

/** 格式化相邻月份之间的金额和比例变化。 */
export function formatMonthOverMonth(current: string | number, previous?: string | number): string {
    if (previous === undefined) return '暂无上月数据'
    const currentNumber = Number(current)
    const previousNumber = Number(previous)
    if (!Number.isFinite(currentNumber) || !Number.isFinite(previousNumber)) return '—'
    const change = currentNumber - previousNumber
    const sign = change > 0 ? '+' : change < 0 ? '-' : ''
    const amount = `${sign}${formatCny(String(Math.abs(change)))}`
    if (previousNumber === 0) return `${amount}（比例不可计算）`
    const percentage = change / Math.abs(previousNumber) * 100
    return `${amount}（${percentage > 0 ? '+' : ''}${percentage.toFixed(2)}%）`
}

/** 按账户币种格式化原币金额。 */
export function formatOriginal(value: string, currency: Currency): string {
    // USDT 当前按美元符号展示，与汇率层的 USD 等值约定保持一致。
    const symbol = currency === 'USD' || currency === 'USDT' ? '$' : currency === 'HKD' ? 'HK$' : '¥'
    return `${symbol}${formatAmount(value, currency === 'CNY' ? 2 : 4)}`
}

/** 判断余额月份是否早于当前月份。 */
export function rowIsStale(date: string | undefined): boolean {
    // 只比较月份；早于当前月即提示陈旧，不引入具体天数造成误判。
    if (!date) return false
    const [year, month] = normalizeMonth(date).split('-').map(Number)
    const [todayYear, todayMonth] = todayMonthISO().split('-').map(Number)
    return todayYear * 12 + todayMonth - (year * 12 + month) > 0
}
