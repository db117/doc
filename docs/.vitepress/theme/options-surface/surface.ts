import type {ExpirationItem, OptionChain, OptionQuote, OptionType} from '../options-strategy/types'

export interface SurfaceCell {
    /** ECharts 坐标，依次为行权价、日历日 DTE、以小数保存的 IV。 */
    value: [strike: number, dte: number, iv: number]
    /** 合约到期日，格式为 `YYYY-MM-DD`。 */
    expiry: string
    /** 未平仓合约数；插值点或 OpenD 缺失数据时为 `null`。 */
    openInterest: number | null
    /** 当日成交合约数；插值点或 OpenD 缺失数据时为 `null`。 */
    volume: number | null
    /** 期权 Delta；插值点或 OpenD 缺失数据时为 `null`。 */
    delta: number | null
    /** 是否由相邻行权价的 IV 线性插值得到。 */
    interpolated: boolean
}

export interface VolatilitySurface {
    /** 按到期日、行权价排列的矩形曲面网格。 */
    cells: SurfaceCell[]
    /** 标的最新价；OpenD 未返回有效价格时为 `null`。 */
    spot: number | null
    /** 当前网格中的最低 IV，以小数保存。 */
    ivMin: number
    /** 当前网格中的最高 IV，以小数保存。 */
    ivMax: number
    /** 当前网格的最小行权价。 */
    strikeMin: number
    /** 当前网格的最大行权价。 */
    strikeMax: number
    /** 每个期限包含的行权价数量。 */
    strikeCount: number
    /** 曲面包含的有效到期日数量。 */
    expiryCount: number
}

export interface OpenInterestPoint {
    /** 期权行权价。 */
    strike: number
    /** 距离到期日的日历天数。 */
    dte: number
    /** 合约到期日，格式为 `YYYY-MM-DD`。 */
    expiry: string
    /** 持仓量所属的看涨或看跌方向。 */
    optionType: OptionType
    /** OpenD 返回的真实未平仓合约数。 */
    openInterest: number
}

interface ExpirySlice {
    /** 当前切片的到期日，格式为 `YYYY-MM-DD`。 */
    expiry: string
    /** 当前切片距离到期日的日历天数。 */
    dte: number
    /** 已过滤异常 IV 并按行权价升序排列的单侧报价。 */
    quotes: OptionQuote[]
}

const DAY_MS = 86_400_000
const MAX_IV = 3
// OpenD 的期权链接口每 30 秒最多请求 10 次。
export const MAX_SURFACE_EXPIRIES = 10

export function daysToExpiry(expiry: string, today = new Date()): number {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(expiry)
    if (!match) return 0
    const expiryDay = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    const currentDay = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
    return Math.max(0, Math.round((expiryDay - currentDay) / DAY_MS))
}

export function selectSurfaceExpirations(
    expirations: ExpirationItem[],
    horizonDays: number,
    limit = MAX_SURFACE_EXPIRIES,
    today = new Date(),
): ExpirationItem[] {
    const eligible = expirations
        .map(item => ({item, dte: item.distance ?? daysToExpiry(item.date, today)}))
        .filter(({dte}) => dte > 0 && dte <= horizonDays)
        .sort((a, b) => a.dte - b.dte)
    if (eligible.length <= limit) return eligible.map(({item}) => item)

    // 密集日到期标的按整个 DTE 范围均匀取样，近端和最远端都保留。
    return Array.from({length: limit}, (_, index) =>
        eligible[Math.round(index * (eligible.length - 1) / (limit - 1))].item,
    )
}

function quoteAtStrike(quotes: OptionQuote[], strike: number): Omit<SurfaceCell, 'value' | 'expiry'> | null {
    const exact = quotes.find(quote => quote.strike === strike)
    if (exact?.iv) return {
        openInterest: exact.openInterest,
        volume: exact.volume,
        delta: exact.delta,
        interpolated: false,
    }

    const upperIndex = quotes.findIndex(quote => quote.strike > strike)
    if (upperIndex <= 0) return null
    const lower = quotes[upperIndex - 1]
    const upper = quotes[upperIndex]
    if (!lower.iv || !upper.iv) return null
    return {
        openInterest: null,
        volume: null,
        delta: null,
        interpolated: true,
    }
}

