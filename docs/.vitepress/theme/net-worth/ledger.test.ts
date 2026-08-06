import {describe, expect, it} from 'vitest'
import {isReactive, reactive} from 'vue'
import {
    confirmInstallmentPaid,
    emptyLedger,
    installmentBalance,
    makeLedgerFile,
    normalizeMonth,
    parseLedgerFile,
    summarize,
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

    it('records one confirmed installment payment without automatic date-based reduction', () => {
        const liability = account({
            name: '账单分期',
            type: 'liability',
            balanceMode: 'installment',
            installment: {
                periodAmount: '1200',
                totalPeriods: 3,
                remainingPeriods: 3,
                nextDueDate: '2026-03-15',
                maturityDate: '2026-05-15',
            },
        })
        let ledger = {...emptyLedger(), accounts: [liability]}
        ledger = upsertBalance(ledger, {
            accountId: liability.id,
            date: '2026-03-01',
            amount: installmentBalance(liability.installment!),
            source: 'installment-setup'
        })

        const unchanged = summarize(ledger, '2026-03-15')
        expect(unchanged.liabilitiesCny).toBe('3600')

        const paid = confirmInstallmentPaid(ledger, liability.id, '2026-03-20')
        const updated = paid.accounts[0].installment!
        expect(updated.remainingPeriods).toBe(2)
        expect(updated.nextDueDate).toBe('2026-04-15')
        expect(updated.maturityDate).toBe('2026-05-15')
        expect(summarize(paid, '2026-03-20').liabilitiesCny).toBe('2400')
    })

    it('round-trips a versioned backup file and rejects unknown versions', () => {
        const source = emptyLedger('2026-04-01T00:00:00.000Z')
        const file = makeLedgerFile(source, '2026-04-02T00:00:00.000Z')
        expect(parseLedgerFile(JSON.parse(JSON.stringify(file))).ledger.createdAt).toBe(source.createdAt)
        expect(() => parseLedgerFile({...file, schemaVersion: 2})).toThrow('版本不兼容')
    })

    it('turns reactive ledgers into structured-cloneable storage data', () => {
        const source = reactive(emptyLedger()) as unknown as Ledger
        const plain = serializableLedger(source)
        expect(isReactive(plain)).toBe(false)
        expect(() => structuredClone(plain)).not.toThrow()
    })
})
