import {beforeEach, expect, test, vi} from 'vitest'
import {emptyLedger} from '../../docs/.vitepress/theme/net-worth/ledger'

const mocks = vi.hoisted(() => ({
    mounted: undefined as (() => Promise<void>) | undefined,
    beginOneDriveLogin: vi.fn(),
    completeOneDriveLogin: vi.fn(),
    getOneDriveMetadata: vi.fn(),
    backupToOneDrive: vi.fn(),
}))

vi.mock('vue', async importOriginal => ({
    ...await importOriginal<typeof import('vue')>(),
    onMounted: (callback: () => Promise<void>) => {
        mocks.mounted = callback
    },
    useSSRContext: () => ({modules: new Set<string>()}),
}))

vi.mock('../../docs/.vitepress/theme/net-worth/storage', () => ({
    listLedgerSnapshots: vi.fn().mockResolvedValue([]),
    loadLedgerSnapshot: vi.fn(),
    loadRollback: vi.fn().mockResolvedValue(null),
    saveLedger: vi.fn(),
    saveRollback: vi.fn(),
}))

vi.mock('../../docs/.vitepress/theme/net-worth/onedrive', () => ({
    oneDriveProvider: {
        id: 'onedrive',
        label: 'OneDrive',
        configured: () => true,
        connected: () => false,
        connect: mocks.beginOneDriveLogin,
        completeLogin: mocks.completeOneDriveLogin,
        disconnect: vi.fn(),
        metadata: mocks.getOneDriveMetadata,
        download: vi.fn(),
        save: mocks.backupToOneDrive,
        snapshots: vi.fn().mockResolvedValue([]),
        downloadSnapshot: vi.fn(),
    },
}))

import BackupView from '../../docs/.vitepress/theme/net-worth/BackupView.vue'

function setup() {
    const component = BackupView as unknown as {
        setup: (props: object, context: object) => Record<string, unknown>
    }
    return component.setup({ledger: emptyLedger()}, {expose: vi.fn(), emit: vi.fn()})
}

beforeEach(() => {
    vi.clearAllMocks()
    mocks.getOneDriveMetadata.mockResolvedValue({
        id: 'ledger',
        name: 'net-worth-ledger.json',
        lastModifiedDateTime: '2026-08-10',
        size: 1
    })
})

test('connecting OneDrive never uploads until the user explicitly chooses backup', async () => {
    mocks.beginOneDriveLogin.mockResolvedValue('Tester')
    const view = setup()
    const state = (view.providers as Array<object>)[0]
    await (view.connectProvider as (state: object) => Promise<void>)(state)
    expect(mocks.getOneDriveMetadata).toHaveBeenCalledOnce()
    expect(mocks.backupToOneDrive).not.toHaveBeenCalled()

    mocks.completeOneDriveLogin.mockResolvedValue('Tester')
    setup()
    await mocks.mounted?.()
    expect(mocks.getOneDriveMetadata).toHaveBeenCalledTimes(2)
    expect(mocks.backupToOneDrive).not.toHaveBeenCalled()
})
