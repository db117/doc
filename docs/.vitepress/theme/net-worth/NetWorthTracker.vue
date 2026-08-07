<script setup lang="ts">
import {computed, onMounted, reactive, ref, watch} from 'vue'
import BackupView from './BackupView.vue'
import HistoryView from './HistoryView.vue'
import OverviewView from './OverviewView.vue'
import {
  ACCOUNT_CATEGORIES,
  CURRENCIES,
  REGIONS,
  accountHasBalances,
  calculateMaturityDate,
  confirmInstallmentPaid,
  emptyLedger,
  installmentBalance,
  latestBalance,
  multiplyAmountByRate,
  normalizeAmount,
  normalizeMonth,
  normalizeRate,
  rateForRecord,
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
import {formatCny} from './format'
import {loadLedger, saveLedger} from './storage'

type EditorMode = 'account' | 'balance' | null
type ViewMode = 'overview' | 'history' | 'backup'

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
const historyCorrection = ref(false)
const rateLoading = ref(false)
const rateSource = ref<RateSource | null>(null)
const rateMessage = ref('')
const manualRateTouched = ref(false)
const accountForm = reactive<AccountForm>(blankAccountForm())
const balanceForm = reactive<BalanceForm>({date: todayMonthISO(), amount: '', rate: ''})
const selectedAccount = computed(() => ledger.value.accounts.find(account => account.id === selectedAccountId.value) ?? null)
const isEditingAccount = computed(() => Boolean(editingAccountId.value))
const editingAccount = computed(() => ledger.value.accounts.find(account => account.id === editingAccountId.value) ?? null)
const editingHasBalances = computed(() => Boolean(editingAccount.value && accountHasBalances(ledger.value, editingAccount.value.id)))

const accountAction = computed(() => ledger.value.accounts.find(account => account.id === accountActionId.value) ?? null)
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

watch([() => accountForm.nextDueDate, () => accountForm.remainingPeriods], () => {
  // 到期月份是计划的派生值，随下期日期或剩余期数变化自动保持一致。
  if (accountForm.balanceMode !== 'installment' || !accountForm.nextDueDate || accountForm.remainingPeriods < 1) return
  accountForm.maturityDate = calculateMaturityDate(accountForm.nextDueDate, accountForm.remainingPeriods)
})

onMounted(async () => {
  try {
    ledger.value = await loadLedger()
    ready.value = true
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

async function saveBalance(): Promise<void> {
  const account = selectedAccount.value
  if (!account) return
  // 分期当前余额由计划派生，禁止普通更新绕过剩余期数；历史纠错是唯一例外。
  if (account.balanceMode === 'installment' && !historyCorrection.value) {
    actionError.value = '分期负债请使用“已还一期”，或编辑分期计划。'
    return
  }
  try {
    const amount = normalizeAmount(balanceForm.amount)
    const rate = normalizeFormRate()
    let next = ledger.value
    // 外币余额与当月汇率一起生成下一份账本，最后只执行一次持久化。
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
    // 初始余额可留空；分期账户必须立即生成由计划计算出的初始欠款。
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

      <HistoryView v-show="viewMode === 'history'" :active="viewMode === 'history'" :ledger="ledger"
                   @edit-balance="openHistoryBalanceEditor" @delete-record="deleteHistoryRecord"/>

      <BackupView v-show="viewMode === 'backup'" :ledger="ledger" @replace-ledger="ledger = $event"/>
    </template>
  </div>
</template>

<style scoped src="./NetWorthTracker.css"></style>
