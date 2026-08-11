import {describe, expect, it} from 'vitest'
import {emptyLedger, type Account, type InstallmentPlan, type Ledger} from './ledger'
import {mergeLedgers, sameLedgerContents} from './merge'

const first = '2026-01-01T00:00:00.000Z'
const later = '2026-02-01T00:00:00.000Z'

function account(updatedAt = first, installments?: InstallmentPlan[]): Account {
    return {
        id: 'account', type: 'liability', name: '本地名称', institution: '', category: '其他', region: '境内',
        currency: 'CNY', status: 'active', balanceMode: 'installment', installments, openedOn: '2026-01', note: '',
        createdAt: first, updatedAt,
    }
}

function plan(id: string, updatedAt: string, remainingPeriods: number): InstallmentPlan {
    return {
        id, name: id, periodAmount: '100', totalPeriods: 3, remainingPeriods, effectiveMonth: '2026-01',
        nextDueMonth: '2026-02', maturityMonth: '2026-04', status: 'active', createdAt: first, updatedAt,
    }
}

function ledger(source: Account, amount: string, updatedAt: string): Ledger {
    return {
        ...emptyLedger(first),
        accounts: [source],
        balances: [{accountId: source.id, date: '2026-01', amount, source: 'manual', updatedAt}],
    }
}

describe('ledger merge', () => {
    it('merges each unit independently, keeps one-sided data, and lets cloud win a tie', () => {
        const local = ledger(account(first, [plan('shared', later, 2), plan('local-only', first, 3)]), '100', later)
        const cloudAccount = {...account(later, [plan('shared', first, 3), plan('cloud-only', first, 3)]), name: '云端名称'}
        const cloud = ledger(cloudAccount, '200', later)
        cloud.exchangeRates = [{date: '2026-01', currency: 'USD', cnyRate: '7.2', source: 'manual', updatedAt: first}]

        const result = mergeLedgers(local, cloud, '2026-03-01T00:00:00.000Z')

        expect(result.ledger.accounts[0].name).toBe('云端名称')
        expect(result.ledger.accounts[0].installments?.map(item => [item.id, item.remainingPeriods])).toEqual([
            ['shared', 2], ['local-only', 3], ['cloud-only', 3],
        ])
        expect(result.ledger.balances[0].amount).toBe('200')
        expect(result.ledger.exchangeRates).toHaveLength(1)
        expect(result.preview).toEqual({localOnly: 1, cloudOnly: 2, localNewer: 1, cloudNewer: 1, total: 6})
    })

    it('compares ledger content without the export envelope', () => {
        const source = ledger(account(), '100', first)
        expect(sameLedgerContents(source, structuredClone(source))).toBe(true)
        expect(sameLedgerContents(source, {...source, updatedAt: later})).toBe(true)
        expect(sameLedgerContents(source, {...source, balances: [{...source.balances[0], amount: '200'}]})).toBe(false)
    })
})
