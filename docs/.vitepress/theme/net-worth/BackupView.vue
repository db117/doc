<script setup lang="ts">
import {onMounted, reactive, ref, watch} from 'vue'
import {makeLedgerFile, parseLedgerFile, type Ledger} from './ledger'
import {mergeLedgers, sameLedgerContents, type MergeResult} from './merge'
import {
  listLedgerSnapshots,
  loadLedgerSnapshot,
  loadRollback,
  saveLedger,
  saveRollback,
  type LedgerSnapshot,
} from './storage'
import {type CloudProvider, type RemoteMetadata, type RemoteSnapshot} from './cloud'
import {oneDriveProvider} from './onedrive'
import {googleDriveProvider} from './google-drive'

const props = defineProps<{ ledger: Ledger }>()
const emit = defineEmits<{ replaceLedger: [ledger: Ledger] }>()

/** 单个云端提供商在备份页中的响应式状态。 */
interface ProviderState {
  /** 提供商能力实现。 */
  provider: CloudProvider
  /** 当前构建是否配置该提供商。 */
  configured: boolean
  /** 当前浏览器会话是否已连接。 */
  connected: boolean
  /** 授权后显示的账户名称。 */
  accountName: string
  /** 是否正在执行该提供商的异步操作。 */
  busy: boolean
  /** 当前云端账本文件元数据。 */
  metadata: RemoteMetadata | null
  /** 当前提供商可恢复的历史快照。 */
  snapshots: RemoteSnapshot[]
}

/** 覆盖本地账本前展示的数据摘要。 */
interface ReplacePreview {
  /** 确认后将写入本地的账本。 */
  ledger: Ledger
  /** 预览区域标题。 */
  title: string
  /** 账本文件的生成时间。 */
  exportedAt: string
  /** 账本中的账户数量。 */
  accountCount: number
  /** 账本中的余额记录数量。 */
  balanceCount: number
  /** 余额记录覆盖的月份范围。 */
  dateRange: string
  /** 用户确认覆盖时显示的提示文本。 */
  confirmation: string
  /** 覆盖成功后显示的状态文本。 */
  success: string
}

/** 云端合并确认前保留的计算结果和版本信息。 */
interface MergePreviewState {
  /** 本次合并使用的提供商状态。 */
  state: ProviderState
  /** 生成预览时下载的云端账本。 */
  remoteLedger: Ledger
  /** 生成预览时的云端最后修改时间。 */
  remoteModifiedAt: string
  /** 合并后的账本和分类计数。 */
  result: MergeResult
}

// 云端提供商连接与文件状态
const providers = reactive<ProviderState[]>([oneDriveProvider, googleDriveProvider].map(provider => ({
  provider,
  configured: provider.configured(),
  connected: provider.connected(),
  accountName: '',
  busy: false,
  metadata: null,
  snapshots: [],
})))

// 当前操作的反馈信息
const actionError = ref('')
const actionWarning = ref('')
const statusMessage = ref('')

// 导入、覆盖、合并和失败重试状态
const fileInput = ref<HTMLInputElement | null>(null)
const replacePreview = ref<ReplacePreview | null>(null)
const mergePreview = ref<MergePreviewState | null>(null)
const retryTarget = ref<{state: ProviderState; ledger: Ledger} | null>(null)

// 本地历史与单步回退状态
const rollbackAvailable = ref(false)
const localSnapshots = ref<LedgerSnapshot[]>([])

/** 显示一条会自动消失的成功状态。 */
function setStatus(message: string): void {
  statusMessage.value = message
  window.setTimeout(() => {
    if (statusMessage.value === message) statusMessage.value = ''
  }, 2600)
}

/** 清空上一次操作留下的错误和警告。 */
function clearFeedback(): void {
  actionError.value = ''
  actionWarning.value = ''
}

/** 判断错误是否来自登录、连接或云端请求本身。 */
function isRemoteAccessError(error: unknown): boolean {
  return error instanceof Error && /(OneDrive|Google Drive|登录|连接|请求失败)/.test(error.message)
}

/** 将 ISO 时间格式化为中文本地时间。 */
function formatTime(value: string): string {
  if (!value) return '未知'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('zh-CN')
}

