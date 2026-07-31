import {describe, expect, it} from 'vitest'
import {adjustLegAtQuote, editLeg, resolveMultiplier} from '../../docs/.vitepress/theme/options-strategy/strategy'
import type {OptionQuote} from '../../docs/.vitepress/theme/options-strategy/types'

const call: OptionQuote = {
    code: 'US.MU260803C900000', name: 'MU 260803 900C', type: 'CALL', strike: 900,
    updateTime: '', last: 2.2, bid: 2.1, bidSize: 10, ask: 2.3, askSize: 12,
    volume: 100, openInterest: 200, iv: 0.8, delta: 0.2, gamma: 0.01,
    vega: 0.1, theta: -0.2, rho: 0.01, contractSize: 100, lotSize: 100,
}

describe('strategy leg state', () => {
    it('adds at ask, averages same-direction entries, and offsets at bid', () => {
        let legs = adjustLegAtQuote([], call, 1, 2)
        legs = adjustLegAtQuote(legs, call, 1, 4)
        expect(legs[0]).toMatchObject({quantity: 2, entryPrice: 3})

        legs = adjustLegAtQuote(legs, call, -1, 2.5)
        expect(legs[0]).toMatchObject({quantity: 1, entryPrice: 3})

        legs = adjustLegAtQuote(legs, call, -1, 2.5)
        expect(legs).toEqual([])
    })

    it('supports direct quantity and cost-basis editing', () => {
        const initial = adjustLegAtQuote([], call, 1, 2)
        expect(editLeg(initial, call.code, {quantity: -3, entryPrice: 1.75})[0])
            .toMatchObject({quantity: -3, entryPrice: 1.75})
        expect(editLeg(initial, call.code, {quantity: 0})).toEqual([])
    })

    it('resolves contract multiplier without hard-coding when data exists', () => {
        expect(resolveMultiplier({...call, contractSize: 50})).toEqual({value: 50, estimated: false})
        expect(resolveMultiplier({...call, contractSize: null, lotSize: 25})).toEqual({value: 25, estimated: false})
        expect(resolveMultiplier({...call, contractSize: null, lotSize: null})).toEqual({value: 100, estimated: true})
    })
})

