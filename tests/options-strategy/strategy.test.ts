import {describe, expect, it} from 'vitest'
import {
    adjustLegAtQuote,
    editLeg,
    refreshLegMarketData,
    resolveMultiplier,
    reverseLeg,
} from '../../docs/.vitepress/theme/options-strategy/strategy'
import type {OptionQuote} from '../../docs/.vitepress/theme/options-strategy/types'

const call: OptionQuote = {
    code: 'US.MU260803C900000', name: 'MU 260803 900C', type: 'CALL', strike: 900,
    updateTime: '', last: 2.2, bid: 2.1, bidSize: 10, ask: 2.3, askSize: 12,
    volume: 100, openInterest: 200, iv: 0.8, delta: 0.2, gamma: 0.01,
    vega: 0.1, theta: -0.2, rho: 0.01, contractSize: 100, lotSize: 100,
}

describe('strategy leg state', () => {
    it('adds at ask, averages same-direction entries, and offsets at bid', () => {
        let legs = adjustLegAtQuote([], call, 1, 2, '2026-08-03')
        legs = adjustLegAtQuote(legs, call, 1, 4, '2026-08-03')
        expect(legs[0]).toMatchObject({quantity: 2, entryPrice: 3, expiry: '2026-08-03'})

        legs = adjustLegAtQuote(legs, call, -1, 2.5, '2026-08-03')
        expect(legs[0]).toMatchObject({quantity: 1, entryPrice: 3})

        legs = adjustLegAtQuote(legs, call, -1, 2.5, '2026-08-03')
        expect(legs).toEqual([])
    })

    it('supports direct quantity and cost-basis editing', () => {
        const initial = adjustLegAtQuote([], call, 1, 2, '2026-08-03')
        expect(editLeg(initial, call.code, {quantity: -3, entryPrice: 1.75})[0])
            .toMatchObject({quantity: -3, entryPrice: 1.75})
        expect(editLeg(initial, call.code, {quantity: 0})).toEqual([])
    })

    it('reverses direction and switches from ask to bid', () => {
        const initial = adjustLegAtQuote([], call, 1, 2, '2026-08-03')
        const reversed = reverseLeg(initial, call.code, call)
        expect(reversed[0]).toMatchObject({quantity: -1, entryPrice: 2.1, expiry: '2026-08-03'})
        expect(reverseLeg(reversed, call.code, call)[0]).toMatchObject({quantity: 1, entryPrice: 2.3})
    })

    it('syncs live executable prices and isolates missing quotes', () => {
        const long = adjustLegAtQuote([], call, 1, 2, '2026-08-03')
        const short = adjustLegAtQuote([], {...call, code: 'short'}, -1, 2, '2026-08-03')
        const missing = adjustLegAtQuote([], {...call, code: 'missing'}, 1, 1.8, '2026-08-03')
        const quotes = new Map([
            [call.code, {...call, ask: 2.6, iv: 0.85}],
            ['short', {...call, code: 'short', bid: 1.9, iv: 0.75}],
        ])

        const refreshed = refreshLegMarketData([...long, ...short, ...missing], quotes)
        expect(refreshed[0]).toMatchObject({entryPrice: 2.6, marketIv: 0.85})
        expect(refreshed[1]).toMatchObject({entryPrice: 1.9, marketIv: 0.75})
        expect(refreshed[2]).toMatchObject({entryPrice: 1.8, marketIv: 0.8})
    })

    it('resolves contract multiplier without hard-coding when data exists', () => {
        expect(resolveMultiplier({...call, contractSize: 50})).toEqual({value: 50, estimated: false})
        expect(resolveMultiplier({...call, contractSize: null, lotSize: 25})).toEqual({value: 25, estimated: false})
        expect(resolveMultiplier({...call, contractSize: null, lotSize: null})).toEqual({value: 100, estimated: true})
    })
})
