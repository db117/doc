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

const scope = 'https://www.googleapis.com/auth/drive.file'
const folderName = '个人净资产追踪'
const sessionKey = 'net-worth-google-drive-session'
const folderMime = 'application/vnd.google-apps.folder'
let accessToken: string | null = null
let accessTokenExpiresAt = 0
let rootFolderId: string | null = null

/** Google Identity Services 返回的访问令牌结果。 */
interface GoogleTokenResponse {
    /** 当前会话使用的 OAuth 访问令牌。 */
    access_token?: string
    /** 访问令牌剩余有效秒数。 */
    expires_in?: number
    /** 授权失败时返回的错误码。 */
    error?: string
}

/** Google Identity Services 令牌客户端的最小能力。 */
interface GoogleTokenClient {
    /** 弹出授权窗口并请求当前 scope 的访问令牌。 */
    requestAccessToken(options?: {prompt?: string}): void
}

declare global {
    /** Google Identity Services 注入到浏览器的全局类型。 */
    interface Window {
        /** Google Identity Services 注入的全局对象。 */
        google?: {accounts: {oauth2: {
            /** 创建用于请求 Google OAuth 访问令牌的客户端。 */
            initTokenClient(config: {client_id: string; scope: string; callback: (response: GoogleTokenResponse) => void}): GoogleTokenClient
        }}}
    }
}

let tokenClient: GoogleTokenClient | null = null
let pendingLogin: {resolve: (name: string) => void; reject: (error: Error) => void} | null = null

/** 清除内存和会话存储中的 Google Drive 授权状态。 */
function clearSession(): void {
    accessToken = null
    accessTokenExpiresAt = 0
    rootFolderId = null
    if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(sessionKey)
}

/** 从会话存储恢复仍在有效期内的访问令牌。 */
function restoreSession(): void {
    if (accessToken && Date.now() < accessTokenExpiresAt) return
    clearSession()
    if (typeof sessionStorage === 'undefined') return
    try {
        const stored = JSON.parse(sessionStorage.getItem(sessionKey) ?? 'null') as {accessToken?: unknown; expiresAt?: unknown} | null
        if (typeof stored?.accessToken === 'string' && typeof stored.expiresAt === 'number' && Date.now() < stored.expiresAt) {
            accessToken = stored.accessToken
            accessTokenExpiresAt = stored.expiresAt
        }
    } catch {
        clearSession()
    }
}

/** 按需加载 Google Identity Services 浏览器脚本。 */
function loadGoogleIdentity(): Promise<void> {
    if (window.google?.accounts.oauth2) return Promise.resolve()
    return new Promise((resolve, reject) => {
        const existing = document.querySelector<HTMLScriptElement>('script[data-net-worth-google-identity]')
        if (existing) {
            existing.addEventListener('load', () => resolve(), {once: true})
            existing.addEventListener('error', () => reject(new Error('无法加载 Google 登录组件。')), {once: true})
            return
        }
        const script = document.createElement('script')
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.dataset.netWorthGoogleIdentity = ''
        script.onload = () => resolve()
        script.onerror = () => reject(new Error('无法加载 Google 登录组件。'))
        document.head.append(script)
    })
}

/** 判断当前构建是否配置了 Google OAuth 客户端 ID。 */
export function googleDriveConfigured(): boolean {
    return true
}

/** 判断当前浏览器会话是否已连接 Google Drive。 */
export function googleDriveConnected(): boolean {
    restoreSession()
    return Boolean(accessToken)
}

/** 发起 Google OAuth 授权并保存会话访问令牌。 */
export async function beginGoogleDriveLogin(): Promise<string> {
    if (pendingLogin) throw new Error('Google Drive 登录窗口已经打开。')
    await loadGoogleIdentity()
    tokenClient ??= window.google!.accounts.oauth2.initTokenClient({
        client_id: '939659544768-eknl9bk0pmm5dik4perk87pscbegqv3l.apps.googleusercontent.com',
        scope,
        callback: response => {
            const pending = pendingLogin
            pendingLogin = null
            if (!pending) return
            if (!response.access_token || !response.expires_in || response.error) {
                pending.reject(new Error('Google Drive 登录失败或已取消。'))
                return
            }
            accessToken = response.access_token
            accessTokenExpiresAt = Date.now() + response.expires_in * 1000
            sessionStorage.setItem(sessionKey, JSON.stringify({accessToken, expiresAt: accessTokenExpiresAt}))
            pending.resolve('Google 账户')
        },
    })
    return new Promise((resolve, reject) => {
        pendingLogin = {resolve, reject}
        tokenClient!.requestAccessToken({prompt: 'consent'})
    })
}

