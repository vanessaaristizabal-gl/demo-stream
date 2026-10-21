<script setup lang="ts">
import { computed, ref } from 'vue'
import { Building2 } from 'lucide-vue-next'
import { DsCard, DsEmptyState, DsInput, DsPagination, DsSegmented, DsTable, DsTag, useTable, type DsColumn } from '@/design-system'
import type { Account } from '@/shared/api/types'
import { formatMoney } from '@/shared/utils/format'

const props = defineProps<{ accounts: Account[] }>()
const emit = defineEmits<{ open: [account: Account] }>()

const COLUMNS: DsColumn[] = [
  { key: 'dealer', label: 'Account', sortable: true },
  { key: 'provider', label: 'Provider', sortable: true },
  { key: 'manufacturer', label: 'OEM', sortable: true },
  { key: 'budget', label: 'Monthly budget', sortable: true, align: 'end' },
  { key: 'campaigns', label: 'Campaigns', sortable: true, align: 'end' },
]

const provider = ref<'all' | 'google' | 'meta'>('all')
const PROVIDERS = computed(() => [
  { label: `All (${props.accounts.length})`, value: 'all' },
  { label: `Google Ads (${props.accounts.filter((a) => a.provider === 'google').length})`, value: 'google' },
  { label: `Meta Ads (${props.accounts.filter((a) => a.provider === 'meta').length})`, value: 'meta' },
])
const shown = computed(() => (provider.value === 'all' ? props.accounts : props.accounts.filter((a) => a.provider === provider.value)))

const { search, sort, page, pageCount, pageRows } = useTable(shown, {
  pageSize: 10,
  initialSort: { key: 'dealer', dir: 'asc' },
  searchText: (a) => `${a.dealer_name} ${a.manufacturer ?? ''} ${a.external_id}`,
  accessors: {
    dealer: (a) => a.dealer_name,
    manufacturer: (a) => a.manufacturer,
    budget: (a) => a.monthly_budget,
    campaigns: (a) => a.campaigns_count,
  },
})
</script>

<template>
  <DsCard v-if="accounts.length === 0">
    <DsEmptyState title="No accounts yet" :icon="Building2">Dealer accounts on Google Ads and Meta will appear here.</DsEmptyState>
  </DsCard>
  <DsCard v-else :padded="false" class="table-card">
    <div class="toolbar">
      <DsSegmented v-model="provider" label="Provider" :options="PROVIDERS" />
      <DsInput v-model="search" label="Search accounts" type="search" placeholder="Dealer, OEM or account id" />
    </div>
    <DsTable v-model:sort="sort" :columns="COLUMNS" :rows="pageRows" row-key="id" caption="Accounts">
      <template #cell-dealer="{ row }">
        <a href="#" class="link" @click.prevent="emit('open', row)">{{ row.dealer_name }}</a>
      </template>
      <template #cell-provider="{ row }">
        <DsTag tone="info">{{ row.provider === 'google' ? 'Google Ads' : 'Meta Ads' }}</DsTag>
      </template>
      <template #cell-manufacturer="{ row }">{{ row.manufacturer ?? '—' }}</template>
      <template #cell-budget="{ row }">
        <DsTag v-if="row.monthly_budget === null" tone="warning">No budget</DsTag>
        <template v-else>{{ formatMoney(row.monthly_budget) }}</template>
      </template>
      <template #cell-campaigns="{ row }">{{ row.campaigns_count }}</template>
      <template #empty>No accounts match your search.</template>
    </DsTable>
    <DsPagination v-model:page="page" :page-count="pageCount" />
  </DsCard>
</template>

<style scoped>
.table-card {
  overflow: hidden;
}
.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: var(--ds-space-4);
  padding: var(--ds-space-4);
  border-bottom: var(--ds-border-width-thin) solid var(--ds-color-border-default);
}
.link {
  color: var(--ds-color-text-link);
  font-weight: var(--ds-font-weight-semibold);
}
</style>
