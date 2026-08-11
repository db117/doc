export type AccountType = 'asset' | 'liability'
export type AccountStatus = 'active' | 'inactive'
export type BalanceMode = 'manual' | 'installment'
export type Currency = 'CNY' | 'USD' | 'HKD' | 'USDT'
export type InstallmentStatus = 'active' | 'completed' | 'terminated' | 'overdue'
export type InstallmentDueState = 'scheduled' | 'pending' | InstallmentStatus
export type BalanceSource =
    'manual'
    | 'installment-setup'
    | 'installment-confirmation'
    | 'installment-backfill'
    | 'installment-correction'
    | 'installment-termination'
export type RateSource = 'automatic' | 'manual' | 'usd-default'

/** 分期负债账户下的等额月供项目；金额为十进制字符串，月份统一到 `YYYY-MM`。 */
export interface InstallmentPlan {
    /** 分期项目的全局唯一标识。 */
    id: string
    /** 用户可识别的分期名称。 */
    name: string
    /** 每期应还金额，使用规范化十进制字符串。 */
    periodAmount: string
    /** 合同约定的总期数。 */
    totalPeriods: number
    /** 当前尚未处理的剩余期数。 */
    remainingPeriods: number
    /** 分期开始计入负债的月份。 */
    effectiveMonth: string
    /** 下一期计划还款月份。 */
    nextDueMonth: string
    /** 按原始计划计算的最终到期月份。 */
    maturityMonth: string
    /** 分期当前状态。 */
    status: InstallmentStatus
    /** 主动终止生效的月份。 */
    terminatedMonth?: string
    /** 最近一次手工修正所使用的生效月份。 */
    lastAdjustedMonth?: string
    /** 分期创建时间。 */
    createdAt: string
    /** 分期内容最后更新时间。 */
    updatedAt: string
}

/** 账本中的账户主数据。停用只影响当前汇总，历史月份仍按生效区间参与计算。 */
export interface Account {
    /** 账户的全局唯一标识。 */
    id: string
    /** 账户属于资产还是负债。 */
    type: AccountType
    /** 用户可识别的账户名称。 */
    name: string
    /** 开户机构或资金平台。 */
    institution: string
    /** 账户业务分类。 */
    category: string
    /** 账户所属地区。 */
    region: string
    /** 账户余额使用的固定币种。 */
    currency: Currency
    /** 账户当前是否参与最新汇总。 */
    status: AccountStatus
    /** 余额由用户手工维护还是由分期计划生成。 */
    balanceMode: BalanceMode
    /** 分期负债账户包含的分期项目。 */
    installments?: InstallmentPlan[]
    /** 账户开始参与统计的月份。 */
    openedOn: string
    /** 账户停用并停止参与当前汇总的月份。 */
    inactiveOn?: string
    /** 用户填写的补充说明。 */
    note: string
    /** 账户创建时间。 */
    createdAt: string
    /** 账户资料最后更新时间，不包含分期项目变更。 */
    updatedAt: string
}

/** 账户月末余额；同一账户同一月份只允许一条，后续录入覆盖旧值。 */
export interface BalanceRecord {
    /** 余额所属账户标识。 */
    accountId: string
    /** 余额对应的自然月份。 */
    date: string
    /** 月末余额，使用规范化十进制字符串。 */
    amount: string
    /** 余额由手工录入还是分期流程生成。 */
    source: BalanceSource
    /** 余额记录最后更新时间。 */
    updatedAt: string
}

/** 外币对人民币的月度汇率；CNY 固定按 1 处理，因此不落库。 */
export interface ExchangeRate {
    /** 汇率对应的自然月份。 */
    date: string
    /** 需要折算成人民币的外币币种。 */
    currency: Exclude<Currency, 'CNY'>
    /** 一单位外币对应的人民币汇率。 */
    cnyRate: string
    /** 汇率来自自动接口、手工录入或默认规则。 */
    source: RateSource
    /** 汇率记录最后更新时间。 */
    updatedAt: string
}

