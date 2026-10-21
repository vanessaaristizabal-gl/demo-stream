<script setup lang="ts">
import { computed, ref } from 'vue'
import { Check, ListChecks, X } from 'lucide-vue-next'
import {
  DsButton,
  DsCard,
  DsEmptyState,
  DsInput,
  DsMessage,
  DsPagination,
  DsSegmented,
  DsTable,
  useTable,
  type DsColumn,
} from '@/design-system'
import type { ChangeRequest } from '@/shared/api/types'
import DateText from '@/shared/components/DateText.vue'
import StatusBadge from '@/shared/components/StatusBadge.vue'
import { dateSortKey, FIELD_LABELS, formatValue } from '@/shared/utils/format'

interface Violation {
  rule_id: string
  message: string
}

const props = defineProps<{
  requests: ChangeRequest[]
  /** Only approvers and admins decide; everyone else sees the queue read-only. */
  canDecide?: boolean
  /** The request being approved or rejected right now: its buttons are busy and the others wait. */
  busyId?: number | null
  /** Why the last decision failed (for example a self-approval), shown above the table. */
  error?: string | null
}>()
const emit = defineEmits<{ approve: [id: number]; reject: [id: number]; open: [campaignId: number] }>()

const COLUMNS: DsColumn[] = [
  { key: 'campaign', label: 'Campaign', sortable: true },
  { key: 'change', label: 'Change' },
  { key: 'requester', label: 'Requested by', sortable: true },
  { key: 'created', label: 'Requested', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'actions', label: 'Decision' },
]

const view = ref<'pending' | 'all'>('pending')
const pendingCount = computed(() => props.requests.filter((r) => r.status === 'pending_approval').length)
const VIEW_OPTIONS = computed(() => [
  { label: `Pending (${pendingCount.value})`, value: 'pending' },
  { label: `All (${props.requests.length})`, value: 'all' },
])
const shown = computed(() => (view.value === 'pending' ? props.requests.filter((r) => r.status === 'pending_approval') : props.requests))

const { search, sort, page, pageCount, pageRows } = useTable(shown, {
  pageSize: 10,
  initialSort: { key: 'created', dir: 'desc' },
  searchText: (r) => `${r.campaign?.name ?? ''} ${r.requester?.name ?? ''} ${r.status}`,
  accessors: {
    campaign: (r) => r.campaign?.name,
    requester: (r) => r.requester?.name,
    created: (r) => dateSortKey(r.created_at),
  },
})

const changes = (r: ChangeRequest): string[] =>
  Object.entries(r.diff ?? {}).map(
    ([field, d]) => `${FIELD_LABELS[field] ?? field}: ${formatValue(field, d.old)} to ${formatValue(field, d.new)}`,
  )
const violations = (r: ChangeRequest): Violation[] => (r.failure?.violations as Violation[] | undefined) ?? []
const awaiting = (r: ChangeRequest): boolean => r.status === 'pending_approval'
const name = (r: ChangeRequest): string => r.campaign?.name ?? `campaign ${r.campaign_id}`
</script>

<template>
  <DsCard v-if="requests.length === 0">
    <DsEmptyState title="No change requests" :icon="ListChecks"
      >Changes proposed to live campaigns will appear here for review.</DsEmptyState
    >
  </DsCard>
  <div v-else class="ds-stack">
    <DsMessage v-if="error" tone="danger">{{ error }}</DsMessage>
    <DsCard :padded="false" class="table-card">
      <div class="toolbar">
        <DsSegmented v-model="view" label="Show" :options="VIEW_OPTIONS" />
        <DsInput v-model="search" label="Search change requests" type="search" placeholder="Campaign, person or status" />
      </div>
      <DsTable v-model:sort="sort" :columns="COLUMNS" :rows="pageRows" row-key="id" caption="Change requests">
        <template #cell-campaign="{ row }">
          <a href="#" class="link" @click.prevent="emit('open', row.campaign_id)">{{ name(row) }}</a>
        </template>
        <template #cell-change="{ row }">
          <ul class="changes" :aria-label="`Changes in request ${row.id}`">
            <li v-for="line in changes(row)" :key="line">{{ line }}</li>
          </ul>
          <ul v-if="violations(row).length" class="violations" :aria-label="`Rule violations in request ${row.id}`">
            <li v-for="v in violations(row)" :key="v.rule_id">{{ v.rule_id }}: {{ v.message }}</li>
          </ul>
        </template>
        <template #cell-requester="{ row }">{{ row.requester?.name ?? 'unknown' }}</template>
        <template #cell-created="{ row }"><DateText :value="row.created_at" mode="datetime" /></template>
        <template #cell-status="{ row }">
          <StatusBadge :status="row.status" />
          <span v-if="row.approver" class="decided">by {{ row.approver.name }}</span>
        </template>
        <template #cell-actions="{ row }">
          <span v-if="awaiting(row) && canDecide" class="actions">
            <DsButton
              size="sm"
              :icon="Check"
              :loading="busyId === row.id"
              :disabled="busyId != null && busyId !== row.id"
              :aria-label="`Approve the change to ${name(row)}`"
              @click="emit('approve', row.id)"
            />
            <DsButton
              size="sm"
              variant="danger"
              :icon="X"
              :disabled="busyId != null"
              :aria-label="`Reject the change to ${name(row)}`"
              @click="emit('reject', row.id)"
            />
          </span>
          <span v-else-if="awaiting(row)" class="ds-muted">Waiting for an approver</span>
          <span v-else class="ds-muted">Decided</span>
        </template>
        <template #empty>{{ view === 'pending' ? 'Nothing is waiting for approval.' : 'No change requests match your search.' }}</template>
      </DsTable>
      <DsPagination v-model:page="page" :page-count="pageCount" />
    </DsCard>
  </div>
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
.changes,
.violations {
  margin: 0;
  padding: 0;
  list-style: none;
  white-space: normal;
}
.violations {
  margin-top: var(--ds-space-1);
  color: var(--ds-color-tone-danger-text);
  font-size: var(--ds-font-size-xs);
}
.decided {
  margin-left: var(--ds-space-2);
  color: var(--ds-color-text-muted);
  font-size: var(--ds-font-size-xs);
}
.actions {
  display: inline-flex;
  gap: var(--ds-space-1);
}
</style>
