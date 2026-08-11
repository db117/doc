import {emptyLedger, todayISO, validateLedger, type Ledger} from './ledger'

const DATABASE_NAME = 'net-worth-tracker'
const STORE_NAME = 'state'
const LEDGER_KEY = 'ledger'
const ROLLBACK_KEY = 'rollback'
const HISTORY_PREFIX = 'history:'

/** IndexedDB `state` store 中统一使用的键值结构。 */
interface StoredValue {
    /** 记录在 store 中的唯一键。 */
    key: string
    /** 对应键保存的完整账本。 */
    value: Ledger
}

/** 将响应式账本转成可被 IndexedDB 克隆的纯对象。 */
export function serializableLedger(ledger: Ledger): Ledger {
    // IndexedDB 不能克隆 Vue Proxy；JSON 往返同时确保只写入纯数据对象。
    return JSON.parse(JSON.stringify(validateLedger(ledger))) as Ledger
}

/** 打开本地账本使用的 IndexedDB 数据库。 */
function openDatabase(): Promise<IDBDatabase> {
    if (typeof indexedDB === 'undefined') return Promise.reject(new Error('当前浏览器不支持 IndexedDB。'))
    return new Promise((resolve, reject) => {
        // 当前只有一个 key-value store；后续结构变更必须提升数据库版本再迁移。
        const request = indexedDB.open(DATABASE_NAME, 1)
        request.onerror = () => reject(request.error ?? new Error('无法打开本地账本。'))
        request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME, {keyPath: 'key'})
        request.onsuccess = () => resolve(request.result)
    })
}

/** 读取当前本地账本，首次使用时返回空账本。 */
export async function loadLedger(): Promise<Ledger> {
    const database = await openDatabase()
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, 'readonly')
        const request = transaction.objectStore(STORE_NAME).get(LEDGER_KEY)
        request.onerror = () => reject(request.error ?? new Error('无法读取本地账本。'))
        request.onsuccess = () => {
            database.close()
            // 首次使用返回空账本；已有数据仍重新校验，隔离旧版本或损坏内容。
            if (!request.result) resolve(emptyLedger())
            else resolve(validateLedger((request.result as StoredValue).value))
        }
    })
}

/** 原子保存当前账本并覆盖当天的本地历史。 */
export async function saveLedger(ledger: Ledger): Promise<void> {
    // 先完整校验再开启写事务，防止部分无效状态覆盖可用账本。
    const checked = serializableLedger(ledger)
    const database = await openDatabase()
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, 'readwrite')
        const store = transaction.objectStore(STORE_NAME)
        store.put({key: LEDGER_KEY, value: checked} satisfies StoredValue)
        // 同一天反复写同一 key：本地每次变更刷新今日版本，但每天最多保留一份。
        store.put({key: `${HISTORY_PREFIX}${todayISO()}`, value: checked} satisfies StoredValue)
        transaction.onerror = () => reject(transaction.error ?? new Error('无法保存本地账本。'))
        transaction.oncomplete = () => {
            database.close()
            resolve()
        }
    })
}

/** 本地每日历史列表中的轻量条目。 */
export interface LedgerSnapshot {
    /** 快照对应的设备本地日期。 */
    date: string
}

/** 列出已有本地历史日期，不预先载入完整账本。 */
export async function listLedgerSnapshots(): Promise<LedgerSnapshot[]> {
    const database = await openDatabase()
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, 'readonly')
        const request = transaction.objectStore(STORE_NAME).getAllKeys()
        request.onerror = () => reject(request.error ?? new Error('无法读取本地历史。'))
        request.onsuccess = () => {
            database.close()
            resolve(request.result
                .filter((key): key is string => typeof key === 'string' && key.startsWith(HISTORY_PREFIX))
                .map(key => ({date: key.slice(HISTORY_PREFIX.length)}))
                .sort((a, b) => b.date.localeCompare(a.date)))
        }
    })
}

/** 按日期读取并校验一份本地历史账本。 */
export async function loadLedgerSnapshot(date: string): Promise<Ledger | null> {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('历史日期无效。')
    const database = await openDatabase()
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, 'readonly')
        const request = transaction.objectStore(STORE_NAME).get(`${HISTORY_PREFIX}${date}`)
        request.onerror = () => reject(request.error ?? new Error('无法读取本地历史。'))
        request.onsuccess = () => {
            database.close()
            resolve(request.result ? validateLedger((request.result as StoredValue).value) : null)
        }
    })
}

/** 保存覆盖或恢复操作之前的单槽回退账本。 */
export async function saveRollback(ledger: Ledger): Promise<void> {
    // 只保留最近一次覆盖前快照，这是单槽回退而不是历史版本系统。
    const checked = serializableLedger(ledger)
    const database = await openDatabase()
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, 'readwrite')
        transaction.objectStore(STORE_NAME).put({key: ROLLBACK_KEY, value: checked} satisfies StoredValue)
        transaction.onerror = () => reject(transaction.error ?? new Error('无法保存回退账本。'))
        transaction.oncomplete = () => {
            database.close()
            resolve()
        }
    })
}

/** 读取最近一次覆盖前的回退账本。 */
export async function loadRollback(): Promise<Ledger | null> {
    const database = await openDatabase()
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, 'readonly')
        const request = transaction.objectStore(STORE_NAME).get(ROLLBACK_KEY)
        request.onerror = () => reject(request.error ?? new Error('无法读取回退账本。'))
        request.onsuccess = () => {
            database.close()
            resolve(request.result ? validateLedger((request.result as StoredValue).value) : null)
        }
    })
}