/** IndexedDB 与备份文件共用的完整账本结构。 */
export interface Ledger {
    /** 账本中的账户主数据。 */
    accounts: Account[]
    /** 各账户按月份保存的余额记录。 */
    balances: BalanceRecord[]
    /** 外币按月份保存的人民币汇率。 */
    exchangeRates: ExchangeRate[]
    /** 账本首次创建时间。 */
    createdAt: string
    /** 账本任意内容最后变更时间。 */
    updatedAt: string
}

/** 对外导入导出的版本化封套；schemaVersion 用于拒绝不兼容文件。 */
export interface LedgerFile {
    /** 固定文件类型标识，用于排除其他 JSON 文件。 */
    format: 'net-worth-ledger'
    /** 当前固定为 2；版本 1 会在导入时迁移。 */
    schemaVersion: 2
    /** 文件生成时间，ISO 8601 字符串。 */
    exportedAt: string
    /** 通过完整校验后的账本数据。 */
    ledger: Ledger
}

/** 账户在目标月份的汇总快照。 */
export interface AccountSnapshot {
    /** 当前快照对应的账户资料。 */
    account: Account
    /** 截至目标月份采用的最近余额记录。 */
    record: BalanceRecord | null
    /** 按快照汇率折算后的人民币金额。 */
    cnyAmount: string
    /** 折算使用的汇率；人民币账户使用虚拟汇率。 */
    rate: ExchangeRate | null
    /** 是否因缺少汇率而无法计入汇总。 */
    missingRate: boolean
}