/** 断开 Google Drive 并清除本地会话令牌。 */
export function disconnectGoogleDrive(): void {
    clearSession()
}

/** 保留 HTTP 状态码的 Google Drive 请求错误。 */
class DriveError extends Error {
    /** 用响应状态码创建可识别的请求错误。 */
    constructor(readonly status: number) {
        super(`Google Drive 请求失败（${status}）。`)
    }
}

/** 携带会话令牌调用 Google Drive REST API。 */
async function drive<T>(path: string, init: RequestInit = {}, upload = false): Promise<T> {
    restoreSession()
    if (!accessToken) throw new Error('请先连接 Google Drive。')
    const response = await fetch(`${upload ? 'https://www.googleapis.com/upload/drive/v3' : 'https://www.googleapis.com/drive/v3'}${path}`, {
        ...init,
        headers: {Authorization: `Bearer ${accessToken}`, ...(init.headers ?? {})},
    })
    if (response.status === 401) {
        clearSession()
        throw new Error('Google Drive 登录已过期，请重新连接。')
    }
    if (!response.ok) throw new DriveError(response.status)
    return response.status === 204 ? undefined as T : response.json() as Promise<T>
}

/** Google Drive API 返回的最小文件结构。 */
interface DriveFile {
    /** Google Drive 文件标识。 */
    id: string
    /** 文件或目录名称。 */
    name: string
    /** Google Drive 最后修改时间。 */
    modifiedTime?: string
    /** 文件字节数，API 使用字符串返回。 */
    size?: string
    /** 文件或目录的 MIME 类型。 */
    mimeType?: string
}

/** 将 Google Drive 文件结构转换为通用远端元数据。 */
function metadata(file: DriveFile): RemoteMetadata {
    return {id: file.id, name: file.name, lastModifiedDateTime: file.modifiedTime ?? '', size: Number(file.size ?? 0)}
}

/** 转义 Drive 查询语法中的反斜线和单引号。 */
function escapeQuery(value: string): string {
    return value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")
}

/** 按 Drive 查询语句列出应用可见文件。 */
async function listFiles(query: string): Promise<DriveFile[]> {
    const params = new URLSearchParams({
        q: query,
        spaces: 'drive',
        pageSize: '1000',
        fields: 'files(id,name,modifiedTime,size,mimeType)',
    })
    return (await drive<{files: DriveFile[]}>(`/files?${params}`)).files
}

/** 按文件 ID 查询元数据，文件不存在时返回空。 */
async function getFile(id: string): Promise<DriveFile | null> {
    try {
        return await drive<DriveFile>(`/files/${encodeURIComponent(id)}?fields=id,name,modifiedTime,size,mimeType`)
    } catch (error) {
        if (error instanceof DriveError && error.status === 404) return null
        throw error
    }
}

/** 创建 Google Drive 目录并返回目录元数据。 */
async function createFolder(name: string, parents?: string[], appProperties?: Record<string, string>): Promise<DriveFile> {
    return drive('/files?fields=id,name,modifiedTime,size,mimeType', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name, mimeType: folderMime, parents, appProperties}),
    })
}

/** 查找或创建带应用属性的可见账本根目录。 */
async function ensureRootFolder(): Promise<string> {
    if (rootFolderId && await getFile(rootFolderId)) return rootFolderId
    const query = `appProperties has { key='netWorthTracker' and value='copy-root' } and trashed = false`
    const existing = (await listFiles(query)).find(file => file.mimeType === folderMime)
    rootFolderId = existing?.id ?? (await createFolder(folderName, undefined, {netWorthTracker: 'copy-root'})).id
    return rootFolderId
}

/** 按父目录和名称查找一个未删除的直接子项。 */
async function findChild(parentId: string, name: string): Promise<DriveFile | null> {
    const query = `'${escapeQuery(parentId)}' in parents and name = '${escapeQuery(name)}' and trashed = false`
    return (await listFiles(query))[0] ?? null
}

/** 确保父目录下存在指定子目录并返回其 ID。 */
async function ensureChildFolder(parentId: string, name: string): Promise<string> {
    const existing = await findChild(parentId, name)
    if (existing?.mimeType === folderMime) return existing.id
    return (await createFolder(name, [parentId])).id
}

