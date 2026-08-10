import {describe, expect, it, vi} from 'vitest'
import {BridgeError, FutuBridgeClient} from '../../docs/.vitepress/theme/options-strategy/bridge-client'

describe('FutuBridgeClient', () => {
    it('normalizes the option chain and converts IV percent to decimal', async () => {
        const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
            symbol: 'US.MU', expiry: '2026-08-03',
            underlying: {code: 'US.MU', name: 'Micron', last_price: 100},
            rows: [{
                strike: 105,
                call: {
                    code: 'US.MU260803C105000', name: 'MU Call', type: 'CALL',
                    bid: 2, ask: 2.2, iv: 55, contract_size: 100,
                },
                put: null,
            }],
        }), {status: 200})) as typeof fetch
        const client = new FutuBridgeClient('http://127.0.0.1:8765/', {fetchImpl})

        const chain = await client.optionChain('US.MU', '2026-08-03')
        expect(chain.underlying.last).toBe(100)
        expect(chain.rows[0].call).toMatchObject({strike: 105, iv: 0.55, contractSize: 100})
        expect(fetchImpl).toHaveBeenCalledWith(
            expect.objectContaining({href: expect.stringContaining('/api/option-chain?')}),
            expect.objectContaining({credentials: 'omit', referrerPolicy: 'no-referrer'}),
        )
    })

    it('filters delisted and malformed stock rows', async () => {
        const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
            stocks: [
                {code: 'US.MU', name: 'Micron', delisting: false},
                {code: 'US.OLD', name: 'Old', delisting: true},
                {code: 'HK.00700', name: 'Tencent', delisting: false},
            ],
        }), {status: 200})) as typeof fetch
        const client = new FutuBridgeClient('http://localhost:8765', {fetchImpl})
        await expect(client.stocks('STOCK')).resolves.toEqual([
            {code: 'US.MU', name: 'Micron', stockType: 'STOCK'},
        ])
    })

    it('keeps failures typed for connection and HTTP states', async () => {
        const http = vi.fn(async () => new Response(JSON.stringify({error: 'OpenD failed'}), {status: 502})) as typeof fetch
        await expect(new FutuBridgeClient('http://localhost:8765', {fetchImpl: http}).health())
            .rejects.toMatchObject({kind: 'http', status: 502, message: 'OpenD failed'})

        const network = vi.fn(async () => {
            throw new TypeError('failed')
        }) as typeof fetch
        await expect(new FutuBridgeClient('http://localhost:8765', {fetchImpl: network}).health())
            .rejects.toBeInstanceOf(BridgeError)
    })

    it('invokes browser fetch with the global object as its receiver', async () => {
        const fetchImpl = vi.fn(async function (this: unknown) {
            if (this !== globalThis) throw new TypeError('Illegal invocation')
            return new Response(JSON.stringify({status: 'ok', opend: '127.0.0.1:11111'}), {status: 200})
        }) as typeof fetch

        await expect(new FutuBridgeClient('http://127.0.0.1:8765', {fetchImpl}).health())
            .resolves.toEqual({status: 'ok', opend: '127.0.0.1:11111'})
    })

    it('loads multiple option chains sequentially and isolates failures', async () => {
        let activeRequests = 0
        let maximumConcurrency = 0
        const fetchImpl = vi.fn(async (input: URL | RequestInfo) => {
            activeRequests++
            maximumConcurrency = Math.max(maximumConcurrency, activeRequests)
            await new Promise(resolve => setTimeout(resolve, 5))
            activeRequests--
            const url = String(input)
            if (url.includes('2026-08-12')) return new Response(JSON.stringify({error: 'rate limited'}), {status: 502})
            const expiry = new URL(url).searchParams.get('expiry') ?? ''
            return new Response(JSON.stringify({symbol: 'US.SPY', expiry, underlying: {}, rows: []}), {status: 200})
        }) as typeof fetch
        const client = new FutuBridgeClient('http://127.0.0.1:8765', {fetchImpl})

        const result = await client.optionChains('US.SPY', ['2026-08-11', '2026-08-12', '2026-08-13'])

        expect(result.chains.map(chain => chain.expiry)).toEqual(['2026-08-11', '2026-08-13'])
        expect(result.failureCount).toBe(1)
        expect(maximumConcurrency).toBe(1)
    })

    it('preserves the first error when every option chain fails', async () => {
        const fetchImpl = vi.fn(async () =>
            new Response(JSON.stringify({error: '获取期权链频率太高，请求失败，每30秒最多10次。'}), {status: 502}),
        ) as typeof fetch
        const client = new FutuBridgeClient('http://127.0.0.1:8765', {fetchImpl})

        await expect(client.optionChains('US.SPY', ['2026-08-11']))
            .rejects.toMatchObject({kind: 'http', message: '获取期权链频率太高，请求失败，每30秒最多10次。'})
    })
})
