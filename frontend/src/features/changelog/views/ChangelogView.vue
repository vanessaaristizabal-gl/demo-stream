<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { History } from 'lucide-vue-next'
import { DsCard, DsEmptyState, DsPagination, DsSegmented, DsTable, DsTag, useTable, type DsColumn } from '@/design-system'
import DateText from '@/shared/components/DateText.vue'
import { dateSortKey, FIELD_LABELS, formatValue } from '@/shared/utils/format'
import { useChangelogStore } from '../store'

const store = useChangelogStore()

const SOURCES = [
  { label: 'All', value: 'all' },
  { label: 'Platform', value: 'platform' },
  { label: 'Outside the platform', value: 'external' },
]

const COLUMNS: DsColumn[] = [
  { key: 'when', label: 'When', sortable: true },
  { key: 'campaign', label: 'Campaign', sortable: true },
  { key: 'field', label: 'Field' },
  { key: 'from', label: 'From' },
  { key: 'to', label: 'To' },
  { key: 'source', label: 'Source', sortable: true },
  { key: 'people', label: 'Actor / approver' },
]

const { sort, page, pageCount, pageRows } = useTable(() => store.items, {
  pageSize: 15,
  initialSort: { key: 'when', dir: 'desc' },
  accessors: { when: (e) => dateSortKey(e.occurred_at), campaign: (e) => e.campaign?.name, source: (e) => e.source },
})

onMounted(() => store.fetchAll())
watch(
  () => store.source,
  () => store.fetchAll(),
)
</script>

<template>
  <div class="ds-page-head">
    <h1>Changelog</h1>
    <p class="ds-muted">Who changed what, including edits made directly in Google Ads and Meta.</p>
  </div>
  <DsCard :padded="false" class="table-card">
    <div class="toolbar">
      <DsSegmented v-model="store.source" label="Source" :options="SOURCES" />
    </div>
    <p v-if="store.loading" class="ds-muted loading" role="status">Loading changelog…</p>
    <DsEmptyState v-else-if="store.items.length === 0" title="No changes recorded yet" :icon="History" />
    <template v-else>
      <DsTable v-model:sort="sort" :columns="COLUMNS" :rows="pageRows" row-key="id" caption="Changelog">
        <template #cell-when="{ row }"><DateText :value="row.occurred_at" mode="datetime" /></template>
        <template #cell-campaign="{ row }">{{ row.campaign?.name ?? '—' }}</template>
        <template #cell-field="{ row }">{{ FIELD_LABELS[row.field] ?? row.field }}</template>
        <template #cell-from="{ row }">{{ formatValue(row.field, row.old_value) }}</template>
        <template #cell-to="{ row }">
          <strong>{{ formatValue(row.field, row.new_value) }}</strong>
        </template>
        <template #cell-source="{ row }">
          <DsTag :tone="row.source === 'external' ? 'warning' : 'success'">{{ row.source }}</DsTag>
        </template>
        <template #cell-people="{ row }">{{ row.actor?.name ?? '—' }} / {{ row.approver?.name ?? '—' }}</template>
      </DsTable>
      <DsPagination v-model:page="page" :page-count="pageCount" />
    </template>
  </DsCard>
</template>

<style scoped>
.table-card {
  overflow: hidden;
}
.toolbar {
  padding: var(--ds-space-4);
  border-bottom: var(--ds-border-width-thin) solid var(--ds-color-border-default);
}
.loading {
  padding: var(--ds-space-4);
}
</style>