/** 在指定目录中创建或覆盖一个文件。 */
async function putFile(parentId: string, name: string, content: string, contentType: string): Promise<RemoteMetadata> {
    let file = await findChild(parentId, name)
    if (!file) {
        file = await drive<DriveFile>('/files?fields=id,name,modifiedTime,size,mimeType', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({name, parents: [parentId]}),
        })
    }
    const updated = await drive<DriveFile>(`/files/${encodeURIComponent(file.id)}?uploadType=media&fields=id,name,modifiedTime,size,mimeType`, {
        method: 'PATCH', headers: {'Content-Type': contentType}, body: content,
    }, true)
    return metadata(updated)
}

/** 下载指定文件并按账本格式完整校验。 */
async function downloadFile(id: string): Promise<LedgerFile> {
    return parseLedgerFile(await drive<unknown>(`/files/${encodeURIComponent(id)}?alt=media`))
}

/** 读取 Google Drive 当前账本文件元数据。 */
export async function getGoogleDriveMetadata(): Promise<RemoteMetadata | null> {
    const root = await ensureRootFolder()
    const file = await findChild(root, CLOUD_LEDGER_NAME)
    return file ? metadata(file) : null
}

/** 下载 Google Drive 当前账本及其元数据。 */
export async function downloadFromGoogleDrive(): Promise<{file: LedgerFile; metadata: RemoteMetadata}> {
    const root = await ensureRootFolder()
    const source = await findChild(root, CLOUD_LEDGER_NAME)
    if (!source) throw new Error('Google Drive 中还没有账本文件，请先执行备份。')
    return {file: await downloadFile(source.id), metadata: metadata(source)}
}

/** 覆盖 Google Drive 当前账本，并在内容变化时刷新当日历史。 */
export async function backupToGoogleDrive(file: LedgerFile, contentChanged = true): Promise<{metadata: RemoteMetadata; warning?: string}> {
    const root = await ensureRootFolder()
    const current = contentChanged
        ? await putFile(root, CLOUD_LEDGER_NAME, JSON.stringify(file), 'application/json')
        : await getGoogleDriveMetadata()
    if (!current) throw new Error('Google Drive 中还没有账本文件，请先执行备份。')
    try {
        if (!await findChild(root, CLOUD_README_NAME)) await putFile(root, CLOUD_README_NAME, CLOUD_README, 'text/plain; charset=utf-8')
        if (contentChanged) {
            const snapshot = cloudSnapshotPath()
            const history = await ensureChildFolder(root, 'history')
            const year = await ensureChildFolder(history, snapshot.year)
            await putFile(year, snapshot.name, JSON.stringify(file), 'application/json')
        }
        return {metadata: current}
    } catch {
        return {metadata: current, warning: '当前账本已保存，但 Google Drive 历史归档或说明文件写入失败。'}
    }
}

/** 列出 Google Drive 年份目录中的全部每日历史。 */
export async function listGoogleDriveSnapshots(): Promise<RemoteSnapshot[]> {
    const root = await ensureRootFolder()
    const history = await findChild(root, 'history')
    if (!history || history.mimeType !== folderMime) return []
    const years = (await listFiles(`'${escapeQuery(history.id)}' in parents and trashed = false`)).filter(file => file.mimeType === folderMime)
    const snapshots = (await Promise.all(years.map(async year => {
        const files = await listFiles(`'${escapeQuery(year.id)}' in parents and trashed = false`)
        return files.flatMap(file => {
            const date = snapshotDate(file.name)
            return date ? [{...metadata(file), date}] : []
        })
    }))).flat()
    return snapshots.sort((a, b) => b.date.localeCompare(a.date))
}

/** 备份页使用的 Google Drive 云端提供商实现。 */
export const googleDriveProvider: CloudProvider = {
    id: 'google-drive',
    label: 'Google Drive',
    configured: googleDriveConfigured,
    connected: googleDriveConnected,
    connect: beginGoogleDriveLogin,
    disconnect: disconnectGoogleDrive,
    metadata: getGoogleDriveMetadata,
    download: downloadFromGoogleDrive,
    save: backupToGoogleDrive,
    snapshots: listGoogleDriveSnapshots,
    downloadSnapshot: snapshot => downloadFile(snapshot.id),
}