/** 根据账本文件生成统一的覆盖预览摘要。 */
function fileSummary(file: {exportedAt: string; ledger: Ledger}, title: string, confirmation: string, success: string): ReplacePreview {
  const dates = file.ledger.balances.map(record => record.date).sort()
  return {
    ledger: file.ledger,
    title,
    exportedAt: file.exportedAt,
    accountCount: file.ledger.accounts.length,
    balanceCount: file.ledger.balances.length,
    dateRange: dates.length ? `${dates[0]} ～ ${dates[dates.length - 1]}` : '暂无余额记录',
    confirmation,
    success,
  }
}

/** 刷新本地每日历史的日期列表。 */
async function loadLocalHistory(): Promise<void> {
  localSnapshots.value = await listLedgerSnapshots()
}

/** 刷新某个云端的当前文件和历史列表。 */
async function refreshProvider(state: ProviderState): Promise<void> {
  if (!state.connected) return
  state.busy = true
  try {
    [state.metadata, state.snapshots] = await Promise.all([
      state.provider.metadata(),
      state.provider.snapshots(),
    ])
    clearFeedback()
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : `无法读取 ${state.provider.label} 状态。`
  } finally {
    state.busy = false
  }
}

/** 发起提供商授权并在成功后载入远端状态。 */
async function connectProvider(state: ProviderState): Promise<void> {
  state.busy = true
  try {
    state.accountName = await state.provider.connect()
    state.connected = true
    clearFeedback()
    await refreshProvider(state)
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : `无法连接 ${state.provider.label}。`
  } finally {
    state.busy = false
  }
}

/** 断开提供商并清空其页面状态。 */
function disconnectProvider(state: ProviderState): void {
  state.provider.disconnect()
  state.connected = false
  state.accountName = ''
  state.metadata = null
  state.snapshots = []
  setStatus(`已断开 ${state.provider.label}`)
}

/** 将当前本地账本下载为版本化 JSON 文件。 */
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

/** 读取用户选择的 JSON 文件并生成覆盖预览。 */
async function onImportFile(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  try {
    const parsed = parseLedgerFile(JSON.parse(await file.text()))
    replacePreview.value = fileSummary(
      parsed,
      '上传文件预览',
      '确认用上传的账本覆盖当前浏览器数据吗？当前数据会先保存到最近一次回退。',
      '本地账本已替换',
    )
    clearFeedback()
  } catch (error) {
    replacePreview.value = null
    actionError.value = error instanceof Error ? error.message : '无法读取备份文件。'
  }
}

/** 用当前本地账本显式覆盖所选云端副本。 */
async function backupToProvider(state: ProviderState): Promise<void> {
  if (!window.confirm(`用当前本地账本覆盖 ${state.provider.label}${state.metadata ? `（远程时间：${formatTime(state.metadata.lastModifiedDateTime)}）` : ''}吗？`)) return
  state.busy = true
  try {
    let contentChanged = true
    if (state.metadata) {
      try {
        contentChanged = !sameLedgerContents(props.ledger, (await state.provider.download()).file.ledger)
      } catch (error) {
        if (isRemoteAccessError(error)) throw error
        // 无效云端文件允许被显式备份覆盖；实际写入仍会独立报告失败。
        contentChanged = true
      }
    }
    const saved = await state.provider.save(makeLedgerFile(props.ledger), contentChanged)
    state.metadata = saved.metadata
    state.snapshots = await state.provider.snapshots()
    clearFeedback()
    if (saved.warning) actionWarning.value = saved.warning
    setStatus(contentChanged ? `已备份到 ${state.provider.label}` : '云端账本内容未变化')
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : `${state.provider.label} 备份失败。`
  } finally {
    state.busy = false
  }
}

/** 下载云端账本并生成覆盖本地的预览。 */
async function previewCloudReplace(state: ProviderState): Promise<void> {
  state.busy = true
  try {
    const remote = await state.provider.download()
    state.metadata = remote.metadata
    replacePreview.value = fileSummary(
      remote.file,
      `${state.provider.label} 覆盖预览`,
      `确认用 ${state.provider.label} 账本覆盖当前浏览器数据吗？当前数据会先保存到最近一次回退。`,
      `已从 ${state.provider.label} 覆盖本地`,
    )
    clearFeedback()
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : `读取 ${state.provider.label} 账本失败。`
  } finally {
    state.busy = false
  }
}

