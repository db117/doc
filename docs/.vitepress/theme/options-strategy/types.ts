export type OptionType = 'CALL' | 'PUT'

export interface StockItem {
    /** 富途标准证券代码，例如 `US.SPY`。 */
    code: string
    /** 证券显示名称；数据源缺失时回退为证券代码。 */
    name: string
    /** 当前工具支持的美股正股或 ETF 类型。 */
    stockType: 'STOCK' | 'ETF'
}

export interface ExpirationItem {
    /** 期权到期日，格式为 `YYYY-MM-DD`。 */
    date: string
    /** OpenD 返回的日历日 DTE；字段缺失时为 `null`。 */
    distance: number | null
    /** 交割周期原始值，例如 `WEEK`、`MONTH` 或 `N/A`。 */
    cycle: string
}

export interface UnderlyingQuote {
    /** 标的的富途标准证券代码。 */
    code: string
    /** 标的显示名称。 */
    name: string
    /** OpenD 行情更新时间字符串。 */
    updateTime: string
    /** 最新成交价；无有效行情时为 `null`。 */
    last: number | null
    /** 当前买一价；无有效报价时为 `null`。 */
    bid: number | null
    /** 当前卖一价；无有效报价时为 `null`。 */
    ask: number | null
    /** 上一交易日收盘价；无有效行情时为 `null`。 */
    previousClose: number | null
}

export interface OptionQuote {
    /** 期权合约的富途标准证券代码。 */
    code: string
    /** 期权合约显示名称。 */
    name: string
    /** 合约的看涨或看跌方向。 */
    type: OptionType
    /** 合约行权价。 */
    strike: number
    /** OpenD 行情更新时间字符串。 */
    updateTime: string
    /** 最新成交权利金；无有效行情时为 `null`。 */
    last: number | null
    /** 当前买一权利金；无有效报价时为 `null`。 */
    bid: number | null
    /** 买一档挂单量，沿用 OpenD 返回单位；缺失时为 `null`。 */
    bidSize: number | null
    /** 当前卖一权利金；无有效报价时为 `null`。 */
    ask: number | null
    /** 卖一档挂单量，沿用 OpenD 返回单位；缺失时为 `null`。 */
    askSize: number | null
    /** 当日成交量；OpenD 缺失数据时为 `null`。 */
    volume: number | null
    /** 未平仓合约数；OpenD 缺失数据时为 `null`。 */
    openInterest: number | null
    /** 定价层统一使用小数 IV，例如 0.42 表示 42%；数据源百分数在适配层换算。 */
    iv: number | null
    /** 标的价格变动 1 单位时的理论期权价格变化；缺失时为 `null`。 */
    delta: number | null
    /** 标的价格变动 1 单位时 Delta 的理论变化；缺失时为 `null`。 */
    gamma: number | null
    /** 隐含波动率变化时的理论价格敏感度；缺失时为 `null`。 */
    vega: number | null
    /** 时间流逝时的理论价格敏感度；缺失时为 `null`。 */
    theta: number | null
    /** 利率变化时的理论价格敏感度；缺失时为 `null`。 */
    rho: number | null
    /** 一张合约对应的标的单位数；缺失时为 `null`。 */
    contractSize: number | null
    /** 一手包含的合约数量；缺失时为 `null`。 */
    lotSize: number | null
}

export interface OptionChainRow {
    /** T 型期权链当前行的行权价。 */
    strike: number
    /** 同行权价的 Call 报价；无对应合约时为 `null`。 */
    call: OptionQuote | null
    /** 同行权价的 Put 报价；无对应合约时为 `null`。 */
    put: OptionQuote | null
}

export interface OptionChain {
    /** 期权链所属标的的标准证券代码。 */
    symbol: string
    /** 当前期权链的到期日，格式为 `YYYY-MM-DD`。 */
    expiry: string
    /** 与期权快照尽量同一时点读取的标的行情。 */
    underlying: UnderlyingQuote
    /** 按行权价升序排列的 T 型报价行。 */
    rows: OptionChainRow[]
}

export interface StrategyLeg {
    /** 策略腿对应的期权合约代码。 */
    code: string
    /** 期权合约显示名称。 */
    name: string
    /** 策略腿的看涨或看跌方向。 */
    type: OptionType
    /** 期权合约行权价。 */
    strike: number
    /** 到期日固定为 YYYY-MM-DD；跨期分组和每腿剩余期限都以此为时间边界。 */
    expiry: string
    /** 有符号合约数：正数为买入，负数为卖出。 */
    quantity: number
    /** 当前方向的可成交报价：买入取 Ask，卖出取 Bid；缺报价时保留上次有效值。 */
    entryPrice: number
    /** 一张合约对应的标的单位数，用于换算整张合约金额。 */
    multiplier: number
    /** 合约乘数是否因数据缺失而使用默认值估算。 */
    multiplierEstimated: boolean
    /** 建腿时的市场 IV，以小数保存；行情缺失时为 `null`。 */
    marketIv: number | null
}

export interface ExpirationStatistics {
    /** 组合净支出；正数为支出，负数为收入。 */
    netCost: number
    /** 到期最大盈利；理论上无上限时为 `null`。 */
    maxProfit: number | null
    /** 到期最大亏损；理论上无下限时为 `null`。 */
    maxLoss: number | null
    /** 到期盈亏为零时的标的价格，按升序排列。 */
    breakevens: number[]
}

export interface ProfitLossPoint {
    /** 盈亏曲线横轴的假设标的价格。 */
    price: number
    /** 对应标的价格下的税费前组合盈亏。 */
    profitLoss: number
}
