import { beforeEach, describe, expect, it } from 'vitest'
import type { LabApplyResult, LabPreview, LabRow } from '../src/shared/api/types.ts'
import {
  createLabApi,
  EDIT_LIMIT,
  EDIT_WINDOW_MS,
  FAILED_ON_FIRST_APPLY,
  RATE_LIMIT_ITEMS,
  ROW_COUNT,
  type LabResponse,
} from './handler.ts'

let clock = 0
let lab: ReturnType<typeof createLabApi>

const call = (method: string, path: string, body?: unknown, key?: string): LabResponse => {
  const [pathname, search = ''] = path.split('?')
  return lab.handle({ method, path: pathname, query: new URLSearchParams(search), headers: key ? { 'idempotency-key': key } : {}, body })
}
const data = <T>(r: LabResponse): T => (r.body as { data: T }).data

beforeEach(() => {
  clock = 1_000_000
  lab = createLabApi({ now: () => clock })
})

describe('preview', () => {
  it('returns 300 items with before and after values and held items with a reason', () => {
    const preview = data<LabPreview>(call('GET', '/bulk/preview'))
    expect(preview.total).toBe(300)
    expect(preview.ready + preview.held).toBe(300)
    expect(preview.held).toBeGreaterThan(0)
    const held = preview.items.filter((i) => i.status === 'held')
    expect(held.every((i) => i.hold_reason)).toBe(true)
    expect(preview.items.filter((i) => i.status === 'ready').every((i) => i.hold_reason === null && i.after > i.before)).toBe(true)
  })
})

describe('apply', () => {
  it('applies most items and lists exactly 12 retryable failures, some caused by the rate limit', () => {
    const result = data<LabApplyResult>(call('POST', '/bulk/apply', { batch_id: 'batch-1' }, 'k1'))
    expect(result.failed).toHaveLength(FAILED_ON_FIRST_APPLY)
    expect(result.failed.every((f) => f.retryable)).toBe(true)
    expect(result.failed.filter((f) => f.code === 'rate_limited')).toHaveLength(RATE_LIMIT_ITEMS)
    expect(result.applied.length + result.failed.length).toBe(data<LabPreview>(call('GET', '/bulk/preview')).ready)
  })

  it('applies the retried failures on a second attempt and never touches held items', () => {
    const first = data<LabApplyResult>(call('POST', '/bulk/apply', { batch_id: 'batch-1' }, 'k1'))
    const ids = first.failed.map((f) => f.id)
    const retry = data<LabApplyResult>(call('POST', '/bulk/apply', { batch_id: 'batch-1', item_ids: ids }, 'k2'))
    expect(retry.failed).toEqual([])
    expect(retry.applied.sort()).toEqual([...ids].sort())

    const held = data<LabPreview>(call('GET', '/bulk/preview')).items.find((i) => i.status === 'held')!
    const attempt = data<LabApplyResult>(call('POST', '/bulk/apply', { batch_id: 'batch-1', item_ids: [held.id] }, 'k3'))
    expect(attempt.failed).toEqual([{ id: held.id, code: 'held', message: held.hold_reason, retryable: false }])
  })

  it('requires an Idempotency-Key and replays the same key and body without applying twice', () => {
    expect(call('POST', '/bulk/apply', { batch_id: 'batch-1' }).status).toBe(400)
    const first = call('POST', '/bulk/apply', { batch_id: 'batch-1' }, 'same')
    const replay = call('POST', '/bulk/apply', { batch_id: 'batch-1' }, 'same')
    expect(replay.body).toEqual(first.body)
    expect(replay.headers?.['Idempotency-Replayed']).toBe('true')
  })

  it('rejects the same key with a different body', () => {
    call('POST', '/bulk/apply', { batch_id: 'batch-1' }, 'same')
    expect(call('POST', '/bulk/apply', { batch_id: 'batch-1', item_ids: [1] }, 'same').status).toBe(422)
  })

  it('answers 404 for an unknown batch', () => {
    expect(call('POST', '/bulk/apply', { batch_id: 'nope' }, 'k').status).toBe(404)
  })
})

