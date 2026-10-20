<script setup lang="ts">
import { FlaskConical } from 'lucide-vue-next'
import { DsCard, DsEmptyState, DsInput, DsPagination, DsTable, DsTag, useTable, type DsColumn } from '@/design-system'
import type { SandboxCampaign } from '@/shared/api/types'
import DateText from '@/shared/components/DateText.vue'
import StatusBadge from '@/shared/components/StatusBadge.vue'
import { dateSortKey, formatMoney, formatNumber } from '@/shared/utils/format'

const props = defineProps<{ campaigns: SandboxCampaign[] }>()
const emit = defineEmits<{ select: [id: number] }>()

const COLUMNS: DsColumn[] = [
  { key: 'name', label: 'Campaign', sortable: true },
  { key: 'platform', label: 'Platform', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'budget', label: 'Daily budget', sortable: true, align: 'end' },
  { key: 'spend', label: 'Spend (30 days)', sortable: true, align: 'end' },
  { key: 'clicks', label: 'Clicks', sortable: true, align: 'end' },
  { key: 'conversions', label: 'Conversions', sortable: true, align: 'end' },
  { key: 'created', label: 'Created', sortable: true },
]

const { search, sort, page, pageCount, pageRows } = useTable(() => props.campaigns, {
  pageSize: 10,
  initialSort: { key: 'created', dir: 'desc' },
  searchText: (c) => `${c.name} ${c.platform} ${c.goal}`,
  accessors: {
    budget: (c) => c.daily_budget,
    spend: (c) => c.totals.cost,
    clicks: (c) => c.totals.clicks,
    conversions: (c) => c.totals.conversions,
    created: (c) => dateSortKey(c.created_at),
  },
})
</script>

<template>
  <DsCard v-if="campaigns.length === 0">
    <DsEmptyState title="No simulated campaigns yet" :icon="FlaskConical"
      >Create one with the form to see its structure and metrics.</DsEmptyState
    >
  </DsCard>
  <DsCard v-else :padded="false" class="table-card">
    <div class="toolbar">
      <DsInput v-model="search" label="Search simulated campaigns" type="search" placeholder="Name, platform or goal" />
    </div>
    <DsTable v-model:sort="sort" :columns="COLUMNS" :rows="pageRows" row-key="id" caption="Simulated campaigns">
      <template #cell-name="{ row }">
        <a href="#" class="link" @click.prevent="emit('select', row.id)">{{ row.name }}</a>
      </template>
      <template #cell-platform="{ row }">
        <DsTag tone="info">{{ row.platform }}</DsTag>
      </template>
      <template #cell-status="{ row }"><StatusBadge :status="row.status" /></template>
      <template #cell-budget="{ row }">{{ formatMoney(row.daily_budget) }}</template>
      <template #cell-spend="{ row }">{{ formatMoney(row.totals.cost) }}</template>
      <template #cell-clicks="{ row }">{{ formatNumber(row.totals.clicks) }}</template>
      <template #cell-conversions="{ row }">{{ formatNumber(row.totals.conversions) }}</template>
      <template #cell-created="{ row }"><DateText :value="row.created_at" /></template>
      <template #empty>No simulated campaigns match your search.</template>
    </DsTable>
    <DsPagination v-model:page="page" :page-count="pageCount" />
  </DsCard>
</template>

<style scoped>
.table-card {
  overflow: hidden;
}
.toolbar {
  padding: var(--ds-space-4);
  border-bottom: var(--ds-border-width-thin) solid var(--ds-color-border-default);
  max-width: 28rem;
}
.link {
  color: var(--ds-color-text-link);
  font-weight: var(--ds-font-weight-semibold);
}
</style>
