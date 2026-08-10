import type {ECharts} from 'echarts'
import {describe, expect, it, vi} from 'vitest'
import {renderSurfaceChart} from '../../docs/.vitepress/theme/options-surface/chart'
import type {VolatilitySurface} from '../../docs/.vitepress/theme/options-surface/surface'

const cells: VolatilitySurface['cells'] = [
    [90, 15, .30], [110, 15, .35], [90, 45, .28], [110, 45, .33],
].map(value => ({
    value: value as [number, number, number],
    expiry: value[1] === 15 ? '2026-08-25' : '2026-09-24',
    openInterest: 100,
    volume: 20,
    delta: .5,
    interpolated: false,
}))

describe('surface chart', () => {
    it('renders IV, Call/Put open interest and the spot reference as separate 3D series', () => {
        const setOption = vi.fn()
        const data: VolatilitySurface = {
            cells,
            spot: 100,
            ivMin: .28,
            ivMax: .35,
            strikeMin: 90,
            strikeMax: 110,
            strikeCount: 2,
            expiryCount: 2,
        }

        renderSurfaceChart({setOption} as unknown as Pick<ECharts, 'setOption'>, {
            data,
            openInterest: [
                {strike: 90, dte: 15, expiry: '2026-08-25', optionType: 'CALL', openInterest: 100},
                {strike: 90, dte: 15, expiry: '2026-08-25', optionType: 'PUT', openInterest: 80},
            ],
            showOpenInterest: true,
            selectedSymbol: 'US.SPY',
            optionType: 'CALL',
            compact: false,
            dark: false,
        })

        const option = setOption.mock.calls[0][0] as { series: Array<{ type: string }> }
        expect(option.series.map(series => series.type)).toEqual(['surface', 'bar3D', 'bar3D', 'line3D'])
        expect(setOption).toHaveBeenCalledWith(expect.any(Object), true)
    })
})
