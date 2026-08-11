/** 按中文数字格式显示固定精度数值，无效值显示占位符。 */
export function formatNumber(value: number | null | undefined, digits = 2): string {
    if (value === null || value === undefined || !Number.isFinite(value)) return '—'
    return new Intl.NumberFormat('zh-CN', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    }).format(value)
}

/** 将大数值格式化为中文紧凑表示。 */
export function formatCompact(value: number | null | undefined): string {
    if (value === null || value === undefined || !Number.isFinite(value)) return '—'
    return new Intl.NumberFormat('zh-CN', {notation: 'compact', maximumFractionDigits: 1}).format(value)
}

/** 将数值格式化为不显示小数位的美元金额。 */
export function formatMoney(value: number): string {
    return new Intl.NumberFormat('zh-CN', {
        style: 'currency',
        currency: 'USD',
        signDisplay: 'auto',
        maximumFractionDigits: 0,
    }).format(value)
}

/** 将小数比例格式化为百分数。 */
export function formatPercent(value: number | null | undefined, digits = 1): string {
    if (value === null || value === undefined || !Number.isFinite(value)) return '—'
    return `${formatNumber(value * 100, digits)}%`
}