function ivAtStrike(quotes: OptionQuote[], strike: number): number | null {
    const exact = quotes.find(quote => quote.strike === strike)
    if (exact?.iv) return exact.iv
    const upperIndex = quotes.findIndex(quote => quote.strike > strike)
    if (upperIndex <= 0) return null
    const lower = quotes[upperIndex - 1]
    const upper = quotes[upperIndex]
    if (!lower.iv || !upper.iv) return null
    const ratio = (strike - lower.strike) / (upper.strike - lower.strike)
    return lower.iv + (upper.iv - lower.iv) * ratio
}

export function buildVolatilitySurface(
    chains: OptionChain[],
    optionType: OptionType,
    strikeRange = 0.3,
    today = new Date(),
): VolatilitySurface | null {
    const spot = chains.find(chain => chain.underlying.last && chain.underlying.last > 0)?.underlying.last ?? null
    const slices: ExpirySlice[] = chains.flatMap(chain => {
        const quotes = chain.rows
            .map(row => optionType === 'CALL' ? row.call : row.put)
            // OpenD 偶尔会给极端无流动性合约返回异常高 IV；与现有策略情景上限保持一致。
            .filter((quote): quote is OptionQuote => Boolean(quote?.iv && quote.iv > 0 && quote.iv <= MAX_IV))
            .sort((a, b) => a.strike - b.strike)
        return quotes.length >= 2 ? [{expiry: chain.expiry, dte: daysToExpiry(chain.expiry, today), quotes}] : []
    }).sort((a, b) => a.dte - b.dte)
    if (!slices.length) return null

    const dataMin = Math.max(...slices.map(slice => slice.quotes[0].strike))
    const dataMax = Math.min(...slices.map(slice => slice.quotes.at(-1)!.strike))
    const rangeMin = spot ? spot * (1 - strikeRange) : dataMin
    const rangeMax = spot ? spot * (1 + strikeRange) : dataMax
    const strikeMin = Math.max(dataMin, rangeMin)
    const strikeMax = Math.min(dataMax, rangeMax)
    const strikes = [...new Set(slices.flatMap(slice => slice.quotes.map(quote => quote.strike)))]
        .filter(strike => strike >= strikeMin && strike <= strikeMax)
        .sort((a, b) => a - b)
    if (strikes.length < 2) return null

    const cells: SurfaceCell[] = []
    // ponytail: 单期限通常只有百级合约，线性扫描最简单；达到万级点位时再换二分索引。
    for (const slice of slices) {
        for (const strike of strikes) {
            const iv = ivAtStrike(slice.quotes, strike)
            const details = quoteAtStrike(slice.quotes, strike)
            if (iv === null || !details) continue
            cells.push({value: [strike, slice.dte, iv], expiry: slice.expiry, ...details})
        }
    }
    if (!cells.length) return null
    const ivs = cells.map(cell => cell.value[2])
    return {
        cells,
        spot,
        ivMin: Math.min(...ivs),
        ivMax: Math.max(...ivs),
        strikeMin: strikes[0],
        strikeMax: strikes.at(-1)!,
        strikeCount: strikes.length,
        expiryCount: slices.length,
    }
}

export function collectOpenInterest(
    chains: OptionChain[],
    strikeMin: number,
    strikeMax: number,
    today = new Date(),
): OpenInterestPoint[] {
    return chains.flatMap(chain => chain.rows.flatMap(row => {
        if (row.strike < strikeMin || row.strike > strikeMax) return []
        const dte = daysToExpiry(chain.expiry, today)
        return [row.call, row.put].flatMap((quote): OpenInterestPoint[] =>
            quote?.openInterest && quote.openInterest > 0
                ? [{
                    strike: row.strike,
                    dte,
                    expiry: chain.expiry,
                    optionType: quote.type,
                    openInterest: quote.openInterest,
                }]
                : [],
        )
    }))
}
