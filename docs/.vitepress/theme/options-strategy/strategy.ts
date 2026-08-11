import type {OptionQuote, StrategyLeg} from './types'

/** 解析期权合约乘数，并标记是否使用市场惯例估算。 */
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

/** 按一手买卖操作新增、加仓、减仓或翻转策略腿。 */
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

/** 应用用户对策略腿数量或成本价的手工修改。 */
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

/** 读取当前持仓方向对应的可成交买卖价。 */
function executablePrice(option: OptionQuote, quantity: number): number | null {
    // 买入按卖价、卖出按买价估算真实可成交成本；单边缺报价时不能用另一侧冒充。
    const price = quantity > 0 ? option.ask : option.bid
    return price !== null && Number.isFinite(price) && price >= 0 ? price : null
}

/** 反转指定策略腿的多空方向，并尽量采用新方向报价。 */
export function reverseLeg(
    legs: readonly StrategyLeg[],
    code: string,
    quote?: OptionQuote,
): StrategyLeg[] {
    return legs.map((leg) => {
        if (leg.code !== code) return leg
        const quantity = -leg.quantity
        const price = quote ? executablePrice(quote, quantity) : null
        return {...leg, quantity, entryPrice: price ?? leg.entryPrice, marketIv: quote?.iv ?? leg.marketIv}
    })
}

/** 使用最新合约报价刷新现有策略腿的成本价和隐含波动率。 */
export function refreshLegMarketData(
    legs: readonly StrategyLeg[],
    quotes: ReadonlyMap<string, OptionQuote>,
): StrategyLeg[] {
    // 每次期权链刷新都同步方向对应价格和 IV；缺合约或缺单边报价时保留上次有效值。
    return legs.map((leg) => {
        const quote = quotes.get(leg.code)
        if (!quote) return leg
        const price = executablePrice(quote, leg.quantity)
        return {...leg, entryPrice: price ?? leg.entryPrice, marketIv: quote.iv}
    })
}
