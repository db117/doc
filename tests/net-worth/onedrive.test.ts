import {afterEach, beforeEach, expect, test, vi} from 'vitest'

const sessionKey = 'net-worth-onedrive-session'

function stubBrowser(values = new Map<string, string>()): Map<string, string> {
    vi.stubGlobal('sessionStorage', {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
        removeItem: (key: string) => values.delete(key),
    })
    vi.stubGlobal('document', {title: 'Net worth'})
    vi.stubGlobal('window', {
        location: {origin: 'https://example.com', pathname: '/net-worth', search: '?code=code&state=expected-state'},
        opener: null,
        history: {replaceState: vi.fn()},
    })
    return values
}

beforeEach(() => vi.resetModules())
afterEach(() => vi.unstubAllGlobals())

test('restores a valid OneDrive session after reload and clears it on disconnect', async () => {
    const values = stubBrowser(new Map([
        ['net-worth-onedrive-state', 'expected-state'],
        ['net-worth-onedrive-verifier', 'verifier'],
    ]))
    vi.stubGlobal('fetch', vi.fn()
        .mockResolvedValueOnce({ok: true, json: async () => ({access_token: 'token', expires_in: 3600})})
        .mockResolvedValueOnce({ok: true, status: 200, json: async () => ({displayName: 'Tester'})}))

    const loggedIn = await import('../../docs/.vitepress/theme/net-worth/onedrive')
    expect(await loggedIn.completeOneDriveLogin()).toBe('Tester')

    vi.resetModules()
    const afterReload = await import('../../docs/.vitepress/theme/net-worth/onedrive')
    expect(afterReload.oneDriveConnected()).toBe(true)
    afterReload.disconnectOneDrive()
    expect(values.has(sessionKey)).toBe(false)
})

test('discards an expired OneDrive session', async () => {
    const values = stubBrowser(new Map([[sessionKey, JSON.stringify({
        accessToken: 'expired',
        expiresAt: Date.now() - 1
    })]]))
    const afterExpiry = await import('../../docs/.vitepress/theme/net-worth/onedrive')

    expect(afterExpiry.oneDriveConnected()).toBe(false)
    expect(values.has(sessionKey)).toBe(false)
})
