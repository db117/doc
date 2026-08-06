<script setup lang="ts">
import {computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch} from 'vue'
import {useData} from 'vitepress'
import type {ECharts, EChartsCoreOption} from 'echarts/core'
import {init, use} from 'echarts/core'
import {LineChart, PieChart} from 'echarts/charts'
import {GridComponent, LegendComponent, TooltipComponent} from 'echarts/components'
import {CanvasRenderer} from 'echarts/renderers'
import {
  ACCOUNT_CATEGORIES,
  CURRENCIES,
  REGIONS,
  accountHasBalances,
  accountIsEffective,
  calculateMaturityDate,
  confirmInstallmentPaid,
  emptyLedger,
  installmentBalance,
  latestBalance,
  makeLedgerFile,
  multiplyAmountByRate,
  normalizeAmount,
  normalizeMonth,
  normalizeRate,
  parseLedgerFile,
  rateForRecord,
  summarize,
  todayMonthISO,
  upsertBalance,
  upsertExchangeRate,
  type Account,
  type AccountType,
  type BalanceMode,
  type Currency,
  type Ledger,
  type RateSource,
} from './ledger'
import {fetchCnyRate} from './rates'
import {loadLedger, loadRollback, saveLedger, saveRollback} from './storage'
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

use([LineChart, PieChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer])

type EditorMode = 'account' | 'balance' | null
type ViewMode = 'overview' | 'history' | 'backup'

interface AccountForm {
  name: string
  institution: string
  type: AccountType
  category: string
  region: string
  currency: Currency
  balanceMode: BalanceMode
  openedOn: string
  initialAmount: string
  initialRate: string
  periodAmount: string
  totalPeriods: number
  remainingPeriods: number
  nextDueDate: string
  maturityDate: string
  note: string
}

interface BalanceForm {
  date: string
  amount: string
  rate: string
}

function blankAccountForm(): AccountForm {
  const date = todayMonthISO()
  return {
    name: '',
    institution: '',
    type: 'asset',
    category: ACCOUNT_CATEGORIES[0],
    region: REGIONS[0],
    currency: 'CNY',
    balanceMode: 'manual',
    openedOn: date,
    initialAmount: '',
    initialRate: '',
    periodAmount: '',
    totalPeriods: 12,
    remainingPeriods: 12,
    nextDueDate: date,
    maturityDate: calculateMaturityDate(date, 12),
    note: '',
  }
}

const ledger = ref<Ledger>(emptyLedger())
const ready = ref(false)
const loadError = ref('')
const actionError = ref('')
const statusMessage = ref('')
const editorMode = ref<EditorMode>(null)
const editingAccountId = ref<string | null>(null)
const selectedAccountId = ref<string | null>(null)
const accountActionId = ref<string | null>(null)
const viewMode = ref<ViewMode>('overview')
const historyDate = ref(todayMonthISO())
const historyAccountId = ref<string | null>(null)
const historyCorrection = ref(false)
const rateLoading = ref(false)
const rateSource = ref<RateSource | null>(null)
const rateMessage = ref('')
const manualRateTouched = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const importLedger = ref<Ledger | null>(null)
const importMetadata = ref<{
  exportedAt: string;
  accountCount: number;
  balanceCount: number;
  dateRange: string
} | null>(null)
const rollbackAvailable = ref(false)
const oneDriveConfiguredState = oneDriveConfigured()
const oneDriveConnectedState = ref(false)
const oneDriveName = ref('')
const oneDriveBusy = ref(false)
const remoteMetadata = ref<OneDriveRemoteMetadata | null>(null)
const accountForm = reactive<AccountForm>(blankAccountForm())
const balanceForm = reactive<BalanceForm>({date: todayMonthISO(), amount: '', rate: ''})
const assetPieRoot = ref<HTMLElement | null>(null)
const historyChartRoot = ref<HTMLElement | null>(null)
const accountHistoryChartRoot = ref<HTMLElement | null>(null)
const {isDark} = useData()
let assetPieChart: ECharts | undefined
let assetPieObserver: ResizeObserver | undefined
let historyChart: ECharts | undefined
let historyChartObserver: ResizeObserver | undefined
let accountHistoryChart: ECharts | undefined
let accountHistoryChartObserver: ResizeObserver | undefined

