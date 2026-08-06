import {normalizeMonth, normalizeRate, type Currency, type RateSource} from './ledger'

const API_ROOT = 'https://api.frankfurter.dev/v2'

export interface RateResult {
    currency: Exclude<Currency, 'CNY'>
    date: string
    cnyRate: string
    source: RateSource
}

export async function fetchCnyRate(currency: Exclude<Currency, 'CNY'>, date: string): Promise<RateResult> {
    const queryCurrency = currency === 'USDT' ? 'USD' : currency
    const month = normalizeMonth(date)
    const response = await fetch(`${API_ROOT}/rate/${queryCurrency}/CNY?date=${encodeURIComponent(`${month}-01`)}`)
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
