export type AccountType = 'asset' | 'liability'
export type AccountStatus = 'active' | 'inactive'
export type BalanceMode = 'manual' | 'installment'
export type Currency = 'CNY' | 'USD' | 'HKD' | 'USDT'
export type BalanceSource = 'manual' | 'installment-setup' | 'installment-payment'
export type RateSource = 'automatic' | 'manual' | 'usd-default'

/** 分期负债的当前计划；金额为十进制字符串，日期统一到 `YYYY-MM`。 */
export interface InstallmentPlan {
    periodAmount: string
    totalPeriods: number
    remainingPeriods: number
    nextDueDate: string
    maturityDate: string
}

/** 账本中的账户主数据。停用只影响当前汇总，历史月份仍按生效区间参与计算。 */
export interface Account {
    id: string
    type: AccountType
    name: string
    institution: string
    category: string
    region: string
    currency: Currency
    status: AccountStatus
    balanceMode: BalanceMode
    installment?: InstallmentPlan
    openedOn: string
    inactiveOn?: string
    note: string
    createdAt: string
    updatedAt: string
}

/** 账户月末余额；同一账户同一月份只允许一条，后续录入覆盖旧值。 */
export interface BalanceRecord {
    accountId: string
    date: string
    amount: string
    source: BalanceSource
    updatedAt: string
}

/** 外币对人民币的月度汇率；CNY 固定按 1 处理，因此不落库。 */
export interface ExchangeRate {
    date: string
    currency: Exclude<Currency, 'CNY'>
    cnyRate: string
    source: RateSource
    updatedAt: string
}

/** IndexedDB 与备份文件共用的完整账本结构。 */
export interface Ledger {
    accounts: Account[]
    balances: BalanceRecord[]
    exchangeRates: ExchangeRate[]
    createdAt: string
    updatedAt: string
}

/** 对外导入导出的版本化封套；schemaVersion 用于拒绝不兼容文件。 */
export interface LedgerFile {
    /** 固定文件类型标识，用于排除其他 JSON 文件。 */
    format: 'net-worth-ledger'
    /** 当前固定为 1；不支持的版本会拒绝导入。 */
    schemaVersion: 1
    /** 文件生成时间，ISO 8601 字符串。 */
    exportedAt: string
    /** 通过完整校验后的账本数据。 */
    ledger: Ledger
}

export interface AccountSnapshot {
    account: Account
    record: BalanceRecord | null
    cnyAmount: string
    rate: ExchangeRate | null
    missingRate: boolean
}

export interface LedgerSummary {
    asOf: string
    assetsCny: string
    liabilitiesCny: string
    netWorthCny: string
    snapshots: AccountSnapshot[]
    missingRateAccounts: Account[]
}

// 金额和汇率使用 bigint 定点计算，避免净资产汇总出现二进制浮点误差。
const MONEY_DIGITS = 6
const RATE_DIGITS = 8
const MONEY_SCALE = 10n ** BigInt(MONEY_DIGITS)
const RATE_SCALE = 10n ** BigInt(RATE_DIGITS)

export const CURRENCIES: Currency[] = ['CNY', 'USD', 'HKD', 'USDT']
export const ACCOUNT_CATEGORIES = ['券商', '银行', '现金', '数字资产', '期货/期权', '其他']
export const REGIONS = ['境内', '境外', '香港', '其他']