describe('rows', () => {
  it('serves 2,000 rows a page at a time, with the total', () => {
    const r = call('GET', '/rows?per_page=50&page=2')
    expect((r.body as { meta: { total: number } }).meta.total).toBe(ROW_COUNT)
    expect(data<LabRow[]>(r)).toHaveLength(50)
    expect(data<LabRow[]>(r)[0].id).toBe(51)
  })

  it('caps the page size so a client cannot ask for every row at once', () => {
    expect(data<LabRow[]>(call('GET', '/rows?per_page=5000'))).toHaveLength(100)
  })

  it('filters by status and text, and sorts, on the server', () => {
    const active = call('GET', '/rows?status=active&per_page=100')
    expect(data<LabRow[]>(active).every((row) => row.status === 'active')).toBe(true)
    expect((active.body as { meta: { total: number } }).meta.total).toBe(ROW_COUNT / 4)

    expect(data<LabRow[]>(call('GET', '/rows?q=lakeside&per_page=100')).every((row) => row.dealer === 'Lakeside Toyota')).toBe(true)

    const sorted = data<LabRow[]>(call('GET', '/rows?sort=daily_budget&dir=desc&per_page=100'))
    expect(sorted.map((row) => row.daily_budget)).toEqual([...sorted.map((row) => row.daily_budget)].sort((a, b) => b - a))
  })
})

describe('inline edit', () => {
  it('updates an unlocked row', () => {
    const r = call('PATCH', '/rows/1', { daily_budget: 12345 }, 'e1')
    expect(r.status).toBe(200)
    expect(data<LabRow>(r).daily_budget).toBe(12345)
    expect(data<LabRow[]>(call('GET', '/rows?q=Campaign 0001'))[0].daily_budget).toBe(12345)
  })

  it('rejects a locked row with the reason and leaves it unchanged', () => {
    const before = data<LabRow[]>(call('GET', '/rows?q=Campaign 0010'))[0]
    const r = call('PATCH', '/rows/10', { daily_budget: 9999 }, 'e1')
    expect(r.status).toBe(423)
    expect(r.body).toMatchObject({ error: 'field_locked', message: before.locked_reason })
    expect(data<LabRow[]>(call('GET', '/rows?q=Campaign 0010'))[0].daily_budget).toBe(before.daily_budget)
  })

  it('validates the budget', () => {
    expect(call('PATCH', '/rows/1', { daily_budget: 5 }, 'e1').status).toBe(422)
    expect(call('PATCH', '/rows/1', { daily_budget: 12.5 }, 'e2').status).toBe(422)
  })

  it('answers 429 with Retry-After after too many edits, and recovers when the window passes', () => {
    for (let i = 0; i < EDIT_LIMIT; i++) expect(call('PATCH', `/rows/${i + 1}`, { daily_budget: 5000 }, `k${i}`).status).toBe(200)
    const limited = call('PATCH', '/rows/9', { daily_budget: 5000 }, 'over')
    expect(limited.status).toBe(429)
    expect(limited.headers?.['Retry-After']).toBe('10')
    expect(limited.body).toMatchObject({ error: 'rate_limited', retry_after: 10 })

    clock += EDIT_WINDOW_MS
    expect(call('PATCH', '/rows/9', { daily_budget: 5000 }, 'over').status).toBe(200) // a rejected 429 is not remembered, so the same key can retry
  })
})

describe('lab control', () => {
  it('reset restores the initial state', () => {
    call('POST', '/bulk/apply', { batch_id: 'batch-1' }, 'k1')
    expect(call('POST', '/reset').status).toBe(204)
    const again = data<LabApplyResult>(call('POST', '/bulk/apply', { batch_id: 'batch-1' }, 'k1'))
    expect(again.failed).toHaveLength(FAILED_ON_FIRST_APPLY)
  })

  it('answers 404 for an unknown endpoint', () => {
    expect(call('GET', '/nope').status).toBe(404)
  })
})
