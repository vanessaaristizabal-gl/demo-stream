import { computed, ref } from 'vue'
import { api } from '@/shared/api/client'
import type { BatchFailure, BatchPreview, BatchReceipt, BatchResult, Resource } from '@/shared/api/types'
import { useAsyncAction } from './useAsyncAction'
import { useIdempotencyKey } from './useIdempotencyKey'

const messageOf = (e: unknown, fallback: string): string => (e instanceof Error ? e.message : fallback)

/**
 * One batch operation from preview to receipts: load the preview (nothing is written), approve once, see what applied,
 * what failed and what is held, retry the failures, read the receipts. The state belongs to the screen that calls this,
 * so two screens never share a batch. The Idempotency-Key is kept while a request fails (the same intent can be retried
 * safely) and renewed once the server has answered.
 */
export function useBatch() {
  const preview = ref<BatchPreview | null>(null)
  const status = ref<'loading' | 'error' | 'ready'>('loading')
  const error = ref<string | null>(null)
  const appliedCount = ref(0)
  const failures = ref<BatchFailure[]>([])
  const receipts = ref<BatchReceipt[]>([])
  const receiptsError = ref<string | null>(null)
  const appliedIds = new Set<number>()
  let loader: (() => Promise<BatchPreview>) | null = null
  const { key, renew } = useIdempotencyKey()

  /** Builds the preview with `source` (and remembers it, so Try again repeats the same request). */
  async function load(source: () => Promise<BatchPreview>): Promise<void> {
    loader = source
    status.value = 'loading'
    error.value = null
    try {
      preview.value = await source()
      appliedCount.value = 0
      appliedIds.clear()
      failures.value = []
      receipts.value = []
      receiptsError.value = null
      status.value = 'ready'
    } catch (e) {
      error.value = messageOf(e, 'The preview could not be loaded.')
      status.value = 'error'
    }
  }
  const reload = (): Promise<void> => (loader ? load(loader) : Promise.resolve())

  async function loadReceipts(batchId: string): Promise<void> {
    receiptsError.value = null
    try {
      receipts.value = (await api<Resource<BatchReceipt[]>>(`/playbooks/batches/receipts?batch_id=${encodeURIComponent(batchId)}`)).data
    } catch (e) {
      // The writes already happened: a failed receipts request must not look like a failed approval.
      receiptsError.value = messageOf(e, 'The receipts could not be loaded.')
    }
  }

  /** Applies the ready items, or only `itemIds` on a retry. An item is in exactly one place: what the server just said replaces what we knew. */
  async function apply(itemIds?: number[]): Promise<void> {
    if (!preview.value) return
    const result = (
      await api<Resource<BatchResult>>('/playbooks/batches/apply', {
        method: 'POST',
        body: { batch_id: preview.value.batch_id, ...(itemIds && { item_ids: itemIds }) },
        headers: { 'Idempotency-Key': key.value },
      })
    ).data
    const retried = new Set(itemIds ?? [])
    const nowFailed = new Set(result.failed.map((f) => f.id))
    const nowApplied = new Set(result.applied)
    appliedCount.value += result.applied.filter((id) => !appliedIds.has(id)).length
    result.applied.forEach((id) => appliedIds.add(id))
    failures.value = [
      ...failures.value.filter((f) => !retried.has(f.id) && !nowFailed.has(f.id) && !nowApplied.has(f.id)),
      ...result.failed,
    ]
    if (appliedCount.value > 0) await loadReceipts(preview.value.batch_id)
  }

  const approveAction = useAsyncAction(async () => {
    await apply()
    renew()
  })
  const retryAction = useAsyncAction(async () => {
    await apply(failures.value.filter((f) => f.retryable).map((f) => f.id))
    renew()
  })

  return {
    preview,
    status,
    error,
    appliedCount,
    failures,
    receipts,
    receiptsError,
    load,
    reload,
    approve: () => approveAction.run(),
    retry: () => retryAction.run(),
    pending: computed(() => approveAction.pending.value || retryAction.pending.value),
    actionError: computed(() => approveAction.error.value?.message ?? retryAction.error.value?.message ?? null),
  }
}
