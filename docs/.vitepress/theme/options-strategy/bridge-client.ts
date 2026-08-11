import type {
    ExpirationItem,
    OptionChain,
    OptionChainRow,
    OptionQuote,
    OptionType,
    StockItem,
    UnderlyingQuote,
} from './types'

/** Bridge 请求失败的稳定错误分类。 */
export type BridgeErrorKind = 'invalid-url' | 'timeout' | 'connection' | 'http' | 'invalid-response'

/** 携带失败分类和可选 HTTP 状态的 Bridge 请求错误。 */
export class BridgeError extends Error {
    /** 创建一个可供界面分类展示的 Bridge 错误。 */
    constructor(
        public readonly kind: BridgeErrorKind,
        message: string,
        public readonly status?: number,
    ) {
        super(message)
        this.name = 'BridgeError'
    }
}

/** 可注入的 fetch 函数类型。 */
type FetchLike = typeof fetch

/** Bridge 客户端的可测试配置。 */
interface ClientOptions {
    /** 替代全局 fetch 的请求实现。 */
    fetchImpl?: FetchLike
    /** 单次请求超时时间，单位为毫秒。 */
    timeoutMs?: number
}

const DEFAULT_TIMEOUT_MS = 15_000

/** 将未知值归一为有限数值，无效值返回 `null`。 */
function finiteNumber(value: unknown): number | null {
    // Bridge 字段可能为空或为字符串；非法值归一为 null，避免 NaN 扩散到表格和定价模型。
    const number = typeof value === 'number' ? value : Number(value)
    return Number.isFinite(number) ? number : null
}

/** 将未知值归一为空安全字符串。 */
function textValue(value: unknown): string {
    return typeof value === 'string' ? value : ''
}

/** 校验并规范化 Bridge HTTP(S) 根地址。 */
function normalizeBaseUrl(value: string): string {
    let url: URL
    try {
        url = new URL(value)
    } catch {
        throw new BridgeError('invalid-url', 'Bridge 地址无效。')
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new BridgeError('invalid-url', 'Bridge 地址必须使用 HTTP 或 HTTPS。')
    }
    return url.href.replace(/\/$/, '')
}

/** 将 Bridge 原始合约数据转换为期权报价。 */
function optionQuote(raw: unknown, strike: number): OptionQuote | null {
    if (!raw || typeof raw !== 'object') return null
    const item = raw as Record<string, unknown>
    const code = textValue(item.code)
    const type = textValue(item.type).toUpperCase() as OptionType
    if (!code || (type !== 'CALL' && type !== 'PUT')) return null

    const rawIv = finiteNumber(item.iv)
    return {
        code,
        name: textValue(item.name),
        type,
        strike,
        updateTime: textValue(item.update_time),
        last: finiteNumber(item.last),
        bid: finiteNumber(item.bid),
        bidSize: finiteNumber(item.bid_size),
        ask: finiteNumber(item.ask),
        askSize: finiteNumber(item.ask_size),
        volume: finiteNumber(item.volume),
        openInterest: finiteNumber(item.open_interest),
        // Futu 快照的 IV 是百分数，定价层统一使用小数；换算只在数据适配边界做一次。
        iv: rawIv !== null && rawIv > 0 ? rawIv / 100 : null,
        delta: finiteNumber(item.delta),
        gamma: finiteNumber(item.gamma),
        vega: finiteNumber(item.vega),
        theta: finiteNumber(item.theta),
        rho: finiteNumber(item.rho),
        contractSize: finiteNumber(item.contract_size),
        lotSize: finiteNumber(item.lot_size),
    }
}

/** 将 Bridge 原始标的数据转换为标的报价。 */
function underlyingQuote(raw: unknown): UnderlyingQuote {
    const item = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {}
    return {
        code: textValue(item.code),
        name: textValue(item.name),
        updateTime: textValue(item.update_time),
        last: finiteNumber(item.last_price),
        bid: finiteNumber(item.bid_price),
        ask: finiteNumber(item.ask_price),
        previousClose: finiteNumber(item.prev_close_price),
    }
}

/** 访问本机只读富途行情 Bridge 的浏览器客户端。 */
export class FutuBridgeClient {
    readonly baseUrl: string
    private readonly fetchImpl: FetchLike
    private readonly timeoutMs: number

    /** 创建并校验一个 Bridge 客户端。 */
    constructor(baseUrl: string, options: ClientOptions = {}) {
        this.baseUrl = normalizeBaseUrl(baseUrl)
        // 部分浏览器/扩展会校验 Window 接收者，绑定 globalThis 以兼容原生 fetch 和测试注入。
        this.fetchImpl = (options.fetchImpl ?? globalThis.fetch).bind(globalThis) as FetchLike
        this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
    }

    /** 检查 Bridge 与 OpenD 的健康状态。 */
    health(): Promise<{ status: string, opend: string }> {
        return this.get('/health')
    }

