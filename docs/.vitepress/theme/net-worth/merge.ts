import {
    validateLedger,
    type Account,
    type BalanceRecord,
    type ExchangeRate,
    type InstallmentPlan,
    type Ledger,
} from './ledger'

/** 账本合并预览的分类计数。 */
export interface MergePreview {
    /** 只存在于本地的记录数。 */
    localOnly: number
    /** 只存在于云端的记录数。 */
    cloudOnly: number
    /** 两端都有但采用本地较新版本的记录数。 */
    localNewer: number
    /** 两端都有但采用云端较新版本的记录数。 */
    cloudNewer: number
    /** 两端去重后的合并单元总数。 */
    total: number
}

/** 账本合并产生的数据和预览统计。 */
export interface MergeResult {
    /** 校验通过的合并后账本。 */
    ledger: Ledger
    /** 本次合并的分类计数。 */
    preview: MergePreview
}

/** 具备最后修改时间、可参与冲突比较的记录。 */
type Versioned = { updatedAt: string }

/** 按业务键和更新时间合并一类记录。 */
function mergeUnits<T extends Versioned>(
    local: T[],
    cloud: T[],
    keyOf: (item: T) => string,
    preview: MergePreview,
): T[] {
    const cloudByKey = new Map(cloud.map(item => [keyOf(item), item]))
    const merged: T[] = []
    for (const localItem of local) {
        preview.total += 1
        const key = keyOf(localItem)
        const cloudItem = cloudByKey.get(key)
        if (!cloudItem) {
            preview.localOnly += 1
            merged.push(localItem)
            continue
        }
        cloudByKey.delete(key)
        if (localItem.updatedAt > cloudItem.updatedAt) {
            preview.localNewer += 1
            merged.push(localItem)
        } else {
            if (cloudItem.updatedAt > localItem.updatedAt) preview.cloudNewer += 1
            merged.push(cloudItem) // 时间相同也以云端为准。
        }
    }
    for (const cloudItem of cloudByKey.values()) {
        preview.total += 1
        preview.cloudOnly += 1
        merged.push(cloudItem)
    }
    return merged
}

/** 移除账户中的分期集合，仅保留账户资料合并单元。 */
function accountMetadata(account: Account): Account {
    const {installments: _installments, ...metadata} = account
    return metadata
}

/** 按确认的合并规则组合本地与云端账本。 */
export function mergeLedgers(localInput: Ledger, cloudInput: Ledger, now = new Date().toISOString()): MergeResult {
    const local = validateLedger(localInput)
    const cloud = validateLedger(cloudInput)
    const preview: MergePreview = {localOnly: 0, cloudOnly: 0, localNewer: 0, cloudNewer: 0, total: 0}
    const accounts = mergeUnits(
        local.accounts.map(accountMetadata),
        cloud.accounts.map(accountMetadata),
        account => account.id,
        preview,
    ).map(account => {
        const installments = mergeUnits<InstallmentPlan>(
            local.accounts.find(item => item.id === account.id)?.installments ?? [],
            cloud.accounts.find(item => item.id === account.id)?.installments ?? [],
            plan => plan.id,
            preview,
        )
        if (installments.length && (account.type !== 'liability' || account.balanceMode !== 'installment')) {
            throw new Error(`账户“${account.name}”的资料与分期计划冲突，无法安全合并。`)
        }
        return {...account, installments: account.balanceMode === 'installment' ? installments : undefined}
    })
    const balances = mergeUnits<BalanceRecord>(
        local.balances,
        cloud.balances,
        record => `${record.accountId}:${record.date}`,
        preview,
    )
    const exchangeRates = mergeUnits<ExchangeRate>(
        local.exchangeRates,
        cloud.exchangeRates,
        rate => `${rate.currency}:${rate.date}`,
        preview,
    )
    return {
        ledger: validateLedger({
            accounts,
            balances,
            exchangeRates,
            createdAt: local.createdAt < cloud.createdAt ? local.createdAt : cloud.createdAt,
            updatedAt: now,
        }),
        preview,
    }
}

/** 比较两份账本的业务内容是否相同，忽略账本顶层更新时间。 */
export function sameLedgerContents(left: Ledger, right: Ledger): boolean {
    /** 生成忽略账本整体更新时间的可比较内容。 */
    const comparable = (ledger: Ledger) => ({...validateLedger(ledger), updatedAt: ''})
    return JSON.stringify(comparable(left)) === JSON.stringify(comparable(right))
}
