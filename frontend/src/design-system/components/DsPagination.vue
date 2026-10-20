<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import DsButton from './DsButton.vue'

const props = defineProps<{ pageCount: number }>()
const page = defineModel<number>('page', { required: true })

const prev = ref<InstanceType<typeof DsButton> | null>(null)
const next = ref<InstanceType<typeof DsButton> | null>(null)

// A disabled button cannot keep focus. If the one just used is now disabled (first or last page),
// hand focus to the opposite button so keyboard users are not dropped on <body> (WCAG 2.4.3).
async function go(delta: number): Promise<void> {
  page.value += delta
  await nextTick()
  const active = document.activeElement as HTMLButtonElement | null
  if (active === null || active === document.body || active.disabled) {
    const target = delta > 0 ? (page.value >= props.pageCount ? prev : next) : page.value <= 1 ? next : prev
    ;(target.value?.$el as HTMLElement | undefined)?.focus()
  }
}
</script>

<template>
  <nav v-if="pageCount > 1" class="ds-pagination" aria-label="Pagination">
    <DsButton
      ref="prev"
      variant="secondary"
      size="sm"
      :icon="ChevronLeft"
      aria-label="Previous page"
      :disabled="page <= 1"
      @click="go(-1)"
    />
    <span class="ds-pagination__status" aria-live="polite">Page {{ page }} of {{ pageCount }}</span>
    <DsButton
      ref="next"
      variant="secondary"
      size="sm"
      :icon="ChevronRight"
      aria-label="Next page"
      :disabled="page >= pageCount"
      @click="go(1)"
    />
  </nav>
</template>

<style scoped>
.ds-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--ds-space-3);
  padding: var(--ds-space-3);
  font-size: var(--ds-font-size-sm);
}
</style>
