import {parseLedgerFile, type LedgerFile} from './ledger'
import {
    CLOUD_LEDGER_NAME,
    CLOUD_README,
    CLOUD_README_NAME,
    cloudSnapshotPath,
    snapshotDate,
    type CloudProvider,
    type RemoteMetadata,
    type RemoteSnapshot,
} from './cloud'

/** OneDrive 当前账本文件的通用云端元数据。 */
export type OneDriveRemoteMetadata = RemoteMetadata

// 文件只访问应用目录；User.Read 仅用于在连接状态中展示当前账户名称。
const clientId = '2cb1afa5-2310-4eed-bdd9-78084173ed5e'
const authority = 'https://login.microsoftonline.com/consumers/oauth2/v2.0'
const scope = 'openid profile User.Read Files.ReadWrite.AppFolder'
const sessionKey = 'net-worth-onedrive-session'
let accessToken: string | null = null
let accessTokenExpiresAt = 0
// 同一页面只允许一个登录事务，避免多个弹窗互相覆盖 state/verifier。
let pendingLogin: {
    state: string
    verifier: string
    popup: Window
    timer: number
    resolve: (name: string) => void
    reject: (error: Error) => void
} | null = null

/** 清除内存和会话存储中的 OneDrive 授权状态。 */
function clearOneDriveSession(): void {
    accessToken = null
    accessTokenExpiresAt = 0
    if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(sessionKey)
}

/** 从会话存储恢复仍在有效期内的 OneDrive 令牌。 */
function restoreOneDriveSession(): void {
    if (accessToken && Date.now() < accessTokenExpiresAt) return
    accessToken = null
    accessTokenExpiresAt = 0
    if (typeof sessionStorage === 'undefined') return
    try {
        const stored = JSON.parse(sessionStorage.getItem(sessionKey) ?? 'null') as {
            accessToken?: unknown
            expiresAt?: unknown
        } | null
        if (typeof stored?.accessToken === 'string' && typeof stored.expiresAt === 'number'
            && Number.isFinite(stored.expiresAt) && Date.now() < stored.expiresAt) {
            accessToken = stored.accessToken
            accessTokenExpiresAt = stored.expiresAt
        } else {
            sessionStorage.removeItem(sessionKey)
        }
    } catch {
        sessionStorage.removeItem(sessionKey)
    }
}

/** 将二进制内容编码为 PKCE 使用的 Base64 URL 文本。 */
function base64Url(value: ArrayBuffer): string {
    return btoa(String.fromCharCode(...new Uint8Array(value))).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

/** 生成 OAuth state 或 PKCE verifier 使用的随机文本。 */
function randomText(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(32))
    return base64Url(bytes.buffer)
}

/** 根据 verifier 计算 SHA-256 PKCE challenge。 */
async function pkceChallenge(verifier: string): Promise<string> {
    return base64Url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)))
}

/** 返回当前净资产工具页对应的 OAuth 回调地址。 */
function redirectUri(): string {
    // Microsoft 注册的重定向 URI 必须与当前工具页精确一致。
    return `${window.location.origin}${window.location.pathname}`
}

/** 将 Graph 相对路径转换为完整 API 地址。 */
function graphUrl(path: string): string {
    return `https://graph.microsoft.com/v1.0${path}`
}

/** 保留 HTTP 状态码的 Microsoft Graph 请求错误。 */
class GraphError extends Error {
    /** 用响应状态码创建可识别的请求错误。 */
    constructor(readonly status: number) {
        super(`OneDrive 请求失败（${status}）。`)
    }
}

/** 携带会话令牌调用 Microsoft Graph API。 */
async function graph<T>(path: string, init: RequestInit = {}): Promise<T> {
    restoreOneDriveSession()
    if (!accessToken) throw new Error('请先连接 OneDrive。')
    const response = await fetch(graphUrl(path), {
        ...init,
        headers: {'Authorization': `Bearer ${accessToken}`, ...(init.headers ?? {})},
    })
    if (response.status === 401) {
        clearOneDriveSession()
        throw new Error('OneDrive 登录已过期，请重新连接。')
    }
    // 写操作不自动重试：PUT 表示显式覆盖，失败后交给用户确认是否再次执行。
    if (!response.ok) {
        throw new GraphError(response.status)
    }
    return response.status === 204 ? undefined as T : response.json() as Promise<T>
}