const summary = computed(() => summarize(ledger.value))
const historyDates = computed(() => [...new Set(ledger.value.balances.map(record => record.date))].sort())
const historyAccountOptions = computed(() => ledger.value.accounts
    .filter(account => accountHasBalances(ledger.value, account.id))
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN')))
const historyAccount = computed(() => historyAccountOptions.value.find(account => account.id === historyAccountId.value)
    ?? historyAccountOptions.value[0]
    ?? null)
const historyAccountRows = computed(() => {
  const account = historyAccount.value
  if (!account) return []
  return ledger.value.balances
      .filter(record => record.accountId === account.id)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(record => {
        const rate = rateForRecord(ledger.value, account, record)
        return {record, rate, cnyAmount: rate ? multiplyAmountByRate(record.amount, rate.cnyRate) : '0'}
      })
})
const historySummary = computed(() => summarize(ledger.value, historyDate.value))
const historyRows = computed(() => ledger.value.accounts
    .filter(account => accountIsEffective(account, historyDate.value))
    .map(account => {
      const record = latestBalance(ledger.value, account.id, historyDate.value)
      const rate = record ? rateForRecord(ledger.value, account, record) : null
      return {
        account,
        record,
        rate,
        cnyAmount: record && rate ? multiplyAmountByRate(record.amount, rate.cnyRate) : '0'
      }
    })
    .filter(row => row.record))
const historyPoints = computed(() => historyDates.value.map(date => ({
  date,
  netWorth: summarize(ledger.value, date).netWorthCny
})))
const accountHistoryChartId = ref<string | null>(null)
const accountHistoryChartAccount = computed(() => ledger.value.accounts.find(account => account.id === accountHistoryChartId.value) ?? null)
const accountHistoryChartPoints = computed(() => {
  const account = accountHistoryChartAccount.value
  if (!account) return []
  return ledger.value.balances
      .filter(record => record.accountId === account.id)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(record => {
        const rate = rateForRecord(ledger.value, account, record)
        return {record, rate, cnyAmount: rate ? multiplyAmountByRate(record.amount, rate.cnyRate) : null}
      })
      .filter(point => point.cnyAmount !== null)
})
const accountHistoryChartOption = computed<EChartsCoreOption>(() => ({
  animation: !isDark.value,
  backgroundColor: 'transparent',
  grid: {top: 24, right: 20, bottom: 48, left: 76, containLabel: true},
  tooltip: {
    trigger: 'axis',
    confine: true,
    axisPointer: {type: 'cross', lineStyle: {color: isDark.value ? '#84908d' : '#8a9692'}},
    formatter: (params: unknown) => {
      const item = (Array.isArray(params) ? params[0] : params) as { dataIndex?: number; axisValue?: string }
      const point = accountHistoryChartPoints.value[item.dataIndex ?? 0]
      if (!point) return item.axisValue ?? ''
      return `${point.record.date}<br>原币余额 <b>${formatOriginal(point.record.amount, accountHistoryChartAccount.value?.currency ?? 'CNY')}</b><br>CNY 金额 <b>${formatCny(point.cnyAmount ?? '0')}</b>`
    },
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    name: '月份',
    nameLocation: 'middle',
    nameGap: 30,
    data: accountHistoryChartPoints.value.map(point => point.record.date),
    axisLine: {lineStyle: {color: isDark.value ? '#555d5b' : '#cfd6d4'}},
    axisLabel: {color: isDark.value ? '#a9b0ae' : '#68716f'},
    axisTick: {alignWithLabel: true},
  },
  yAxis: {
    type: 'value',
    name: '金额（CNY）',
    nameLocation: 'middle',
    nameGap: 56,
    axisLabel: {color: isDark.value ? '#a9b0ae' : '#68716f', formatter: (value: number) => formatChartAxisCny(value)},
    splitLine: {lineStyle: {color: isDark.value ? '#303635' : '#edf0ef'}},
  },
  series: [{
    name: '账户余额',
    type: 'line',
    data: accountHistoryChartPoints.value.map(point => Number(point.cnyAmount)),
    smooth: true,
    showSymbol: true,
    symbol: 'circle',
    symbolSize: 8,
    lineStyle: {width: 3, color: '#5b8def'},
    itemStyle: {color: '#5b8def', borderColor: isDark.value ? '#202425' : '#ffffff', borderWidth: 2},
    areaStyle: {color: '#5b8def', opacity: isDark.value ? 0.14 : 0.1},
  }],
}))
const historyChartOption = computed<EChartsCoreOption>(() => ({
  animation: !isDark.value,
  backgroundColor: 'transparent',
  grid: {top: 24, right: 20, bottom: 48, left: 76, containLabel: true},
  tooltip: {
    trigger: 'axis',
    confine: true,
    axisPointer: {type: 'cross', lineStyle: {color: isDark.value ? '#84908d' : '#8a9692'}},
    formatter: (params: unknown) => {
      const item = (Array.isArray(params) ? params[0] : params) as { axisValue?: string; value?: number | string }
      return `${item.axisValue ?? ''}<br>净资产 <b>${formatCny(String(item.value ?? 0))}</b>`
    },
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    name: '月份',
    nameLocation: 'middle',
    nameGap: 30,
    data: historyPoints.value.map(point => point.date),
    axisLine: {lineStyle: {color: isDark.value ? '#555d5b' : '#cfd6d4'}},
    axisLabel: {color: isDark.value ? '#a9b0ae' : '#68716f'},
    axisTick: {alignWithLabel: true},
  },
  yAxis: {
    type: 'value',
    name: '金额（CNY）',
    nameLocation: 'middle',
    nameGap: 56,
    axisLabel: {color: isDark.value ? '#a9b0ae' : '#68716f', formatter: (value: number) => formatChartAxisCny(value)},
    splitLine: {lineStyle: {color: isDark.value ? '#303635' : '#edf0ef'}},
  },
  series: [{
    name: '净资产',
    type: 'line',
    data: historyPoints.value.map(point => Number(point.netWorth)),
    smooth: true,
    showSymbol: true,
    symbol: 'circle',
    symbolSize: 8,
    lineStyle: {width: 3, color: '#2f9e93'},
    itemStyle: {color: '#2f9e93', borderColor: isDark.value ? '#202425' : '#ffffff', borderWidth: 2},
    areaStyle: {color: '#2f9e93', opacity: isDark.value ? 0.14 : 0.1},
  }],
}))
const selectedAccount = computed(() => ledger.value.accounts.find(account => account.id === selectedAccountId.value) ?? null)
const isEditingAccount = computed(() => Boolean(editingAccountId.value))
const editingAccount = computed(() => ledger.value.accounts.find(account => account.id === editingAccountId.value) ?? null)
const editingHasBalances = computed(() => Boolean(editingAccount.value && accountHasBalances(ledger.value, editingAccount.value.id)))

const accountRows = computed(() => ledger.value.accounts
    .map(account => {
      const record = latestBalance(ledger.value, account.id, todayMonthISO())
      const rate = record ? rateForRecord(ledger.value, account, record) : null
      return {
        account,
        record,
        rate,
        cnyAmount: record && rate ? multiplyAmountByRate(record.amount, rate.cnyRate) : '0'
      }
    })
    .sort((a, b) => Number(a.account.status === 'inactive') - Number(b.account.status === 'inactive') || a.account.name.localeCompare(b.account.name, 'zh-CN')))

const assetRows = computed(() => accountRows.value.filter(row => row.account.type === 'asset'))
const liabilityRows = computed(() => accountRows.value.filter(row => row.account.type === 'liability'))
const accountAction = computed(() => ledger.value.accounts.find(account => account.id === accountActionId.value) ?? null)
const accountActionRow = computed(() => accountRows.value.find(row => row.account.id === accountActionId.value) ?? null)
const assetPieData = computed(() => assetRows.value
    .filter(row => row.account.status === 'active' && row.record && row.rate)
    .map(row => ({name: row.account.name, value: Number(row.cnyAmount)}))
    .filter(item => Number.isFinite(item.value) && item.value > 0))
const assetPieOption = computed<EChartsCoreOption>(() => ({
  animation: !isDark.value,
  backgroundColor: 'transparent',
  tooltip: {
    trigger: 'item',
    confine: true,
    formatter: (params: unknown) => {
      const item = params as { name?: string; value?: number; percent?: number }
      return `${item.name ?? '账户'}<br><b>${formatCny(String(item.value ?? 0))}</b>（${(item.percent ?? 0).toFixed(1)}%）`
    },
  },
  legend: {
    type: 'scroll',
    orient: 'vertical',
    right: 0,
    top: 'middle',
    height: '80%',
    textStyle: {color: isDark.value ? '#a9b0ae' : '#68716f', fontSize: 11},
  },
  series: [{
    name: '资产分布',
    type: 'pie',
    center: ['34%', '50%'],
    radius: ['38%', '68%'],
    avoidLabelOverlap: true,
    itemStyle: {borderColor: isDark.value ? '#202425' : '#ffffff', borderWidth: 2},
    label: {show: false},
    emphasis: {label: {show: true, fontSize: 12, fontWeight: 700}},
    data: assetPieData.value,
  }],
}))

watch([() => accountForm.nextDueDate, () => accountForm.remainingPeriods], () => {
  if (accountForm.balanceMode !== 'installment' || !accountForm.nextDueDate || accountForm.remainingPeriods < 1) return
  accountForm.maturityDate = calculateMaturityDate(accountForm.nextDueDate, accountForm.remainingPeriods)
})

onMounted(async () => {
  try {
    ledger.value = await loadLedger()
    rollbackAvailable.value = Boolean(await loadRollback())
    if (historyDates.value.length) historyDate.value = historyDates.value[historyDates.value.length - 1]
    historyAccountId.value = historyAccountOptions.value[0]?.id ?? null
    ready.value = true
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : '无法读取本地账本。'
  }
  if (!ready.value) return
  try {
    const name = await completeOneDriveLogin()
    if (name) {
      oneDriveConnectedState.value = true
      oneDriveName.value = name
      remoteMetadata.value = await getOneDriveMetadata()
    } else {
      oneDriveConnectedState.value = oneDriveConnected()
    }
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : 'OneDrive 连接失败。'
  }
})

watch(historyDates, dates => {
  if (dates.length && !dates.includes(historyDate.value)) historyDate.value = dates[dates.length - 1]
})

watch(historyAccountOptions, options => {
  if (!options.some(account => account.id === historyAccountId.value)) historyAccountId.value = options[0]?.id ?? null
})

function renderAssetPie(): void {
  if (!assetPieRoot.value) {
    assetPieObserver?.disconnect()
    assetPieObserver = undefined
    assetPieChart?.dispose()
    assetPieChart = undefined
    return
  }
  if (!assetPieChart) assetPieChart = init(assetPieRoot.value, undefined, {renderer: 'canvas'})
  if (!assetPieObserver) {
    assetPieObserver = new ResizeObserver(() => assetPieChart?.resize())
    assetPieObserver.observe(assetPieRoot.value)
  }
  assetPieChart.setOption(assetPieOption.value, {notMerge: true, lazyUpdate: true})
}

watch([assetPieData, isDark], () => nextTick(renderAssetPie), {deep: true})
watch(assetPieRoot, () => nextTick(renderAssetPie))
onMounted(() => renderAssetPie())

function renderHistoryChart(): void {
  if (!historyChartRoot.value) {
    historyChartObserver?.disconnect()
    historyChartObserver = undefined
    historyChart?.dispose()
    historyChart = undefined
    return
  }
  if (!historyChart) historyChart = init(historyChartRoot.value, undefined, {renderer: 'canvas'})
  if (!historyChartObserver) {
    historyChartObserver = new ResizeObserver(() => historyChart?.resize())
    historyChartObserver.observe(historyChartRoot.value)
  }
  historyChart.setOption(historyChartOption.value, {notMerge: true, lazyUpdate: true})
}

watch([historyPoints, isDark], () => nextTick(renderHistoryChart), {deep: true})
watch(historyChartRoot, () => nextTick(renderHistoryChart))
onMounted(() => renderHistoryChart())

function renderAccountHistoryChart(): void {
  if (!accountHistoryChartRoot.value) {
    accountHistoryChartObserver?.disconnect()
    accountHistoryChartObserver = undefined
    accountHistoryChart?.dispose()
    accountHistoryChart = undefined
    return
  }
  if (!accountHistoryChart) accountHistoryChart = init(accountHistoryChartRoot.value, undefined, {renderer: 'canvas'})
  if (!accountHistoryChartObserver) {
    accountHistoryChartObserver = new ResizeObserver(() => accountHistoryChart?.resize())
    accountHistoryChartObserver.observe(accountHistoryChartRoot.value)
  }
  accountHistoryChart.setOption(accountHistoryChartOption.value, {notMerge: true, lazyUpdate: true})
}

watch([accountHistoryChartPoints, isDark], () => nextTick(renderAccountHistoryChart), {deep: true})
watch(accountHistoryChartRoot, () => nextTick(renderAccountHistoryChart))
onBeforeUnmount(() => {
  assetPieObserver?.disconnect()
  assetPieChart?.dispose()
  historyChartObserver?.disconnect()
  historyChart?.dispose()
  accountHistoryChartObserver?.disconnect()
  accountHistoryChart?.dispose()
})

function setStatus(message: string): void {
  statusMessage.value = message
  window.setTimeout(() => {
    if (statusMessage.value === message) statusMessage.value = ''
  }, 2600)
}

async function commit(next: Ledger, successMessage = '已保存'): Promise<void> {
  const normalized = {...next, updatedAt: new Date().toISOString()}
  await saveLedger(normalized)
  ledger.value = normalized
  actionError.value = ''
  setStatus(successMessage)
}

function downloadLedger(): void {
  const file = makeLedgerFile(ledger.value)
  const blob = new Blob([JSON.stringify(file, null, 2)], {type: 'application/json'})
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
  try {
    await beginOneDriveLogin()
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : '无法连接 OneDrive。'
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

async function backupToOneDrive(): Promise<void> {
  if (!oneDriveConnectedState.value) return
  if (!window.confirm(`用当前本地账本覆盖 OneDrive${remoteMetadata.value ? `（远程时间：${remoteMetadata.value.lastModifiedDateTime}）` : ''}吗？`)) return
  oneDriveBusy.value = true
  try {
    remoteMetadata.value = await backupOneDriveFile(makeLedgerFile(ledger.value))
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
    await saveRollback(ledger.value)
    await saveLedger(importLedger.value)
    ledger.value = importLedger.value
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
    ledger.value = rollback
    setStatus('已恢复覆盖前账本')
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : '恢复回退账本失败。'
  }
}

function resetAccountForm(): void {
  Object.assign(accountForm, blankAccountForm())
}

function resetBalanceForm(): void {
  balanceForm.date = todayMonthISO()
  balanceForm.amount = ''
  balanceForm.rate = ''
  rateSource.value = null
  rateMessage.value = ''
  manualRateTouched.value = false
}

function openNewAccount(): void {
  accountActionId.value = null
  resetAccountForm()
  editingAccountId.value = null
  selectedAccountId.value = null
  editorMode.value = 'account'
  actionError.value = ''
}

function openAccountActions(account: Account): void {
  selectedAccountId.value = account.id
  accountActionId.value = account.id
}

function closeAccountActions(): void {
  accountActionId.value = null
}

function openHistoryAccountChart(account: Account): void {
  accountHistoryChartId.value = account.id
}

function closeHistoryAccountChart(): void {
  accountHistoryChartId.value = null
}

function openEditAccount(account: Account): void {
  closeAccountActions()
  const plan = account.installment
  Object.assign(accountForm, {
    name: account.name,
    institution: account.institution,
    type: account.type,
    category: account.category,
    region: account.region,
    currency: account.currency,
    balanceMode: account.balanceMode,
    openedOn: account.openedOn,
    initialAmount: '',
    initialRate: '',
    periodAmount: plan?.periodAmount ?? '',
    totalPeriods: plan?.totalPeriods ?? 12,
    remainingPeriods: plan?.remainingPeriods ?? 12,
    nextDueDate: plan?.nextDueDate ?? todayMonthISO(),
    maturityDate: plan?.maturityDate ?? todayMonthISO(),
    note: account.note,
  })
  editingAccountId.value = account.id
  selectedAccountId.value = account.id
  editorMode.value = 'account'
  actionError.value = ''
}

function openBalanceEditor(account: Account, date = todayMonthISO(), correction = false): void {
  if (account.status === 'inactive') return
  closeAccountActions()
  selectedAccountId.value = account.id
  if (correction) viewMode.value = 'overview'
  editorMode.value = 'balance'
  historyCorrection.value = correction
  actionError.value = ''
  resetBalanceForm()
  balanceForm.date = normalizeMonth(date)
  const record = latestBalance(ledger.value, account.id, date)
  balanceForm.amount = record?.amount ?? ''
  void loadRate()
}

async function loadRate(): Promise<void> {
  const account = selectedAccount.value
  if (!account) return
  rateMessage.value = ''
  if (account.currency === 'CNY') {
    balanceForm.rate = '1'
    rateSource.value = 'manual'
    return
  }
  const stored = ledger.value.exchangeRates.find(rate => rate.currency === account.currency && rate.date === balanceForm.date)
  if (stored) {
    balanceForm.rate = stored.cnyRate
    rateSource.value = stored.source
    return
  }
  rateLoading.value = true
  try {
    const result = await fetchCnyRate(account.currency, balanceForm.date)
    balanceForm.rate = result.cnyRate
    rateSource.value = result.source
  } catch (error) {
    rateMessage.value = error instanceof Error ? error.message : '自动获取汇率失败，请手动填写。'
    rateSource.value = null
  } finally {
    rateLoading.value = false
  }
}

function normalizeFormRate(): string {
  if (selectedAccount.value?.currency === 'CNY') return '1'
  if (!balanceForm.rate.trim()) throw new Error('请填写汇率，或等待自动汇率加载。')
  return normalizeRate(balanceForm.rate)
}

async function saveBalance(): Promise<void> {
  const account = selectedAccount.value
  if (!account) return
  if (account.balanceMode === 'installment' && !historyCorrection.value) {
    actionError.value = '分期负债请使用“已还一期”，或编辑分期计划。'
    return
  }
  try {
    const amount = normalizeAmount(balanceForm.amount)
    const rate = normalizeFormRate()
    let next = ledger.value
    if (account.currency !== 'CNY') {
      next = upsertExchangeRate(next, {
        date: balanceForm.date,
        currency: account.currency,
        cnyRate: rate,
        source: manualRateTouched.value ? 'manual' : (rateSource.value ?? 'manual'),
      })
    }
    next = upsertBalance(next, {
      accountId: account.id,
      date: balanceForm.date,
      amount,
      source: 'manual',
    })
    await commit(next, '余额已保存')
    editorMode.value = null
    historyCorrection.value = false
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : '余额保存失败。'
  }
}

async function confirmPaid(): Promise<void> {
  const account = selectedAccount.value
  if (!account?.installment) return
  try {
    let next = ledger.value
    if (account.currency !== 'CNY') {
      const rate = normalizeFormRate()
      next = upsertExchangeRate(next, {
        date: balanceForm.date,
        currency: account.currency,
        cnyRate: rate,
        source: manualRateTouched.value ? 'manual' : (rateSource.value ?? 'manual'),
      })
    }
    next = confirmInstallmentPaid(next, account.id, balanceForm.date)
    await commit(next, '已记录本期还款')
    const refreshed = next.accounts.find(item => item.id === account.id)
    if (refreshed?.installment) balanceForm.amount = installmentBalance(refreshed.installment)
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : '还款记录失败。'
  }
}

async function deleteHistoryRecord(accountId: string, date: string): Promise<void> {
  const account = ledger.value.accounts.find(item => item.id === accountId)
  const record = ledger.value.balances.find(item => item.accountId === accountId && item.date === date)
  if (!account || !record) return
  if (record.source !== 'manual') {
    actionError.value = '分期自动生成的余额请通过分期计划修正，不能直接删除。'
    return
  }
  if (!window.confirm(`删除 ${account.name} 在 ${date} 的余额记录？`)) return
  await commit({
    ...ledger.value,
    balances: ledger.value.balances.filter(item => !(item.accountId === accountId && item.date === date))
  }, '历史记录已删除')
}

async function saveAccount(): Promise<void> {
  try {
    const name = accountForm.name.trim()
    if (!name) throw new Error('请填写账户名称。')
    if (accountForm.type === 'asset') accountForm.balanceMode = 'manual'
    const now = new Date().toISOString()
    const current = editingAccount.value
    if (current) {
      if (editingHasBalances.value && (current.type !== accountForm.type || current.currency !== accountForm.currency || current.balanceMode !== accountForm.balanceMode)) {
        throw new Error('已有余额记录的账户不能直接修改类型、币种或余额模式。')
      }
      const nextAccount: Account = {
        ...current,
        name,
        institution: accountForm.institution.trim(),
        category: accountForm.category,
        region: accountForm.region,
        note: accountForm.note.trim(),
        updatedAt: now,
      }
      await commit({
        ...ledger.value,
        accounts: ledger.value.accounts.map(account => account.id === current.id ? nextAccount : account)
      }, '账户资料已保存')
      editorMode.value = null
      return
    }

    const accountId = crypto.randomUUID()
    const installment = accountForm.type === 'liability' && accountForm.balanceMode === 'installment'
        ? {
          periodAmount: normalizeAmount(accountForm.periodAmount),
          totalPeriods: Number(accountForm.totalPeriods),
          remainingPeriods: Number(accountForm.remainingPeriods),
          nextDueDate: accountForm.nextDueDate,
          maturityDate: calculateMaturityDate(accountForm.nextDueDate, Number(accountForm.remainingPeriods)),
        }
        : undefined
    if (installment && (!Number.isInteger(installment.totalPeriods) || installment.totalPeriods < 1 || !Number.isInteger(installment.remainingPeriods) || installment.remainingPeriods < 1 || installment.remainingPeriods > installment.totalPeriods)) {
      throw new Error('请填写有效的分期期数。')
    }
    const account: Account = {
      id: accountId,
      type: accountForm.type,
      name,
      institution: accountForm.institution.trim(),
      category: accountForm.category,
      region: accountForm.region,
      currency: accountForm.currency,
      status: 'active',
      balanceMode: accountForm.balanceMode,
      installment,
      openedOn: accountForm.openedOn,
      note: accountForm.note.trim(),
      createdAt: now,
      updatedAt: now,
    }
    let next = {...ledger.value, accounts: [...ledger.value.accounts, account]}
    if (accountForm.initialAmount.trim() || installment) {
      const amount = installment ? installmentBalance(installment) : normalizeAmount(accountForm.initialAmount)
      if (account.currency !== 'CNY') {
        let initialRate = accountForm.initialRate.trim()
        let initialRateSource: RateSource = 'manual'
        if (!initialRate) {
          const fetched = await fetchCnyRate(account.currency, account.openedOn)
          initialRate = fetched.cnyRate
          initialRateSource = fetched.source
        }
        next = upsertExchangeRate(next, {
          date: accountForm.openedOn,
          currency: account.currency,
          cnyRate: normalizeRate(initialRate),
          source: initialRateSource,
        })
      }
      next = upsertBalance(next, {
        accountId,
        date: accountForm.openedOn,
        amount,
        source: installment ? 'installment-setup' : 'manual',
      })
    }
    await commit(next, '账户已新增')
    editorMode.value = null
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : '账户保存失败。'
  }
}

async function deactivateSelected(): Promise<void> {
  const account = editingAccount.value
  if (!account || account.status === 'inactive') return
  if (!window.confirm(`停用“${account.name}”？历史数据会保留。`)) return
  await commit({
    ...ledger.value, accounts: ledger.value.accounts.map(item => item.id === account.id
        ? {...item, status: 'inactive', inactiveOn: todayMonthISO(), updatedAt: new Date().toISOString()}
        : item)
  }, '账户已停用')
  editorMode.value = null
}

function closeEditor(): void {
  editorMode.value = null
  actionError.value = ''
  historyCorrection.value = false
}

function currencySymbol(currency: Currency): string {
  return currency === 'USD' || currency === 'USDT' ? '$' : currency === 'HKD' ? 'HK$' : '¥'
}

function formatAmount(value: string, digits = 2): string {
  const number = Number(value)
  if (!Number.isFinite(number)) return '—'
  return new Intl.NumberFormat('zh-CN', {minimumFractionDigits: digits, maximumFractionDigits: digits}).format(number)
}

function formatCny(value: string): string {
  return `¥${formatAmount(value)}`
}

function formatChartAxisCny(value: number): string {
  const absolute = Math.abs(value)
  if (absolute >= 100_000_000) return `¥${(value / 100_000_000).toFixed(1)}亿`
  if (absolute >= 10_000) return `¥${(value / 10_000).toFixed(1)}万`
  return `¥${new Intl.NumberFormat('zh-CN', {maximumFractionDigits: 0}).format(value)}`
}

function formatOriginal(value: string, currency: Currency): string {
  return `${currencySymbol(currency)}${formatAmount(value, currency === 'CNY' ? 2 : 4)}`
}

function rowIsStale(date: string | undefined): boolean {
  if (!date) return false
  const [year, month] = normalizeMonth(date).split('-').map(Number)
  const [todayYear, todayMonth] = todayMonthISO().split('-').map(Number)
  return todayYear * 12 + todayMonth - (year * 12 + month) > 0
}

function rowCny(row: { cnyAmount: string }): string {
  return row.cnyAmount
}
</script>

<template>
  <div class="net-worth-app">
    <header class="tool-header">
      <div>
        <p class="tool-kicker">个人账本</p>
        <h1>净资产追踪</h1>
        <p class="tool-description">随时更新一个账户，查看截至最新数据的资产、负债与净资产。</p>
      </div>
      <button class="primary-button" type="button" @click="openNewAccount">新增账户</button>
    </header>

    <nav class="tool-tabs" aria-label="净资产工具视图">
      <button class="tab" :class="{active: viewMode === 'overview'}" type="button" @click="viewMode = 'overview'">总览
      </button>
      <button class="tab" :class="{active: viewMode === 'history'}" type="button" @click="viewMode = 'history'">历史
      </button>
      <button class="tab" :class="{active: viewMode === 'backup'}" type="button" @click="viewMode = 'backup'">备份
      </button>
    </nav>
    <input ref="fileInput" class="hidden-file-input" type="file" accept=".json,application/json"
           @change="onImportFile"/>

    <div v-if="loadError" class="notice error" role="alert">{{ loadError }}</div>
    <div v-else-if="!ready" class="loading-state" aria-live="polite">正在读取本地账本…</div>
    <template v-else>
      <div v-if="statusMessage" class="toast" role="status">{{ statusMessage }}</div>

      <section v-if="viewMode === 'overview'" class="summary-strip" aria-label="净资产摘要">
        <div>
          <span>净资产</span>
          <strong class="net-worth-value">{{ formatCny(summary.netWorthCny) }}</strong>
        </div>
        <div>
          <span>资产</span>
          <strong>{{ formatCny(summary.assetsCny) }}</strong>
        </div>
        <div>
          <span>负债</span>
          <strong class="liability-value">{{ formatCny(summary.liabilitiesCny) }}</strong>
        </div>
      </section>

      <div v-if="viewMode === 'overview' && summary.missingRateAccounts.length" class="notice warning" role="status">
        {{ summary.missingRateAccounts.length }} 个账户缺少汇率，暂未计入人民币折算，请补充汇率。
      </div>

      <section v-if="viewMode === 'overview' && !ledger.accounts.length && editorMode !== 'account'"
               class="empty-state">
        <div class="empty-mark">+</div>
        <h2>先添加一个账户</h2>
        <p>账户余额保存在当前浏览器。你可以稍后再连接 OneDrive 备份。</p>
        <button class="primary-button" type="button" @click="openNewAccount">新增第一个账户</button>
      </section>

      <div v-else-if="viewMode === 'overview'" class="workspace">
        <main class="account-column">
          <section class="distribution-panel" aria-labelledby="asset-distribution-heading">
            <div class="section-heading compact">
              <div><h2 id="asset-distribution-heading">资产分布</h2>
                <p>按各资产账户当前最新余额的 CNY 金额计算。</p></div>
            </div>
            <div v-if="assetPieData.length" ref="assetPieRoot" class="asset-pie-chart" role="img"
                 aria-label="资产账户分布饼图"/>
            <div v-else class="distribution-empty">暂无可折算的资产余额</div>
          </section>
          <div class="section-heading">
            <div>
              <h2>账户</h2>
              <p>{{ ledger.accounts.filter(account => account.status === 'active').length }} 个启用账户 ·
                汇总取各账户最新记录</p>
            </div>
            <button class="quiet-button" type="button" @click="openNewAccount">＋账户</button>
          </div>

          <section v-if="assetRows.length" class="account-group" aria-labelledby="asset-heading">
            <h3 id="asset-heading">资产账户</h3>
            <div class="account-table">
              <div class="account-table-head">
                <span>账户名称</span><span>原币余额</span><span>CNY 金额</span><span>最后更新</span>
              </div>
              <div v-for="row in assetRows" :key="row.account.id" class="account-row"
                   :class="{selected: selectedAccountId === row.account.id, inactive: row.account.status === 'inactive'}"
                   @click="openAccountActions(row.account)">
                <div class="account-name"><span class="account-dot asset-dot"/> <span>{{
                    row.account.name
                  }}<small>{{
                      row.account.status === 'inactive' ? '已停用 · 不计入当前汇总' : (row.account.institution || row.account.category)
                    }}</small></span></div>
                <span class="amount">{{
                    row.account.status === 'inactive' ? '—' : (row.record ? formatOriginal(row.record.amount, row.account.currency) : '未录入')
                  }}</span>
                <span class="cny-amount">{{
                    row.account.status === 'inactive' ? '不计入' : (row.record && row.rate ? formatCny(rowCny(row)) : '—')
                  }}</span>
                <span class="updated" :class="{stale: rowIsStale(row.record?.date)}">{{
                    row.record?.date ?? '未录入'
                  }}</span>
              </div>
            </div>
          </section>

          <section v-if="liabilityRows.length" class="account-group liabilities" aria-labelledby="liability-heading">
            <h3 id="liability-heading">负债账户</h3>
            <div class="account-table">
              <div class="account-table-head">
                <span>账户名称</span><span>原币余额</span><span>CNY 金额</span><span>最后更新</span>
              </div>
              <div v-for="row in liabilityRows" :key="row.account.id" class="account-row"
                   :class="{selected: selectedAccountId === row.account.id, inactive: row.account.status === 'inactive'}"
                   @click="openAccountActions(row.account)">
                <div class="account-name"><span class="account-dot liability-dot"/> <span>{{ row.account.name }}<small
                    v-if="row.account.status === 'inactive'">已停用 · 不计入当前汇总</small><small
                    v-else-if="row.account.installment">剩余 {{
                    formatCny(installmentBalance(row.account.installment))
                  }} · {{ row.account.installment.remainingPeriods }}/{{ row.account.installment.totalPeriods }} 期 · 到期 {{
                    row.account.installment.maturityDate
                  }}</small><small v-else>{{ row.account.institution || row.account.category }}</small></span></div>
                <span class="amount liability-value">{{
                    row.account.status === 'inactive' ? '—' : (row.record ? `-${formatOriginal(row.record.amount, row.account.currency)}` : '未录入')
                  }}</span>
                <span class="cny-amount liability-value">{{
                    row.account.status === 'inactive' ? '不计入' : (row.record && row.rate ? `-${formatCny(rowCny(row))}` : '—')
                  }}</span>
                <span class="updated" :class="{stale: rowIsStale(row.record?.date)}">{{
                    row.record?.date ?? '未录入'
                  }}</span>
              </div>
            </div>
          </section>
        </main>

        <aside v-if="editorMode" class="editor-backdrop" aria-label="账户编辑" @click.self="closeEditor">
          <section v-if="editorMode === 'balance' && selectedAccount" class="editor-panel">
            <div class="panel-heading">
              <div><span class="panel-kicker">更新账户余额</span>
                <h2>{{ selectedAccount.name }}</h2></div>
              <button class="close-button" type="button" aria-label="关闭" @click="closeEditor">×</button>
            </div>
            <form @submit.prevent="saveBalance">
              <label>统计月份<input v-model="balanceForm.date" type="month" @change="loadRate"/></label>
              <label>账户余额（原币）<input v-model="balanceForm.amount" inputmode="decimal"
                                          :readonly="selectedAccount.balanceMode === 'installment'"
                                          placeholder="例如 10000.00"/></label>
              <label v-if="selectedAccount.currency !== 'CNY'">汇率（{{
                  selectedAccount.currency === 'USDT' ? 'USDT' : selectedAccount.currency
                }}/CNY）<input v-model="balanceForm.rate" inputmode="decimal" placeholder="自动获取或手动填写"
                              @input="manualRateTouched = true"/></label>
              <p v-if="rateLoading" class="field-hint">正在获取汇率…</p>
              <p v-if="rateMessage" class="field-error">{{ rateMessage }}</p>
              <p v-if="selectedAccount.balanceMode === 'installment'" class="field-hint">
                分期余额由每期金额和剩余期数计算，请使用“已还一期”更新。</p>
              <div class="form-actions">
                <button v-if="selectedAccount.installment" class="secondary-button" type="button" @click="confirmPaid">
                  已还一期
                </button>
                <button class="primary-button" type="submit" :disabled="selectedAccount.balanceMode === 'installment'">
                  保存余额
                </button>
              </div>
            </form>
          </section>

          <section v-if="editorMode === 'account'" class="editor-panel">
            <div class="panel-heading">
              <div><span class="panel-kicker">{{ isEditingAccount ? '编辑账户' : '新增账户' }}</span>
                <h2>{{ isEditingAccount ? accountForm.name : '建立一个账户' }}</h2></div>
              <button class="close-button" type="button" aria-label="关闭" @click="closeEditor">×</button>
            </div>
            <form @submit.prevent="saveAccount">
              <label>账户名称<input v-model="accountForm.name" placeholder="例如 富途-USD"/></label>
              <div class="form-grid"><label>类型<select v-model="accountForm.type" :disabled="editingHasBalances">
                <option value="asset">资产</option>
                <option value="liability">负债</option>
              </select></label><label>币种<select v-model="accountForm.currency" :disabled="editingHasBalances">
                <option v-for="currency in CURRENCIES" :key="currency" :value="currency">{{ currency }}</option>
              </select></label></div>
              <div class="form-grid"><label>机构<input v-model="accountForm.institution"
                                                       placeholder="可选"/></label><label>分类<select
                  v-model="accountForm.category">
                <option v-for="category in ACCOUNT_CATEGORIES" :key="category" :value="category">{{ category }}</option>
              </select></label></div>
              <div class="form-grid"><label>地区<select v-model="accountForm.region">
                <option v-for="region in REGIONS" :key="region" :value="region">{{ region }}</option>
              </select></label><label>开始月份<input v-model="accountForm.openedOn" type="month"
                                                     :disabled="isEditingAccount"/></label></div>
              <template v-if="!isEditingAccount">
                <label v-if="accountForm.type === 'liability'">余额模式<select v-model="accountForm.balanceMode">
                  <option value="manual">手动更新</option>
                  <option value="installment">分期负债</option>
                </select></label>
                <template v-if="accountForm.balanceMode === 'installment'">
                  <div class="form-grid"><label>每期金额<input v-model="accountForm.periodAmount" inputmode="decimal"
                                                               placeholder="包含已知手续费"/></label><label>总期数<input
                      v-model.number="accountForm.totalPeriods" type="number" min="1" step="1"/></label></div>
                  <div class="form-grid"><label>剩余期数<input v-model.number="accountForm.remainingPeriods"
                                                               type="number" min="1" :max="accountForm.totalPeriods"
                                                               step="1"/></label><label>下次还款月份<input
                      v-model="accountForm.nextDueDate" type="month"/></label></div>
                  <p class="field-hint">最终到期月份：{{ accountForm.maturityDate }}</p>
                </template>
                <label v-else>初始余额<input v-model="accountForm.initialAmount" inputmode="decimal"
                                             placeholder="可留空，之后再更新"/></label>
                <label v-if="accountForm.currency !== 'CNY'">初始汇率<input v-model="accountForm.initialRate"
                                                                            inputmode="decimal"
                                                                            placeholder="例如 7.20"/></label>
              </template>
              <label>备注<textarea v-model="accountForm.note" rows="2" placeholder="可选"></textarea></label>
              <p v-if="editingHasBalances" class="field-hint">已有余额记录，类型、币种和余额模式已锁定。</p>
              <div class="form-actions">
                <button v-if="isEditingAccount && editingAccount?.status === 'active'" class="danger-button"
                        type="button" @click="deactivateSelected">停用账户
                </button>
                <button class="primary-button" type="submit">保存账户</button>
              </div>
            </form>
          </section>

          <div v-if="actionError" class="notice error" role="alert">{{ actionError }}</div>
        </aside>
      </div>

      <p v-if="viewMode === 'overview'" class="storage-note">数据保存在当前浏览器
        IndexedDB。清除站点数据前，请先下载或备份账本。</p>

      <div v-if="accountAction" class="account-action-backdrop" @click.self="closeAccountActions">
        <section class="account-action-modal" role="dialog" aria-modal="true"
                 :aria-label="`${accountAction.name} 操作`">
          <div class="panel-heading">
            <div><span class="panel-kicker">账户操作</span>
              <h2>{{ accountAction.name }}</h2></div>
            <button class="close-button" type="button" aria-label="关闭" @click="closeAccountActions">×</button>
          </div>
          <div class="account-action-summary">
            <span>{{ accountAction.type === 'asset' ? '资产账户' : '负债账户' }} · {{ accountAction.currency }}</span>
            <strong v-if="accountActionRow?.record && accountActionRow.rate">{{
                accountAction.type === 'liability' ? '-' : ''
              }}{{ formatCny(accountActionRow.cnyAmount) }}</strong>
            <strong v-else>未录入</strong>
            <small v-if="accountActionRow?.record">记录月份：{{ accountActionRow.record.date }}</small>
          </div>
          <div class="account-action-buttons">
            <button v-if="accountAction.status === 'active'" class="primary-button" type="button"
                    @click="openBalanceEditor(accountAction)">{{ accountAction.installment ? '还款' : '更新余额' }}
            </button>
            <button class="secondary-button" type="button" @click="openEditAccount(accountAction)">编辑账户</button>
          </div>
          <p v-if="accountAction.status === 'inactive'" class="field-hint">账户已停用，只保留历史记录，不能新增余额。</p>
        </section>
      </div>

      <div v-if="accountHistoryChartAccount" class="account-history-chart-backdrop"
           @click.self="closeHistoryAccountChart">
        <section class="account-history-chart-modal" role="dialog" aria-modal="true"
                 :aria-label="`${accountHistoryChartAccount.name} 余额趋势`">
          <div class="panel-heading">
            <div><span class="panel-kicker">账户历史趋势</span>
              <h2>{{ accountHistoryChartAccount.name }}</h2></div>
            <button class="close-button" type="button" aria-label="关闭" @click="closeHistoryAccountChart">×</button>
          </div>
          <div v-if="accountHistoryChartPoints.length" ref="accountHistoryChartRoot" class="account-history-chart"
               role="img" aria-label="账户余额历史折线图，可悬停查看月份和金额"/>
          <div v-else class="distribution-empty">暂无可折算的账户历史余额</div>
        </section>
      </div>

      <section v-if="viewMode === 'history'" class="history-view">
        <div class="section-heading history-heading">
          <div><h2>历史净资产</h2>
            <p>按每个账户截至目标月份的最后一条记录计算。</p></div>
          <label class="history-date-picker">查看月份<select v-model="historyDate" :disabled="!historyDates.length">
            <option v-for="date in historyDates" :key="date" :value="date">{{ date }}</option>
          </select></label>
        </div>
        <div v-if="!historyDates.length" class="empty-state">
          <div class="empty-mark">—</div>
          <h2>还没有历史记录</h2>
          <p>保存账户余额后，这里会显示净资产变化和每个账户的来源。</p></div>
        <template v-else>
          <section class="summary-strip" aria-label="历史月份摘要">
            <div><span>净资产</span><strong class="net-worth-value">{{ formatCny(historySummary.netWorthCny) }}</strong>
            </div>
            <div><span>资产</span><strong>{{ formatCny(historySummary.assetsCny) }}</strong></div>
            <div><span>负债</span><strong class="liability-value">{{
                formatCny(historySummary.liabilitiesCny)
              }}</strong></div>
          </section>
          <section class="history-chart-panel">
            <div class="section-heading compact">
              <div><h2>净资产趋势</h2>
                <p>{{ historyPoints.length }} 个记录月份</p></div>
            </div>
            <div ref="historyChartRoot" class="history-chart" role="img"
                 aria-label="净资产历史趋势图，可悬停查看月份和金额"/>
          </section>
          <section class="history-table-panel">
            <div class="section-heading compact">
              <div><h2>{{ historyDate }} 的账户状态</h2>
                <p>每个账户每月只保留一条余额记录，修正会覆盖当月数据。</p></div>
            </div>
            <div class="history-table">
              <div class="history-table-head">
                <span>账户</span><span>记录月份</span><span>原币余额</span><span>CNY 金额</span><span>操作</span></div>
              <div v-for="row in historyRows" :key="row.account.id" class="history-row">
                <button class="history-account-link account-name" type="button"
                        @click="openHistoryAccountChart(row.account)"><span class="account-dot"
                                                                            :class="row.account.type === 'liability' ? 'liability-dot' : 'asset-dot'"/>{{
                    row.account.name
                  }}
                </button>
                <span>{{ row.record?.date }}</span>
                <span>{{ row.record ? formatOriginal(row.record.amount, row.account.currency) : '—' }}</span>
                <span :class="{'liability-value': row.account.type === 'liability'}">{{
                    row.rate ? `${row.account.type === 'liability' ? '-' : ''}${formatCny(row.cnyAmount)}` : '缺少汇率'
                  }}</span>
                <span class="history-actions"><button v-if="row.record?.source === 'manual'" class="row-button"
                                                      type="button"
                                                      @click="openBalanceEditor(row.account, row.record.date, true)">修正</button><button
                    v-if="row.record?.source === 'manual'" class="text-danger" type="button"
                    @click="deleteHistoryRecord(row.account.id, row.record.date)">删除</button><small
                    v-else>分期记录</small></span>
              </div>
            </div>
          </section>
          <section class="history-table-panel account-history-panel">
            <div class="section-heading compact">
              <div><h2>账户历史</h2>
                <p>
                  <button v-if="historyAccount" class="history-account-link" type="button"
                          @click="openHistoryAccountChart(historyAccount)">{{ historyAccount.name }}
                  </button>
                  的全部月度余额记录，不受上方查看月份限制。
                </p>
              </div>
              <label class="history-account-picker">账户<select v-model="historyAccountId">
                <option v-for="account in historyAccountOptions" :key="account.id" :value="account.id">{{
                    account.name
                  }}
                </option>
              </select></label>
            </div>
            <div v-if="!historyAccountRows.length" class="empty-state compact-empty">
              <div class="empty-mark">—</div>
              <p>这个账户还没有余额记录。</p></div>
            <div v-else class="history-table">
              <div class="account-history-head">
                <span>月份</span><span>原币余额</span><span>CNY 金额</span><span>来源</span><span>操作</span></div>
              <div v-for="row in historyAccountRows" :key="row.record.date" class="account-history-row">
                <span>{{ row.record.date }}</span>
                <span>{{ formatOriginal(row.record.amount, historyAccount?.currency ?? 'CNY') }}</span>
                <span :class="{'liability-value': historyAccount?.type === 'liability'}">{{
                    row.rate ? `${historyAccount?.type === 'liability' ? '-' : ''}${formatCny(row.cnyAmount)}` : '缺少汇率'
                  }}</span>
                <span class="history-source">{{
                    row.record.source === 'manual' ? '手动' : row.record.source === 'installment-setup' ? '分期设置' : '分期还款'
                  }}</span>
                <span class="history-actions"><button v-if="row.record.source === 'manual'" class="row-button"
                                                      type="button"
                                                      @click="historyAccount && openBalanceEditor(historyAccount, row.record.date, true)">修正</button><button
                    v-if="row.record.source === 'manual'" class="text-danger" type="button"
                    @click="deleteHistoryRecord(historyAccount?.id ?? '', row.record.date)">删除</button><small v-else>自动记录</small></span>
              </div>
            </div>
          </section>
        </template>
      </section>

      <section v-if="viewMode === 'backup'" class="backup-view">
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
            <button class="secondary-button" type="button" :disabled="oneDriveBusy" @click="connectOneDrive">连接
              OneDrive
            </button>
          </div>
          <div v-if="oneDriveConnectedState" class="backup-actions">
            <button class="primary-button" type="button" :disabled="oneDriveBusy" @click="backupToOneDrive">备份到
              OneDrive
            </button>
            <button class="secondary-button" type="button" :disabled="oneDriveBusy" @click="syncFromOneDrive">从
              OneDrive 同步
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
  </div>
</template>

<style scoped>
.net-worth-app {
  --nw-accent: var(--vp-c-brand-1);
  --nw-accent-soft: var(--vp-c-brand-soft);
  --nw-panel: var(--vp-c-bg-soft);
  --nw-border: var(--vp-c-divider);
  --nw-muted: var(--vp-c-text-2);
  color: var(--vp-c-text-1);
  max-width: 1440px;
  margin: 0 auto;
  padding: 20px 24px 48px;
}

.tool-header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 20px;
}

.tool-kicker, .panel-kicker {
  margin: 0 0 4px;
  color: var(--nw-accent);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .04em;
}

h1, h2, h3, p {
  margin-top: 0;
}

h1 {
  margin-bottom: 6px;
  font-size: 28px;
  line-height: 1.2;
  letter-spacing: -.02em;
}

h2 {
  margin-bottom: 4px;
  font-size: 17px;
  line-height: 1.35;
}

h3 {
  margin-bottom: 10px;
  font-size: 14px;
}

.tool-description, .section-heading p, .storage-note {
  margin-bottom: 0;
  color: var(--nw-muted);
  font-size: 13px;
  line-height: 1.5;
}

.tool-tabs {
  display: flex;
  gap: 22px;
  border-bottom: 1px solid var(--nw-border);
  margin-bottom: 18px;
}

.tab {
  border: 0;
  padding: 0 2px 10px;
  background: transparent;
  color: var(--nw-muted);
  font: inherit;
  font-size: 14px;
  cursor: pointer;
}

.tab.active {
  border-bottom: 2px solid var(--nw-accent);
  color: var(--nw-accent);
  font-weight: 700;
}

.tab.disabled {
  cursor: not-allowed;
  opacity: .55;
}

.summary-strip {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  border: 1px solid var(--nw-border);
  border-radius: 10px;
  background: var(--nw-border);
  overflow: hidden;
  margin-bottom: 14px;
}

.summary-strip > div {
  display: grid;
  gap: 5px;
  padding: 15px 18px;
  background: var(--vp-c-bg);
}

.summary-strip span {
  color: var(--nw-muted);
  font-size: 12px;
}

.summary-strip strong {
  font-size: 24px;
  font-variant-numeric: tabular-nums;
}

.net-worth-value {
  color: var(--nw-accent);
}

.liability-value {
  color: var(--vp-c-danger-1);
}

.workspace {
  display: grid;
  grid-template-columns: 1fr;
  gap: 18px;
  align-items: start;
}

.account-column {
  min-width: 0;
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 10px 0;
}

.section-heading.compact {
  margin-top: 0;
}

.account-group, .editor-panel, .distribution-panel {
  border: 1px solid var(--nw-border);
  border-radius: 10px;
  background: var(--vp-c-bg);
  overflow: hidden;
}

.account-group {
  margin-bottom: 14px;
}

.distribution-panel {
  margin-bottom: 14px;
  padding: 16px;
}

.distribution-panel .section-heading {
  margin: 0;
}

.asset-pie-chart {
  width: 100%;
  height: 270px;
}

.distribution-empty {
  display: grid;
  min-height: 180px;
  place-items: center;
  color: var(--nw-muted);
  font-size: 13px;
}

.account-group > h3 {
  margin: 0;
  padding: 13px 16px 8px;
}

.liabilities {
  border-color: color-mix(in oklch, var(--vp-c-red-1) 22%, var(--nw-border));
}

.account-table-head, .account-row {
  display: grid;
  grid-template-columns: minmax(160px, 1.8fr) minmax(108px, 1fr) minmax(110px, 1fr) 82px;
  gap: 10px;
  align-items: center;
  padding: 10px 14px;
}

.account-table-head {
  border-top: 1px solid var(--nw-border);
  border-bottom: 1px solid var(--nw-border);
  color: var(--nw-muted);
  font-size: 11px;
}

.account-row {
  min-height: 58px;
  border-bottom: 1px solid var(--nw-border);
  font-size: 13px;
  transition: background-color .16s ease;
  cursor: pointer;
}

.account-row:last-child {
  border-bottom: 0;
}

.account-row:hover, .account-row.selected {
  background: var(--nw-accent-soft);
}

.account-row.inactive {
  color: var(--nw-muted);
  opacity: .72;
}

.account-name {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 9px;
  font-weight: 650;
}

.account-name > span:last-child {
  min-width: 0;
  overflow-wrap: anywhere;
}

.account-name small {
  display: block;
  margin-top: 3px;
  color: var(--nw-muted);
  font-size: 11px;
  font-weight: 400;
  line-height: 1.35;
}

.account-dot {
  width: 9px;
  height: 9px;
  flex: none;
  border-radius: 50%;
  background: var(--nw-accent);
}

.liability-dot {
  background: var(--vp-c-red-1);
}

.amount, .cny-amount, .updated {
  font-variant-numeric: tabular-nums;
}

.cny-amount {
  font-weight: 650;
}

.updated {
  color: var(--nw-muted);
  font-size: 12px;
}

.updated.stale {
  color: var(--vp-c-warning-1);
}

.row-button, .quiet-button, .secondary-button, .danger-button, .primary-button, .close-button {
  font: inherit;
  cursor: pointer;
}

.row-button, .quiet-button, .secondary-button {
  border: 1px solid var(--nw-accent);
  border-radius: 6px;
  background: transparent;
  color: var(--nw-accent);
}

.row-button {
  padding: 6px 9px;
  font-size: 12px;
}

.row-button:hover, .secondary-button:hover, .quiet-button:hover {
  background: var(--nw-accent-soft);
}

.quiet-button {
  padding: 6px 10px;
  font-size: 12px;
}

.editor-backdrop {
  position: fixed;
  z-index: 40;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 20px;
  background: rgb(15 24 22 / 42%);
}

.editor-panel {
  width: min(520px, 100%);
  max-height: calc(100vh - 40px);
  box-sizing: border-box;
  overflow: auto;
  padding: 16px;
}

.account-action-backdrop {
  position: fixed;
  z-index: 30;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgb(15 24 22 / 42%);
}

.account-action-modal {
  width: min(420px, 100%);
  border: 1px solid var(--nw-border);
  border-radius: 12px;
  padding: 18px;
  background: var(--vp-c-bg);
  box-shadow: 0 18px 60px rgb(0 0 0 / 22%);
}

.account-action-modal .panel-heading {
  margin-bottom: 16px;
}

.account-action-summary {
  display: grid;
  gap: 5px;
  border-radius: 8px;
  padding: 12px;
  background: var(--nw-accent-soft);
}

.account-action-summary span, .account-action-summary small {
  color: var(--nw-muted);
  font-size: 12px;
}

.account-action-summary strong {
  color: var(--nw-accent);
  font-size: 22px;
  font-variant-numeric: tabular-nums;
}

.account-action-buttons {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.history-account-link {
  border: 0;
  padding: 0;
  background: transparent;
  color: var(--nw-accent);
  cursor: pointer;
  font: inherit;
  text-align: left;
}

.history-account-link:hover {
  text-decoration: underline;
}

.account-history-chart-backdrop {
  position: fixed;
  z-index: 35;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgb(15 24 22 / 42%);
}

.account-history-chart-modal {
  width: min(760px, 100%);
  max-height: calc(100vh - 40px);
  box-sizing: border-box;
  overflow: auto;
  border: 1px solid var(--nw-border);
  border-radius: 12px;
  padding: 18px;
  background: var(--vp-c-bg);
  box-shadow: 0 18px 60px rgb(0 0 0 / 22%);
}

.account-history-chart {
  width: 100%;
  height: 360px;
}

.panel-heading {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.close-button {
  border: 0;
  background: transparent;
  color: var(--nw-muted);
  font-size: 22px;
  line-height: 1;
}

.editor-panel form {
  display: grid;
  gap: 12px;
}

label {
  display: grid;
  gap: 5px;
  color: var(--nw-muted);
  font-size: 12px;
}

input, select, textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--nw-border);
  border-radius: 6px;
  padding: 9px 10px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font: inherit;
  font-size: 14px;
}

input:focus, select:focus, textarea:focus, button:focus-visible {
  outline: 2px solid color-mix(in oklch, var(--nw-accent) 70%, transparent);
  outline-offset: 2px;
}

input:disabled, select:disabled {
  cursor: not-allowed;
  opacity: .7;
}

textarea {
  resize: vertical;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 3px;
}

.primary-button {
  border: 1px solid var(--nw-accent);
  border-radius: 6px;
  padding: 9px 14px;
  background: var(--nw-accent);
  color: var(--vp-c-white);
  font-weight: 700;
}

.primary-button:hover {
  filter: brightness(1.05);
}

.primary-button:disabled {
  cursor: not-allowed;
  opacity: .5;
}

.secondary-button, .danger-button {
  padding: 9px 12px;
}

.danger-button {
  border: 1px solid var(--vp-c-danger-1);
  border-radius: 6px;
  background: transparent;
  color: var(--vp-c-danger-1);
  margin-right: auto;
}

.field-hint {
  margin: -3px 0 0;
  color: var(--nw-muted);
  font-size: 11px;
  line-height: 1.45;
}

.field-error {
  margin: -3px 0 0;
  color: var(--vp-c-danger-1);
  font-size: 12px;
}

.notice {
  margin-bottom: 14px;
  border: 1px solid var(--nw-border);
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 13px;
  line-height: 1.5;
}

.notice.warning {
  border-color: color-mix(in oklch, var(--vp-c-yellow-1) 35%, var(--nw-border));
  background: var(--vp-c-yellow-soft);
  color: var(--vp-c-yellow-1);
}

.notice.error {
  border-color: color-mix(in oklch, var(--vp-c-red-1) 35%, var(--nw-border));
  background: var(--vp-c-red-soft);
  color: var(--vp-c-red-1);
}

.toast {
  position: fixed;
  z-index: 20;
  right: 24px;
  bottom: 24px;
  border: 1px solid var(--nw-accent);
  border-radius: 7px;
  padding: 10px 14px;
  background: var(--vp-c-bg);
  color: var(--nw-accent);
  box-shadow: 0 4px 10px rgb(0 0 0 / 10%);
  font-size: 13px;
}

.empty-state {
  display: grid;
  justify-items: center;
  gap: 7px;
  border: 1px dashed var(--nw-border);
  border-radius: 10px;
  padding: 60px 20px;
  text-align: center;
}

.empty-state h2 {
  margin: 5px 0 0;
}

.empty-state p {
  max-width: 35ch;
  margin-bottom: 10px;
  color: var(--nw-muted);
  font-size: 13px;
  line-height: 1.6;
}

.empty-mark {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 50%;
  background: var(--nw-accent-soft);
  color: var(--nw-accent);
  font-size: 25px;
}

.loading-state {
  padding: 80px 20px;
  color: var(--nw-muted);
  text-align: center;
}

.storage-note {
  margin: 0;
  font-size: 11px;
  line-height: 1.6;
}

.history-view {
  display: grid;
  gap: 14px;
}

.history-heading {
  align-items: end;
}

.history-date-picker {
  width: 180px;
}

.history-chart-panel, .history-table-panel {
  border: 1px solid var(--nw-border);
  border-radius: 10px;
  background: var(--vp-c-bg);
  padding: 16px;
}

.history-chart {
  display: block;
  width: 100%;
  height: 320px;
}

.history-table {
  overflow-x: auto;
}

.history-table-head, .history-row {
  display: grid;
  grid-template-columns: minmax(160px, 1.5fr) 100px 120px 120px 110px;
  gap: 10px;
  align-items: center;
  min-width: 670px;
  padding: 10px 4px;
}

.history-table-head {
  border-bottom: 1px solid var(--nw-border);
  color: var(--nw-muted);
  font-size: 11px;
}

.history-row {
  border-bottom: 1px solid var(--nw-border);
  font-size: 13px;
}

.history-row:last-child {
  border-bottom: 0;
}

.history-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.text-danger {
  border: 0;
  padding: 0;
  background: transparent;
  color: var(--vp-c-danger-1);
  cursor: pointer;
  font: inherit;
  font-size: 12px;
}

.history-actions small {
  color: var(--nw-muted);
}

.history-source {
  color: var(--nw-muted);
  font-size: 12px;
}

.history-account-picker {
  width: 220px;
}

.account-history-head, .account-history-row {
  display: grid;
  grid-template-columns: 120px 140px 140px 100px 110px;
  gap: 10px;
  align-items: center;
  min-width: 640px;
  padding: 10px 4px;
}

.account-history-head {
  border-bottom: 1px solid var(--nw-border);
  color: var(--nw-muted);
  font-size: 11px;
}

.account-history-row {
  border-bottom: 1px solid var(--nw-border);
  font-size: 13px;
}

.account-history-row:last-child {
  border-bottom: 0;
}

.compact-empty {
  padding: 28px 16px;
}

.hidden-file-input {
  display: none;
}

.backup-view {
  display: grid;
  gap: 14px;
  max-width: 760px;
}

.backup-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.onedrive-panel {
  border: 1px solid var(--nw-border);
  border-radius: 10px;
  padding: 16px;
  background: var(--vp-c-bg);
}

.onedrive-panel h3 {
  margin-bottom: 4px;
}

.backup-preview, .backup-rollback {
  border: 1px solid var(--nw-border);
  border-radius: 10px;
  padding: 16px;
  background: var(--vp-c-bg);
}

.backup-preview p, .backup-rollback p {
  margin: 0 0 10px;
  color: var(--nw-muted);
  font-size: 13px;
}

.backup-rollback {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.backup-rollback strong {
  display: block;
  margin-bottom: 4px;
}

@media (max-width: 960px) {
  .net-worth-app {
    padding-inline: 16px;
  }

  .workspace {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .net-worth-app {
    padding: 16px 12px 32px;
  }

  .tool-header {
    align-items: start;
  }

  .tool-header .primary-button {
    flex: none;
    padding-inline: 10px;
  }

  h1 {
    font-size: 24px;
  }

  .tool-description {
    max-width: 26ch;
  }

  .summary-strip {
    grid-template-columns: repeat(3, 1fr);
  }

  .summary-strip > div {
    padding: 11px 9px;
  }

  .summary-strip strong {
    font-size: 16px;
  }

  .account-table-head {
    display: none;
  }

  .account-row {
    grid-template-columns: minmax(0, 1fr);
    gap: 4px 8px;
    padding: 12px 11px;
  }

  .account-name {
    grid-column: 1;
    grid-row: 1 / span 2;
    align-self: start;
  }

  .account-row .amount, .account-row .cny-amount, .account-row .updated {
    grid-column: 1;
    margin-left: 18px;
    font-size: 11px;
  }

  .account-row .amount {
    grid-row: 3;
  }

  .account-row .cny-amount {
    grid-row: 4;
  }

  .account-row .updated {
    grid-row: 5;
  }

  .account-name small {
    max-width: 32ch;
  }

  .history-heading {
    align-items: start;
    flex-direction: column;
  }

  .history-date-picker {
    width: 100%;
  }

  .history-account-picker {
    width: 100%;
  }

  .account-history-chart {
    height: 280px;
  }

  .backup-rollback {
    align-items: start;
    flex-direction: column;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .toast {
    right: 12px;
    bottom: 12px;
    left: 12px;
    text-align: center;
  }
}

@media (prefers-reduced-motion: reduce) {
  .account-row {
    transition: none;
  }
}
</style>
