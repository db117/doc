export type OptionType = 'CALL' | 'PUT'

export interface StockItem {
    code: string
    name: string
    stockType: 'STOCK' | 'ETF'
}

export interface ExpirationItem {
    date: string
    distance: number | null
    cycle: string
}

export interface UnderlyingQuote {
    code: string
    name: string
    updateTime: string
    last: number | null
    bid: number | null
    ask: number | null
    previousClose: number | null
}

export interface OptionQuote {
    code: string
    name: string
    type: OptionType
    strike: number
    updateTime: string
    last: number | null
    bid: number | null
    bidSize: number | null
    ask: number | null
    askSize: number | null
    volume: number | null
    openInterest: number | null
    /** Decimal IV, for example 0.42 means 42%. */
    iv: number | null
    delta: number | null
    gamma: number | null
    vega: number | null
    theta: number | null
    rho: number | null
    contractSize: number | null
    lotSize: number | null
}

export interface OptionChainRow {
    strike: number
    call: OptionQuote | null
    put: OptionQuote | null
}

export interface OptionChain {
    symbol: string
    expiry: string
    underlying: UnderlyingQuote
    rows: OptionChainRow[]
}

export interface StrategyLeg {
    code: string
    name: string
    type: OptionType
    strike: number
    quantity: number
    entryPrice: number
    multiplier: number
    multiplierEstimated: boolean
    marketIv: number | null
}

export interface ExpirationStatistics {
    netCost: number
    maxProfit: number | null
    maxLoss: number | null
    breakevens: number[]
}

export interface ProfitLossPoint {
    price: number
    profitLoss: number
}