/** 生成 OneDrive 应用目录中的路径寻址地址。 */
function itemPath(relativePath: string, suffix = ''): string {
    // special/approot 把读写限制在应用专属目录，不触碰用户其他网盘文件。
    const encoded = relativePath.split('/').map(encodeURIComponent).join('/')
    return `/me/drive/special/approot:/${encoded}${suffix}`
}

/** 读取应用目录中的文件元数据，不存在时返回空。 */
async function optionalItem(relativePath: string): Promise<RemoteMetadata | null> {
    try {
        return await graph<RemoteMetadata>(itemPath(relativePath, '?$select=id,name,lastModifiedDateTime,size'))
    } catch (error) {
        if (error instanceof GraphError && error.status === 404) return null
        throw error
    }
}

/** 在 OneDrive 应用目录中创建或覆盖文件内容。 */
async function putContent(relativePath: string, content: string, contentType: string): Promise<void> {
    await graph<void>(itemPath(relativePath, ':/content'), {
        method: 'PUT', headers: {'Content-Type': contentType}, body: content,
    })
}

/** 确保应用目录指定位置存在目标子目录。 */
async function ensureFolder(parentPath: string, name: string): Promise<void> {
    const relativePath = parentPath ? `${parentPath}/${name}` : name
    if (await optionalItem(relativePath)) return
    const childrenPath = parentPath
        ? itemPath(parentPath, ':/children')
        : '/me/drive/special/approot/children'
    try {
        await graph(childrenPath, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({name, folder: {}}),
        })
    } catch (error) {
        if (!(error instanceof GraphError) || error.status !== 409) throw error
    }
}

/** 在应用目录缺少说明文件时创建 README。 */
async function ensureReadme(): Promise<void> {
    if (!await optionalItem(CLOUD_README_NAME)) await putContent(CLOUD_README_NAME, CLOUD_README, 'text/plain; charset=utf-8')
}

/** 将附加备份步骤的失败转换为不泄露响应内容的用户提示。 */
function auxiliaryFailure(step: string, error: unknown): string {
    return `${step}失败${error instanceof GraphError ? `（HTTP ${error.status}）` : ''}`
}

/** 判断当前构建是否配置了 OneDrive 客户端。 */
export function oneDriveConfigured(): boolean {
    return Boolean(clientId)
}

/** 判断当前浏览器会话是否已连接 OneDrive。 */
export function oneDriveConnected(): boolean {
    restoreOneDriveSession()
    return Boolean(accessToken)
}

/** 使用授权码和 PKCE verifier 换取访问令牌。 */
async function exchangeCode(code: string, state: string, verifier: string): Promise<string> {
    // 纯前端应用使用 PKCE 换令牌，不持有也不需要客户端密钥。
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
    const payload = await response.json() as { access_token?: string; expires_in?: number }
    if (!payload.access_token || typeof payload.expires_in !== 'number'
        || !Number.isFinite(payload.expires_in) || payload.expires_in <= 0) {
        throw new Error('OneDrive 登录响应缺少有效令牌。')
    }
    accessToken = payload.access_token
    accessTokenExpiresAt = Date.now() + payload.expires_in * 1000
    sessionStorage.setItem(sessionKey, JSON.stringify({accessToken, expiresAt: accessTokenExpiresAt}))
    const user = await graph<{ displayName?: string; userPrincipalName?: string }>(
        '/me?$select=displayName,userPrincipalName',
    )
    return user.displayName || user.userPrincipalName || 'Microsoft 账户'
}

