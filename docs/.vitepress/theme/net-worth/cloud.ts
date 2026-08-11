import {todayISO, type LedgerFile} from './ledger'

export const CLOUD_LEDGER_NAME = 'net-worth-ledger.json'
export const CLOUD_README_NAME = 'README.txt'
export const CLOUD_README = `个人净资产追踪云端副本

此目录由“个人净资产追踪”创建，包含当前账本和按天保存的历史版本。
“备份覆盖云端”会用本地账本替换当前文件；“云端覆盖本地”不会修改本目录。
“合并”按记录更新时间选择较新版本，单边记录会保留，删除不会通过合并传播。
请勿手工修改 JSON 文件；移动或重命名本目录不会影响 Google Drive 连接。
恢复历史版本只会覆盖当前浏览器数据，不会自动写回云端。
`

/** 云端文件的通用元数据。 */
export interface RemoteMetadata {
    /** 云端提供商分配的文件标识。 */
    id: string
    /** 云端文件名称。 */
    name: string
    /** 云端文件最后修改时间。 */
    lastModifiedDateTime: string
    /** 云端文件字节数。 */
    size: number
}

/** 可用于历史恢复的云端每日快照。 */
export interface RemoteSnapshot extends RemoteMetadata {
    /** 快照对应的设备本地日期。 */
    date: string
}

/** 云端保存操作的结果。 */
export interface RemoteSaveResult {
    /** 保存后的当前账本文件元数据。 */
    metadata: RemoteMetadata
    /** 当前账本成功但说明文件或历史归档失败时的提示。 */
    warning?: string
}

/** OneDrive 与 Google Drive 共同遵守的云端副本操作契约。 */
export interface CloudProvider {
    /** 提供商的稳定程序标识。 */
    id: 'onedrive' | 'google-drive'
    /** 提供商的界面显示名称。 */
    label: string
    /** 判断当前构建是否已配置 OAuth 客户端。 */
    configured(): boolean
    /** 判断当前浏览器会话是否持有有效访问令牌。 */
    connected(): boolean
    /** 发起用户授权并返回账户显示名称。 */
    connect(): Promise<string>
    /** 完成需要页面重定向的登录流程。 */
    completeLogin?(): Promise<string | null>
    /** 清除当前浏览器中的提供商会话。 */
    disconnect(): void
    /** 读取当前云端账本文件的元数据。 */
    metadata(): Promise<RemoteMetadata | null>
    /** 下载并校验当前云端账本文件。 */
    download(): Promise<{file: LedgerFile; metadata: RemoteMetadata}>
    /** 保存当前云端账本，并在内容变化时归档当日历史。 */
    save(file: LedgerFile, contentChanged: boolean): Promise<RemoteSaveResult>
    /** 列出可恢复的云端每日历史。 */
    snapshots(): Promise<RemoteSnapshot[]>
    /** 下载并校验指定的云端历史文件。 */
    downloadSnapshot(snapshot: RemoteSnapshot): Promise<LedgerFile>
}

/** 生成某一天的云端历史年份和文件名。 */
export function cloudSnapshotPath(date = todayISO()): {year: string; name: string} {
    return {year: date.slice(0, 4), name: `net-worth-ledger-${date}.json`}
}

/** 从标准云端历史文件名中解析日期。 */
export function snapshotDate(name: string): string | null {
    return /^net-worth-ledger-(\d{4}-\d{2}-\d{2})\.json$/.exec(name)?.[1] ?? null
}
