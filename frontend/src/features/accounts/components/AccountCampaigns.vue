<script setup lang="ts">
import { Inbox } from 'lucide-vue-next'
import { DsCard, DsEmptyState, DsTable, type DsColumn } from '@/design-system'
import type { Campaign } from '@/shared/api/types'
import DateText from '@/shared/components/DateText.vue'
import StatusBadge from '@/shared/components/StatusBadge.vue'
import { formatMoney } from '@/shared/utils/format'

defineProps<{ campaigns: Campaign[] }>()
const emit = defineEmits<{ open: [campaign: Campaign] }>()

const COLUMNS: DsColumn[] = [
  { key: 'name', label: 'Campaign' },
  { key: 'status', label: 'Status' },
  { key: 'budget', label: 'Daily budget', align: 'end' },
  { key: 'created', label: 'Created' },
]
</script>

<template>
  <DsCard v-if="campaigns.length === 0">
    <DsEmptyState title="No campaigns on this account" :icon="Inbox">Adopted campaigns will appear here.</DsEmptyState>
  </DsCard>
  <DsCard v-else :padded="false">
    <DsTable :columns="COLUMNS" :rows="campaigns" row-key="id" caption="Campaigns of this account">
      <template #cell-name="{ row }">
        <a href="#" class="link" @click.prevent="emit('open', row)">{{ row.name }}</a>
      </template>
      <template #cell-status="{ row }"><StatusBadge :status="row.status" /></template>
      <template #cell-budget="{ row }">{{ formatMoney(row.live.daily_budget) }}</template>
      <template #cell-created="{ row }"><DateText :value="row.created_at" /></template>
    </DsTable>
  </DsCard>
</template>

<style scoped>
.link {
  color: var(--ds-color-text-link);
  font-weight: var(--ds-font-weight-semibold);
}
</style>
