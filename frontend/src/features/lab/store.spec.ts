import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { api, ApiError } from '@/shared/api/client'
import { makeLabPreview, makeLabRow } from '@/shared/test/factories'
import { useLabStore } from './store'

vi.mock('@/shared/api/client', async () => ({
  ...(await vi.importActual<typeof import('@/shared/api/client')>('@/shared/api/client')),
  api: vi.fn(),
}))
const mocked = vi.mocked(api)

beforeEach(() => {
  setActivePinia(createPinia())
  mocked.mockReset()
})

describe('lab store: bulk approval', () => {
  it('loads the preview and resets any previous result', async () => {
    mocked.mockResolvedValue({ data: makeLabPreview() })
    const store = useLabStore()
    await store.fetchPreview()
    expect(mocked).toHaveBeenCalledWith('/lab/bulk/preview')
    expect(store.previewStatus).toBe('ready')
    expect(store.preview?.total).toBe(33)
  })

  it('records the error when the preview cannot be loaded', async () => {
    mocked.mockRejectedValue(new ApiError(500, 'Server exploded'))
    const store = useLabStore()
    await store.fetchPreview()
    expect(store.previewStatus).toBe('error')
    expect(store.previewError).toBe('Server exploded')
  })

  it('sends the apply request with its Idempotency-Key and keeps the failures', async () => {
    const store = useLabStore()
    mocked.mockResolvedValueOnce({ data: makeLabPreview() })
    await store.fetchPreview()
    mocked.mockResolvedValueOnce({
      data: { batch_id: 'batch-1', applied: [1, 2, 3], failed: [{ id: 4, code: 'rate_limited', message: 'slow down', retryable: true }] },
    })
    await store.apply('key-1')

    expect(mocked).toHaveBeenLastCalledWith('/lab/bulk/apply', {
      method: 'POST',
      body: { batch_id: 'batch-1' },
      headers: { 'Idempotency-Key': 'key-1' },
    })
    expect(store.appliedCount).toBe(3)
    expect(store.failures.map((f) => f.id)).toEqual([4])
  })

  it('a retry sends only the given items and replaces just those failures', async () => {
    const store = useLabStore()
    mocked.mockResolvedValueOnce({ data: makeLabPreview() })
    await store.fetchPreview()
    mocked.mockResolvedValueOnce({
      data: {
        batch_id: 'batch-1',
        applied: [1],
        failed: [
          { id: 4, code: 'rate_limited', message: 'a', retryable: true },
          { id: 5, code: 'provider_rejected', message: 'b', retryable: true },
        ],
      },
    })
    await store.apply('key-1')
    mocked.mockResolvedValueOnce({ data: { batch_id: 'batch-1', applied: [4], failed: [] } })
    await store.apply('key-2', [4])

    expect(mocked).toHaveBeenLastCalledWith('/lab/bulk/apply', {
      method: 'POST',
      body: { batch_id: 'batch-1', item_ids: [4] },
      headers: { 'Idempotency-Key': 'key-2' },
    })
    expect(store.appliedCount).toBe(2)
    expect(store.failures.map((f) => f.id)).toEqual([5])
  })

  it('a second approve never duplicates a failure and drops failures that have since been applied', async () => {
    const store = useLabStore()
    mocked.mockResolvedValueOnce({ data: makeLabPreview() })
    await store.fetchPreview()
    const fail = (id: number) => ({ id, code: 'rate_limited' as const, message: 'x', retryable: true })
    mocked.mockResolvedValueOnce({ data: { batch_id: 'batch-1', applied: [1], failed: [fail(4), fail(5)] } })
    await store.apply('k1')
    mocked.mockResolvedValueOnce({ data: { batch_id: 'batch-1', applied: [4], failed: [fail(5)] } })
    await store.apply('k2')
    expect(store.failures.map((f) => f.id)).toEqual([5])
    expect(store.appliedCount).toBe(2)
  })

  it('a failed apply request leaves the counts unchanged and rethrows', async () => {
    const store = useLabStore()
    mocked.mockRejectedValueOnce(new ApiError(429, 'Too many requests'))
    await expect(store.apply('k')).rejects.toThrow('Too many requests')
    expect(store.appliedCount).toBe(0)
    expect(store.failures).toEqual([])
  })
})

