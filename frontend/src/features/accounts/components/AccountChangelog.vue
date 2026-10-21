<script setup lang="ts">
import { History } from 'lucide-vue-next'
import { DsCard, DsEmptyState, DsTable, DsTag, type DsColumn } from '@/design-system'
import type { ChangelogEntry } from '@/shared/api/types'
import DateText from '@/shared/components/DateText.vue'
import { FIELD_LABELS, formatValue } from '@/shared/utils/format'

defineProps<{ entries: ChangelogEntry[] }>()

const COLUMNS: DsColumn[] = [
  { key: 'when', label: 'When' },
  { key: 'campaign', label: 'Campaign' },
  { key: 'change', label: 'Change' },
  { key: 'source', label: 'Source' },
  { key: 'who', label: 'Who' },
]
</script>

<template>
  <DsCard v-if="entries.length === 0">
    <DsEmptyState title="No changes recorded" :icon="History"
      >Every write on this account's campaigns, and every edit made directly in the provider, is recorded here.</DsEmptyState
    >
  </DsCard>
  <DsCard v-else :padded="false">
    <DsTable :columns="COLUMNS" :rows="entries" row-key="id" caption="Changes on this account">
      <template #cell-when="{ row }"><DateText :value="row.occurred_at" mode="datetime" /></template>
      <template #cell-campaign="{ row }">{{ row.campaign?.name ?? '—' }}</template>
      <template #cell-change="{ row }">
        {{ FIELD_LABELS[row.field] ?? row.field }}: {{ formatValue(row.field, row.old_value) }} to
        {{ formatValue(row.field, row.new_value) }}
      </template>
      <template #cell-source="{ row }">
        <DsTag :tone="row.source === 'platform' ? 'info' : 'warning'">{{
          row.source === 'platform' ? 'Through Stream' : 'In the provider'
        }}</DsTag>
      </template>
      <template #cell-who="{ row }">{{ row.actor?.name ?? '—' }}</template>
    </DsTable>
  </DsCard>
</template>
