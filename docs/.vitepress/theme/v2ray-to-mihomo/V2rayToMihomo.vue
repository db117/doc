<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { SubscriptionDecodeError } from './codec'
import {
  fetchSubscription,
  FetchSubscriptionError,
  type FetchFailureKind,
} from './fetch-subscription'
import { generateMihomoYaml, MihomoConfigError } from './mihomo-config'
import { parseSubscription } from './parse-subscription'
import { parseHttpSubscriptionUrl } from './subscription-url'
import {
  DEFAULT_RULE_OPTIONS,
  type ParseSubscriptionResult,
  type RuleOptions,
} from './types'

const subscriptionUrl = ref('')
const manualContent = ref('')
const manualOpen = ref(false)
const busy = ref(false)
const errorMessage = ref('')
const statusMessage = ref('')
const fetchFailureKind = ref<FetchFailureKind | null>(null)
const result = ref<ParseSubscriptionResult | null>(null)
const yaml = ref('')
const ruleOptions = reactive<RuleOptions>({ ...DEFAULT_RULE_OPTIONS })

const fetchMessages: Record<FetchFailureKind, string> = {
  'invalid-url': '请输入有效的 HTTP 或 HTTPS 订阅地址。',
  'mixed-content': 'HTTPS 页面无法读取 HTTP 订阅，请打开订阅地址后粘贴返回内容。',
  timeout: '读取订阅超时，请检查网络或改用手动粘贴。',
  http: '订阅服务返回错误状态，请确认地址有效或改用手动粘贴。',
  'network-or-cors': '浏览器无法读取订阅，可能是网络或 CORS 限制，请改用手动粘贴。',
  empty: '订阅服务返回了空内容，请确认地址是否有效。',
}

const activeFetchFailureKind = computed<FetchFailureKind | null>(() => {
  const kind = fetchFailureKind.value
  return kind !== null && errorMessage.value === fetchMessages[kind] ? kind : null
})
const hasActiveInvalidUrlError = computed(() => activeFetchFailureKind.value === 'invalid-url')
const canOpenSubscription = computed(() => (
  activeFetchFailureKind.value !== null
  && parseHttpSubscriptionUrl(subscriptionUrl.value) !== null
))

function convert(content: string): void {
  errorMessage.value = ''
  statusMessage.value = ''
  try {
    const parsed = parseSubscription(content)
    result.value = parsed
    if (parsed.nodes.length === 0) {
      yaml.value = ''
      errorMessage.value = '没有找到可转换的 VMess、VLESS、Trojan 或 Shadowsocks 节点。'
      return
    }
    yaml.value = generateMihomoYaml(parsed.nodes, ruleOptions)
    statusMessage.value = `已生成包含 ${parsed.nodes.length} 个节点的配置。`
  } catch (error) {
    result.value = null
    yaml.value = ''
    errorMessage.value = error instanceof SubscriptionDecodeError || error instanceof MihomoConfigError
      ? error.message
      : '订阅内容无法转换，请检查内容格式。'
  }
}

async function readSubscription(): Promise<void> {
  busy.value = true
  errorMessage.value = ''
  statusMessage.value = '正在读取并转换订阅。'
  fetchFailureKind.value = null
  try {
    const content = await fetchSubscription(subscriptionUrl.value)
    convert(content)
  } catch (error) {
    manualOpen.value = true
    statusMessage.value = ''
    if (error instanceof FetchSubscriptionError) {
      fetchFailureKind.value = error.kind
      errorMessage.value = fetchMessages[error.kind]
    } else {
      errorMessage.value = '读取订阅失败，请改用手动粘贴。'
    }
  } finally {
    busy.value = false
  }
}

function convertManual(): void {
  convert(manualContent.value)
  if (yaml.value) fetchFailureKind.value = null
}

function clearFetchFailure(): void {
  if (fetchFailureKind.value === null) return
  fetchFailureKind.value = null
  errorMessage.value = ''
  statusMessage.value = ''
}

function reset(): void {
  subscriptionUrl.value = ''
  manualContent.value = ''
  manualOpen.value = false
  busy.value = false
  errorMessage.value = ''
  statusMessage.value = ''
  fetchFailureKind.value = null
  result.value = null
  yaml.value = ''
  Object.assign(ruleOptions, DEFAULT_RULE_OPTIONS)
}

