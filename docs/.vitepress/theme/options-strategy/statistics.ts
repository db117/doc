import {americanOptionPrice, intrinsicValue} from './pricing'
import type {ExpirationStatistics, ProfitLossPoint, StrategyLeg,} from './types'

const EPSILON = 1e-7

export function netCost(legs: readonly StrategyLeg[]): number {
    return legs.reduce((total, leg) => total + leg.quantity * leg.entryPrice * leg.multiplier, 0)
}

export function expirationProfitLoss(legs: readonly StrategyLeg[], spot: number): number {
    return legs.reduce((total, leg) => total + leg.quantity * (
        intrinsicValue(leg.type, spot, leg.strike) - leg.entryPrice
    ) * leg.multiplier, 0)
}

export function expirationStatistics(legs: readonly StrategyLeg[]): ExpirationStatistics {
    const cost = netCost(legs)
    if (legs.length === 0) return {netCost: cost, maxProfit: 0, maxLoss: 0, breakevens: []}

    // 仅适用于同到期日：到期收益只会在各行权价处改变斜率，因此可精确求极值和零点。
    const strikes = [...new Set(legs.map(leg => leg.strike))].sort((a, b) => a - b)
    const knots = [0, ...strikes]
    const values = knots.map(price => expirationProfitLoss(legs, price))
    // 最后一个行权价之后只有 Call 继续贡献斜率，用它判断盈利或亏损是否无上界。
    const tailSlope = legs
        .filter(leg => leg.type === 'CALL')
        .reduce((slope, leg) => slope + leg.quantity * leg.multiplier, 0)

    const maxProfit = tailSlope > EPSILON ? null : Math.max(...values)
    const minValue = tailSlope < -EPSILON ? null : Math.min(...values)
    const maxLoss = minValue === null ? null : Math.max(0, -minValue)
    const breakevens: number[] = []

    for (let index = 0; index < knots.length - 1; index += 1) {
        collectLinearRoot(knots[index], values[index], knots[index + 1], values[index + 1], breakevens)
    }
    const tailStart = knots[knots.length - 1]
    const tailValue = values[values.length - 1]
    if (Math.abs(tailValue) <= EPSILON) breakevens.push(tailStart)
    if (Math.abs(tailSlope) > EPSILON) {
        const root = tailStart - tailValue / tailSlope
        if (root > tailStart + EPSILON) breakevens.push(root)
    }

    return {
        netCost: cost,
        maxProfit,
        maxLoss,
        breakevens: deduplicate(breakevens),
    }
}

function collectLinearRoot(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    roots: number[],
): void {
    if (Math.abs(y1) <= EPSILON) roots.push(x1)
    if (y1 * y2 < 0) roots.push(x1 + (x2 - x1) * (-y1) / (y2 - y1))
}

function deduplicate(values: readonly number[]): number[] {
    return [...values].sort((a, b) => a - b).filter((value, index, sorted) => (
        index === 0 || Math.abs(value - sorted[index - 1]) > 1e-5
    ))
}

export function atTheMoneyIv(
    rows: readonly { strike: number, call: { iv: number | null } | null, put: { iv: number | null } | null }[],
    spot: number,
): number | null {
    let bestDistance = Number.POSITIVE_INFINITY
    let best: number | null = null
    for (const row of rows) {
        const values = [row.call?.iv, row.put?.iv]
            .filter((value): value is number => value !== null && value !== undefined && value > 0)
        if (values.length === 0) continue
        const distance = Math.abs(row.strike - spot)
        if (distance < bestDistance) {
            bestDistance = distance
            best = values.reduce((sum, value) => sum + value, 0) / values.length
        }
    }
    return best
}

interface ProfitLossCurveInput {
    legs: readonly StrategyLeg[]
    minimumPrice: number
    maximumPrice: number
    points?: number
    /** 情景日固定为 YYYY-MM-DD；每条腿再按自己的到期日计算剩余期限。 */
    scenarioDate: string
    currentAtmIv: number | null
    scenarioAtmIv: number | null
    riskFreeRate: number
    dividendYield: number
}

export function theoreticalProfitLossCurve(input: ProfitLossCurveInput): ProfitLossPoint[] {
    const count = Math.max(2, Math.trunc(input.points ?? 241))
    const step = (input.maximumPrice - input.minimumPrice) / (count - 1)
    // 情景 IV 按当前 ATM 的比例缩放每条腿 IV，保留已有波动率微笑的相对形状。
    const ivMultiplier = input.currentAtmIv && input.scenarioAtmIv !== null
        ? input.scenarioAtmIv / input.currentAtmIv
        : 1

    return Array.from({length: count}, (_, index) => {
        const price = input.minimumPrice + index * step
        const profitLoss = input.legs.reduce((total, leg) => {
            const timeToExpiry = yearsBetween(input.scenarioDate, leg.expiry)
            const baseIv = leg.marketIv ?? input.currentAtmIv
            // 情景日到达某腿到期日后只剩内在价值；较远到期腿继续按美式模型保留时间价值。
            const value = timeToExpiry <= 0
                ? intrinsicValue(leg.type, price, leg.strike)
                : americanOptionPrice({
                    type: leg.type,
                    spot: price,
                    strike: leg.strike,
                    timeToExpiry,
                    volatility: Math.max(0, (baseIv ?? 0) * ivMultiplier),
                    riskFreeRate: input.riskFreeRate,
                    dividendYield: input.dividendYield,
                })
            return total + leg.quantity * (value - leg.entryPrice) * leg.multiplier
        }, 0)
        return {price, profitLoss}
    })
}

export function curveStatistics(legs: readonly StrategyLeg[], points: readonly ProfitLossPoint[]): ExpirationStatistics {
    // 跨期曲线没有简单的全局封闭解；这里只报告用户当前价格范围内的采样极值和交点。
    if (!points.length) return {netCost: netCost(legs), maxProfit: 0, maxLoss: 0, breakevens: []}
    const values = points.map(point => point.profitLoss)
    const breakevens: number[] = []
    for (let index = 0; index < points.length - 1; index += 1) {
        collectLinearRoot(
            points[index].price,
            points[index].profitLoss,
            points[index + 1].price,
            points[index + 1].profitLoss,
            breakevens,
        )
    }
    return {
        netCost: netCost(legs),
        maxProfit: Math.max(...values),
        maxLoss: Math.max(0, -Math.min(...values)),
        breakevens: deduplicate(breakevens),
    }
}

function yearsBetween(from: string, to: string): number {
    // 使用 UTC 中午消除浏览器时区/DST 差异；无效日期按已到期处理，避免定价函数收到 NaN。
    const fromTime = Date.parse(`${from}T12:00:00Z`)
    const toTime = Date.parse(`${to}T12:00:00Z`)
    if (!Number.isFinite(fromTime) || !Number.isFinite(toTime)) return 0
    return Math.max(0, (toTime - fromTime) / 31_536_000_000)
}
