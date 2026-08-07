import {emptyLedger, validateLedger, type Ledger} from './ledger'

const DATABASE_NAME = 'net-worth-tracker'
const STORE_NAME = 'state'
const LEDGER_KEY = 'ledger'
const ROLLBACK_KEY = 'rollback'

interface StoredValue {
    key: string
    value: Ledger
}

export function serializableLedger(ledger: Ledger): Ledger {
    // IndexedDB 不能克隆 Vue Proxy；JSON 往返同时确保只写入纯数据对象。
    return JSON.parse(JSON.stringify(validateLedger(ledger))) as Ledger
}

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

export async function saveLedger(ledger: Ledger): Promise<void> {
    // 先完整校验再开启写事务，防止部分无效状态覆盖可用账本。
    const checked = serializableLedger(ledger)
    const database = await openDatabase()
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, 'readwrite')
        transaction.objectStore(STORE_NAME).put({key: LEDGER_KEY, value: checked} satisfies StoredValue)
        transaction.onerror = () => reject(transaction.error ?? new Error('无法保存本地账本。'))
        transaction.oncomplete = () => {
            database.close()
            resolve()
        }
    })
}

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
