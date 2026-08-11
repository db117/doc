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

/** 提取到期日中的日期数字。 */
function day(expiry: string): string {
  return String(Number(expiry.slice(8, 10)))
}

/** 计算到期日距离本地今天的非负天数。 */
function daysToExpiry(expiry: string): number {
  // 使用本地中午计算自然日，避开午夜时区和夏令时边界。
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const target = new Date(`${expiry}T12:00:00`)
  return Math.max(0, Math.round((target.getTime() - today.getTime()) / 86_400_000))
}

/** 生成包含期限和策略腿数量的无障碍标签。 */
function expiryLabel(expiry: string): string {
  const count = props.legCounts.get(expiry) ?? 0
  return `${expiry}，${daysToExpiry(expiry)} 天到期${count ? `，已选 ${count} 腿` : ''}`
}

/** 在页面空闲时切换当前浏览的到期日。 */
function selectExpiry(expiry: string): void {
  if (expiry !== props.selectedExpiry && !props.loading) emit('select', expiry)
}

/** 滚动日期栏以显示当前选中的到期日。 */
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

<style scoped src="./ExpirationRail.css"></style>
