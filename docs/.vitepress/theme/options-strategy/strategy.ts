import type {OptionQuote, StrategyLeg} from './types'

export function resolveMultiplier(option: OptionQuote): { value: number, estimated: boolean } {
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
): StrategyLeg[] {
    if (!Number.isFinite(price) || price <= 0) return [...legs]
    const index = legs.findIndex(leg => leg.code === option.code)
    if (index < 0) {
        const multiplier = resolveMultiplier(option)
        return [...legs, {
            code: option.code,
            name: option.name,
            type: option.type,
            strike: option.strike,
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

    let entryPrice = current.entryPrice
    if (Math.sign(current.quantity) === Math.sign(quantityDelta)) {
        entryPrice = (
            Math.abs(current.quantity) * current.entryPrice + Math.abs(quantityDelta) * price
        ) / Math.abs(nextQuantity)
    } else if (Math.sign(current.quantity) !== Math.sign(nextQuantity)) {
        entryPrice = price
    }

    return legs.map((leg, legIndex) => legIndex === index
        ? {...leg, quantity: nextQuantity, entryPrice, marketIv: option.iv}
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
    return legs.map((leg) => {
        const quote = quotes.get(leg.code)
        return quote ? {...leg, marketIv: quote.iv} : leg
    })
}

