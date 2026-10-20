import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api, ApiError } from '@/shared/api/client'
import type {
  LabApplyFailure,
  LabApplyResult,
  LabDeployOptions,
  LabDeployRequest,
  LabPreview,
  LabReceipt,
  LabRow,
  LabRowsQuery,
  Resource,
} from '@/shared/api/types'
import type { RowMessage } from './types'

type LoadStatus = 'loading' | 'error' | 'ready'

interface RowsPage {
  data: LabRow[]
  meta: { total: number; page: number; per_page: number; last_page: number }
}

const messageOf = (e: unknown, fallback: string): string => (e instanceof Error ? e.message : fallback)

export const DEFAULT_QUERY: LabRowsQuery = { page: 1, per_page: 50, status: '', q: '', sort: '', dir: 'asc' }

/** The practice lab: a batch that is previewed, approved once and partly fails, and a 2,000-row list paged by the server. */
export const useLabStore = defineStore('lab', () => {
  // Bulk approval
  const preview = ref<LabPreview | null>(null)
  const previewStatus = ref<LoadStatus>('loading')
  const previewError = ref<string | null>(null)
  const appliedCount = ref(0)
  const failures = ref<LabApplyFailure[]>([])
  const appliedIds = new Set<number>()

  async function fetchPreview(): Promise<void> {
    previewStatus.value = 'loading'
    previewError.value = null
    try {
      preview.value = (await api<Resource<LabPreview>>('/lab/bulk/preview')).data
      appliedCount.value = 0
      appliedIds.clear()
      failures.value = []
      previewStatus.value = 'ready'
    } catch (e) {
      previewError.value = messageOf(e, 'The preview could not be loaded.')
      previewStatus.value = 'error'
    }
  }

  /** Applies the ready items, or only `itemIds` on a retry. Failures from earlier attempts that were not retried are kept. */
  async function apply(idempotencyKey: string, itemIds?: number[]): Promise<LabApplyResult> {
    const result = (
      await api<Resource<LabApplyResult>>('/lab/bulk/apply', {
        method: 'POST',
        body: { batch_id: preview.value?.batch_id, ...(itemIds && { item_ids: itemIds }) },
        headers: { 'Idempotency-Key': idempotencyKey },
      })
    ).data
    const retried = new Set(itemIds ?? [])
    const nowFailed = new Set(result.failed.map((f) => f.id))
    const nowApplied = new Set(result.applied)
    appliedCount.value += result.applied.filter((id) => !appliedIds.has(id)).length
    result.applied.forEach((id) => appliedIds.add(id))
    // An item is in exactly one place: whatever the server just said about it replaces what we knew.
    failures.value = [
      ...failures.value.filter((f) => !retried.has(f.id) && !nowFailed.has(f.id) && !nowApplied.has(f.id)),
      ...result.failed,
    ]
    return result
  }

  // Playbook deploy: a dry run that produces the same kind of batch as the bulk preview, approved and retried the same way.
  const deployOptions = ref<LabDeployOptions | null>(null)
  const deployStatus = ref<LoadStatus>('loading')
  const deployError = ref<string | null>(null)
  const receipts = ref<LabReceipt[]>([])

  async function fetchDeployOptions(): Promise<void> {
    deployStatus.value = 'loading'
    deployError.value = null
    try {
      deployOptions.value = (await api<Resource<LabDeployOptions>>('/lab/deploy/options')).data
      deployStatus.value = 'ready'
    } catch (e) {
      deployError.value = messageOf(e, 'The deploy options could not be loaded.')
      deployStatus.value = 'error'
    }
  }

  /** Dry run only: nothing is written. Sets `preview`, so the approval and retry of the bulk screen work on it unchanged. */
  async function previewDeploy(request: LabDeployRequest): Promise<void> {
    previewStatus.value = 'loading'
    previewError.value = null
    receipts.value = []
    try {
      preview.value = (await api<Resource<LabPreview>>('/lab/deploy/preview', { method: 'POST', body: request })).data
      appliedCount.value = 0
      appliedIds.clear()
      failures.value = []
      previewStatus.value = 'ready'
    } catch (e) {
      previewError.value = messageOf(e, 'The deploy preview could not be built.')
      previewStatus.value = 'error'
    }
  }

  async function fetchReceipts(batchId: string): Promise<void> {
    receipts.value = (await api<Resource<LabReceipt[]>>(`/lab/deploy/receipts?batch_id=${encodeURIComponent(batchId)}`)).data
  }

  // Dense list
  const rows = ref<LabRow[]>([])
  const total = ref(0)
  const pageCount = ref(1)
  const query = ref<LabRowsQuery>({ ...DEFAULT_QUERY })
  const rowsStatus = ref<LoadStatus>('loading')
  const rowsError = ref<string | null>(null)
  const savingId = ref<number | null>(null)
  const messages = ref<Record<number, RowMessage>>({})
  let latest = 0

  async function fetchRows(next: LabRowsQuery = query.value): Promise<void> {
    const mine = ++latest
    query.value = next
    rowsStatus.value = 'loading'
    rowsError.value = null
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(next)) if (value !== '') params.set(key, String(value))
    try {
      const result = await api<RowsPage>(`/lab/rows?${params}`)
      if (mine !== latest) return // a newer query is already in flight: ignore this late answer
      rows.value = result.data
      total.value = result.meta.total
      pageCount.value = result.meta.last_page
      messages.value = {}
      rowsStatus.value = 'ready'
    } catch (e) {
      if (mine !== latest) return
      rowsError.value = messageOf(e, 'The campaigns could not be loaded.')
      rowsStatus.value = 'error'
    }
  }

  /** The server decides: a locked field answers 423 with its reason, too many edits answer 429. Either leaves the row unchanged. */
  async function saveRow(id: number, dailyBudget: number, idempotencyKey: string): Promise<boolean> {
    savingId.value = id
    messages.value = Object.fromEntries(Object.entries(messages.value).filter(([key]) => Number(key) !== id))
    try {
      const saved = (
        await api<Resource<LabRow>>(`/lab/rows/${id}`, {
          method: 'PATCH',
          body: { daily_budget: dailyBudget },
          headers: { 'Idempotency-Key': idempotencyKey },
        })
      ).data
      rows.value = rows.value.map((r) => (r.id === id ? saved : r))
      return true
    } catch (e) {
      const kind =
        e instanceof ApiError && e.status === 423 ? 'locked' : e instanceof ApiError && e.status === 429 ? 'rate-limited' : 'error'
      let text = messageOf(e, 'The budget could not be saved.')
      // A gateway may answer a bare "Too Many Requests": still say for how long, from the body or the Retry-After value we were given.
      const wait = e instanceof ApiError ? (e.body as { retry_after?: unknown } | null)?.retry_after : undefined
      if (kind === 'rate-limited' && typeof wait === 'number' && !/\d/.test(text)) text = `${text} Retry in ${wait} seconds.`
      messages.value = { ...messages.value, [id]: { kind, text } }
      return false
    } finally {
      savingId.value = null
    }
  }

  return {
    preview,
    previewStatus,
    previewError,
    appliedCount,
    failures,
    fetchPreview,
    deployOptions,
    deployStatus,
    deployError,
    receipts,
    fetchDeployOptions,
    previewDeploy,
    fetchReceipts,
    apply,
    rows,
    total,
    pageCount,
    query,
    rowsStatus,
    rowsError,
    savingId,
    messages,
    fetchRows,
    saveRow,
  }
})
