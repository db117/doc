import {describe, expect, it} from 'vitest'
import {isReactive, reactive} from 'vue'
import {
    addInstallmentPlan,
    backfillInstallments,
    confirmInstallmentPaid,
    correctInstallmentRemaining,
    deleteUnstartedInstallmentPlan,
    emptyLedger,
    makeLedgerFile,
    normalizeMonth,
    parseLedgerFile,
    summarize,
    terminateInstallmentPlan,
    upsertBalance,
    upsertExchangeRate,
    type Account,
    type Ledger,
} from './ledger'
import {serializableLedger} from './storage'

function account(overrides: Partial<Account> = {}): Account {
    return {
        id: crypto.randomUUID(),
        type: 'asset',
        name: '测试账户',
        institution: '测试机构',
        category: '银行',
        region: '境内',
        currency: 'CNY',
        status: 'active',
        balanceMode: 'manual',
        openedOn: '2026-01-01',
        note: '',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        ...overrides,
    }
}

// 这些测试覆盖账本最关键的持久化契约：月度唯一、历史口径、分期推进和导入兼容。
describe('net worth ledger', () => {
    it('takes the latest balance for each account and subtracts liabilities', () => {
        const asset = account({name: '资产'})
        const debt = account({id: crypto.randomUUID(), name: '负债', type: 'liability'})
        let ledger = {...emptyLedger(), accounts: [asset, debt]}
        ledger = upsertBalance(ledger, {accountId: asset.id, date: '2026-01-01', amount: '1000', source: 'manual'})
        ledger = upsertBalance(ledger, {accountId: asset.id, date: '2026-01-10', amount: '1200', source: 'manual'})
        ledger = upsertBalance(ledger, {accountId: debt.id, date: '2026-01-05', amount: '300', source: 'manual'})

        const result = summarize(ledger, '2026-01-10')
        expect(result.assetsCny).toBe('1200')
        expect(result.liabilitiesCny).toBe('300')
        expect(result.netWorthCny).toBe('900')
    })

    it('uses the stored rate on the account record date', () => {
        const usd = account({name: '美元账户', currency: 'USD'})
        let ledger = {...emptyLedger(), accounts: [usd]}
        ledger = upsertExchangeRate(ledger, {date: '2026-02-01', currency: 'USD', cnyRate: '7.2', source: 'automatic'})
        ledger = upsertBalance(ledger, {accountId: usd.id, date: '2026-02-01', amount: '100', source: 'manual'})

        expect(summarize(ledger, '2026-02-03').assetsCny).toBe('720')
    })

    it('keeps one balance and rate per account month', () => {
        const usd = account({name: '美元账户', currency: 'USD'})
        let ledger = {...emptyLedger(), accounts: [usd]}
        ledger = upsertExchangeRate(ledger, {date: '2026-02-01', currency: 'USD', cnyRate: '7.1', source: 'automatic'})
        ledger = upsertBalance(ledger, {accountId: usd.id, date: '2026-02-01', amount: '100', source: 'manual'})
        ledger = upsertExchangeRate(ledger, {date: '2026-02-28', currency: 'USD', cnyRate: '7.2', source: 'manual'})
        ledger = upsertBalance(ledger, {accountId: usd.id, date: '2026-02-28', amount: '120', source: 'manual'})

        expect(normalizeMonth('2026-02-28')).toBe('2026-02')
        expect(ledger.balances).toHaveLength(1)
        expect(ledger.balances[0].date).toBe('2026-02')
        expect(ledger.balances[0].amount).toBe('120')
        expect(ledger.exchangeRates).toHaveLength(1)
        expect(ledger.exchangeRates[0].date).toBe('2026-02')
        expect(summarize(ledger, '2026-02').assetsCny).toBe('864')
    })

    it('normalizes legacy daily records and keeps the latest record in a month', () => {
        const source = account({name: '历史账户'})
        const ledger = parseLedgerFile({
            format: 'net-worth-ledger',
            schemaVersion: 1,
            exportedAt: '2026-03-01T00:00:00.000Z',
            ledger: {
                ...emptyLedger(),
                accounts: [source],
                balances: [
                    {
                        accountId: source.id,
                        date: '2026-02-01',
                        amount: '100',
                        source: 'manual',
                        updatedAt: '2026-03-01T00:00:00.000Z'
                    },
                    {
                        accountId: source.id,
                        date: '2026-02-28',
                        amount: '200',
                        source: 'manual',
                        updatedAt: '2026-03-01T00:00:00.000Z'
                    },
                ],
            },
        })

        expect(ledger.ledger.balances).toHaveLength(1)
        expect(ledger.ledger.balances[0].date).toBe('2026-02')
        expect(ledger.ledger.balances[0].amount).toBe('200')
    })

    it('supports multiple plans, keeps the current month pending, and confirms it manually', () => {
        const liability = account({
            name: '账单分期',
            type: 'liability',
            balanceMode: 'installment',
            installments: [],
        })
        let ledger = {...emptyLedger(), accounts: [liability]}
        ledger = addInstallmentPlan(ledger, liability.id, {
            id: 'phone', name: '手机', periodAmount: '1000', totalPeriods: 3, remainingPeriods: 3,
            effectiveMonth: '2026-03', nextDueMonth: '2026-03',
        })
        ledger = addInstallmentPlan(ledger, liability.id, {
            id: 'computer', name: '电脑', periodAmount: '500', totalPeriods: 2, remainingPeriods: 2,
            effectiveMonth: '2026-03', nextDueMonth: '2026-04',
        })
        ledger = addInstallmentPlan(ledger, liability.id, {
            id: 'mistake', name: '误建', periodAmount: '10', totalPeriods: 1, remainingPeriods: 1,
            effectiveMonth: '2026-03', nextDueMonth: '2026-04',
        })
        ledger = deleteUnstartedInstallmentPlan(ledger, liability.id, 'mistake', '2026-03')

        expect(summarize(ledger, '2026-03').liabilitiesCny).toBe('4000')
        expect(ledger.accounts[0].installments).toHaveLength(2)
        expect(backfillInstallments(ledger, '2026-03').changed).toBe(false)

        const paid = confirmInstallmentPaid(ledger, liability.id, 'phone', '2026-03')
        const updated = paid.accounts[0].installments![0]
        expect(updated.remainingPeriods).toBe(2)
        expect(updated.nextDueMonth).toBe('2026-04')
        expect(updated.maturityMonth).toBe('2026-05')
        expect(summarize(paid, '2026-03').liabilitiesCny).toBe('3000')

        const backfilled = backfillInstallments(paid, '2026-06')
        expect(backfilled.completedPlanNames).toEqual(['手机', '电脑'])
        expect(summarize(backfilled.ledger, '2026-04').liabilitiesCny).toBe('1500')
        expect(summarize(backfilled.ledger, '2026-05').liabilitiesCny).toBe('0')
    })

    it('corrects from an effective month and can terminate a plan without rewriting earlier history', () => {
        const liability = account({name: '贷款', type: 'liability', balanceMode: 'installment', installments: []})
        let ledger = {...emptyLedger(), accounts: [liability]}
        ledger = addInstallmentPlan(ledger, liability.id, {
            id: 'loan', name: '装修贷', periodAmount: '100', totalPeriods: 6, remainingPeriods: 6,
            effectiveMonth: '2026-02', nextDueMonth: '2026-03',
        })
        ledger = backfillInstallments(ledger, '2026-06').ledger
        expect(summarize(ledger, '2026-03').liabilitiesCny).toBe('500')
        expect(summarize(ledger, '2026-05').liabilitiesCny).toBe('300')

        ledger = correctInstallmentRemaining(ledger, liability.id, 'loan', '2026-04', 5, '2026-06')
        expect(summarize(ledger, '2026-03').liabilitiesCny).toBe('500')
        expect(summarize(ledger, '2026-04').liabilitiesCny).toBe('500')
        expect(summarize(ledger, '2026-06').liabilitiesCny).toBe('400')

        ledger = terminateInstallmentPlan(ledger, liability.id, 'loan', '2026-05', '2026-06')
        expect(summarize(ledger, '2026-04').liabilitiesCny).toBe('500')
        expect(summarize(ledger, '2026-05').liabilitiesCny).toBe('0')
        expect(ledger.accounts[0].installments![0].status).toBe('terminated')
    })

    it('round-trips schema v2, migrates a legacy installment, and rejects unknown versions', () => {
        const source = emptyLedger('2026-04-01T00:00:00.000Z')
        const file = makeLedgerFile(source, '2026-04-02T00:00:00.000Z')
        expect(file.schemaVersion).toBe(2)
        expect(parseLedgerFile(JSON.parse(JSON.stringify(file))).ledger.createdAt).toBe(source.createdAt)
        const legacyAccount = account({name: '旧分期', type: 'liability', balanceMode: 'installment'})
        const legacy = parseLedgerFile({
            format: 'net-worth-ledger', schemaVersion: 1, exportedAt: file.exportedAt,
            ledger: {
                ...emptyLedger(),
                accounts: [{
                    ...legacyAccount, installment: {
                        periodAmount: '100', totalPeriods: 2, remainingPeriods: 2,
                        nextDueDate: '2026-04', maturityDate: '2026-05',
                    }
                }],
            },
        })
        expect(legacy.schemaVersion).toBe(2)
        expect(legacy.ledger.accounts[0].installments?.[0].name).toBe('旧分期')
        expect(() => parseLedgerFile({...file, schemaVersion: 3})).toThrow('版本不兼容')
    })

    it('turns reactive ledgers into structured-cloneable storage data', () => {
        const source = reactive(emptyLedger()) as unknown as Ledger
        const plain = serializableLedger(source)
        expect(isReactive(plain)).toBe(false)
        expect(() => structuredClone(plain)).not.toThrow()
    })
})
