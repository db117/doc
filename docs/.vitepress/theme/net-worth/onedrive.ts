import {parseLedgerFile, type Ledger, type LedgerFile} from './ledger'

export interface OneDriveRemoteMetadata {
    name: string
    lastModifiedDateTime: string
    size: number
}

const clientId = import.meta.env.VITE_ONEDRIVE_CLIENT_ID as string | undefined
const authority = (import.meta.env.VITE_ONEDRIVE_AUTHORITY as string | undefined) ?? 'https://login.microsoftonline.com/consumers/oauth2/v2.0'
const scope = 'openid profile Files.ReadWrite.AppFolder'
const fileName = 'net-worth-ledger.json'
let accessToken: string | null = null
let pendingLogin: {
    state: string
    verifier: string
    popup: Window
    timer: number
    resolve: (name: string) => void
    reject: (error: Error) => void
} | null = null

function base64Url(value: ArrayBuffer): string {
    return btoa(String.fromCharCode(...new Uint8Array(value))).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

function randomText(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(32))
    return base64Url(bytes.buffer)
}

async function pkceChallenge(verifier: string): Promise<string> {
    return base64Url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)))
}

function redirectUri(): string {
    return `${window.location.origin}${window.location.pathname}`
}

function graphUrl(path: string): string {
    return `https://graph.microsoft.com/v1.0${path}`
}

async function graph<T>(path: string, init: RequestInit = {}): Promise<T> {
    if (!accessToken) throw new Error('请先连接 OneDrive。')
    const response = await fetch(graphUrl(path), {
        ...init,
        headers: {'Authorization': `Bearer ${accessToken}`, ...(init.headers ?? {})},
    })
    if (response.status === 401) {
        accessToken = null
        throw new Error('OneDrive 登录已过期，请重新连接。')
    }
    if (!response.ok) {
        if (response.status === 404) throw new Error('OneDrive 中还没有账本文件，请先执行备份。')
        throw new Error(`OneDrive 请求失败（${response.status}）。`)
    }
    return response.status === 204 ? undefined as T : response.json() as Promise<T>
}

function filePath(suffix: string): string {
    return `/me/drive/special/approot:/${encodeURIComponent(fileName)}${suffix.startsWith('?') ? suffix : `:${suffix}`}`
}

export function oneDriveConfigured(): boolean {
    return Boolean(clientId)
}

export function oneDriveConnected(): boolean {
    return Boolean(accessToken)
}

async function exchangeCode(code: string, state: string, verifier: string): Promise<string> {
    if (!clientId || !state || !verifier) throw new Error('OneDrive 登录校验失败。')
    const response = await fetch(`${authority}/token`, {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: new URLSearchParams({
            client_id: clientId,
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri(),
            code_verifier: verifier,
            scope,
        }),
    })
    if (!response.ok) throw new Error('OneDrive 登录失败，请检查应用注册和重定向地址。')
    const payload = await response.json() as { access_token?: string }
    if (!payload.access_token) throw new Error('OneDrive 登录响应缺少令牌。')
    accessToken = payload.access_token
    const user = await graph<{
        displayName?: string;
        userPrincipalName?: string
    }>('/me?$select=displayName,userPrincipalName')
    return user.displayName || user.userPrincipalName || 'Microsoft 账户'
}

export async function beginOneDriveLogin(): Promise<string> {
    if (!clientId) throw new Error('尚未配置 VITE_ONEDRIVE_CLIENT_ID。')
    if (pendingLogin) throw new Error('OneDrive 登录窗口已经打开。')
    const verifier = randomText()
    const state = randomText()
    sessionStorage.setItem('net-worth-onedrive-verifier', verifier)
    sessionStorage.setItem('net-worth-onedrive-state', state)
    const popup = window.open('', 'net-worth-onedrive-login', 'popup,width=520,height=720')
    if (!popup) throw new Error('登录窗口被浏览器拦截，请允许本站打开弹窗后重试。')
    const challenge = await pkceChallenge(verifier)
    const params = new URLSearchParams({
        client_id: clientId,
        response_type: 'code',
        redirect_uri: redirectUri(),
        response_mode: 'query',
        scope,
        state,
        code_challenge: challenge,
        code_challenge_method: 'S256',
    })
    return new Promise((resolve, reject) => {
        const timer = window.setInterval(() => {
            if (popup.closed) {
                window.clearInterval(timer)
                window.removeEventListener('message', onMessage)
                sessionStorage.removeItem('net-worth-onedrive-state')
                sessionStorage.removeItem('net-worth-onedrive-verifier')
                pendingLogin = null
                reject(new Error('OneDrive 登录窗口已关闭。'))
            }
        }, 500)
        const onMessage = (event: MessageEvent<{ type?: string; code?: string; state?: string }>) => {
            if (event.origin !== window.location.origin || event.data?.type !== 'net-worth-onedrive-auth') return
            if (!pendingLogin || event.data.state !== pendingLogin.state || !event.data.code) return
            window.clearInterval(timer)
            window.removeEventListener('message', onMessage)
            const current = pendingLogin
            pendingLogin = null
            sessionStorage.removeItem('net-worth-onedrive-state')
            sessionStorage.removeItem('net-worth-onedrive-verifier')
            void exchangeCode(event.data.code, event.data.state, current.verifier).then(current.resolve).catch(current.reject)
        }
        pendingLogin = {state, verifier, popup, timer, resolve, reject}
        window.addEventListener('message', onMessage)
        popup.location.href = `${authority}/authorize?${params}`
    })
}

export async function completeOneDriveLogin(): Promise<string | null> {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (!code) return null
    const state = params.get('state')
    if (window.opener && window.opener !== window) {
        window.opener.postMessage({type: 'net-worth-onedrive-auth', code, state}, window.location.origin)
        window.close()
        return null
    }
    const expectedState = sessionStorage.getItem('net-worth-onedrive-state')
    const verifier = sessionStorage.getItem('net-worth-onedrive-verifier')
    sessionStorage.removeItem('net-worth-onedrive-state')
    sessionStorage.removeItem('net-worth-onedrive-verifier')
    window.history.replaceState({}, document.title, redirectUri())
    if (!clientId || !state || state !== expectedState || !verifier) throw new Error('OneDrive 登录校验失败。')
    return exchangeCode(code, state, verifier)
}

export function disconnectOneDrive(): void {
    accessToken = null
}

export async function getOneDriveMetadata(): Promise<OneDriveRemoteMetadata | null> {
    try {
        return await graph<OneDriveRemoteMetadata>(filePath('?select=name,lastModifiedDateTime,size'))
    } catch (error) {
        if (error instanceof Error && error.message.includes('还没有账本文件')) return null
        throw error
    }
}

export async function backupToOneDrive(file: LedgerFile): Promise<OneDriveRemoteMetadata> {
    await graph<void>(filePath('/content'), {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(file),
    })
    return (await getOneDriveMetadata())!
}

export async function downloadFromOneDrive(): Promise<{ file: LedgerFile; metadata: OneDriveRemoteMetadata }> {
    const metadata = await getOneDriveMetadata()
    if (!metadata) throw new Error('OneDrive 中还没有账本文件，请先执行备份。')
    return {file: parseLedgerFile(await graph<unknown>(filePath('/content'))), metadata}
}
