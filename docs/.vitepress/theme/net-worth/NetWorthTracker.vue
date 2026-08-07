<script setup lang="ts">
import {computed, onMounted, reactive, ref} from 'vue'
import BackupView from './BackupView.vue'
import HistoryView from './HistoryView.vue'
import OverviewView from './OverviewView.vue'
import {
  ACCOUNT_CATEGORIES,
  CURRENCIES,
  REGIONS,
  accountHasBalances,
  addInstallmentPlan,
  backfillInstallments,
  calculateMaturityDate,
  confirmInstallmentPaid,
  correctInstallmentRemaining,
  deleteUnstartedInstallmentPlan,
  emptyLedger,
  installmentDueState,
  installmentBalance,
  latestBalance,
  multiplyAmountByRate,
  normalizeAmount,
  normalizeMonth,
  normalizeRate,
  rateForRecord,
  todayMonthISO,
  terminateInstallmentPlan,
  upsertBalance,
  upsertExchangeRate,
  type Account,
  type AccountType,
  type BalanceMode,
  type Currency,
  type Ledger,
  type InstallmentPlan,
  type RateSource,
} from './ledger'
import {fetchCnyRate} from './rates'
import {formatCny, formatOriginal} from './format'
import {loadLedger, saveLedger} from './storage'

type EditorMode = 'account' | 'balance' | 'installment' | null
type ViewMode = 'overview' | 'history' | 'backup'
type InstallmentAction = 'new' | 'correct' | 'terminate'

// 表单保留字符串金额，统一交给 ledger 层做定点校验，避免输入阶段引入浮点数。
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
  note: string
}

interface InstallmentForm {
  name: string
  periodAmount: string
  totalPeriods: number
  remainingPeriods: number
  effectiveMonth: string
  nextDueMonth: string
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
    note: '',
  }
}