/** 下载云端账本并计算记录级合并预览。 */
async function previewCloudMerge(state: ProviderState): Promise<void> {
  state.busy = true
  try {
    const remote = await state.provider.download()
    state.metadata = remote.metadata
    mergePreview.value = {
      state,
      remoteLedger: remote.file.ledger,
      remoteModifiedAt: remote.metadata.lastModifiedDateTime,
      result: mergeLedgers(props.ledger, remote.file.ledger),
    }
    clearFeedback()
  } catch (error) {
    mergePreview.value = null
    actionError.value = error instanceof Error ? error.message : `无法预览 ${state.provider.label} 合并。`
  } finally {
    state.busy = false
  }
}

/** 保存回退后，将当前覆盖预览写入本地。 */
async function applyReplacePreview(): Promise<void> {
  const preview = replacePreview.value
  if (!preview || !window.confirm(preview.confirmation)) return
  try {
    await saveRollback(props.ledger)
    await saveLedger(preview.ledger)
    emit('replaceLedger', preview.ledger)
    rollbackAvailable.value = true
    replacePreview.value = null
    clearFeedback()
    await loadLocalHistory()
    setStatus(preview.success)
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : '覆盖本地账本失败。'
  }
}

/** 校验云端版本后，将合并结果依次写入本地和云端。 */
async function confirmMerge(): Promise<void> {
  const preview = mergePreview.value
  if (!preview || !window.confirm(`确认合并本地与 ${preview.state.provider.label} 吗？合并结果会先保存到本地，再写回云端。`)) return
  const state = preview.state
  state.busy = true
  try {
    const latestMetadata = await state.provider.metadata()
    if (!latestMetadata || latestMetadata.lastModifiedDateTime !== preview.remoteModifiedAt) {
      throw new Error(`${state.provider.label} 账本在预览后发生变化，请重新生成合并预览。`)
    }
    await saveRollback(props.ledger)
    await saveLedger(preview.result.ledger)
    emit('replaceLedger', preview.result.ledger)
    rollbackAvailable.value = true
    await loadLocalHistory()
    const contentChanged = !sameLedgerContents(preview.result.ledger, preview.remoteLedger)
    try {
      const saved = await state.provider.save(makeLedgerFile(preview.result.ledger), contentChanged)
      state.metadata = saved.metadata
      state.snapshots = await state.provider.snapshots()
      if (saved.warning) actionWarning.value = saved.warning
      retryTarget.value = null
      setStatus(`已完成 ${state.provider.label} 合并`)
    } catch (error) {
      retryTarget.value = {state, ledger: preview.result.ledger}
      actionError.value = `合并结果已保存在本地，但写入 ${state.provider.label} 失败：${error instanceof Error ? error.message : '未知错误'}`
    }
    mergePreview.value = null
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : '合并失败。'
  } finally {
    state.busy = false
  }
}

/** 重试仅云端失败的合并结果写入。 */
async function retryCloudSave(): Promise<void> {
  const target = retryTarget.value
  if (!target) return
  target.state.busy = true
  try {
    const saved = await target.state.provider.save(makeLedgerFile(target.ledger), true)
    target.state.metadata = saved.metadata
    target.state.snapshots = await target.state.provider.snapshots()
    retryTarget.value = null
    clearFeedback()
    if (saved.warning) actionWarning.value = saved.warning
    setStatus(`已写入 ${target.state.provider.label}`)
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : '重试写入云端失败。'
  } finally {
    target.state.busy = false
  }
}

