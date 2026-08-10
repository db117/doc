import {describe, expect, it} from 'vitest'
import {
    buildVolatilitySurface,
    collectOpenInterest,
    daysToExpiry,
    selectSurfaceExpirations,
} from '../../docs/.vitepress/theme/options-surface/surface'
import type {OptionChain, OptionQuote, OptionType} from '../../docs/.vitepress/theme/options-strategy/types'

function quote(type: OptionType, strike: number, iv: number): OptionQuote {
    return {
        code: `${type}-${strike}`, name: '', type, strike, iv,
        updateTime: '', last: null, bid: null, bidSize: null, ask: null, askSize: null,
        volume: strike * 10, openInterest: strike * 100, delta: null, gamma: null,
        vega: null, theta: null, rho: null, contractSize: 100, lotSize: 1,
    }
}

function chain(expiry: string, strikes: Array<[number, number]>): OptionChain {
    return {
        symbol: 'US.MU', expiry,
        underlying: {
            code: 'US.MU',
            name: 'Micron',
            updateTime: '',
            last: 100,
            bid: null,
            ask: null,
            previousClose: null
        },
        rows: strikes.map(([strike, iv]) => ({
            strike,
            call: quote('CALL', strike, iv),
            put: quote('PUT', strike, iv + 0.05),
        })),
    }
}

describe('volatility surface', () => {
    it('uses calendar days for DTE', () => {
        expect(daysToExpiry('2026-08-25', new Date(2026, 7, 10, 23, 30))).toBe(15)
    })

    it('builds a rectangular grid and interpolates missing strikes', () => {
        const surface = buildVolatilitySurface([
            chain('2026-08-25', [[80, .6], [100, .4], [120, .55]]),
            chain('2026-09-24', [[80, .58], [110, .44], [120, .53]]),
        ], 'CALL', .3, new Date(2026, 7, 10))

        expect(surface).toMatchObject({spot: 100, strikeMin: 80, strikeMax: 120, expiryCount: 2})
        expect(surface?.cells).toHaveLength(8)
        const interpolated = surface?.cells.find(cell => cell.expiry === '2026-08-25' && cell.value[0] === 110)
        expect(interpolated).toMatchObject({interpolated: true, openInterest: null})
        expect(interpolated?.value.slice(0, 2)).toEqual([110, 15])
        expect(interpolated?.value[2]).toBeCloseTo(.475)
    })

    it('selects the requested option side and removes out-of-range strikes', () => {
        const surface = buildVolatilitySurface([
            chain('2026-08-25', [[60, .8], [80, .6], [100, .4], [120, .55], [140, .7]]),
        ], 'PUT', .2, new Date(2026, 7, 10))

        expect(surface?.cells.map(cell => cell.value[0])).toEqual([80, 100, 120])
        expect(surface?.cells.find(cell => cell.value[0] === 100)?.value[2]).toBeCloseTo(.45)
    })

    it('drops IV values above the shared 300% scenario ceiling', () => {
        const surface = buildVolatilitySurface([
            chain('2026-08-25', [[80, 3.5], [90, .7], [100, .4], [110, .5]]),
        ], 'CALL', .3, new Date(2026, 7, 10))

        expect(surface?.cells.map(cell => cell.value[0])).toEqual([90, 100, 110])
    })

    it('keeps real Call and Put open interest without interpolating it', () => {
        const points = collectOpenInterest([
            chain('2026-08-25', [[80, .6], [100, .4], [120, .55]]),
        ], 90, 110, new Date(2026, 7, 10))

        expect(points).toEqual([
            {strike: 100, dte: 15, expiry: '2026-08-25', optionType: 'CALL', openInterest: 10000},
            {strike: 100, dte: 15, expiry: '2026-08-25', optionType: 'PUT', openInterest: 10000},
        ])
    })

    it('samples dense expirations across the requested DTE horizon', () => {
        const expirations = Array.from({length: 60}, (_, index) => ({
            date: `expiry-${index + 1}`,
            distance: index + 1,
            cycle: 'WEEK',
        }))
        const selected = selectSurfaceExpirations(expirations, 60)

        expect(selected).toHaveLength(10)
        expect(selected[0].distance).toBe(1)
        expect(selected.at(-1)?.distance).toBe(60)
        expect(selectSurfaceExpirations(expirations, 30).at(-1)?.distance).toBe(30)
    })
})
