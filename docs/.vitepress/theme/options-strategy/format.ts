export function formatNumber(value: number | null | undefined, digits = 2): string {
    if (value === null || value === undefined || !Number.isFinite(value)) return '—'
    return new Intl.NumberFormat('zh-CN', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    }).format(value)
}

export function formatCompact(value: number | null | undefined): string {
    if (value === null || value === undefined || !Number.isFinite(value)) return '—'
    return new Intl.NumberFormat('zh-CN', {notation: 'compact', maximumFractionDigits: 1}).format(value)
}

export function formatMoney(value: number): string {
    return new Intl.NumberFormat('zh-CN', {
        style: 'currency',
        currency: 'USD',
        signDisplay: 'auto',
        maximumFractionDigits: 0,
    }).format(value)
}

export function formatPercent(value: number | null | undefined, digits = 1): string {
    if (value === null || value === undefined || !Number.isFinite(value)) return '—'
    return `${formatNumber(value * 100, digits)}%`
}