/** 按日期读取本地历史并生成恢复预览。 */
async function previewLocalSnapshot(snapshot: LedgerSnapshot): Promise<void> {
  try {
    const ledger = await loadLedgerSnapshot(snapshot.date)
    if (!ledger) throw new Error('找不到这份本地历史。')
    replacePreview.value = fileSummary(
      {exportedAt: ledger.updatedAt, ledger},
      `本地历史 ${snapshot.date}`,
      `确认恢复 ${snapshot.date} 的本地历史吗？当前数据会先保存到最近一次回退，云端不会改变。`,
      `已恢复 ${snapshot.date} 的本地历史`,
    )
    clearFeedback()
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : '无法读取本地历史。'
  }
}

/** 下载云端历史并生成仅恢复到本地的预览。 */
async function previewRemoteSnapshot(state: ProviderState, snapshot: RemoteSnapshot): Promise<void> {
  state.busy = true
  try {
    const file = await state.provider.downloadSnapshot(snapshot)
    replacePreview.value = fileSummary(
      file,
      `${state.provider.label} 历史 ${snapshot.date}`,
      `确认恢复 ${snapshot.date} 的 ${state.provider.label} 历史到本地吗？当前数据会先保存到最近一次回退，云端不会改变。`,
      `已恢复 ${snapshot.date} 的云端历史到本地`,
    )
    clearFeedback()
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : '无法读取云端历史。'
  } finally {
    state.busy = false
  }
}

/** 恢复最近一次覆盖前保存的单槽回退账本。 */
async function restoreRollback(): Promise<void> {
  try {
    const rollback = await loadRollback()
    if (!rollback || !window.confirm('确认恢复覆盖前的本地账本吗？当前数据不会再次保存到回退槽。')) return
    await saveLedger(rollback)
    emit('replaceLedger', rollback)
    await loadLocalHistory()
    setStatus('已恢复覆盖前账本')
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : '恢复回退账本失败。'
  }
}

watch(() => props.ledger.updatedAt, () => void loadLocalHistory())

onMounted(async () => {
  try {
    rollbackAvailable.value = Boolean(await loadRollback())
    await loadLocalHistory()
    const oneDrive = providers.find(state => state.provider.id === 'onedrive')!
    const name = await oneDrive.provider.completeLogin?.()
    if (name) {
      oneDrive.connected = true
      oneDrive.accountName = name
    }
    await Promise.all(providers.filter(state => state.connected).map(refreshProvider))
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : '备份状态加载失败。'
  }
})
</script>

