import {afterEach, describe, expect, it, vi} from 'vitest'
import {backupToOneDrive, disconnectOneDrive} from './onedrive'
import type {LedgerFile} from './ledger'

const file: LedgerFile = {
    format: 'net-worth-ledger',
    schemaVersion: 2,
    exportedAt: '2026-08-14T10:00:00.000Z',
    ledger: {
        accounts: [], balances: [], exchangeRates: [],
        createdAt: '2026-08-14T10:00:00.000Z', updatedAt: '2026-08-14T10:00:00.000Z',
    },
}

describe('backupToOneDrive', () => {
    afterEach(() => {
        disconnectOneDrive()
        vi.unstubAllGlobals()
    })

    it('主账本成功但 README 写入失败时保留具体步骤和状态码', async () => {
        const values = new Map([['net-worth-onedrive-session', JSON.stringify({
            accessToken: 'test-token', expiresAt: Date.now() + 60_000,
        })]])
        vi.stubGlobal('sessionStorage', {
            getItem: (key: string) => values.get(key) ?? null,
            setItem: (key: string, value: string) => values.set(key, value),
            removeItem: (key: string) => values.delete(key),
        })
        vi.stubGlobal('fetch', vi.fn()
            .mockResolvedValueOnce(new Response('{}', {status: 201}))
            .mockResolvedValueOnce(Response.json({
                id: 'ledger', name: 'net-worth-ledger.json',
                lastModifiedDateTime: '2026-08-14T10:00:00.000Z', size: 1,
            }))
            .mockResolvedValueOnce(new Response('{}', {status: 404}))
            .mockResolvedValueOnce(new Response('{}', {status: 415}))
            .mockResolvedValueOnce(new Response('{}', {status: 404}))
            .mockResolvedValueOnce(new Response('{}', {status: 201}))
            .mockResolvedValueOnce(new Response('{}', {status: 404}))
            .mockResolvedValueOnce(new Response('{}', {status: 201}))
            .mockResolvedValueOnce(new Response('{}', {status: 201})))

        await expect(backupToOneDrive(file)).resolves.toMatchObject({
            warning: '当前账本已保存，但 OneDrive README.txt 写入失败（HTTP 415）。',
        })
    })
})
