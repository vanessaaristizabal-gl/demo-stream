<script setup lang="ts">
import { DsCard, DsTable, type DsColumn } from '@/design-system'
import type { BatchReceipt } from '@/shared/api/types'
import DateText from './DateText.vue'

defineProps<{ receipts: BatchReceipt[]; error?: string | null }>()

const COLUMNS: DsColumn[] = [
  { key: 'label', label: 'Item' },
  { key: 'actor', label: 'Who' },
  { key: 'summary', label: 'What' },
  { key: 'steps', label: 'Path' },
  { key: 'at', label: 'When' },
]
</script>

<template>
  <section v-if="receipts.length > 0 || error" aria-labelledby="receipts-title">
    <h2 id="receipts-title" class="title">Changelog receipts ({{ receipts.length }})</h2>
    <p v-if="error" class="ds-muted" role="status">{{ error }}</p>
    <DsCard v-if="receipts.length > 0" :padded="false">
      <DsTable :columns="COLUMNS" :rows="receipts" row-key="id" caption="Receipts for this batch">
        <template #cell-steps="{ row }">{{ row.steps.join(' > ') }}</template>
        <template #cell-at="{ row }"><DateText :value="row.at" /></template>
      </DsTable>
    </DsCard>
  </section>
</template>

<style scoped>
.title {
  margin-bottom: var(--ds-space-2);
  font-size: var(--ds-font-size-lg);
}
</style>
