<script setup lang="ts">
import { computed, nextTick, ref, useId, watch } from 'vue'
import { ClipboardList, RotateCw } from 'lucide-vue-next'
import { DsButton, DsCard, DsEmptyState, DsMessage, DsPagination, DsTable, DsTabs, DsTag, useTable, type DsColumn } from '@/design-system'
import type { LabApplyFailure, LabChange, LabPreview } from '@/shared/api/types'
import { formatMoney, formatNumber } from '@/shared/utils/format'

const props = defineProps<{
  status: 'loading' | 'error' | 'ready'
  preview: LabPreview | null
  /** Why the preview could not be loaded (status error). */
  error?: string | null
  /** Items applied so far, across the first attempt and every retry. */
  appliedCount: number
  /** Items that still failed after the last attempt. */
  failures: LabApplyFailure[]
  /** The apply request itself failed (for example HTTP 429): nothing is known about the items. */
  actionError?: string | null
  pending: boolean
}>()
const emit = defineEmits<{ approve: []; retry: []; reload: [] }>()

const READY_COLUMNS: DsColumn[] = [
  { key: 'account', label: 'Account', sortable: true },
  { key: 'before', label: 'Budget before', sortable: true, align: 'end' },
  { key: 'after', label: 'Budget after', sortable: true, align: 'end' },
]
const HELD_COLUMNS: DsColumn[] = [
  { key: 'account', label: 'Account' },
  { key: 'hold_reason', label: 'Why it is held' },
]
const FAILED_COLUMNS: DsColumn[] = [
  { key: 'account', label: 'Account' },
  { key: 'code', label: 'Cause' },
  { key: 'message', label: 'Reason from the provider' },
]

const items = computed<LabChange[]>(() => props.preview?.items ?? [])
const readyItems = computed(() => items.value.filter((i) => i.status === 'ready'))
const heldItems = computed(() => items.value.filter((i) => i.status === 'held'))
const failedRows = computed(() =>
  props.failures.map((f) => ({ ...f, account: items.value.find((i) => i.id === f.id)?.account ?? `Item ${f.id}` })),
)
const retryable = computed(() => props.failures.some((f) => f.retryable))
const isEmpty = computed(() => props.status === 'ready' && items.value.length === 0)
const hasResult = computed(() => props.appliedCount > 0 || props.failures.length > 0)
const allApplied = computed(() => hasResult.value && props.failures.length === 0 && unresolved.value === 0)
// Items the server neither applied nor reported as failed: they must never vanish silently.
const unresolved = computed(() => Math.max(0, (props.preview?.ready ?? 0) - props.appliedCount - props.failures.length))
const rateLimitedCount = computed(() => props.failures.filter((f) => f.code === 'rate_limited').length)

const listTabs = computed(() => [
  { value: 'ready', label: 'Changes to apply', count: readyItems.value.length },
  { value: 'held', label: 'Held', count: heldItems.value.length },
])
// Open on what there is to review: the changes, or, when everything is held, the reasons.
const listTab = ref<string>(props.preview && props.preview.ready === 0 ? 'held' : 'ready')
watch(
  () => props.preview?.batch_id,
  () => (listTab.value = props.preview && props.preview.ready === 0 ? 'held' : 'ready'),
)

const { sort, page, pageCount, pageRows } = useTable(readyItems, { pageSize: 25 })

// Applying replaces the button that has focus with a result: move focus to the result so keyboard and screen-reader users land on it.
const summary = ref<HTMLElement | null>(null)
const actionAlert = ref<HTMLElement | null>(null)
const summaryId = useId()
watch(
  () => props.pending,
  async (now, before) => {
    if (before && !now) {
      await nextTick()
      // A request that failed outright has no result section: the message is where the person must land.
      ;(summary.value ?? actionAlert.value)?.focus()
    }
  },
)
</script>

