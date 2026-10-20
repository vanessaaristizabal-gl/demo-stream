<script setup lang="ts">
import { computed } from 'vue'
import { DsTable, type DsColumn } from '@/design-system'
import type { FieldDiff } from '@/shared/api/types'
import { FIELD_LABELS, formatValue } from '@/shared/utils/format'

const props = defineProps<{ diff: FieldDiff | null }>()

const COLUMNS: DsColumn[] = [
  { key: 'label', label: 'Field' },
  { key: 'live', label: 'Live' },
  { key: 'proposed', label: 'Proposed' },
]

const rows = computed(() =>
  Object.entries(props.diff ?? {}).map(([field, change]) => ({
    field,
    label: FIELD_LABELS[field] ?? field,
    live: formatValue(field, change.old),
    proposed: formatValue(field, change.new),
  })),
)
</script>

<template>
  <p v-if="rows.length === 0" class="ds-muted">No changes against live state.</p>
  <DsTable v-else :columns="COLUMNS" :rows="rows" row-key="field" caption="Proposed changes">
    <template #cell-proposed="{ value }">
      <strong>{{ value }}</strong>
    </template>
  </DsTable>
</template>