function openSubscription(): void {
  const safeUrl = parseHttpSubscriptionUrl(subscriptionUrl.value)
  if (!safeUrl) {
    fetchFailureKind.value = 'invalid-url'
    statusMessage.value = ''
    errorMessage.value = fetchMessages['invalid-url']
    return
  }

  const popup = window.open(safeUrl.href, '_blank', 'noopener,noreferrer')
  if (popup) popup.opener = null
}

async function copyConfig(): Promise<void> {
  try {
    await navigator.clipboard.writeText(yaml.value)
    errorMessage.value = ''
    statusMessage.value = '配置已复制到剪贴板。'
  } catch {
    statusMessage.value = ''
    errorMessage.value = '复制失败，请从预览中手动复制，或下载配置文件。'
  }
}

function downloadConfig(): void {
  try {
    const href = URL.createObjectURL(new Blob([yaml.value], { type: 'application/yaml;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = href
    anchor.download = 'config.yaml'
    document.body.append(anchor)
    anchor.click()
    anchor.remove()
    setTimeout(() => URL.revokeObjectURL(href), 0)
    errorMessage.value = ''
    statusMessage.value = '已开始下载 config.yaml。'
  } catch {
    statusMessage.value = ''
    errorMessage.value = '下载失败，请复制预览内容并保存为 config.yaml。'
  }
}

watch(ruleOptions, () => {
  if (!result.value?.nodes.length) return

  try {
    yaml.value = generateMihomoYaml(result.value.nodes, ruleOptions)
    errorMessage.value = ''
    statusMessage.value = '已按当前规则更新配置。'
  } catch (error) {
    yaml.value = ''
    statusMessage.value = ''
    errorMessage.value = error instanceof MihomoConfigError
      ? error.message
      : '配置更新失败，请重新转换订阅内容。'
  }
}, { deep: true })
</script>

<template>
  <section class="converter" aria-label="V2Ray 订阅转换工具">
    <div class="converter-grid">
      <section class="converter-panel converter-input" aria-labelledby="converter-input-heading">
        <h2 id="converter-input-heading">输入订阅</h2>

        <form class="read-form" :aria-busy="busy" @submit.prevent="readSubscription">
          <label for="subscription-url">订阅地址</label>
          <div class="input-action-row">
            <input
              id="subscription-url"
              v-model="subscriptionUrl"
              type="url"
              inputmode="url"
              autocomplete="off"
              autocapitalize="off"
              spellcheck="false"
              placeholder="https://example.com/subscription"
              :disabled="busy"
              :aria-invalid="hasActiveInvalidUrlError ? 'true' : undefined"
              :aria-describedby="hasActiveInvalidUrlError ? 'subscription-note converter-error' : 'subscription-note'"
              @input="clearFetchFailure"
            >
            <button class="button-primary" type="submit" :disabled="!subscriptionUrl.trim() || busy">
              {{ busy ? '正在读取…' : '读取订阅' }}
            </button>
          </div>
          <p id="subscription-note" class="converter-note">
            转换数据仅在当前浏览器页面处理，不经过本站服务器。浏览器只会直接请求你填写的订阅服务。
          </p>
        </form>

        <button
          class="button-secondary manual-toggle"
          type="button"
          :disabled="busy"
          :aria-expanded="manualOpen"
          aria-controls="manual-input"
          @click="manualOpen = !manualOpen"
        >
          无法读取？手动粘贴
        </button>

        <div v-if="manualOpen" id="manual-input" class="manual-input">
          <button
            v-if="canOpenSubscription"
            class="button-secondary"
            type="button"
            :disabled="busy"
            @click="openSubscription"
          >
            在新标签页打开订阅地址
          </button>

          <label for="manual-content">订阅内容</label>
          <textarea
            id="manual-content"
            v-model="manualContent"
            rows="8"
            autocomplete="off"
            autocapitalize="off"
            spellcheck="false"
            placeholder="粘贴订阅服务返回的 Base64 内容或节点链接"
            :disabled="busy"
          />
          <button
            class="button-primary"
            type="button"
            :disabled="!manualContent.trim() || busy"
            @click="convertManual"
          >
            转换粘贴内容
          </button>
        </div>

        <p class="converter-disclosure">
          页面仍会加载本站现有的百度访问统计，但转换组件不会向统计脚本写入订阅或节点数据。
        </p>
      </section>

      <section class="converter-panel converter-rules" aria-labelledby="converter-rules-heading">
        <h2 id="converter-rules-heading">配置规则</h2>
        <p class="panel-intro">标准分流</p>

        <label class="checkbox-row">
          <input v-model="ruleOptions.blockAds" type="checkbox" :disabled="busy">
          <span>拦截广告规则</span>
        </label>
        <label class="checkbox-row">
          <input v-model="ruleOptions.directChina" type="checkbox" :disabled="busy">
          <span>国内流量直连</span>
        </label>
        <label for="unmatched-rule">未匹配流量</label>
        <select id="unmatched-rule" v-model="ruleOptions.unmatched" :disabled="busy">
          <option value="proxy">使用节点选择</option>
          <option value="direct">直接连接</option>
        </select>
      </section>

      <section class="converter-panel converter-result" aria-labelledby="converter-result-heading">
        <h2 id="converter-result-heading">生成结果</h2>

        <div class="converter-status" role="status" aria-live="polite">
          <p v-if="busy">正在读取并转换订阅，请稍候。</p>
          <p v-else-if="statusMessage">{{ statusMessage }}</p>
          <p v-else-if="!result">转换后将在此处显示节点统计和 Mihomo YAML。</p>
        </div>

        <div v-if="errorMessage" id="converter-error" class="converter-error" role="status" aria-live="polite">
          {{ errorMessage }}
        </div>

        <template v-if="result">
          <p class="result-summary">
            共识别 {{ result.nodes.length }} 个节点：VMess {{ result.counts.vmess }}、VLESS
            {{ result.counts.vless }}、Trojan {{ result.counts.trojan }}、SS {{ result.counts.ss }}。
          </p>

          <div v-if="result.warnings.length" class="warning-list">
            <h3>转换警告</h3>
            <ul>
              <li v-for="warning in result.warnings" :key="`${warning.line}-${warning.protocol}-${warning.code}`">
                第 {{ warning.line }} 行 · {{ warning.protocol }} · {{ warning.message }}
              </li>
            </ul>
          </div>
        </template>

        <template v-if="yaml">
          <p class="credential-warning">配置包含节点凭据，请勿截图或公开分享。</p>
          <pre tabindex="0" aria-label="生成的 Mihomo YAML 配置"><code>{{ yaml }}</code></pre>
          <div class="result-actions">
            <button class="button-primary" type="button" :disabled="!yaml || busy" @click="copyConfig">
              复制配置
            </button>
            <button class="button-secondary" type="button" :disabled="!yaml || busy" @click="downloadConfig">
              下载 config.yaml
            </button>
            <button class="button-danger" type="button" :disabled="busy" @click="reset">
              清空
            </button>
          </div>
        </template>
      </section>
    </div>
  </section>
</template>

<style scoped>
.converter {
  margin-top: 24px;
  color: var(--vp-c-text-1);
  font-family: inherit;
}

.converter-grid {
  display: grid;
  gap: 16px;
  align-items: start;
}

.converter-panel {
  min-width: 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 20px;
  background: var(--vp-c-bg-soft);
}

.converter-panel h2,
.converter-panel h3,
.converter-panel p {
  margin-top: 0;
}

.converter-panel h2 {
  margin-bottom: 16px;
  border-top: 0;
  padding-top: 0;
  font-size: 20px;
  line-height: 1.35;
  text-wrap: balance;
}

.converter-panel h3 {
  margin-bottom: 8px;
  font-size: 16px;
  line-height: 1.4;
}

.converter label:not(.checkbox-row) {
  display: block;
  margin-bottom: 7px;
  font-weight: 600;
  line-height: 1.4;
}

.read-form {
  margin: 0;
}

.input-action-row {
  display: flex;
  gap: 10px;
  align-items: stretch;
}

.input-action-row input {
  flex: 1 1 360px;
  min-width: 0;
}

.converter input,
.converter textarea,
.converter select {
  width: 100%;
  min-height: 42px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font: inherit;
}

.converter input[type='url'],
.converter select {
  min-height: 42px;
  padding: 8px 11px;
}

.converter textarea {
  display: block;
  min-height: 160px;
  margin-bottom: 10px;
  padding: 10px 11px;
  font-family: var(--vp-font-family-mono);
  line-height: 1.55;
  resize: vertical;
}

.converter input::placeholder,
.converter textarea::placeholder {
  color: var(--vp-c-text-2);
  opacity: 1;
}

.converter input[aria-invalid='true'] {
  border-color: var(--vp-c-danger-1);
}

.converter button {
  min-height: 42px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 7px 13px;
  background: transparent;
  color: var(--vp-c-text-1);
  font: inherit;
  font-weight: 600;
  line-height: 1.35;
  cursor: pointer;
}

.converter button:hover:not(:disabled) {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.converter button:active:not(:disabled) {
  background: var(--vp-c-bg-soft);
}

.converter .button-primary {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-1);
  color: var(--vp-c-bg);
}

.converter .button-primary:hover:not(:disabled) {
  background: transparent;
  color: var(--vp-c-brand-1);
}

.converter .button-danger {
  border-color: var(--vp-c-danger-1);
  color: var(--vp-c-danger-1);
}

.converter button:focus-visible,
.converter input:focus-visible,
.converter textarea:focus-visible,
.converter select:focus-visible,
.converter pre:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
}

.converter button:disabled,
.converter input:disabled,
.converter textarea:disabled,
.converter select:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.converter-note,
.converter-disclosure,
.panel-intro,
.converter-status {
  color: var(--vp-c-text-2);
  font-size: 14px;
  line-height: 1.6;
}

.converter-note {
  max-width: 72ch;
  margin: 9px 0 0;
}

.manual-toggle {
  margin-top: 14px;
}

.manual-input {
  margin-top: 14px;
  border-top: 1px solid var(--vp-c-divider);
  padding-top: 14px;
}

.manual-input > .button-secondary {
  margin-bottom: 14px;
}

.converter-disclosure {
  max-width: 72ch;
  margin: 16px 0 0;
}

.panel-intro {
  margin-bottom: 14px;
  font-weight: 600;
}

.checkbox-row {
  display: flex;
  gap: 9px;
  align-items: center;
  min-height: 42px;
  margin: 12px 0;
  line-height: 1.5;
  cursor: pointer;
}

.checkbox-row input {
  width: 18px;
  min-height: 18px;
  height: 18px;
  margin: 0;
  accent-color: var(--vp-c-brand-1);
}

.converter-rules select {
  margin-top: 1px;
}

.converter-status {
  min-height: 22px;
  margin-bottom: 12px;
}

.converter-status p {
  margin-bottom: 0;
}

.converter-error,
.credential-warning {
  border: 1px solid var(--vp-c-danger-1);
  border-radius: 8px;
  padding: 10px 12px;
  color: var(--vp-c-danger-1);
  font-size: 14px;
  line-height: 1.55;
}

.converter-error {
  margin-bottom: 14px;
}

.result-summary {
  margin-bottom: 14px;
  line-height: 1.6;
}

.warning-list {
  margin-bottom: 14px;
  border-top: 1px solid var(--vp-c-divider);
  border-bottom: 1px solid var(--vp-c-divider);
  padding: 12px 0;
}

.warning-list ul {
  margin: 0;
  padding-left: 20px;
  color: var(--vp-c-text-2);
  font-size: 14px;
  line-height: 1.6;
}

.warning-list li + li {
  margin-top: 5px;
}

.credential-warning {
  margin-bottom: 10px;
}

.converter pre {
  max-height: 520px;
  margin: 0 0 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 14px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 13px;
  line-height: 1.55;
  overflow: auto;
}

.converter pre code {
  background: transparent;
  color: inherit;
}

.result-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

@media (min-width: 900px) {
  .converter-grid {
    grid-template-columns: minmax(280px, 0.8fr) minmax(0, 1.2fr);
  }

  .converter-input {
    grid-column: 1 / -1;
  }
}

@media (max-width: 760px) {
  .converter-panel {
    padding: 16px;
  }

  .input-action-row {
    flex-direction: column;
  }

  .input-action-row input {
    flex-basis: auto;
  }

  .input-action-row button,
  .manual-input > button,
  .result-actions button {
    width: 100%;
  }
}
</style>
