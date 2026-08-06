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
    return JSON.parse(JSON.stringify(validateLedger(ledger))) as Ledger
}

function openDatabase(): Promise<IDBDatabase> {
    if (typeof indexedDB === 'undefined') return Promise.reject(new Error('当前浏览器不支持 IndexedDB。'))
    return new Promise((resolve, reject) => {
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
            if (!request.result) resolve(emptyLedger())
            else resolve(validateLedger((request.result as StoredValue).value))
        }
    })
}

export async function saveLedger(ledger: Ledger): Promise<void> {
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