/** 某个月份的完整账本汇总结果。 */
export interface LedgerSummary {
    /** 汇总截止月份。 */
    asOf: string
    /** 资产人民币合计。 */
    assetsCny: string
    /** 负债人民币合计。 */
    liabilitiesCny: string
    /** 资产减负债后的净资产。 */
    netWorthCny: string
    /** 每个有效账户的汇总快照。 */
    snapshots: AccountSnapshot[]
    /** 因缺少汇率未计入合计的账户。 */
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

/** 返回设备本地时区中的今日日期。 */
export function todayISO(): string {
    // 账本按用户本地月份统计，不能使用 UTC 日期截断，否则月初可能落到上月。
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

/** 返回设备本地时区中的当前月份。 */
export function todayMonthISO(): string {
    return todayISO().slice(0, 7)
}

/** 校验日期文本并归一为 `YYYY-MM`。 */
export function normalizeMonth(value: string): string {
    const text = String(value).trim()
    const match = /^(\d{4})-(\d{2})(?:-\d{2})?$/.exec(text)
    if (!match || Number(match[2]) < 1 || Number(match[2]) > 12) throw new Error('月份必须是 YYYY-MM。')
    return `${match[1]}-${match[2]}`
}

/** 创建一个带时间戳的空账本。 */
export function emptyLedger(now = new Date().toISOString()): Ledger {
    return {accounts: [], balances: [], exchangeRates: [], createdAt: now, updatedAt: now}
}

/** 将账本校验后封装成可导出的版本化文件。 */
export function makeLedgerFile(ledger: Ledger, exportedAt = new Date().toISOString()): LedgerFile {
    return {format: 'net-worth-ledger', schemaVersion: 2, exportedAt, ledger: validateLedger(ledger)}
}

/** 校验并迁移外部导入的账本文件。 */
export function parseLedgerFile(value: unknown): LedgerFile {
    // 上传文件属于不可信输入：先验证封套版本，再深入校验账本内容。
    if (!value || typeof value !== 'object') throw new Error('备份文件格式无效。')
    const candidate = value as Partial<LedgerFile>
    if (candidate.format !== 'net-worth-ledger' || ![1, 2].includes(Number(candidate.schemaVersion)) || typeof candidate.exportedAt !== 'string') {
        throw new Error('备份文件版本不兼容。')
    }
    return {
        format: 'net-worth-ledger',
        schemaVersion: 2,
        exportedAt: candidate.exportedAt,
        ledger: validateLedger(candidate.ledger),
    }
}

/** 将十进制输入解析为指定精度的定点整数。 */
function parseScaled(value: string | number, digits: number): bigint {
    // 领域约定余额只存绝对值，资产/负债方向由账户类型表达，不接受负数。
    const text = String(value).trim().replaceAll(',', '')
    if (!/^\d+(?:\.\d+)?$/.test(text)) throw new Error('金额或汇率必须是非负数字。')
    const [whole, fraction = ''] = text.split('.')
    if (fraction.length > digits) throw new Error(`小数最多保留 ${digits} 位。`)
    return BigInt(whole) * 10n ** BigInt(digits) + BigInt(fraction.padEnd(digits, '0') || '0')
}

/** 将定点整数格式化为不带多余零的十进制字符串。 */
function formatScaled(value: bigint, digits: number): string {
    const negative = value < 0n
    const absolute = negative ? -value : value
    const scale = 10n ** BigInt(digits)
    const whole = absolute / scale
    const fraction = String(absolute % scale).padStart(digits, '0').replace(/0+$/, '')
    return `${negative ? '-' : ''}${whole}${fraction ? `.${fraction}` : ''}`
}

/** 校验金额并归一为账本使用的十进制字符串。 */
export function normalizeAmount(value: string | number): string {
    const parsed = parseScaled(value, MONEY_DIGITS)
    return formatScaled(parsed, MONEY_DIGITS)
}

/** 校验汇率并归一为账本使用的十进制字符串。 */
export function normalizeRate(value: string | number): string {
    const parsed = parseScaled(value, RATE_DIGITS)
    if (parsed === 0n) throw new Error('汇率必须大于 0。')
    return formatScaled(parsed, RATE_DIGITS)
}

/** 使用定点运算将原币金额按汇率折算。 */
export function multiplyAmountByRate(amount: string, rate: string): string {
    const amountScaled = parseScaled(amount, MONEY_DIGITS)
    const rateScaled = parseScaled(rate, RATE_DIGITS)
    const rounded = (amountScaled * rateScaled + RATE_SCALE / 2n) / RATE_SCALE
    return formatScaled(rounded, MONEY_DIGITS)
}

/** 计算单期金额与期数的乘积。 */
export function multiplyAmountByPeriods(amount: string, periods: number): string {
    if (!Number.isInteger(periods) || periods < 0) throw new Error('期数必须是非负整数。')
    return formatScaled(parseScaled(amount, MONEY_DIGITS) * BigInt(periods), MONEY_DIGITS)
}

/** 使用定点精度相加两个金额。 */
export function addMoney(a: string, b: string): string {
    return formatScaled(parseScaled(a, MONEY_DIGITS) + parseScaled(b, MONEY_DIGITS), MONEY_DIGITS)
}

/** 使用定点精度计算两个金额之差。 */
export function subtractMoney(a: string, b: string): string {
    return formatScaled(parseScaled(a, MONEY_DIGITS) - parseScaled(b, MONEY_DIGITS), MONEY_DIGITS)
}

/** 将月份或日期安全推进一个自然月。 */
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

/** 根据下次还款月和剩余期数计算最终到期月。 */
export function calculateMaturityDate(nextDueDate: string, remainingPeriods: number): string {
    if (remainingPeriods <= 0) return nextDueDate
    let result = nextDueDate
    for (let index = 1; index < remainingPeriods; index += 1) result = addCalendarMonth(result)
    return result
}

/** 计算单个分期项目的剩余应付总额。 */
export function installmentBalance(plan: InstallmentPlan): string {
    return multiplyAmountByPeriods(plan.periodAmount, plan.remainingPeriods)
}

/** 判断分期项目在目标月份的展示状态。 */
export function installmentDueState(plan: InstallmentPlan, currentMonth = todayMonthISO()): InstallmentDueState {
    if (plan.status === 'terminated' || plan.remainingPeriods === 0) return plan.status === 'terminated' ? 'terminated' : 'completed'
    const month = normalizeMonth(currentMonth)
    if (normalizeMonth(plan.maturityMonth) < month) return 'overdue'
    if (normalizeMonth(plan.nextDueMonth) === month) return 'pending'
    return normalizeMonth(plan.nextDueMonth) > month ? 'scheduled' : 'active'
}

/** 汇总账户下所有未结束分期的剩余金额。 */
export function accountInstallmentBalance(account: Account): string {
    return (account.installments ?? [])
        .filter(plan => plan.status !== 'terminated' && plan.remainingPeriods > 0)
        .reduce((total, plan) => addMoney(total, installmentBalance(plan)), '0')
}

/** 判断账户是否已经产生任意余额记录。 */
export function accountHasBalances(ledger: Ledger, accountId: string): boolean {
    return ledger.balances.some(record => record.accountId === accountId)
}

/** 判断账户在目标月份是否应参与汇总。 */
export function accountIsEffective(account: Account, asOf: string): boolean {
    // 停用月份起不再计入；停用前的历史快照仍须保留。
    const month = normalizeMonth(asOf)
    if (normalizeMonth(account.openedOn) > month) return false
    return account.status === 'active' || !account.inactiveOn || normalizeMonth(account.inactiveOn) > month
}

/** 查找账户截至目标月份的最近一条余额。 */
export function latestBalance(ledger: Ledger, accountId: string, asOf: string): BalanceRecord | null {
    // 历史汇总采用“截至目标月份的最近记录”，没有要求每月重复录入未变化账户。
    const month = normalizeMonth(asOf)
    return ledger.balances
        .filter(record => record.accountId === accountId && normalizeMonth(record.date) <= month)
        .sort((a, b) => b.date.localeCompare(a.date))[0] ?? null
}

/** 查找余额折算所需的月度汇率。 */
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

/** 汇总目标月份的资产、负债、净资产和账户明细。 */
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

/** 按账户和月份新增或覆盖一条余额记录。 */
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

/** 按币种和月份新增或覆盖一条汇率记录。 */
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

/** 新建分期项目所需的表单数据。 */
export interface InstallmentPlanInput {
    /** 调用方指定的分期标识；缺省时自动生成。 */
    id?: string
    /** 分期项目名称。 */
    name: string
    /** 每期应还金额。 */
    periodAmount: string
    /** 合同约定总期数。 */
    totalPeriods: number
    /** 创建时的剩余期数。 */
    remainingPeriods: number
    /** 分期开始计入负债的月份。 */
    effectiveMonth: string
    /** 下一期计划还款月份。 */
    nextDueMonth: string
}

/** 替换指定账户的分期集合并刷新账本时间。 */
function replaceInstallments(ledger: Ledger, accountId: string, installments: InstallmentPlan[], now: string): Ledger {
    return {
        ...ledger,
        updatedAt: now,
        accounts: ledger.accounts.map(account => account.id === accountId
            // 账户资料与分期计划是独立合并单元；分期变更不能污染账户资料时间戳。
            ? {...account, installments}
            : account),
    }
}

/** 根据分期项目合计写入指定月份的账户余额。 */
function writeInstallmentBalance(
    ledger: Ledger,
    accountId: string,
    month: string,
    source: Exclude<BalanceSource, 'manual'>,
    now: string,
): Ledger {
    const account = ledger.accounts.find(item => item.id === accountId)
    if (!account) throw new Error('找不到分期负债账户。')
    return upsertBalance(ledger, {
        accountId,
        date: month,
        amount: accountInstallmentBalance(account),
        source,
    }, now)
}

/** 创建分期项目并生成生效月余额。 */
export function addInstallmentPlan(
    ledger: Ledger,
    accountId: string,
    input: InstallmentPlanInput,
    now = new Date().toISOString(),
): Ledger {
    const account = ledger.accounts.find(item => item.id === accountId)
    if (!account || account.type !== 'liability' || account.balanceMode !== 'installment') {
        throw new Error('该账户不是分期负债账户。')
    }
    if (account.status !== 'active') throw new Error('已停用账户不能新增分期。')
    const name = input.name.trim()
    if (!name) throw new Error('请填写分期名称。')
    if (!Number.isInteger(input.totalPeriods) || input.totalPeriods < 1
        || !Number.isInteger(input.remainingPeriods) || input.remainingPeriods < 1
        || input.remainingPeriods > input.totalPeriods) throw new Error('请填写有效的分期期数。')
    const effectiveMonth = normalizeMonth(input.effectiveMonth)
    const nextDueMonth = normalizeMonth(input.nextDueMonth)
    if (nextDueMonth < effectiveMonth) throw new Error('下次还款月不能早于生效月。')
    const plan: InstallmentPlan = {
        id: input.id ?? crypto.randomUUID(),
        name,
        periodAmount: normalizeAmount(input.periodAmount),
        totalPeriods: input.totalPeriods,
        remainingPeriods: input.remainingPeriods,
        effectiveMonth,
        nextDueMonth,
        maturityMonth: calculateMaturityDate(nextDueMonth, input.remainingPeriods),
        status: 'active',
        createdAt: now,
        updatedAt: now,
    }
    const next = replaceInstallments(ledger, accountId, [...(account.installments ?? []), plan], now)
    return writeInstallmentBalance(next, accountId, effectiveMonth, 'installment-setup', now)
}

/** 确认分期已还一期并刷新当月余额。 */
export function confirmInstallmentPaid(
    ledger: Ledger,
    accountId: string,
    installmentId: string,
    month = todayMonthISO(),
    now = new Date().toISOString(),
): Ledger {
    const account = ledger.accounts.find(item => item.id === accountId)
    const plan = account?.installments?.find(item => item.id === installmentId)
    if (!account || account.balanceMode !== 'installment' || !plan) throw new Error('找不到分期项目。')
    const paymentMonth = normalizeMonth(month)
    if (installmentDueState(plan, paymentMonth) !== 'pending') throw new Error('只能确认本月待还的分期。')
    const remainingPeriods = plan.remainingPeriods - 1
    const installments = account.installments!.map(item => item.id === installmentId ? {
        ...item,
        remainingPeriods,
        nextDueMonth: addCalendarMonth(item.nextDueMonth),
        status: remainingPeriods === 0 ? 'completed' as const : 'active' as const,
        updatedAt: now,
    } : item)
    return writeInstallmentBalance(
        replaceInstallments(ledger, accountId, installments, now),
        accountId,
        paymentMonth,
        'installment-confirmation',
        now,
    )
}

/** 分期自动补记的处理结果。 */
export interface InstallmentBackfillResult {
    /** 完成自动补记后的账本。 */
    ledger: Ledger
    /** 本次补记过程中结清的分期名称。 */
    completedPlanNames: string[]
    /** 账本是否实际发生变化。 */
    changed: boolean
}

/** 自动补记已经过去的分期月份并更新状态。 */
export function backfillInstallments(
    ledger: Ledger,
    currentMonth = todayMonthISO(),
    now = new Date().toISOString(),
): InstallmentBackfillResult {
    const month = normalizeMonth(currentMonth)
    const completedPlanNames: string[] = []
    let next = ledger
    let changed = false

    for (const sourceAccount of ledger.accounts) {
        if (sourceAccount.balanceMode !== 'installment' || !sourceAccount.installments?.length) continue
        let installments = sourceAccount.installments.map(plan => ({...plan}))
        while (true) {
            const dueMonth = installments
                .filter(plan => plan.status === 'active' && plan.remainingPeriods > 0
                    && plan.nextDueMonth < month && plan.nextDueMonth <= plan.maturityMonth)
                .map(plan => plan.nextDueMonth)
                .sort()[0]
            if (!dueMonth) break
            installments = installments.map(plan => {
                if (plan.status !== 'active' || plan.nextDueMonth !== dueMonth) return plan
                const remainingPeriods = plan.remainingPeriods - 1
                if (remainingPeriods === 0) completedPlanNames.push(plan.name)
                return {
                    ...plan,
                    remainingPeriods,
                    nextDueMonth: addCalendarMonth(plan.nextDueMonth),
                    status: remainingPeriods === 0 ? 'completed' : 'active',
                    updatedAt: now,
                }
            })
            next = replaceInstallments(next, sourceAccount.id, installments, now)
            next = writeInstallmentBalance(next, sourceAccount.id, dueMonth, 'installment-backfill', now)
            changed = true
        }
        const withOverdue = installments.map(plan => plan.status === 'active' && plan.remainingPeriods > 0 && plan.maturityMonth < month
            ? {...plan, status: 'overdue' as const, updatedAt: now}
            : plan)
        if (withOverdue.some((plan, index) => plan.status !== installments[index].status)) {
            next = replaceInstallments(next, sourceAccount.id, withOverdue, now)
            changed = true
        }
    }
    return {ledger: next, completedPlanNames, changed}
}

/** 计算修正锚点之后已处理的计划期数。 */
function processedPaymentsAfter(plan: InstallmentPlan, effectiveMonth: string, targetMonth: string): number {
    let count = 0
    let cursor = addCalendarMonth(effectiveMonth)
    while (cursor <= targetMonth && cursor < plan.nextDueMonth && cursor <= plan.maturityMonth) {
        count += 1
        cursor = addCalendarMonth(cursor)
    }
    return count
}

/** 生成起止月份之间的连续月份列表。 */
function installmentMonths(start: string, end: string): string[] {
    const months: string[] = []
    for (let month = start; month <= end; month = addCalendarMonth(month)) months.push(month)
    return months
}

/** 从指定月份起修正分期剩余期数及关联余额。 */
function adjustInstallmentRemaining(
    ledger: Ledger,
    accountId: string,
    installmentId: string,
    effectiveMonthInput: string,
    remainingPeriods: number,
    currentMonthInput: string,
    source: 'installment-correction' | 'installment-termination',
    now: string,
): Ledger {
    const account = ledger.accounts.find(item => item.id === accountId)
    const plan = account?.installments?.find(item => item.id === installmentId)
    if (!account || account.balanceMode !== 'installment' || !plan) throw new Error('找不到分期项目。')
    if (!['active', 'overdue'].includes(plan.status)) throw new Error('已结束的分期不能修改。')
    if (!Number.isInteger(remainingPeriods) || remainingPeriods < 0 || remainingPeriods > plan.totalPeriods) {
        throw new Error('剩余期数必须是有效整数。')
    }
    const effectiveMonth = normalizeMonth(effectiveMonthInput)
    const currentMonth = normalizeMonth(currentMonthInput)
    if (effectiveMonth < plan.effectiveMonth || effectiveMonth > currentMonth) throw new Error('修正月份超出分期有效范围。')
    // ponytail: 只保留最近修正锚点；若将来需要任意回溯多次修正，再升级为分期事件表。
    if (plan.lastAdjustedMonth && effectiveMonth < plan.lastAdjustedMonth) throw new Error('不能早于上次修正月份再次回溯。')

    const processedToCurrent = processedPaymentsAfter(plan, effectiveMonth, currentMonth)
    const oldRemainingAtEffective = Math.min(plan.totalPeriods, plan.remainingPeriods + processedToCurrent)
    const originalTotals = new Map(installmentMonths(effectiveMonth, currentMonth).map(month => [
        month,
        latestBalance(ledger, accountId, month)?.amount ?? '0',
    ]))
    let next = ledger
    for (const month of installmentMonths(effectiveMonth, currentMonth)) {
        const processed = processedPaymentsAfter(plan, effectiveMonth, month)
        const oldPlanAmount = multiplyAmountByPeriods(plan.periodAmount, Math.max(0, oldRemainingAtEffective - processed))
        const newPlanAmount = multiplyAmountByPeriods(plan.periodAmount, Math.max(0, remainingPeriods - processed))
        next = upsertBalance(next, {
            accountId,
            date: month,
            amount: addMoney(subtractMoney(originalTotals.get(month)!, oldPlanAmount), newPlanAmount),
            source,
        }, now)
    }

    const currentRemaining = Math.max(0, remainingPeriods - processedToCurrent)
    const status: InstallmentStatus = source === 'installment-termination'
        ? 'terminated'
        : currentRemaining === 0 ? 'completed' : plan.maturityMonth < currentMonth ? 'overdue' : 'active'
    const installments = account.installments!.map(item => item.id === installmentId ? {
        ...item,
        remainingPeriods: currentRemaining,
        status,
        terminatedMonth: source === 'installment-termination' ? effectiveMonth : undefined,
        lastAdjustedMonth: effectiveMonth,
        updatedAt: now,
    } : item)
    return replaceInstallments(next, accountId, installments, now)
}

/** 修正分期在某个月份的实际剩余期数。 */
export function correctInstallmentRemaining(
    ledger: Ledger,
    accountId: string,
    installmentId: string,
    effectiveMonth: string,
    remainingPeriods: number,
    currentMonth = todayMonthISO(),
    now = new Date().toISOString(),
): Ledger {
    return adjustInstallmentRemaining(
        ledger, accountId, installmentId, effectiveMonth, remainingPeriods, currentMonth, 'installment-correction', now,
    )
}

/** 从指定月份起终止分期并移除后续负债。 */
export function terminateInstallmentPlan(
    ledger: Ledger,
    accountId: string,
    installmentId: string,
    effectiveMonth: string,
    currentMonth = todayMonthISO(),
    now = new Date().toISOString(),
): Ledger {
    return adjustInstallmentRemaining(
        ledger, accountId, installmentId, effectiveMonth, 0, currentMonth, 'installment-termination', now,
    )
}

/** 删除当月误建且尚未开始还款的分期。 */
export function deleteUnstartedInstallmentPlan(
    ledger: Ledger,
    accountId: string,
    installmentId: string,
    currentMonth = todayMonthISO(),
    now = new Date().toISOString(),
): Ledger {
    const month = normalizeMonth(currentMonth)
    const account = ledger.accounts.find(item => item.id === accountId)
    const plan = account?.installments?.find(item => item.id === installmentId)
    if (!account || !plan) throw new Error('找不到分期项目。')
    if (plan.status !== 'active' || plan.effectiveMonth !== month || plan.nextDueMonth <= month) {
        throw new Error('只有当月新建且尚未进入首个还款月的分期可以删除。')
    }
    const installments = account.installments!.filter(item => item.id !== installmentId)
    let next = replaceInstallments(ledger, accountId, installments, now)
    if (installments.length || ledger.balances.some(record => record.accountId === accountId && record.date < month)) {
        next = writeInstallmentBalance(next, accountId, month, 'installment-correction', now)
    } else {
        next = {
            ...next,
            balances: next.balances.filter(record => !(record.accountId === accountId && record.date === month))
        }
    }
    return next
}

/** 校验并规范化账本及其所有嵌套记录。 */
export function validateLedger(value: unknown): Ledger {
    // 所有外部文件和 IndexedDB 数据都经过这里，防止坏引用或非法金额进入计算层。
    if (!value || typeof value !== 'object') throw new Error('账本格式无效。')
    const candidate = value as Partial<Ledger>
    if (!Array.isArray(candidate.accounts) || !Array.isArray(candidate.balances) || !Array.isArray(candidate.exchangeRates)) {
        throw new Error('账本缺少必要数据。')
    }
    const accountIds = new Set<string>()
    const accounts: Account[] = []
    for (const accountValue of candidate.accounts) {
        const account = accountValue as Account & {
            installment?: {
                periodAmount: string
                totalPeriods: number
                remainingPeriods: number
                nextDueDate: string
                maturityDate: string
            }
        }
        if (!account || typeof account !== 'object' || typeof account.id !== 'string' || accountIds.has(account.id)) {
            throw new Error('账户 ID 无效或重复。')
        }
        accountIds.add(account.id)
        if (!CURRENCIES.includes(account.currency) || !['asset', 'liability'].includes(account.type)) {
            throw new Error('账户类型或币种无效。')
        }
        if (account.type === 'asset' && account.balanceMode === 'installment') throw new Error('资产账户不能使用分期模式。')
        const legacyPlan = account.installment
        const sourcePlans: InstallmentPlan[] = Array.isArray(account.installments)
            ? account.installments
            : legacyPlan ? [{
                id: `legacy-${account.id}`,
                name: account.name,
                periodAmount: legacyPlan.periodAmount,
                totalPeriods: legacyPlan.totalPeriods,
                remainingPeriods: legacyPlan.remainingPeriods,
                effectiveMonth: account.openedOn,
                nextDueMonth: legacyPlan.nextDueDate,
                maturityMonth: legacyPlan.maturityDate,
                status: legacyPlan.remainingPeriods === 0 ? 'completed' : 'active',
                createdAt: account.createdAt,
                updatedAt: account.updatedAt,
            }] : []
        const planIds = new Set<string>()
        const installments = sourcePlans.map(plan => {
            if (!plan || typeof plan.id !== 'string' || planIds.has(plan.id) || !String(plan.name).trim()
                || !Number.isInteger(plan.totalPeriods) || !Number.isInteger(plan.remainingPeriods)
                || plan.totalPeriods < 1 || plan.remainingPeriods < 0 || plan.remainingPeriods > plan.totalPeriods
                || !['active', 'completed', 'terminated', 'overdue'].includes(plan.status)
            ) throw new Error('分期计划无效。')
            planIds.add(plan.id)
            const status: InstallmentStatus = plan.remainingPeriods === 0 && plan.status !== 'terminated' ? 'completed' : plan.status
            if ((status === 'active' || status === 'overdue') && plan.remainingPeriods === 0) throw new Error('分期状态无效。')
            return {
                ...plan,
                name: String(plan.name).trim(),
                periodAmount: normalizeAmount(plan.periodAmount),
                effectiveMonth: normalizeMonth(plan.effectiveMonth),
                nextDueMonth: normalizeMonth(plan.nextDueMonth),
                maturityMonth: normalizeMonth(plan.maturityMonth),
                terminatedMonth: plan.terminatedMonth ? normalizeMonth(plan.terminatedMonth) : undefined,
                lastAdjustedMonth: plan.lastAdjustedMonth ? normalizeMonth(plan.lastAdjustedMonth) : undefined,
                status,
            }
        })
        if (account.balanceMode !== 'installment' && installments.length) throw new Error('普通账户不能包含分期计划。')
        const {installment: _legacyPlan, ...accountFields} = account
        accounts.push({
            ...accountFields,
            openedOn: normalizeMonth(account.openedOn),
            inactiveOn: account.inactiveOn ? normalizeMonth(account.inactiveOn) : undefined,
            installments: account.balanceMode === 'installment' ? installments : undefined,
        })
    }
    // 兼容早期按日保存的数据：归一到月份后以 updatedAt 较新的记录为准。
    const balanceRecords = new Map<string, { record: BalanceRecord; sourceDate: string }>()
    for (const rawRecord of candidate.balances) {
        const record = rawRecord as BalanceRecord | (Omit<BalanceRecord, 'source'> & { source: 'installment-payment' })
        if (!record || !accountIds.has(record.accountId)) {
            throw new Error('余额记录无效。')
        }
        const date = normalizeMonth(record.date)
        normalizeAmount(record.amount)
        const source = record.source === 'installment-payment' ? 'installment-confirmation' : record.source
        if (!['manual', 'installment-setup', 'installment-confirmation', 'installment-backfill', 'installment-correction', 'installment-termination'].includes(source)) {
            throw new Error('余额来源无效。')
        }
        const key = `${record.accountId}:${date}`
        const current = balanceRecords.get(key)
        if (!current || String(record.updatedAt) > String(current.record.updatedAt)
            || (String(record.updatedAt) === String(current.record.updatedAt) && record.date > current.sourceDate)) {
            balanceRecords.set(key, {record: {...record, date, source}, sourceDate: record.date})
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
