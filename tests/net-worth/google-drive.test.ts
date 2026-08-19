import {afterEach, beforeEach, expect, test, vi} from 'vitest'

/** 创建最小浏览器环境，捕获 Google 令牌请求而不打开真实授权页。 */
function stubBrowser(): {requests: ReturnType<typeof vi.fn>} {
    const values = new Map<string, string>()
    const requests = vi.fn((_options: {prompt?: string}) => {
        tokenCallback?.({access_token: 'token', expires_in: 3600})
    })
    let tokenCallback: ((response: {access_token: string; expires_in: number}) => void) | undefined
    vi.stubGlobal('sessionStorage', {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
        removeItem: (key: string) => values.delete(key),
    })
    vi.stubGlobal('window', {
        google: {accounts: {oauth2: {
            initTokenClient: ({callback}: {callback: (response: {access_token: string; expires_in: number}) => void}) => {
                tokenCallback = callback
                return {requestAccessToken: requests}
            },
        }}},
    })
    return {requests}
}

beforeEach(() => vi.resetModules())
afterEach(() => vi.unstubAllGlobals())

test('Google Drive 已有授权会话时不重复打开同意页', async () => {
    const {requests} = stubBrowser()
    const googleDrive = await import('../../docs/.vitepress/theme/net-worth/google-drive')

    await googleDrive.beginGoogleDriveLogin()
    expect(requests).toHaveBeenCalledWith({prompt: ''})

    await googleDrive.beginGoogleDriveLogin()
    expect(requests).toHaveBeenCalledOnce()
})
