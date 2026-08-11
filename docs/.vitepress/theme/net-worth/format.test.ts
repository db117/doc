import {describe, expect, it} from 'vitest'
import {formatMonthOverMonth} from './format'

describe('formatMonthOverMonth', () => {
    it('格式化环比金额与比例', () => {
        expect(formatMonthOverMonth(102, 100)).toBe('+¥2.00（+2.00%）')
        expect(formatMonthOverMonth(98, 100)).toBe('-¥2.00（-2.00%）')
        expect(formatMonthOverMonth(100)).toBe('暂无上月数据')
        expect(formatMonthOverMonth(100, 0)).toBe('+¥100.00（比例不可计算）')
    })
})
