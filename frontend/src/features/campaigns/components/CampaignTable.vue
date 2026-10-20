<script setup lang="ts">
import { Inbox, Pencil, Trash2 } from 'lucide-vue-next'
import { DsButton, DsCard, DsEmptyState, DsInput, DsPagination, DsTable, DsTag, useTable, type DsColumn } from '@/design-system'
import DateText from '@/shared/components/DateText.vue'
import StatusBadge from '@/shared/components/StatusBadge.vue'
import { dateSortKey, formatMoney } from '@/shared/utils/format'
import type { CampaignRow } from '../rows'

const props = defineProps<{ rows: CampaignRow[] }>()
const emit = defineEmits<{ open: [row: CampaignRow]; edit: [row: CampaignRow]; remove: [row: CampaignRow] }>()

const COLUMNS: DsColumn[] = [
  { key: 'name', label: 'Campaign', sortable: true },
  { key: 'kind', label: 'Source', sortable: true },
  { key: 'owner', label: 'Dealer', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'budget', label: 'Daily budget', sortable: true, align: 'end' },
  { key: 'created', label: 'Created', sortable: true },
  { key: 'actions', label: 'Actions' },
]

const { search, sort, page, pageCount, pageRows } = useTable(() => props.rows, {
  pageSize: 10,
  initialSort: { key: 'name', dir: 'asc' },
  searchText: (r) => `${r.name} ${r.owner} ${r.kind}`,
  accessors: {
    budget: (r) => r.daily_budget,
    created: (r) => dateSortKey(r.created_at),
  },
})
</script>

<template>
  <DsCard v-if="rows.length === 0">
    <DsEmptyState title="No campaigns yet" :icon="Inbox">Adopted campaigns and simulated ones will appear here.</DsEmptyState>
  </DsCard>
  <DsCard v-else :padded="false" class="table-card">
    <div class="toolbar">
      <DsInput v-model="search" label="Search campaigns" type="search" placeholder="Name, dealer or source" />
    </div>
    <DsTable v-model:sort="sort" :columns="COLUMNS" :rows="pageRows" row-key="key" caption="Campaigns">
      <template #cell-name="{ row }">
        <a href="#" class="link" @click.prevent="emit('open', row)">{{ row.name }}</a>
      </template>
      <template #cell-kind="{ row }">
        <DsTag :tone="row.kind === 'live' ? 'info' : 'neutral'">{{ row.kind === 'live' ? 'Live' : 'Simulated' }}</DsTag>
      </template>
      <template #cell-status="{ row }"><StatusBadge :status="row.status" /></template>
      <template #cell-budget="{ row }">{{ formatMoney(row.daily_budget) }}</template>
      <template #cell-created="{ row }"><DateText :value="row.created_at" /></template>
      <template #cell-actions="{ row }">
        <span class="actions">
          <!-- A live campaign changes only through approval: Edit opens a change request. Only simulated ones can be deleted. -->
          <DsButton
            size="sm"
            variant="ghost"
            :icon="Pencil"
            :aria-label="row.kind === 'live' ? `Request a change to ${row.name}` : `Edit ${row.name}`"
            @click="emit('edit', row)"
          />
          <DsButton
            v-if="row.kind === 'simulated'"
            size="sm"
            variant="ghost"
            :icon="Trash2"
            :aria-label="`Delete ${row.name}`"
            @click="emit('remove', row)"
          />
        </span>
      </template>
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
.actions {
  display: inline-flex;
  gap: var(--ds-space-1);
}
</style>
