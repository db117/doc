import type {
    ExpirationItem,
    OptionChain,
    OptionChainRow,
    OptionQuote,
    OptionType,
    StockItem,
    UnderlyingQuote,
} from './types'

export type BridgeErrorKind = 'invalid-url' | 'timeout' | 'connection' | 'http' | 'invalid-response'

export class BridgeError extends Error {
    constructor(
        public readonly kind: BridgeErrorKind,
        message: string,
        public readonly status?: number,
    ) {
        super(message)
        this.name = 'BridgeError'
    }
}

type FetchLike = typeof fetch

interface ClientOptions {
    fetchImpl?: FetchLike
    timeoutMs?: number
}

const DEFAULT_TIMEOUT_MS = 15_000

function finiteNumber(value: unknown): number | null {
    const number = typeof value === 'number' ? value : Number(value)
    return Number.isFinite(number) ? number : null
}

function textValue(value: unknown): string {
    return typeof value === 'string' ? value : ''
}

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
        // Futu snapshots expose IV as a percentage, while pricing functions use a decimal.
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

export class FutuBridgeClient {
    readonly baseUrl: string
    private readonly fetchImpl: FetchLike
    private readonly timeoutMs: number

    constructor(baseUrl: string, options: ClientOptions = {}) {
        this.baseUrl = normalizeBaseUrl(baseUrl)
        // Some browser/extension environments enforce Window's Web IDL receiver check.
        this.fetchImpl = (options.fetchImpl ?? globalThis.fetch).bind(globalThis) as FetchLike
        this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
    }

    health(): Promise<{ status: string, opend: string }> {
        return this.get('/health')
    }

    async stocks(type: 'STOCK' | 'ETF'): Promise<StockItem[]> {
        const data = await this.get<Record<string, unknown>>('/api/stocks', {market: 'US', type})
        if (!Array.isArray(data.stocks)) throw new BridgeError('invalid-response', '股票列表格式无效。')
        return data.stocks.flatMap((raw): StockItem[] => {
            if (!raw || typeof raw !== 'object') return []
            const item = raw as Record<string, unknown>
            const code = textValue(item.code)
            if (!code.startsWith('US.') || item.delisting === true) return []
            return [{code, name: textValue(item.name) || code, stockType: type}]
        })
    }

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

    async optionChain(symbol: string, expiry: string): Promise<OptionChain> {
        const data = await this.get<Record<string, unknown>>('/api/option-chain', {symbol, expiry})
        if (!Array.isArray(data.rows)) throw new BridgeError('invalid-response', '期权链格式无效。')

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

    private async get<T>(path: string, params: Record<string, string> = {}): Promise<T> {
        const url = new URL(`${this.baseUrl}${path}`)
        for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), this.timeoutMs)
        try {
            const response = await this.fetchImpl(url, {
                method: 'GET',
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
                    // Keep the status-based message when an upstream error is not JSON.
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