    /** 获取可选的美股正股或 ETF 列表。 */
    async stocks(type: 'STOCK' | 'ETF'): Promise<StockItem[]> {
        const data = await this.get<Record<string, unknown>>('/api/stocks', {market: 'US', type})
        if (!Array.isArray(data.stocks)) throw new BridgeError('invalid-response', '股票列表格式无效。')
        // 前端仅支持美股且不允许选择已退市标的，异常记录在适配层隔离，不污染搜索列表。
        return data.stocks.flatMap((raw): StockItem[] => {
            if (!raw || typeof raw !== 'object') return []
            const item = raw as Record<string, unknown>
            const code = textValue(item.code)
            if (!code.startsWith('US.') || item.delisting === true) return []
            return [{code, name: textValue(item.name) || code, stockType: type}]
        })
    }

    /** 获取指定标的的期权到期日列表。 */
    async expirations(symbol: string): Promise<ExpirationItem[]> {
        const data = await this.get<Record<string, unknown>>('/api/option-expirations', {symbol})
        if (!Array.isArray(data.expirations)) throw new BridgeError('invalid-response', '到期日格式无效。')
        return data.expirations.flatMap((raw): ExpirationItem[] => {
            if (!raw || typeof raw !== 'object') return []
            const item = raw as Record<string, unknown>
            const date = textValue(item.strike_time)
            if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return []
            return [{
                date,
                distance: finiteNumber(item.option_expiry_date_distance),
                cycle: textValue(item.expiration_cycle),
            }]
        })
    }

    /** 获取指定标的和到期日的完整期权链。 */
    async optionChain(symbol: string, expiry: string): Promise<OptionChain> {
        const data = await this.get<Record<string, unknown>>('/api/option-chain', {symbol, expiry})
        if (!Array.isArray(data.rows)) throw new BridgeError('invalid-response', '期权链格式无效。')

        // 丢弃无效行权价并在入口统一升序，虚拟列表、现价定位和 T 型展示都依赖该顺序。
        const rows: OptionChainRow[] = data.rows.flatMap((raw): OptionChainRow[] => {
            if (!raw || typeof raw !== 'object') return []
            const item = raw as Record<string, unknown>
            const strike = finiteNumber(item.strike)
            if (strike === null || strike <= 0) return []
            return [{strike, call: optionQuote(item.call, strike), put: optionQuote(item.put, strike)}]
        }).sort((a, b) => a.strike - b.strike)

        return {
            symbol: textValue(data.symbol) || symbol,
            expiry: textValue(data.expiry) || expiry,
            underlying: underlyingQuote(data.underlying),
            rows,
        }
    }

    /** 顺序读取多个到期日的期权链并统计失败数量。 */
    async optionChains(symbol: string, expiries: string[]): Promise<{ chains: OptionChain[], failureCount: number }> {
        const chains: OptionChain[] = []
        let failureCount = 0
        let firstError: unknown
        // OpenD 的完整期权链很重，顺序读取避免密集到期标的并发争抢同一个行情上下文。
        for (const expiry of expiries) {
            try {
                chains.push(await this.optionChain(symbol, expiry))
            } catch (error) {
                firstError ??= error
                failureCount++
            }
        }
        if (!chains.length && firstError) throw firstError
        return {chains, failureCount}
    }

    /** 发起带超时和统一错误映射的只读 GET 请求。 */
    private async get<T>(path: string, params: Record<string, string> = {}): Promise<T> {
        // 单次请求不自动重试；重试和定时刷新由页面统一控制，避免故障时成倍压垮本机 Bridge。
        const url = new URL(`${this.baseUrl}${path}`)
        for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), this.timeoutMs)
        try {
            const response = await this.fetchImpl(url, {
                method: 'GET',
                // Bridge 是只读本机接口，不携带站点凭据和来源信息，避免跨域泄露。
                credentials: 'omit',
                referrerPolicy: 'no-referrer',
                signal: controller.signal,
            })
            if (!response.ok) {
                let detail = `本地行情服务返回 ${response.status}。`
                try {
                    const body = await response.json() as { error?: unknown }
                    if (typeof body.error === 'string' && body.error.trim()) detail = body.error
                } catch {
                    // 上游错误不保证 JSON；解析失败时保留 HTTP 状态，不能让二次异常遮住原失败。
                }
                throw new BridgeError('http', detail, response.status)
            }
            try {
                return await response.json() as T
            } catch {
                throw new BridgeError('invalid-response', '本地行情服务返回了无效 JSON。')
            }
        } catch (error) {
            if (error instanceof BridgeError) throw error
            if (error instanceof DOMException && error.name === 'AbortError') {
                throw new BridgeError('timeout', '连接本地行情服务超时。')
            }
            throw new BridgeError('connection', '无法连接本地行情服务。')
        } finally {
            clearTimeout(timer)
        }
    }
}
