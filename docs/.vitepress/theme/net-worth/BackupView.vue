<script setup lang="ts">
import {onMounted, ref} from 'vue'
import {makeLedgerFile, parseLedgerFile, type Ledger} from './ledger'
import {loadRollback, saveLedger, saveRollback} from './storage'
import {
  backupToOneDrive as backupOneDriveFile,
  beginOneDriveLogin,
  completeOneDriveLogin,
  disconnectOneDrive,
  downloadFromOneDrive,
  getOneDriveMetadata,
  oneDriveConfigured,
  oneDriveConnected,
  type OneDriveRemoteMetadata,
} from './onedrive'

const props = defineProps<{ ledger: Ledger }>()
const emit = defineEmits<{ replaceLedger: [ledger: Ledger] }>()

const actionError = ref('')
const statusMessage = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const importLedger = ref<Ledger | null>(null)
const importMetadata = ref<{
  exportedAt: string
  accountCount: number
  balanceCount: number
  dateRange: string
} | null>(null)
const rollbackAvailable = ref(false)
const oneDriveConfiguredState = oneDriveConfigured()
const oneDriveConnectedState = ref(false)
const oneDriveName = ref('')
const oneDriveBusy = ref(false)
const remoteMetadata = ref<OneDriveRemoteMetadata | null>(null)

function setStatus(message: string): void {
  statusMessage.value = message
  window.setTimeout(() => {
    if (statusMessage.value === message) statusMessage.value = ''
  }, 2600)
}

function downloadLedger(): void {
  const blob = new Blob([JSON.stringify(makeLedgerFile(props.ledger), null, 2)], {type: 'application/json'})
  const link = document.createElement('a')
  const stamp = new Date().toISOString().replace(/[.:]/g, '-').replace('T', '_').slice(0, 19)
  link.href = URL.createObjectURL(blob)
  link.download = `net-worth-ledger-${stamp}.json`
  link.click()
  URL.revokeObjectURL(link.href)
  setStatus('账本已下载')
}

function triggerImport(): void {
  fileInput.value?.click()
}

function setImportPreview(file: { exportedAt: string; ledger: Ledger }): void {
  const dates = file.ledger.balances.map(record => record.date).sort()
  importLedger.value = file.ledger
  importMetadata.value = {
    exportedAt: file.exportedAt,
    accountCount: file.ledger.accounts.length,
    balanceCount: file.ledger.balances.length,
    dateRange: dates.length ? `${dates[0]} ～ ${dates[dates.length - 1]}` : '暂无余额记录',
  }
}

async function onImportFile(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  try {
    setImportPreview(parseLedgerFile(JSON.parse(await file.text())))
    actionError.value = ''
  } catch (error) {
    importLedger.value = null
    importMetadata.value = null
    actionError.value = error instanceof Error ? error.message : '无法读取备份文件。'
  }
}

async function connectOneDrive(): Promise<void> {
  oneDriveBusy.value = true
  try {
    oneDriveName.value = await beginOneDriveLogin()
    oneDriveConnectedState.value = true
    remoteMetadata.value = await getOneDriveMetadata()
    await backupToOneDrive(false)
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : '无法连接 OneDrive。'
  } finally {
    oneDriveBusy.value = false
  }
}

function disconnectOneDriveAccount(): void {
  disconnectOneDrive()
  oneDriveConnectedState.value = false
  oneDriveName.value = ''
  remoteMetadata.value = null
  setStatus('已断开 OneDrive')
}

async function refreshOneDriveMetadata(): Promise<void> {
  if (!oneDriveConnectedState.value) return
  oneDriveBusy.value = true
  try {
    remoteMetadata.value = await getOneDriveMetadata()
    actionError.value = ''
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : '无法读取 OneDrive 状态。'
  } finally {
    oneDriveBusy.value = false
  }
}

async function backupToOneDrive(confirmBeforeUpload = true): Promise<void> {
  if (!oneDriveConnectedState.value) return
  if (confirmBeforeUpload && !window.confirm(`用当前本地账本覆盖 OneDrive${remoteMetadata.value ? `（远程时间：${remoteMetadata.value.lastModifiedDateTime}）` : ''}吗？`)) return
  oneDriveBusy.value = true
  try {
    remoteMetadata.value = await backupOneDriveFile(makeLedgerFile(props.ledger))
    actionError.value = ''
    setStatus('已备份到 OneDrive')
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : 'OneDrive 备份失败。'
  } finally {
    oneDriveBusy.value = false
  }
}

async function syncFromOneDrive(): Promise<void> {
  if (!oneDriveConnectedState.value) return
  oneDriveBusy.value = true
  try {
    const remote = await downloadFromOneDrive()
    remoteMetadata.value = remote.metadata
    setImportPreview(remote.file)
    actionError.value = ''
    setStatus('已读取 OneDrive 账本，请确认覆盖本地')
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : '读取 OneDrive 账本失败。'
  } finally {
    oneDriveBusy.value = false
  }
}

