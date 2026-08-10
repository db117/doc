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
    loadRollback: vi.fn().mockResolvedValue(null),
    saveLedger: vi.fn(),
    saveRollback: vi.fn(),
}))

vi.mock('../../docs/.vitepress/theme/net-worth/onedrive', () => ({
    backupToOneDrive: mocks.backupToOneDrive,
    beginOneDriveLogin: mocks.beginOneDriveLogin,
    completeOneDriveLogin: mocks.completeOneDriveLogin,
    disconnectOneDrive: vi.fn(),
    downloadFromOneDrive: vi.fn(),
    getOneDriveMetadata: mocks.getOneDriveMetadata,
    oneDriveConfigured: () => true,
    oneDriveConnected: () => false,
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
        name: 'net-worth-ledger.json',
        lastModifiedDateTime: '2026-08-10',
        size: 1
    })
})

test('connecting OneDrive never uploads until the user explicitly chooses backup', async () => {
    mocks.beginOneDriveLogin.mockResolvedValue('Tester')
    const view = setup()
    await (view.connectOneDrive as () => Promise<void>)()
    expect(mocks.getOneDriveMetadata).toHaveBeenCalledOnce()
    expect(mocks.backupToOneDrive).not.toHaveBeenCalled()

    mocks.completeOneDriveLogin.mockResolvedValue('Tester')
    setup()
    await mocks.mounted?.()
    expect(mocks.getOneDriveMetadata).toHaveBeenCalledTimes(2)
    expect(mocks.backupToOneDrive).not.toHaveBeenCalled()
})
