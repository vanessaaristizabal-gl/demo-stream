<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { Lock, Pencil, RotateCw, SearchX } from 'lucide-vue-next'
import {
  DsButton,
  DsCard,
  DsEmptyState,
  DsInput,
  DsMessage,
  DsPagination,
  DsSegmented,
  DsTable,
  type DsColumn,
  type Sort,
} from '@/design-system'
import type { LabRow, LabRowsQuery } from '@/shared/api/types'
import StatusBadge from '@/shared/components/StatusBadge.vue'
import { formatMoney, formatNumber } from '@/shared/utils/format'
import type { RowMessage } from '../types'
import InlineBudgetEdit from './InlineBudgetEdit.vue'

/** The server pages the list; the table never renders more than this many rows, whatever it is handed. */
const MAX_ROWS = 100

const props = defineProps<{
  status: 'loading' | 'error' | 'ready'
  rows: LabRow[]
  total: number
  pageCount: number
  query: LabRowsQuery
  error?: string | null
  savingId: number | null
  messages: Record<number, RowMessage>
}>()
const emit = defineEmits<{ query: [query: LabRowsQuery]; save: [payload: { id: number; daily_budget: number }]; reload: [] }>()

const COLUMNS: DsColumn[] = [
  { key: 'name', label: 'Campaign', sortable: true },
  { key: 'dealer', label: 'Dealer', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'daily_budget', label: 'Daily budget', sortable: true, align: 'end' },
]
const STATUS_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Paused', value: 'paused' },
  { label: 'Limited', value: 'limited' },
  { label: 'Ended', value: 'ended' },
]

// Refreshing (a new filter, sort or page) keeps the controls mounted: replacing them with a spinner would drop keyboard focus
// mid-typing (WCAG 2.4.3). The full loading state is only for the very first load.
const loadedOnce = ref(props.status === 'ready')
watch(
  () => props.status,
  (s) => s === 'ready' && (loadedOnce.value = true),
)
const firstLoad = computed(() => props.status === 'loading' && !loadedOnce.value)
const refreshing = computed(() => props.status === 'loading' && loadedOnce.value)

const visible = computed(() => props.rows.slice(0, MAX_ROWS))
const filtered = computed(() => props.query.status !== '' || props.query.q !== '')
const sort = computed<Sort | null>(() => (props.query.sort ? { key: props.query.sort, dir: props.query.dir } : null))

const search = ref(props.query.q)
watch(
  () => props.query.q,
  (q) => (search.value = q),
)

// The search box is the source of truth for q: a pending search must survive a click on a filter.
const change = (patch: Partial<LabRowsQuery>): void => emit('query', { ...props.query, q: search.value, page: 1, ...patch })

function onSort(next: Sort | null): void {
  change({ sort: (next?.key ?? '') as LabRowsQuery['sort'], dir: next?.dir ?? 'asc' })
}

// Editing swaps the button for a form and back: send focus to the control that replaces the one that vanished (WCAG 2.4.3).
const editingId = ref<number | null>(null)
const tableWrap = ref<HTMLElement | null>(null)
const editor = ref<InstanceType<typeof InlineBudgetEdit> | null>(null)
async function stopEditing(id: number): Promise<void> {
  editingId.value = null
  await nextTick()
  tableWrap.value?.querySelector<HTMLElement>(`[data-edit="${id}"]`)?.focus()
}
function save(id: number, daily_budget: number): void {
  emit('save', { id, daily_budget })
}
// Close the editor when the save succeeded (the row is no longer saving and has no message).
watch(
  () => props.savingId,
  async (now, before) => {
    if (before === null || now !== null || editingId.value !== before) return
    if (!props.messages[before]) await stopEditing(before)
    else {
      // The saving control was disabled, so focus fell off it: put it back in the field so the person can fix and retry.
      await nextTick()
      editor.value?.focus()
    }
  },
)
</script>

<template>
  <p v-if="firstLoad" class="ds-muted" role="status">Loading campaigns…</p>

  <DsMessage v-else-if="status === 'error'" tone="danger">
    <p>{{ error ?? 'The campaigns could not be loaded.' }}</p>
    <DsButton variant="secondary" size="sm" :icon="RotateCw" @click="emit('reload')">Try again</DsButton>
  </DsMessage>

  <div v-else class="ds-stack" :aria-busy="refreshing || undefined">
    <div class="toolbar">
      <DsInput
        v-model="search"
        label="Search campaigns"
        type="search"
        placeholder="Campaign or dealer"
        @update:model-value="change({ q: $event })"
      />
      <DsSegmented
        :model-value="query.status || 'all'"
        label="Status"
        :options="STATUS_OPTIONS"
        @update:model-value="change({ status: ($event === 'all' ? '' : $event) as LabRowsQuery['status'] })"
      />
    </div>

    <DsCard v-if="rows.length === 0 && !refreshing">
      <DsEmptyState title="No campaigns match" :icon="SearchX">
        <template v-if="filtered">No campaign matches these filters.</template>
        <template v-else>There are no campaigns yet.</template>
      </DsEmptyState>
      <div v-if="filtered" class="clear">
        <DsButton variant="secondary" @click="emit('query', { ...query, page: 1, q: '', status: '' })">Clear filters</DsButton>
      </div>
    </DsCard>

    <template v-else-if="rows.length > 0">
      <p class="ds-muted" role="status">{{ formatNumber(total) }} {{ total === 1 ? 'campaign' : 'campaigns' }}</p>
      <DsCard :padded="false">
        <div ref="tableWrap">
          <DsTable :sort="sort" :columns="COLUMNS" :rows="visible" row-key="id" caption="Campaigns" @update:sort="onSort">
            <template #cell-status="{ row }"><StatusBadge :status="row.status" /></template>
            <template #cell-daily_budget="{ row }">
              <InlineBudgetEdit
                v-if="editingId === row.id"
                ref="editor"
                :name="row.name"
                :cents="row.daily_budget"
                :saving="savingId === row.id"
                @save="save(row.id, $event)"
                @cancel="stopEditing(row.id)"
              />
              <span v-else class="budget">
                <Lock v-if="row.locked_reason" aria-hidden="true" :size="14" />
                {{ formatMoney(row.daily_budget) }}
                <DsButton
                  size="sm"
                  variant="ghost"
                  :icon="Pencil"
                  :data-edit="row.id"
                  :aria-label="`Edit budget for ${row.name}`"
                  :disabled="savingId !== null"
                  @click="editingId = row.id"
                />
              </span>
              <p v-if="messages[row.id]" class="message" :class="`message--${messages[row.id].kind}`" role="alert">
                {{ messages[row.id].text }}
              </p>
            </template>
          </DsTable>
        </div>
      </DsCard>
      <DsPagination :page="query.page" :page-count="pageCount" @update:page="change({ page: $event })" />
    </template>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: var(--ds-space-4);
}
.clear {
  display: flex;
  justify-content: center;
  padding-bottom: var(--ds-space-4);
}
.budget {
  display: inline-flex;
  align-items: center;
  gap: var(--ds-space-2);
}
.message {
  margin-top: var(--ds-space-1);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);
  white-space: normal;
  color: var(--ds-color-tone-danger-text);
}
.message--rate-limited {
  color: var(--ds-color-tone-warning-text);
}
</style>
