import type {OptionQuote, StrategyLeg} from './types'

export function resolveMultiplier(option: OptionQuote): { value: number, estimated: boolean } {
    // 数据源优先级固定为合约乘数、每手数量、市场惯例 100；兜底值必须显式标记为估算。
    if (option.contractSize !== null && option.contractSize > 0) {
        return {value: option.contractSize, estimated: false}
    }
    if (option.lotSize !== null && option.lotSize > 0) {
        return {value: option.lotSize, estimated: false}
    }
    return {value: 100, estimated: true}
}

export function adjustLegAtQuote(
    legs: readonly StrategyLeg[],
    option: OptionQuote,
    quantityDelta: 1 | -1,
    price: number,
    expiry: string,
): StrategyLeg[] {
    if (!Number.isFinite(price) || price <= 0) return [...legs]
    // 合约代码是策略腿唯一键；同一合约的连续点击合并数量，不制造重复腿。
    const index = legs.findIndex(leg => leg.code === option.code)
    if (index < 0) {
        const multiplier = resolveMultiplier(option)
        return [...legs, {
            code: option.code,
            name: option.name,
            type: option.type,
            strike: option.strike,
            expiry,
            quantity: quantityDelta,
            entryPrice: price,
            multiplier: multiplier.value,
            multiplierEstimated: multiplier.estimated,
            marketIv: option.iv,
        }]
    }

    const current = legs[index]
    const nextQuantity = current.quantity + quantityDelta
    if (nextQuantity === 0) return legs.filter((_, legIndex) => legIndex !== index)

    // 同方向加仓按数量加权；反向只减仓，只有越过零轴翻仓时才以本次报价作为新成本。
    let entryPrice = current.entryPrice
    if (Math.sign(current.quantity) === Math.sign(quantityDelta)) {
        entryPrice = (
            Math.abs(current.quantity) * current.entryPrice + Math.abs(quantityDelta) * price
        ) / Math.abs(nextQuantity)
    } else if (Math.sign(current.quantity) !== Math.sign(nextQuantity)) {
        entryPrice = price
    }

    return legs.map((leg, legIndex) => legIndex === index
        ? {...leg, quantity: nextQuantity, entryPrice, marketIv: option.iv, expiry}
        : leg)
}

export function editLeg(
    legs: readonly StrategyLeg[],
    code: string,
    patch: Partial<Pick<StrategyLeg, 'quantity' | 'entryPrice'>>,
): StrategyLeg[] {
    return legs.flatMap((leg): StrategyLeg[] => {
        if (leg.code !== code) return [leg]
        const quantity = patch.quantity === undefined ? leg.quantity : Math.trunc(patch.quantity)
        const entryPrice = patch.entryPrice === undefined ? leg.entryPrice : patch.entryPrice
        if (!Number.isFinite(quantity) || quantity === 0) return []
        if (!Number.isFinite(entryPrice) || entryPrice < 0) return [leg]
        return [{...leg, quantity, entryPrice}]
    })
}

export function refreshLegMarketIv(
    legs: readonly StrategyLeg[],
    quotes: ReadonlyMap<string, OptionQuote>,
): StrategyLeg[] {
    // 行情刷新只更新估值输入 IV，不重写用户已经形成或编辑的建仓成本。
    return legs.map((leg) => {
        const quote = quotes.get(leg.code)
        return quote ? {...leg, marketIv: quote.iv} : leg
    })
}
