import {describe, expect, it} from 'vitest'
import {
    americanOptionPrice,
    europeanOptionPrice,
    intrinsicValue,
    normalCdf,
} from '../../docs/.vitepress/theme/options-strategy/pricing'

describe('option pricing', () => {
    it('matches standard normal and Black-Scholes reference values', () => {
        expect(normalCdf(0)).toBeCloseTo(0.5, 7)
        expect(normalCdf(1.96)).toBeCloseTo(0.975, 3)

        const call = europeanOptionPrice({
            type: 'CALL', spot: 100, strike: 100, timeToExpiry: 1,
            volatility: 0.2, riskFreeRate: 0.05, dividendYield: 0,
        })
        expect(call).toBeCloseTo(10.4506, 3)
    })

    it('prices a no-dividend American call like its European equivalent', () => {
        const input = {
            type: 'CALL' as const, spot: 100, strike: 100, timeToExpiry: 1,
            volatility: 0.2, riskFreeRate: 0.05, dividendYield: 0,
        }
        expect(americanOptionPrice(input)).toBeCloseTo(europeanOptionPrice(input), 5)
    })

    it('includes the early-exercise premium for an American put', () => {
        const input = {
            type: 'PUT' as const, spot: 100, strike: 100, timeToExpiry: 1,
            volatility: 0.2, riskFreeRate: 0.05, dividendYield: 0,
        }
        const european = europeanOptionPrice(input)
        const american = americanOptionPrice(input)
        expect(american).toBeGreaterThan(european)
        expect(american).toBeGreaterThan(6)
        expect(american).toBeLessThan(6.5)
    })

    it('uses intrinsic value at expiry and never returns less than intrinsic value', () => {
        expect(americanOptionPrice({
            type: 'PUT', spot: 80, strike: 100, timeToExpiry: 0,
            volatility: 0.4, riskFreeRate: 0.045, dividendYield: 0,
        })).toBe(20)
        expect(intrinsicValue('CALL', 120, 100)).toBe(20)
    })
})

