<script setup lang="ts">
import { Inbox } from 'lucide-vue-next'
import { DsCard, DsEmptyState, DsInput, DsPagination, DsTable, DsTag, useTable, type DsColumn } from '@/design-system'
import type { Campaign } from '@/shared/api/types'
import DateText from '@/shared/components/DateText.vue'
import StatusBadge from '@/shared/components/StatusBadge.vue'
import { dateSortKey, formatMoney } from '@/shared/utils/format'

const props = defineProps<{ campaigns: Campaign[] }>()
const emit = defineEmits<{ select: [id: number] }>()

const COLUMNS: DsColumn[] = [
  { key: 'name', label: 'Campaign', sortable: true },
  { key: 'dealer', label: 'Dealer', sortable: true },
  { key: 'provider', label: 'Provider', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'budget', label: 'Daily budget', sortable: true, align: 'end' },
  { key: 'created', label: 'Created', sortable: true },
]

const { search, sort, page, pageCount, pageRows } = useTable(() => props.campaigns, {
  pageSize: 10,
  initialSort: { key: 'name', dir: 'asc' },
  searchText: (c) => `${c.name} ${c.account?.dealer_name ?? ''} ${c.account?.provider ?? ''}`,
  accessors: {
    dealer: (c) => c.account?.dealer_name,
    provider: (c) => c.account?.provider,
    budget: (c) => c.live.daily_budget,
    created: (c) => dateSortKey(c.created_at),
  },
})
</script>

<template>
  <DsCard v-if="campaigns.length === 0">
    <DsEmptyState title="No campaigns yet" :icon="Inbox">Adopted campaigns will appear here.</DsEmptyState>
  </DsCard>
  <DsCard v-else :padded="false" class="table-card">
    <div class="toolbar">
      <DsInput v-model="search" label="Search campaigns" type="search" placeholder="Name, dealer or provider" />
    </div>
    <DsTable v-model:sort="sort" :columns="COLUMNS" :rows="pageRows" row-key="id" caption="Campaigns">
      <template #cell-name="{ row }">
        <a href="#" class="link" @click.prevent="emit('select', row.id)">{{ row.name }}</a>
      </template>
      <template #cell-dealer="{ row }">{{ row.account?.dealer_name ?? '—' }}</template>
      <template #cell-provider="{ row }">
        <DsTag v-if="row.account" tone="info">{{ row.account.provider }}</DsTag>
      </template>
      <template #cell-status="{ row }"><StatusBadge :status="row.status" /></template>
      <template #cell-budget="{ row }">{{ formatMoney(row.live.daily_budget) }}</template>
      <template #cell-created="{ row }"><DateText :value="row.created_at" /></template>
      <template #empty>No campaigns match your search.</template>
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