function blankInstallmentForm(): InstallmentForm {
  const month = todayMonthISO()
  return {
    name: '',
    periodAmount: '',
    totalPeriods: 12,
    remainingPeriods: 12,
    effectiveMonth: month,
    nextDueMonth: month
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
const installmentAction = ref<InstallmentAction>('new')
const editingInstallmentId = ref<string | null>(null)
const viewMode = ref<ViewMode>('overview')
const historyCorrection = ref(false)
const rateLoading = ref(false)
const rateSource = ref<RateSource | null>(null)
const rateMessage = ref('')
const manualRateTouched = ref(false)
const accountForm = reactive<AccountForm>(blankAccountForm())
const installmentForm = reactive<InstallmentForm>(blankInstallmentForm())
const balanceForm = reactive<BalanceForm>({date: todayMonthISO(), amount: '', rate: ''})
const selectedAccount = computed(() => ledger.value.accounts.find(account => account.id === selectedAccountId.value) ?? null)
const isEditingAccount = computed(() => Boolean(editingAccountId.value))
const editingAccount = computed(() => ledger.value.accounts.find(account => account.id === editingAccountId.value) ?? null)
const editingHasBalances = computed(() => Boolean(editingAccount.value && accountHasBalances(ledger.value, editingAccount.value.id)))
const installmentMaturityMonth = computed(() => installmentForm.nextDueMonth && installmentForm.remainingPeriods > 0
    ? calculateMaturityDate(installmentForm.nextDueMonth, installmentForm.remainingPeriods)
    : '')

const accountAction = computed(() => ledger.value.accounts.find(account => account.id === accountActionId.value) ?? null)
const activeActionPlans = computed(() => accountAction.value?.installments?.filter(plan => plan.status === 'active' || plan.status === 'overdue') ?? [])
const endedActionPlans = computed(() => accountAction.value?.installments?.filter(plan => plan.status === 'completed' || plan.status === 'terminated') ?? [])
// 父组件只为当前操作账户投影一行数据，完整列表与汇总留在 OverviewView 内部。
const accountActionRow = computed(() => {
  const account = accountAction.value
  if (!account) return null
  const record = latestBalance(ledger.value, account.id, todayMonthISO())
  const rate = record ? rateForRecord(ledger.value, account, record) : null
  return {
    account,
    record,
    rate,
    cnyAmount: record && rate ? multiplyAmountByRate(record.amount, rate.cnyRate) : '0',
  }
})

onMounted(async () => {
  try {
    const loaded = await loadLedger()
    const backfilled = backfillInstallments(loaded)
    if (backfilled.changed) await saveLedger(backfilled.ledger)
    ledger.value = backfilled.ledger
    ready.value = true
    if (backfilled.completedPlanNames.length) setStatus(`${backfilled.completedPlanNames.join('、')} 已全部还清`)
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : '无法读取本地账本。'
  }
})

function setStatus(message: string): void {
  statusMessage.value = message
  window.setTimeout(() => {
    if (statusMessage.value === message) statusMessage.value = ''
  }, 2600)
}

async function commit(next: Ledger, successMessage = '已保存'): Promise<void> {
  // 先持久化再替换响应式状态，写入失败时页面仍保留最后一份可靠账本。
  const normalized = {...next, updatedAt: new Date().toISOString()}
  await saveLedger(normalized)
  ledger.value = normalized
  actionError.value = ''
  setStatus(successMessage)
}

function resetAccountForm(): void {
  Object.assign(accountForm, blankAccountForm())
}

function resetInstallmentForm(): void {
  Object.assign(installmentForm, blankInstallmentForm())
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

function openEditAccount(account: Account): void {
  closeAccountActions()
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
    note: account.note,
  })
  editingAccountId.value = account.id
  selectedAccountId.value = account.id
  editorMode.value = 'account'
  actionError.value = ''
}

function openInstallmentEditor(action: InstallmentAction, plan?: InstallmentPlan): void {
  if (!accountAction.value || accountAction.value.status === 'inactive') return
  resetInstallmentForm()
  installmentAction.value = action
  editingInstallmentId.value = plan?.id ?? null
  if (plan) Object.assign(installmentForm, {
    name: plan.name,
    periodAmount: plan.periodAmount,
    totalPeriods: plan.totalPeriods,
    remainingPeriods: plan.remainingPeriods,
    effectiveMonth: todayMonthISO(),
    nextDueMonth: plan.nextDueMonth,
  })
  editorMode.value = 'installment'
  actionError.value = ''
}

function installmentStatusText(plan: InstallmentPlan): string {
  const state = installmentDueState(plan)
  return state === 'pending' ? '本月待确认'
      : state === 'overdue' ? '已逾期'
          : state === 'completed' ? '已结清'
              : state === 'terminated' ? '已终止'
                  : '进行中'
}

function openBalanceEditor(account: Account, date = todayMonthISO(), correction = false): void {
  if (account.status === 'inactive') return
  closeAccountActions()
  selectedAccountId.value = account.id
  // 历史修正沿用同一编辑器；切回总览可避免弹层关闭后停留在已变化的历史表。
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

function openHistoryBalanceEditor(account: Account, date: string): void {
  openBalanceEditor(account, date, true)
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
  // 优先使用该月已确认汇率，只有缺失时才访问外部服务。
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

async function addRateIfAvailable(next: Ledger, account: Account, month: string): Promise<Ledger> {
  if (account.currency === 'CNY' || next.exchangeRates.some(rate => rate.currency === account.currency && rate.date === month)) return next
  try {
    const result = await fetchCnyRate(account.currency, month)
    return upsertExchangeRate(next, {
      date: month,
      currency: account.currency,
      cnyRate: result.cnyRate,
      source: result.source
    })
  } catch {
    return next
  }
}

async function saveBalance(): Promise<void> {
  const account = selectedAccount.value
  if (!account) return
  try {
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
    if (account.balanceMode === 'installment') {
      if (account.currency === 'CNY') throw new Error('人民币分期账户无需补汇率。')
      await commit(next, '汇率已保存')
      editorMode.value = null
      historyCorrection.value = false
      return
    }
    const amount = normalizeAmount(balanceForm.amount)
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

async function confirmPlan(plan: InstallmentPlan): Promise<void> {
  const account = accountAction.value
  if (!account) return
  if (plan.remainingPeriods === 1 && !window.confirm(`确认“${plan.name}”已全部还清？`)) return
  try {
    let next = confirmInstallmentPaid(ledger.value, account.id, plan.id)
    next = await addRateIfAvailable(next, account, todayMonthISO())
    await commit(next, plan.remainingPeriods === 1 ? `${plan.name} 已全部还清` : '已记录本期还款')
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : '还款记录失败。'
  }
}

async function deletePlan(plan: InstallmentPlan): Promise<void> {
  const account = accountAction.value
  if (!account || !window.confirm(`删除误建的“${plan.name}”？`)) return
  try {
    await commit(deleteUnstartedInstallmentPlan(ledger.value, account.id, plan.id), '分期已删除')
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : '分期删除失败。'
  }
}

async function saveInstallment(): Promise<void> {
  const account = accountAction.value
  if (!account) return
  const planId = editingInstallmentId.value
  try {
    let next = ledger.value
    let message = '分期已添加'
    if (installmentAction.value === 'new') {
      next = addInstallmentPlan(next, account.id, {
        name: installmentForm.name,
        periodAmount: installmentForm.periodAmount,
        totalPeriods: Number(installmentForm.totalPeriods),
        remainingPeriods: Number(installmentForm.remainingPeriods),
        effectiveMonth: todayMonthISO(),
        nextDueMonth: installmentForm.nextDueMonth,
      })
      next = await addRateIfAvailable(next, account, todayMonthISO())
    } else if (installmentAction.value === 'correct' && planId) {
      if (installmentForm.remainingPeriods === 0 && !window.confirm(`确认“${installmentForm.name}”已全部还清？`)) return
      next = correctInstallmentRemaining(
          next, account.id, planId, installmentForm.effectiveMonth, Number(installmentForm.remainingPeriods),
      )
      message = installmentForm.remainingPeriods === 0 ? `${installmentForm.name} 已全部还清` : '分期进度已修正'
    } else if (installmentAction.value === 'terminate' && planId) {
      if (!window.confirm(`从 ${installmentForm.effectiveMonth} 起终止“${installmentForm.name}”？`)) return
      next = terminateInstallmentPlan(next, account.id, planId, installmentForm.effectiveMonth)
      message = '分期已终止'
    }
    await commit(next, message)
    editorMode.value = null
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : '分期保存失败。'
  }
}

async function deleteHistoryRecord(accountId: string, date: string): Promise<void> {
  const account = ledger.value.accounts.find(item => item.id === accountId)
  const record = ledger.value.balances.find(item => item.accountId === accountId && item.date === date)
  if (!account || !record) return
  // 自动分期记录与计划状态成对存在，不能单独删除造成剩余期数和余额不一致。
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
      // 有历史后锁定会改变旧记录解释方式的字段，名称、机构等展示资料仍可修改。
      if (editingHasBalances.value && (current.type !== accountForm.type || current.currency !== accountForm.currency || current.balanceMode !== accountForm.balanceMode)) {
        throw new Error('已有余额记录的账户不能直接修改类型、币种或余额模式。')
      }
      const nextAccount: Account = {
        ...current,
        type: accountForm.type,
        name,
        institution: accountForm.institution.trim(),
        category: accountForm.category,
        region: accountForm.region,
        currency: accountForm.currency,
        balanceMode: accountForm.balanceMode,
        installments: accountForm.balanceMode === 'installment' ? (current.installments ?? []) : undefined,
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
      installments: accountForm.balanceMode === 'installment' ? [] : undefined,
      openedOn: accountForm.openedOn,
      note: accountForm.note.trim(),
      createdAt: now,
      updatedAt: now,
    }
    let next = {...ledger.value, accounts: [...ledger.value.accounts, account]}
    if (accountForm.balanceMode === 'manual' && accountForm.initialAmount.trim()) {
      const amount = normalizeAmount(accountForm.initialAmount)
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
        source: 'manual',
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
  if (account.installments?.some(plan => plan.status === 'active' || plan.status === 'overdue')) {
    actionError.value = '请先结清或终止全部分期项目。'
    return
  }
  if (!window.confirm(`停用“${account.name}”？历史数据会保留。`)) return
  // 停用是软删除：记录停用月份，历史数据和过去月份汇总继续保留。
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
    <div v-if="loadError" class="notice error" role="alert">{{ loadError }}</div>
    <div v-else-if="!ready" class="loading-state" aria-live="polite">正在读取本地账本…</div>
    <template v-else>
      <div v-if="statusMessage" class="toast" role="status">{{ statusMessage }}</div>

      <OverviewView v-show="viewMode === 'overview'" :active="viewMode === 'overview'" :ledger="ledger"
                    :selected-account-id="selectedAccountId" @new-account="openNewAccount"
                    @open-account="openAccountActions"/>

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
                分期账户总余额由项目汇总，不能直接修改；这里只补充该月汇率。</p>
              <div class="form-actions">
                <button class="primary-button" type="submit"
                        :disabled="selectedAccount.balanceMode === 'installment' && selectedAccount.currency === 'CNY'">
                  {{ selectedAccount.balanceMode === 'installment' ? '保存汇率' : '保存余额' }}
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
              <label v-if="accountForm.type === 'liability'">负债形态<select v-model="accountForm.balanceMode"
                                                                             :disabled="editingHasBalances">
                  <option value="manual">手动更新</option>
                  <option value="installment">分期负债</option>
                </select></label>
              <template v-if="!isEditingAccount">
                <p v-if="accountForm.balanceMode === 'installment'" class="field-hint">
                  保存账户后，再逐个添加分期项目。</p>
                <label v-else>初始余额<input v-model="accountForm.initialAmount" inputmode="decimal"
                                             placeholder="可留空，之后再更新"/></label>
                <label v-if="accountForm.balanceMode === 'manual' && accountForm.currency !== 'CNY'">初始汇率<input
                    v-model="accountForm.initialRate"
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

        <section v-if="editorMode === 'installment' && accountAction" class="editor-panel">
          <div class="panel-heading">
            <div><span class="panel-kicker">分期项目</span>
              <h2>{{
                  installmentAction === 'new' ? '添加分期' : installmentAction === 'correct' ? '修正进度' : '终止分期'
                }}</h2></div>
            <button class="close-button" type="button" aria-label="关闭" @click="closeEditor">×</button>
          </div>
          <form @submit.prevent="saveInstallment">
            <label>项目名称<input v-model="installmentForm.name" :readonly="installmentAction !== 'new'"
                                  placeholder="例如 手机分期"/></label>
            <template v-if="installmentAction === 'new'">
              <div class="form-grid"><label>每期金额<input v-model="installmentForm.periodAmount" inputmode="decimal"
                                                           placeholder="包含已知费用"/></label><label>原总期数<input
                  v-model.number="installmentForm.totalPeriods" type="number" min="1" step="1"/></label></div>
              <div class="form-grid"><label>当前剩余期数<input v-model.number="installmentForm.remainingPeriods"
                                                               type="number" min="1" :max="installmentForm.totalPeriods"
                                                               step="1"/></label><label>下次还款月<input
                  v-model="installmentForm.nextDueMonth" type="month"/></label></div>
              <p class="field-hint">最终到期月：{{ installmentMaturityMonth }}</p>
            </template>
            <template v-else>
              <label>生效月份<input v-model="installmentForm.effectiveMonth" type="month"/></label>
              <label v-if="installmentAction === 'correct'">修正后的剩余期数<input
                  v-model.number="installmentForm.remainingPeriods" type="number" min="0"
                  :max="installmentForm.totalPeriods" step="1"/></label>
              <p class="field-hint">{{
                  installmentAction === 'correct'
                      ? '该月及之后的自动余额会重建，更早历史保持不变。'
                      : '该月起剩余应付归零，已有历史继续保留。'
                }}</p>
            </template>
            <div class="form-actions">
              <button :class="installmentAction === 'terminate' ? 'danger-button' : 'primary-button'" type="submit">
                {{
                  installmentAction === 'new' ? '添加分期' : installmentAction === 'correct' ? '保存修正' : '终止分期'
                }}
              </button>
            </div>
          </form>
        </section>

          <div v-if="actionError" class="notice error" role="alert">{{ actionError }}</div>
      </aside>

      <div v-if="accountAction" class="account-action-backdrop" @click.self="closeAccountActions">
        <section class="account-action-modal" role="dialog" aria-modal="true"
                 :aria-label="`${accountAction.name} 操作`">
          <div class="panel-heading">
            <div><span class="panel-kicker">账户操作</span>
              <h2>{{ accountAction.name }}</h2></div>
            <button class="close-button" type="button" aria-label="关闭" @click="closeAccountActions">×</button>
          </div>
          <div class="account-action-summary">
            <span>{{
                accountAction.type === 'asset' ? '资产账户' : accountAction.balanceMode === 'installment' ? '分期负债账户' : '普通负债账户'
              }} · {{ accountAction.currency }}</span>
            <strong v-if="accountActionRow?.record && accountActionRow.rate">{{
                accountAction.type === 'liability' ? '-' : ''
              }}{{ formatCny(accountActionRow.cnyAmount) }}</strong>
            <strong v-else>未录入</strong>
            <small v-if="accountActionRow?.record">记录月份：{{ accountActionRow.record.date }}</small>
          </div>
          <div v-if="accountAction.balanceMode === 'installment'" class="installment-manager">
            <div v-if="!activeActionPlans.length" class="installment-empty">暂无进行中的分期</div>
            <div v-for="plan in activeActionPlans" :key="plan.id" class="installment-item">
              <div class="installment-main">
                <strong>{{ plan.name }}</strong>
                <span class="installment-status" :class="installmentDueState(plan)">{{
                    installmentStatusText(plan)
                  }}</span>
                <small>{{ formatOriginal(installmentBalance(plan), accountAction.currency) }} · 剩余
                  {{ plan.remainingPeriods }}/{{ plan.totalPeriods }} 期 · 下次 {{ plan.nextDueMonth }}</small>
              </div>
              <div class="installment-actions">
                <button v-if="installmentDueState(plan) === 'pending'" class="secondary-button" type="button"
                        @click="confirmPlan(plan)">已还一期
                </button>
                <button class="text-button" type="button" @click="openInstallmentEditor('correct', plan)">修正</button>
                <button v-if="plan.effectiveMonth === todayMonthISO() && plan.nextDueMonth > todayMonthISO()"
                        class="text-danger" type="button" @click="deletePlan(plan)">删除
                </button>
                <button class="text-danger" type="button" @click="openInstallmentEditor('terminate', plan)">终止
                </button>
              </div>
            </div>
            <details v-if="endedActionPlans.length" class="ended-installments">
              <summary>已结束项目（{{ endedActionPlans.length }}）</summary>
              <div v-for="plan in endedActionPlans" :key="plan.id" class="installment-item ended">
                <div class="installment-main"><strong>{{ plan.name }}</strong>
                  <span class="installment-status" :class="plan.status">{{ installmentStatusText(plan) }}</span>
                  <small>{{ plan.status === 'terminated' ? `${plan.terminatedMonth} 起终止` : '已全部还清' }}</small>
                </div>
              </div>
            </details>
          </div>
          <div class="account-action-buttons">
            <button v-if="accountAction.status === 'active' && accountAction.balanceMode === 'manual'"
                    class="primary-button" type="button"
                    @click="openBalanceEditor(accountAction)">更新余额
            </button>
            <button v-if="accountAction.status === 'active' && accountAction.balanceMode === 'installment'"
                    class="primary-button" type="button"
                    @click="openInstallmentEditor('new')">添加分期
            </button>
            <button class="secondary-button" type="button" @click="openEditAccount(accountAction)">编辑账户</button>
          </div>
          <p v-if="accountAction.status === 'inactive'" class="field-hint">账户已停用，只保留历史记录，不能新增余额。</p>
        </section>
      </div>

      <HistoryView v-show="viewMode === 'history'" :active="viewMode === 'history'" :ledger="ledger"
                   @edit-balance="openHistoryBalanceEditor" @delete-record="deleteHistoryRecord"/>

      <BackupView v-show="viewMode === 'backup'" :ledger="ledger" @replace-ledger="ledger = $event"/>
    </template>
  </div>
</template>

<style scoped src="./NetWorthTracker.css"></style>