<template>
  <section class="backup-view">
    <input ref="fileInput" class="hidden-file-input" type="file" accept=".json,application/json" @change="onImportFile">
    <div v-if="statusMessage" class="toast" role="status">{{ statusMessage }}</div>

    <header class="section-heading">
      <div>
        <h2>备份与同步</h2>
        <p>所有云端操作均手动触发；覆盖和历史恢复会先保存一份本地回退。</p>
      </div>
    </header>

    <section class="backup-panel">
      <div class="section-heading compact">
        <div>
          <h3>本地文件</h3>
          <p>下载或上传版本化 JSON；本地变更每天自动保留最新一份历史。</p>
        </div>
      </div>
      <div class="backup-actions">
        <button class="primary-button" type="button" @click="downloadLedger">下载当前账本</button>
        <button class="secondary-button" type="button" @click="fileInput?.click()">上传并预览</button>
      </div>
      <details v-if="localSnapshots.length" class="history-disclosure">
        <summary>本地历史（{{ localSnapshots.length }}）</summary>
        <ul class="history-list">
          <li v-for="snapshot in localSnapshots" :key="snapshot.date">
            <span>{{ snapshot.date }}</span>
            <button class="quiet-button" type="button" @click="previewLocalSnapshot(snapshot)">预览恢复</button>
          </li>
        </ul>
      </details>
    </section>

    <section v-for="state in providers" :key="state.provider.id" class="backup-panel">
      <div class="section-heading compact">
        <div>
          <h3>{{ state.provider.label }}</h3>
          <p v-if="!state.configured">
            尚未配置{{ state.provider.id === 'google-drive' ? ' Google OAuth 客户端 ID' : '应用客户端' }}。
          </p>
          <p v-else-if="!state.connected">连接后仅访问本应用创建的云端副本目录。</p>
          <p v-else>
            已连接 {{ state.accountName || '当前会话' }} · 远程：{{ state.metadata ? formatTime(state.metadata.lastModifiedDateTime) : '尚未备份' }}
          </p>
        </div>
        <button v-if="state.connected" class="quiet-button" type="button" @click="disconnectProvider(state)">断开</button>
      </div>
      <div v-if="state.configured && !state.connected" class="backup-actions">
        <button class="primary-button" type="button" :disabled="state.busy" @click="connectProvider(state)">
          连接 {{ state.provider.label }}
        </button>
      </div>
      <div v-if="state.connected" class="backup-actions">
        <button class="primary-button" type="button" :disabled="state.busy" @click="backupToProvider(state)">备份覆盖云端</button>
        <button class="secondary-button" type="button" :disabled="state.busy || !state.metadata" @click="previewCloudReplace(state)">云端覆盖本地</button>
        <button class="secondary-button" type="button" :disabled="state.busy || !state.metadata" @click="previewCloudMerge(state)">合并</button>
        <button class="quiet-button" type="button" :disabled="state.busy" @click="refreshProvider(state)">刷新</button>
      </div>
      <details v-if="state.snapshots.length" class="history-disclosure">
        <summary>云端历史（{{ state.snapshots.length }}）</summary>
        <ul class="history-list">
          <li v-for="snapshot in state.snapshots" :key="snapshot.id">
            <span>{{ snapshot.date }}</span>
            <button class="quiet-button" type="button" :disabled="state.busy" @click="previewRemoteSnapshot(state, snapshot)">预览恢复</button>
          </li>
        </ul>
      </details>
    </section>

    <section v-if="replacePreview" class="backup-preview" aria-live="polite">
      <div class="preview-heading">
        <h3>{{ replacePreview.title }}</h3>
        <button class="quiet-button" type="button" @click="replacePreview = null">关闭</button>
      </div>
      <p>生成时间：{{ formatTime(replacePreview.exportedAt) }}</p>
      <p>{{ replacePreview.accountCount }} 个账户 · {{ replacePreview.balanceCount }} 条余额记录 · {{ replacePreview.dateRange }}</p>
      <button class="primary-button" type="button" @click="applyReplacePreview">确认覆盖本地</button>
    </section>

    <section v-if="mergePreview" class="backup-preview" aria-live="polite">
      <div class="preview-heading">
        <h3>{{ mergePreview.state.provider.label }} 合并预览</h3>
        <button class="quiet-button" type="button" @click="mergePreview = null">关闭</button>
      </div>
      <dl class="merge-counts">
        <div><dt>仅本地</dt><dd>{{ mergePreview.result.preview.localOnly }}</dd></div>
        <div><dt>仅云端</dt><dd>{{ mergePreview.result.preview.cloudOnly }}</dd></div>
        <div><dt>本地较新</dt><dd>{{ mergePreview.result.preview.localNewer }}</dd></div>
        <div><dt>云端较新</dt><dd>{{ mergePreview.result.preview.cloudNewer }}</dd></div>
        <div><dt>记录总数</dt><dd>{{ mergePreview.result.preview.total }}</dd></div>
      </dl>
      <p>同一记录按更新时间选择，时间相同采用云端；单边记录会保留。</p>
      <button class="primary-button" type="button" @click="confirmMerge">确认合并并写回</button>
    </section>

    <section v-if="retryTarget" class="backup-rollback">
      <div><strong>本地合并已完成，云端尚未写入</strong><p>可以重试，不会回滚已经保存的本地结果。</p></div>
      <button class="primary-button" type="button" :disabled="retryTarget.state.busy" @click="retryCloudSave">重试写入</button>
    </section>

    <section v-if="rollbackAvailable" class="backup-rollback">
      <div><strong>有一份覆盖前回退</strong><p>仅保留最近一次覆盖或恢复前的本地账本。</p></div>
      <button class="quiet-button" type="button" @click="restoreRollback">恢复回退账本</button>
    </section>

    <div v-if="actionWarning" class="notice warning" role="status">{{ actionWarning }}</div>
    <div v-if="actionError" class="notice error" role="alert">{{ actionError }}</div>
  </section>
</template>

<style scoped src="./BackupView.css"></style>