async function applyImportedLedger(): Promise<void> {
  if (!importLedger.value || !window.confirm('确认用上传的账本覆盖当前浏览器数据吗？当前数据会保存在最近一次回退中。')) return
  try {
    await saveRollback(props.ledger)
    await saveLedger(importLedger.value)
    emit('replaceLedger', importLedger.value)
    rollbackAvailable.value = true
    importLedger.value = null
    importMetadata.value = null
    setStatus('本地账本已替换')
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : '覆盖本地账本失败。'
  }
}

async function restoreRollback(): Promise<void> {
  const rollback = await loadRollback()
  if (!rollback || !window.confirm('确认恢复覆盖前的本地账本吗？当前数据不会再次保存到回退槽。')) return
  try {
    await saveLedger(rollback)
    emit('replaceLedger', rollback)
    setStatus('已恢复覆盖前账本')
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : '恢复回退账本失败。'
  }
}

onMounted(async () => {
  rollbackAvailable.value = Boolean(await loadRollback())
  try {
    const name = await completeOneDriveLogin()
    if (name) {
      oneDriveConnectedState.value = true
      oneDriveName.value = name
      remoteMetadata.value = await getOneDriveMetadata()
      await backupToOneDrive(false)
    } else {
      oneDriveConnectedState.value = oneDriveConnected()
    }
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : 'OneDrive 连接失败。'
  }
})
</script>

<template>
  <section class="backup-view">
    <input ref="fileInput" class="hidden-file-input" type="file" accept=".json,application/json"
           @change="onImportFile">
    <div v-if="statusMessage" class="toast" role="status">{{ statusMessage }}</div>
    <div class="section-heading">
      <div><h2>本地备份</h2>
        <p>下载和上传使用同一份版本化 JSON；上传会覆盖本地，不做合并。</p></div>
    </div>
    <section class="onedrive-panel">
      <div class="section-heading compact">
        <div><h3>OneDrive（可选）</h3>
          <p v-if="!oneDriveConfiguredState">当前站点尚未配置 Microsoft 应用，仍可正常使用本地备份。</p>
          <p v-else-if="!oneDriveConnectedState">连接后只访问 OneDrive 应用目录。</p>
          <p v-else>已连接 {{ oneDriveName || 'Microsoft 账户' }} · 本地：{{ ledger.updatedAt }} ·
            远程：{{ remoteMetadata ? remoteMetadata.lastModifiedDateTime : '尚未备份' }}</p></div>
        <button v-if="oneDriveConnectedState" class="quiet-button" type="button" @click="disconnectOneDriveAccount">
          断开
        </button>
      </div>
      <div v-if="oneDriveConfiguredState && !oneDriveConnectedState" class="backup-actions">
        <button class="primary-button" type="button" :disabled="oneDriveBusy" @click="connectOneDrive">
          登录并备份到 OneDrive
        </button>
      </div>
      <div v-if="oneDriveConnectedState" class="backup-actions">
        <button class="primary-button" type="button" :disabled="oneDriveBusy" @click="backupToOneDrive">
          备份到 OneDrive
        </button>
        <button class="secondary-button" type="button" :disabled="oneDriveBusy" @click="syncFromOneDrive">
          从 OneDrive 同步
        </button>
        <button class="quiet-button" type="button" :disabled="oneDriveBusy" @click="refreshOneDriveMetadata">
          刷新远程时间
        </button>
      </div>
    </section>
    <div class="backup-actions">
      <button class="primary-button" type="button" @click="downloadLedger">下载当前账本</button>
      <button class="secondary-button" type="button" @click="triggerImport">上传账本文件</button>
    </div>
    <div v-if="importMetadata" class="backup-preview">
      <h3>上传预览</h3>
      <p>导出时间：{{ importMetadata.exportedAt }}</p>
      <p>{{ importMetadata.accountCount }} 个账户 · {{ importMetadata.balanceCount }} 条余额记录 ·
        {{ importMetadata.dateRange }}</p>
      <button class="primary-button" type="button" @click="applyImportedLedger">确认覆盖本地</button>
    </div>
    <div v-if="rollbackAvailable" class="backup-rollback">
      <div><strong>有一份覆盖前回退</strong>
        <p>仅保留最近一次覆盖前的本地账本。</p></div>
      <button class="quiet-button" type="button" @click="restoreRollback">恢复回退账本</button>
    </div>
    <div v-if="actionError" class="notice error" role="alert">{{ actionError }}</div>
  </section>
</template>

<style scoped src="./BackupView.css"></style>
