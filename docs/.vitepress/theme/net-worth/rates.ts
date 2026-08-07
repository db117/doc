import {normalizeMonth, normalizeRate, type Currency, type RateSource} from './ledger'

const API_ROOT = 'https://api.frankfurter.dev/v2'

export interface RateResult {
    /** 用户账户币种；不包含无需查询的 CNY。 */
    currency: Exclude<Currency, 'CNY'>
    /** 汇率归属月份，格式为 `YYYY-MM`。 */
    date: string
    /** 1 单位原币可兑换的 CNY 金额，使用规范化十进制字符串。 */
    cnyRate: string
    /** 汇率来源；USDT 按 USD 查询时为 `usd-default`。 */
    source: RateSource
}

export async function fetchCnyRate(currency: Exclude<Currency, 'CNY'>, date: string): Promise<RateResult> {
    // 账本按月统计，因此固定查询月初汇率；USDT 暂按 USD 等值是当前业务约定。
    const queryCurrency = currency === 'USDT' ? 'USD' : currency
    const month = normalizeMonth(date)
    const response = await fetch(`${API_ROOT}/rate/${queryCurrency}/CNY?date=${encodeURIComponent(`${month}-01`)}`)
    // 这里不重试或静默兜底，调用方会提示用户手动输入，避免保存猜测汇率。
    if (!response.ok) throw new Error(`汇率服务返回 HTTP ${response.status}。`)
    const payload = await response.json() as { date?: string; rate?: number }
    if (typeof payload.rate !== 'number' || !Number.isFinite(payload.rate) || payload.rate <= 0) {
        throw new Error('汇率服务返回了无效数据。')
    }
    return {
        currency,
        date: month,
        cnyRate: normalizeRate(payload.rate),
        source: currency === 'USDT' ? 'usd-default' : 'automatic',
    }
}
