<script setup lang="ts">
import {computed, nextTick, ref, watch} from 'vue'

const props = defineProps<{
  expirations: string[]
  selectedExpiry: string
  legCounts: ReadonlyMap<string, number>
  loading: boolean
}>()

const emit = defineEmits<{
  select: [expiry: string]
}>()

const scroller = ref<HTMLElement | null>(null)

const groups = computed(() => {
  const result: {key: string, label: string, dates: string[]}[] = []
  const currentYear = new Date().getFullYear()
  // 保留 Bridge 返回的到期日顺序，只按相邻月份分组；日期栏与默认“最近到期日”顺序一致。
  for (const expiry of props.expirations) {
    const [year, month] = expiry.split('-').map(Number)
    const key = `${year}-${month}`
    let group = result[result.length - 1]
    if (!group || group.key !== key) {
      group = {key, label: year === currentYear ? `${month}月` : `${year}年${month}月`, dates: []}
      result.push(group)
    }
    group.dates.push(expiry)
  }
  return result
})

function day(expiry: string): string {
  return String(Number(expiry.slice(8, 10)))
}

function daysToExpiry(expiry: string): number {
  // 使用本地中午计算自然日，避开午夜时区和夏令时边界。
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const target = new Date(`${expiry}T12:00:00`)
  return Math.max(0, Math.round((target.getTime() - today.getTime()) / 86_400_000))
}

function expiryLabel(expiry: string): string {
  const count = props.legCounts.get(expiry) ?? 0
  return `${expiry}，${daysToExpiry(expiry)} 天到期${count ? `，已选 ${count} 腿` : ''}`
}

function selectExpiry(expiry: string): void {
  if (expiry !== props.selectedExpiry && !props.loading) emit('select', expiry)
}

async function revealSelected(): Promise<void> {
  await nextTick()
  // 跨期腿可能跳到视口外的月份，选择后主动揭示但不抢占键盘焦点。
  const selected = scroller.value?.querySelector<HTMLElement>('[aria-current="date"]')
  selected?.scrollIntoView({behavior: 'smooth', block: 'nearest', inline: 'center'})
}

watch(() => props.selectedExpiry, revealSelected)
</script>

<template>
  <section class="expiry-rail" aria-labelledby="expiry-rail-heading">
    <div class="rail-label">
      <strong id="expiry-rail-heading">到期日</strong>
      <span><i/>当前浏览</span>
      <span><b/>已含策略腿</span>
    </div>
    <div ref="scroller" class="month-scroller">
      <div v-for="group in groups" :key="group.key" class="month-group">
        <div class="month-label">{{ group.label }}</div>
        <div class="date-list">
          <button
              v-for="expiry in group.dates"
              :key="expiry"
              type="button"
              class="expiry-button"
              :class="{ selected: expiry === selectedExpiry, used: legCounts.has(expiry) }"
              :aria-current="expiry === selectedExpiry ? 'date' : undefined"
              :aria-label="expiryLabel(expiry)"
              :disabled="loading && expiry !== selectedExpiry"
              @click="selectExpiry(expiry)"
          >
            <span>{{ day(expiry) }}</span>
            <small>{{ daysToExpiry(expiry) }}D</small>
            <b v-if="legCounts.has(expiry)" class="leg-count" aria-hidden="true">{{ legCounts.get(expiry) }}</b>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.expiry-rail {
  display: grid;
  grid-template-columns: 94px minmax(0, 1fr);
  min-height: 84px;
  margin-top: 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg);
  overflow: hidden;
}

.rail-label {
  display: grid;
  align-content: center;
  gap: 5px;
  padding: 10px 12px;
  border-right: 1px solid var(--vp-c-divider);
}

.rail-label strong {
  font-size: .8125rem;
}

.rail-label span {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--vp-c-text-2);
  font-size: .625rem;
  white-space: nowrap;
}

.rail-label i, .rail-label b {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--vp-c-brand-2);
}

.rail-label b {
  box-sizing: border-box;
  background: var(--vp-c-bg);
  border: 2px solid var(--vp-c-brand-2);
}

.month-scroller {
  display: flex;
  gap: 16px;
  min-width: 0;
  padding: 9px 12px 10px;
  overflow-x: auto;
  overscroll-behavior-inline: contain;
  scrollbar-gutter: stable;
}

.month-group {
  flex: 0 0 auto;
  min-width: max-content;
}

.month-label {
  margin-bottom: 5px;
  padding-bottom: 3px;
  border-bottom: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-2);
  font-size: .6875rem;
  text-align: center;
}

.date-list {
  display: flex;
  gap: 5px;
}

.expiry-button {
  position: relative;
  display: grid;
  width: 48px;
  height: 39px;
  padding: 3px 4px;
  place-content: center;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg-soft);
  cursor: pointer;
  font: inherit;
  font-variant-numeric: tabular-nums;
  line-height: 1.05;
  transition: border-color 160ms ease-out, background-color 160ms ease-out, color 160ms ease-out;
}

.expiry-button:hover:not(:disabled) {
  border-color: var(--vp-c-brand-3);
  background: var(--vp-c-brand-soft);
}

.expiry-button:active:not(:disabled) {
  background: var(--vp-c-brand-soft);
}

.expiry-button:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
}

.expiry-button:disabled {
  cursor: wait;
  opacity: .55;
}

.expiry-button > span {
  font-size: .75rem;
  font-weight: 650;
}

.expiry-button small {
  margin-top: 2px;
  color: var(--vp-c-text-3);
  font-size: .5625rem;
}

.expiry-button.used {
  border-color: color-mix(in srgb, var(--vp-c-brand-2) 55%, var(--vp-c-divider));
}

.expiry-button.selected {
  border-color: var(--vp-c-brand-2);
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

.leg-count {
  position: absolute;
  top: -5px;
  right: -5px;
  display: grid;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  place-items: center;
  border: 2px solid var(--vp-c-bg);
  border-radius: 999px;
  color: white;
  background: var(--vp-c-brand-2);
  font-size: .5rem;
  line-height: 1;
}

@media (prefers-reduced-motion: reduce) {
  .expiry-button {
    transition: none;
  }
}
</style>