/** 打开 OneDrive OAuth 弹窗并等待授权完成。 */
export async function beginOneDriveLogin(): Promise<string> {
    if (!clientId) throw new Error('尚未配置 VITE_ONEDRIVE_CLIENT_ID。')
    if (pendingLogin) throw new Error('OneDrive 登录窗口已经打开。')
    const verifier = randomText()
    const state = randomText()
    sessionStorage.setItem('net-worth-onedrive-verifier', verifier)
    sessionStorage.setItem('net-worth-onedrive-state', state)
    // 先同步打开空窗口，避免等待 PKCE 计算后触发浏览器的弹窗拦截。
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
        /** 接收并校验 OneDrive 授权窗口返回的登录结果。 */
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

/** 处理 OneDrive 回调参数并完成弹窗或当前页登录。 */
export async function completeOneDriveLogin(): Promise<string | null> {
    // 弹窗模式把授权码交还父页；直接回调模式则在当前页完成兑换，兼容浏览器限制。
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

/** 断开 OneDrive 并清除本地会话令牌。 */
export function disconnectOneDrive(): void {
    clearOneDriveSession()
}

/** 读取 OneDrive 当前账本文件元数据。 */
export async function getOneDriveMetadata(): Promise<OneDriveRemoteMetadata | null> {
    return optionalItem(CLOUD_LEDGER_NAME)
}

/** 覆盖 OneDrive 当前账本，并在内容变化时刷新当日历史。 */
export async function backupToOneDrive(file: LedgerFile, contentChanged = true): Promise<{metadata: RemoteMetadata; warning?: string}> {
    if (contentChanged) await putContent(CLOUD_LEDGER_NAME, JSON.stringify(file), 'application/json')
    const metadata = await getOneDriveMetadata()
    if (!metadata) throw new Error('OneDrive 中还没有账本文件，请先执行备份。')
    const failures: string[] = []
    try {
        await ensureReadme()
    } catch (error) {
        failures.push(auxiliaryFailure(`${CLOUD_README_NAME} 写入`, error))
    }
    if (contentChanged) {
        const snapshot = cloudSnapshotPath()
        let step = 'history 目录创建'
        try {
            await ensureFolder('', 'history')
            step = `history/${snapshot.year} 目录创建`
            await ensureFolder('history', snapshot.year)
            step = `history/${snapshot.year}/${snapshot.name} 写入`
            await putContent(`history/${snapshot.year}/${snapshot.name}`, JSON.stringify(file), 'application/json')
        } catch (error) {
            failures.push(auxiliaryFailure(step, error))
        }
    }
    return failures.length ? {metadata, warning: `当前账本已保存，但 OneDrive ${failures.join('；')}。`} : {metadata}
}

/** 下载 OneDrive 当前账本及其元数据。 */
export async function downloadFromOneDrive(): Promise<{ file: LedgerFile; metadata: OneDriveRemoteMetadata }> {
    const metadata = await getOneDriveMetadata()
    if (!metadata) throw new Error('OneDrive 中还没有账本文件，请先执行备份。')
    // 远端内容仍视为不可信输入，下载后必须走与本地上传相同的版本校验。
    return {file: parseLedgerFile(await graph<unknown>(itemPath(CLOUD_LEDGER_NAME, ':/content'))), metadata}
}

/** Microsoft Graph 列表接口的最小响应结构。 */
interface DriveItems {
    /** 当前响应页中的文件或目录。 */
    value: Array<RemoteMetadata & {folder?: unknown}>
}

/** 列出 OneDrive 年份目录中的全部每日历史。 */
export async function listOneDriveSnapshots(): Promise<RemoteSnapshot[]> {
    if (!await optionalItem('history')) return []
    const years = await graph<DriveItems>(itemPath('history', ':/children?$select=id,name,folder&$top=999'))
    const snapshots = (await Promise.all(years.value.filter(item => item.folder).map(async year => {
        const files = await graph<DriveItems>(itemPath(`history/${year.name}`, ':/children?$select=id,name,lastModifiedDateTime,size&$top=400'))
        return files.value.flatMap(file => {
            const date = snapshotDate(file.name)
            return date ? [{...file, date}] : []
        })
    }))).flat()
    return snapshots.sort((a, b) => b.date.localeCompare(a.date))
}

/** 下载并校验指定的 OneDrive 历史文件。 */
export async function downloadOneDriveSnapshot(snapshot: RemoteSnapshot): Promise<LedgerFile> {
    return parseLedgerFile(await graph<unknown>(`/me/drive/items/${encodeURIComponent(snapshot.id)}/content`))
}

/** 备份页使用的 OneDrive 云端提供商实现。 */
export const oneDriveProvider: CloudProvider = {
    id: 'onedrive',
    label: 'OneDrive',
    configured: oneDriveConfigured,
    connected: oneDriveConnected,
    connect: beginOneDriveLogin,
    completeLogin: completeOneDriveLogin,
    disconnect: disconnectOneDrive,
    metadata: getOneDriveMetadata,
    download: downloadFromOneDrive,
    save: backupToOneDrive,
    snapshots: listOneDriveSnapshots,
    downloadSnapshot: downloadOneDriveSnapshot,
}
