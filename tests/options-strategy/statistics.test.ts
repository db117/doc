import {describe, expect, it} from 'vitest'
import {
    atTheMoneyIv,
    expirationStatistics,
    theoreticalProfitLossCurve,
} from '../../docs/.vitepress/theme/options-strategy/statistics'
import type {StrategyLeg} from '../../docs/.vitepress/theme/options-strategy/types'

function leg(patch: Partial<StrategyLeg>): StrategyLeg {
    return {
        code: 'option', name: 'option', type: 'CALL', strike: 100,
        expiry: '2026-08-07',
        quantity: 1, entryPrice: 5, multiplier: 100, multiplierEstimated: false,
        marketIv: 0.3, ...patch,
    }
}

describe('expiration statistics', () => {
    it('handles unlimited profit for a long call', () => {
        const stats = expirationStatistics([leg({})])
        expect(stats.netCost).toBe(500)
        expect(stats.maxProfit).toBeNull()
        expect(stats.maxLoss).toBe(500)
        expect(stats.breakevens[0]).toBeCloseTo(105)
    })

    it('computes a vertical spread exactly', () => {
        const stats = expirationStatistics([
            leg({code: 'long', strike: 100, quantity: 1, entryPrice: 5}),
            leg({code: 'short', strike: 110, quantity: -1, entryPrice: 2}),
        ])
        expect(stats.netCost).toBe(300)
        expect(stats.maxProfit).toBe(700)
        expect(stats.maxLoss).toBe(300)
        expect(stats.breakevens).toEqual([103])
    })

    it('computes the bounded downside of a short put', () => {
        const stats = expirationStatistics([
            leg({type: 'PUT', quantity: -1, strike: 100, entryPrice: 4}),
        ])
        expect(stats.netCost).toBe(-400)
        expect(stats.maxProfit).toBe(400)
        expect(stats.maxLoss).toBe(9600)
        expect(stats.breakevens).toEqual([96])
    })
})

describe('scenario inputs', () => {
    it('uses the nearest strike and averages valid call and put IV', () => {
        expect(atTheMoneyIv([
            {strike: 95, call: {iv: 0.3}, put: {iv: 0.32}},
            {strike: 100, call: {iv: 0.4}, put: {iv: 0.44}},
        ], 99)).toBeCloseTo(0.42)
    })

    it('keeps the expiry curve independent of IV', () => {
        const legs = [leg({})]
        const lowIv = theoreticalProfitLossCurve({
            legs, minimumPrice: 90, maximumPrice: 110, points: 3,
            scenarioDate: '2026-08-07', currentAtmIv: 0.3, scenarioAtmIv: 0.1,
            riskFreeRate: 0.045, dividendYield: 0,
        })
        const highIv = theoreticalProfitLossCurve({
            legs, minimumPrice: 90, maximumPrice: 110, points: 3,
            scenarioDate: '2026-08-07', currentAtmIv: 0.3, scenarioAtmIv: 1,
            riskFreeRate: 0.045, dividendYield: 0,
        })
        expect(highIv).toEqual(lowIv)
        expect(lowIv.map(point => point.profitLoss)).toEqual([-500, -500, 500])
    })

    it('keeps later-expiring legs alive at the first expiry', () => {
        const points = theoreticalProfitLossCurve({
            legs: [
                leg({code: 'near', type: 'PUT', strike: 100, expiry: '2026-08-07'}),
                leg({code: 'far', type: 'PUT', strike: 105, expiry: '2026-08-14', quantity: -1}),
            ],
            minimumPrice: 100, maximumPrice: 100, points: 2,
            scenarioDate: '2026-08-07', currentAtmIv: 0.3, scenarioAtmIv: 0.3,
            riskFreeRate: 0.045, dividendYield: 0,
        })
        expect(points[0].profitLoss).toBeLessThan(-500)
        expect(points[0].profitLoss).toBeGreaterThan(-1500)
    })
})