describe('lab store: dense list', () => {
  const page = (rows = [makeLabRow(1)]) => ({ data: rows, meta: { total: 2000, page: 1, per_page: 50, last_page: 40 } })

  it('asks the server for the page, filters and sort, skipping empty ones', async () => {
    mocked.mockResolvedValue(page())
    const store = useLabStore()
    await store.fetchRows({ page: 3, per_page: 50, status: 'paused', q: '', sort: 'daily_budget', dir: 'desc' })
    expect(mocked).toHaveBeenCalledWith('/lab/rows?page=3&per_page=50&status=paused&sort=daily_budget&dir=desc')
    expect(store.total).toBe(2000)
    expect(store.pageCount).toBe(40)
  })

  it('ignores a late answer to an older query', async () => {
    const store = useLabStore()
    let resolveFirst!: (v: unknown) => void
    mocked.mockReturnValueOnce(new Promise((r) => (resolveFirst = r)))
    const first = store.fetchRows({ ...store.query, q: 'old' })
    mocked.mockResolvedValueOnce(page([makeLabRow(2, { name: 'new result' })]))
    await store.fetchRows({ ...store.query, q: 'new' })
    resolveFirst(page([makeLabRow(1, { name: 'old result' })]))
    await first
    expect(store.rows.map((r) => r.name)).toEqual(['new result'])
  })

  it('records an error when the list cannot be loaded', async () => {
    mocked.mockRejectedValue(new ApiError(500, 'Down'))
    const store = useLabStore()
    await store.fetchRows()
    expect(store.rowsStatus).toBe('error')
    expect(store.rowsError).toBe('Down')
  })

  it('saves a budget with a PATCH and an Idempotency-Key, and updates the row', async () => {
    const store = useLabStore()
    mocked.mockResolvedValueOnce(page([makeLabRow(1), makeLabRow(2)]))
    await store.fetchRows()
    mocked.mockResolvedValueOnce({ data: makeLabRow(2, { daily_budget: 9900 }) })
    expect(await store.saveRow(2, 9900, 'k')).toBe(true)
    expect(mocked).toHaveBeenLastCalledWith('/lab/rows/2', {
      method: 'PATCH',
      body: { daily_budget: 9900 },
      headers: { 'Idempotency-Key': 'k' },
    })
    expect(store.rows.find((r) => r.id === 2)?.daily_budget).toBe(9900)
    expect(store.savingId).toBeNull()
  })

  it('a bare 429 still says for how long, from retry_after', async () => {
    const store = useLabStore()
    mocked.mockResolvedValueOnce(page([makeLabRow(1)]))
    await store.fetchRows()
    mocked.mockRejectedValueOnce(new ApiError(429, 'Too Many Requests', 'rate_limited', { retry_after: 9 }))
    await store.saveRow(1, 9900, 'k')
    expect(store.messages[1].text).toBe('Too Many Requests Retry in 9 seconds.')
  })

  it.each([
    [423, 'locked', 'Locked by brand.'],
    [429, 'rate-limited', 'Too many edits. Retry in 7 seconds.'],
    [500, 'error', 'Boom'],
  ])('a %i answer is shown as %s next to the row and the budget is unchanged', async (status, kind, text) => {
    const store = useLabStore()
    mocked.mockResolvedValueOnce(page([makeLabRow(1)]))
    await store.fetchRows()
    mocked.mockRejectedValueOnce(new ApiError(status, text))
    expect(await store.saveRow(1, 9900, 'k')).toBe(false)
    expect(store.messages[1]).toEqual({ kind, text })
    expect(store.rows[0].daily_budget).toBe(5000)
    expect(store.savingId).toBeNull()
  })
})