<template>
  <p v-if="status === 'loading'" class="ds-muted" role="status">Loading the preview…</p>

  <DsMessage v-else-if="status === 'error'" tone="danger">
    <p>{{ error ?? 'The preview could not be loaded.' }}</p>
    <DsButton variant="secondary" size="sm" :icon="RotateCw" @click="emit('reload')">Try again</DsButton>
  </DsMessage>

  <DsCard v-else-if="isEmpty">
    <DsEmptyState title="Nothing to approve" :icon="ClipboardList">There are no changes in this batch.</DsEmptyState>
  </DsCard>

  <div v-else-if="preview" class="ds-stack">
    <DsCard>
      <h2 class="section-title">Summary</h2>
      <dl class="stats">
        <div>
          <dt>Total</dt>
          <dd>{{ formatNumber(preview.total) }}</dd>
        </div>
        <div>
          <dt>Ready to apply</dt>
          <dd>{{ formatNumber(preview.ready) }}</dd>
        </div>
        <div>
          <dt>Held</dt>
          <dd>{{ formatNumber(preview.held) }}</dd>
        </div>
      </dl>
      <p class="ds-muted">Held items are not applied and are not part of this approval.</p>
      <!-- One approval per batch: once there is a result the only next step is retrying what failed. -->
      <DsButton v-if="!hasResult" :loading="pending" :disabled="preview.ready === 0" @click="emit('approve')">
        Approve {{ formatNumber(preview.ready) }} changes
      </DsButton>
    </DsCard>

    <div v-if="actionError" ref="actionAlert" tabindex="-1">
      <DsMessage tone="danger">{{ actionError }}</DsMessage>
    </div>

    <section v-if="hasResult" ref="summary" tabindex="-1" class="result" :aria-labelledby="summaryId">
      <h2 :id="summaryId" class="section-title">Result</h2>
      <DsMessage v-if="allApplied" tone="success"> All {{ formatNumber(appliedCount) }} changes were applied. </DsMessage>
      <template v-else>
        <DsMessage tone="warning">
          {{ formatNumber(appliedCount) }} applied, {{ formatNumber(failures.length) }} failed.
          <template v-if="rateLimitedCount > 0">{{ formatNumber(rateLimitedCount) }} stopped at the provider rate limit.</template>
          <template v-if="unresolved > 0"
            >{{ formatNumber(unresolved) }} {{ unresolved === 1 ? 'item was' : 'items were' }} neither applied nor reported as
            failed.</template
          >
        </DsMessage>
        <DsCard v-if="failures.length > 0" :padded="false">
          <DsTable :columns="FAILED_COLUMNS" :rows="failedRows" row-key="id" caption="Failed items">
            <template #cell-code="{ row }">
              <DsTag :tone="row.code === 'rate_limited' ? 'warning' : 'danger'">{{ row.code.replace(/_/g, ' ') }}</DsTag>
            </template>
          </DsTable>
        </DsCard>
        <div v-if="retryable">
          <DsButton variant="secondary" :icon="RotateCw" :loading="pending" @click="emit('retry')">Retry failed</DsButton>
        </div>
      </template>
    </section>

    <!-- Two lists, two tabs: the person is either checking what will be written or why something was held. -->
    <DsTabs v-if="items.length > 0" v-model="listTab" label="Items in this batch" :items="listTabs">
      <template #panel-ready>
        <p v-if="readyItems.length === 0" class="ds-muted">Nothing is ready to apply.</p>
        <template v-else>
          <DsCard :padded="false">
            <DsTable v-model:sort="sort" :columns="READY_COLUMNS" :rows="pageRows" row-key="id" caption="Budget changes ready to apply">
              <template #cell-before="{ row }">{{ formatMoney(row.before) }}</template>
              <template #cell-after="{ row }">{{ formatMoney(row.after) }}</template>
            </DsTable>
          </DsCard>
          <DsPagination v-model:page="page" :page-count="pageCount" />
        </template>
      </template>
      <template #panel-held>
        <p v-if="heldItems.length === 0" class="ds-muted">Nothing is held.</p>
        <DsCard v-else :padded="false">
          <DsTable :columns="HELD_COLUMNS" :rows="heldItems" row-key="id" caption="Held items and the reason for each" />
        </DsCard>
      </template>
    </DsTabs>
  </div>
</template>

<style scoped>
.section-title {
  margin-bottom: var(--ds-space-3);
  font-size: var(--ds-font-size-lg);
}
.stats {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-6);
  margin-bottom: var(--ds-space-3);
}
.stats dt {
  font-size: var(--ds-font-size-xs);
  color: var(--ds-color-text-muted);
}
.stats dd {
  font-size: var(--ds-font-size-2xl);
  font-weight: var(--ds-font-weight-semibold);
}
.result {
  display: grid;
  gap: var(--ds-space-3);
}
</style>