export function todayISO(): string {
    // 账本按用户本地月份统计，不能使用 UTC 日期截断，否则月初可能落到上月。
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

export function todayMonthISO(): string {
    return todayISO().slice(0, 7)
}

export function normalizeMonth(value: string): string {
    const text = String(value).trim()
    const match = /^(\d{4})-(\d{2})(?:-\d{2})?$/.exec(text)
    if (!match || Number(match[2]) < 1 || Number(match[2]) > 12) throw new Error('月份必须是 YYYY-MM。')
    return `${match[1]}-${match[2]}`
}

export function emptyLedger(now = new Date().toISOString()): Ledger {
    return {accounts: [], balances: [], exchangeRates: [], createdAt: now, updatedAt: now}
}

export function makeLedgerFile(ledger: Ledger, exportedAt = new Date().toISOString()): LedgerFile {
    return {format: 'net-worth-ledger', schemaVersion: 1, exportedAt, ledger: validateLedger(ledger)}
}

export function parseLedgerFile(value: unknown): LedgerFile {
    // 上传文件属于不可信输入：先验证封套版本，再深入校验账本内容。
    if (!value || typeof value !== 'object') throw new Error('备份文件格式无效。')
    const candidate = value as Partial<LedgerFile>
    if (candidate.format !== 'net-worth-ledger' || candidate.schemaVersion !== 1 || typeof candidate.exportedAt !== 'string') {
        throw new Error('备份文件版本不兼容。')
    }
    return {
        format: 'net-worth-ledger',
        schemaVersion: 1,
        exportedAt: candidate.exportedAt,
        ledger: validateLedger(candidate.ledger),
    }
}

function parseScaled(value: string | number, digits: number): bigint {
    // 领域约定余额只存绝对值，资产/负债方向由账户类型表达，不接受负数。
    const text = String(value).trim().replaceAll(',', '')
    if (!/^\d+(?:\.\d+)?$/.test(text)) throw new Error('金额或汇率必须是非负数字。')
    const [whole, fraction = ''] = text.split('.')
    if (fraction.length > digits) throw new Error(`小数最多保留 ${digits} 位。`)
    return BigInt(whole) * 10n ** BigInt(digits) + BigInt(fraction.padEnd(digits, '0') || '0')
}

function formatScaled(value: bigint, digits: number): string {
    const negative = value < 0n
    const absolute = negative ? -value : value
    const scale = 10n ** BigInt(digits)
    const whole = absolute / scale
    const fraction = String(absolute % scale).padStart(digits, '0').replace(/0+$/, '')
    return `${negative ? '-' : ''}${whole}${fraction ? `.${fraction}` : ''}`
}

export function normalizeAmount(value: string | number): string {
    const parsed = parseScaled(value, MONEY_DIGITS)
    return formatScaled(parsed, MONEY_DIGITS)
}

export function normalizeRate(value: string | number): string {
    const parsed = parseScaled(value, RATE_DIGITS)
    if (parsed === 0n) throw new Error('汇率必须大于 0。')
    return formatScaled(parsed, RATE_DIGITS)
}

export function multiplyAmountByRate(amount: string, rate: string): string {
    const amountScaled = parseScaled(amount, MONEY_DIGITS)
    const rateScaled = parseScaled(rate, RATE_DIGITS)
    const rounded = (amountScaled * rateScaled + RATE_SCALE / 2n) / RATE_SCALE
    return formatScaled(rounded, MONEY_DIGITS)
}

export function multiplyAmountByPeriods(amount: string, periods: number): string {
    if (!Number.isInteger(periods) || periods < 0) throw new Error('期数必须是非负整数。')
    return formatScaled(parseScaled(amount, MONEY_DIGITS) * BigInt(periods), MONEY_DIGITS)
}

export function addMoney(a: string, b: string): string {
    return formatScaled(parseScaled(a, MONEY_DIGITS) + parseScaled(b, MONEY_DIGITS), MONEY_DIGITS)
}

export function subtractMoney(a: string, b: string): string {
    return formatScaled(parseScaled(a, MONEY_DIGITS) - parseScaled(b, MONEY_DIGITS), MONEY_DIGITS)
}

export function addCalendarMonth(date: string): string {
    const parts = date.split('-')
    const [year, month, day] = parts.map(Number)
    const target = new Date(Date.UTC(year, month - 1 + 1, 1))
    if (parts.length === 2) return `${target.getUTCFullYear()}-${String(target.getUTCMonth() + 1).padStart(2, '0')}`
    // 完整日期跨月时夹到目标月最后一天，避免 31 日被 Date 自动滚入下下月。
    const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate()
    const nextDay = Math.min(day, lastDay)
    return `${target.getUTCFullYear()}-${String(target.getUTCMonth() + 1).padStart(2, '0')}-${String(nextDay).padStart(2, '0')}`
}

export function calculateMaturityDate(nextDueDate: string, remainingPeriods: number): string {
    if (remainingPeriods <= 0) return nextDueDate
    let result = nextDueDate
    for (let index = 1; index < remainingPeriods; index += 1) result = addCalendarMonth(result)
    return result
}

export function installmentBalance(plan: InstallmentPlan): string {
    return multiplyAmountByPeriods(plan.periodAmount, plan.remainingPeriods)
}

export function accountHasBalances(ledger: Ledger, accountId: string): boolean {
    return ledger.balances.some(record => record.accountId === accountId)
}

export function accountIsEffective(account: Account, asOf: string): boolean {
    // 停用月份起不再计入；停用前的历史快照仍须保留。
    const month = normalizeMonth(asOf)
    if (normalizeMonth(account.openedOn) > month) return false
    return account.status === 'active' || !account.inactiveOn || normalizeMonth(account.inactiveOn) > month
}

export function latestBalance(ledger: Ledger, accountId: string, asOf: string): BalanceRecord | null {
    // 历史汇总采用“截至目标月份的最近记录”，没有要求每月重复录入未变化账户。
    const month = normalizeMonth(asOf)
    return ledger.balances
        .filter(record => record.accountId === accountId && normalizeMonth(record.date) <= month)
        .sort((a, b) => b.date.localeCompare(a.date))[0] ?? null
}

export function rateForRecord(ledger: Ledger, account: Account, record: BalanceRecord): ExchangeRate | null {
    if (account.currency === 'CNY') return {
        date: record.date,
        currency: 'USD',
        cnyRate: '1',
        source: 'manual',
        updatedAt: record.updatedAt,
    }
    // 当前产品约定 USDT 暂按 USD 等值；优先尊重已单独保存的 USDT 汇率。
    return ledger.exchangeRates.find(rate => rate.date === record.date && rate.currency === account.currency)
        ?? (account.currency === 'USDT'
            ? ledger.exchangeRates.find(rate => rate.date === record.date && rate.currency === 'USD') ?? null
            : null)
}

export function summarize(ledger: Ledger, asOf = todayISO()): LedgerSummary {
    // 每个有效账户只取一条最新余额；缺汇率账户保留提示，但不猜测金额进入汇总。
    const snapshots: AccountSnapshot[] = []
    let assetsCny = '0'
    let liabilitiesCny = '0'
    const missingRateAccounts: Account[] = []

    for (const account of ledger.accounts) {
        if (!accountIsEffective(account, asOf)) continue
        const record = latestBalance(ledger, account.id, asOf)
        if (!record) continue
        const rate = rateForRecord(ledger, account, record)
        const missingRate = !rate
        const cnyAmount = rate ? multiplyAmountByRate(record.amount, rate.cnyRate) : '0'
        if (missingRate) missingRateAccounts.push(account)
        snapshots.push({account, record, cnyAmount, rate, missingRate})
        if (account.type === 'asset') assetsCny = addMoney(assetsCny, cnyAmount)
        else liabilitiesCny = addMoney(liabilitiesCny, cnyAmount)
    }

    return {
        asOf,
        assetsCny,
        liabilitiesCny,
        netWorthCny: subtractMoney(assetsCny, liabilitiesCny),
        snapshots,
        missingRateAccounts,
    }
}

export function upsertBalance(
    ledger: Ledger,
    input: Omit<BalanceRecord, 'updatedAt'>,
    now = new Date().toISOString(),
): Ledger {
    // 月份是余额记录的业务主键之一；同月修正必须覆盖，不能制造多条明细。
    const amount = normalizeAmount(input.amount)
    const next = {...ledger, updatedAt: now, balances: [...ledger.balances]}
    const date = normalizeMonth(input.date)
    const index = next.balances.findIndex(record => record.accountId === input.accountId && normalizeMonth(record.date) === date)
    const record = {...input, date, amount, updatedAt: now}
    if (index === -1) next.balances.push(record)
    else next.balances[index] = record
    return next
}

export function upsertExchangeRate(
    ledger: Ledger,
    input: Omit<ExchangeRate, 'updatedAt'>,
    now = new Date().toISOString(),
): Ledger {
    // 汇率同样按“币种 + 月份”唯一，手工修正会替换自动结果。
    const next = {...ledger, updatedAt: now, exchangeRates: [...ledger.exchangeRates]}
    const date = normalizeMonth(input.date)
    const index = next.exchangeRates.findIndex(rate => normalizeMonth(rate.date) === date && rate.currency === input.currency)
    const rate = {...input, date, cnyRate: normalizeRate(input.cnyRate), updatedAt: now}
    if (index === -1) next.exchangeRates.push(rate)
    else next.exchangeRates[index] = rate
    return next
}

export function confirmInstallmentPaid(
    ledger: Ledger,
    accountId: string,
    paymentDate: string,
    now = new Date().toISOString(),
): Ledger {
    const account = ledger.accounts.find(item => item.id === accountId)
    if (!account?.installment || account.balanceMode !== 'installment') throw new Error('该账户不是分期负债。')
    if (account.installment.remainingPeriods <= 0) throw new Error('这笔分期已经结清。')

    // 一次还款同时推进计划并生成当月剩余余额，保持两部分状态一致。
    const installment = {
        ...account.installment,
        remainingPeriods: account.installment.remainingPeriods - 1,
        nextDueDate: addCalendarMonth(account.installment.nextDueDate),
    }
    const next = {
        ...ledger,
        updatedAt: now,
        accounts: ledger.accounts.map(item => item.id === accountId
            ? {...item, installment, updatedAt: now}
            : item),
    }
    return upsertBalance(next, {
        accountId,
        date: paymentDate,
        amount: installmentBalance(installment),
        source: 'installment-payment',
    }, now)
}

export function validateLedger(value: unknown): Ledger {
    // 所有外部文件和 IndexedDB 数据都经过这里，防止坏引用或非法金额进入计算层。
    if (!value || typeof value !== 'object') throw new Error('账本格式无效。')
    const candidate = value as Partial<Ledger>
    if (!Array.isArray(candidate.accounts) || !Array.isArray(candidate.balances) || !Array.isArray(candidate.exchangeRates)) {
        throw new Error('账本缺少必要数据。')
    }
    const accountIds = new Set<string>()
    const accounts: Account[] = []
    for (const account of candidate.accounts) {
        if (!account || typeof account !== 'object' || typeof account.id !== 'string' || accountIds.has(account.id)) {
            throw new Error('账户 ID 无效或重复。')
        }
        accountIds.add(account.id)
        if (!CURRENCIES.includes(account.currency) || !['asset', 'liability'].includes(account.type)) {
            throw new Error('账户类型或币种无效。')
        }
        if (account.type === 'asset' && account.balanceMode === 'installment') throw new Error('资产账户不能使用分期模式。')
        let installment = account.installment
        if (account.balanceMode === 'installment') {
            const plan = account.installment
            if (!plan || !Number.isInteger(plan.totalPeriods) || !Number.isInteger(plan.remainingPeriods)
                || plan.totalPeriods < 1 || plan.remainingPeriods < 0 || plan.remainingPeriods > plan.totalPeriods
            ) {
                throw new Error('分期计划无效。')
            }
            normalizeAmount(plan.periodAmount)
            installment = {
                ...plan,
                nextDueDate: normalizeMonth(plan.nextDueDate),
                maturityDate: normalizeMonth(plan.maturityDate)
            }
        }
        accounts.push({
            ...account,
            openedOn: normalizeMonth(account.openedOn),
            inactiveOn: account.inactiveOn ? normalizeMonth(account.inactiveOn) : undefined,
            installment
        })
    }
    // 兼容早期按日保存的数据：归一到月份后以 updatedAt 较新的记录为准。
    const balanceRecords = new Map<string, { record: BalanceRecord; sourceDate: string }>()
    for (const rawRecord of candidate.balances) {
        const record = rawRecord as BalanceRecord
        if (!record || !accountIds.has(record.accountId)) {
            throw new Error('余额记录无效。')
        }
        const date = normalizeMonth(record.date)
        normalizeAmount(record.amount)
        const key = `${record.accountId}:${date}`
        const current = balanceRecords.get(key)
        if (!current || String(record.updatedAt) > String(current.record.updatedAt)
            || (String(record.updatedAt) === String(current.record.updatedAt) && record.date > current.sourceDate)) {
            balanceRecords.set(key, {record: {...record, date}, sourceDate: record.date})
        }
    }
    // 汇率导入也执行同样的月度去重，避免数组顺序影响最终结果。
    const exchangeRates = new Map<string, { rate: ExchangeRate; sourceDate: string }>()
    for (const rawRate of candidate.exchangeRates) {
        const rate = rawRate as ExchangeRate
        if (!rate || !['USD', 'HKD', 'USDT'].includes(rate.currency)) throw new Error('汇率记录无效。')
        const date = normalizeMonth(rate.date)
        normalizeRate(rate.cnyRate)
        const key = `${rate.currency}:${date}`
        const current = exchangeRates.get(key)
        if (!current || String(rate.updatedAt) > String(current.rate.updatedAt)
            || (String(rate.updatedAt) === String(current.rate.updatedAt) && rate.date > current.sourceDate)) {
            exchangeRates.set(key, {rate: {...rate, date}, sourceDate: rate.date})
        }
    }
    return {
        ...(candidate as Ledger),
        accounts,
        balances: [...balanceRecords.values()].map(item => item.record),
        exchangeRates: [...exchangeRates.values()].map(item => item.rate),
    }
}
