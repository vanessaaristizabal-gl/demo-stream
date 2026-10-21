import { beforeEach, describe, expect, it } from 'vitest'
import type { BatchResult, BatchPreview } from '../src/shared/api/types.ts'
import { createMockBackend, FAILED_ON_FIRST_APPLY, RATE_LIMIT_ITEMS, type MockResponse } from './handler.ts'

let clock = 0
let backend: ReturnType<typeof createMockBackend>

const call = (method: string, path: string, body?: unknown, key?: string): MockResponse => {
  const [pathname, search = ''] = path.split('?')
  return backend.handle({
    method,
    path: pathname,
    query: new URLSearchParams(search),
    headers: key ? { 'idempotency-key': key } : {},
    body,
  })
}
const data = <T>(r: MockResponse): T => (r.body as { data: T }).data

beforeEach(() => {
  clock = 1_000_000
  backend = createMockBackend({ now: () => clock })
})

describe('preview', () => {
  it('returns 300 items with before and after values and held items with a reason', () => {
    const preview = data<BatchPreview>(call('GET', '/bulk/preview'))
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
    const result = data<BatchResult>(call('POST', '/batches/apply', { batch_id: 'batch-1' }, 'k1'))
    expect(result.failed).toHaveLength(FAILED_ON_FIRST_APPLY)
    expect(result.failed.every((f) => f.retryable)).toBe(true)
    expect(result.failed.filter((f) => f.code === 'rate_limited')).toHaveLength(RATE_LIMIT_ITEMS)
    expect(result.applied.length + result.failed.length).toBe(data<BatchPreview>(call('GET', '/bulk/preview')).ready)
  })

  it('applies the retried failures on a second attempt and never touches held items', () => {
    const first = data<BatchResult>(call('POST', '/batches/apply', { batch_id: 'batch-1' }, 'k1'))
    const ids = first.failed.map((f) => f.id)
    const retry = data<BatchResult>(call('POST', '/batches/apply', { batch_id: 'batch-1', item_ids: ids }, 'k2'))
    expect(retry.failed).toEqual([])
    expect(retry.applied.sort()).toEqual([...ids].sort())

    const held = data<BatchPreview>(call('GET', '/bulk/preview')).items.find((i) => i.status === 'held')!
    const attempt = data<BatchResult>(call('POST', '/batches/apply', { batch_id: 'batch-1', item_ids: [held.id] }, 'k3'))
    expect(attempt.failed).toEqual([{ id: held.id, code: 'held', message: held.hold_reason, retryable: false }])
  })

  it('requires an Idempotency-Key and replays the same key and body without applying twice', () => {
    expect(call('POST', '/batches/apply', { batch_id: 'batch-1' }).status).toBe(400)
    const first = call('POST', '/batches/apply', { batch_id: 'batch-1' }, 'same')
    const replay = call('POST', '/batches/apply', { batch_id: 'batch-1' }, 'same')
    expect(replay.body).toEqual(first.body)
    expect(replay.headers?.['Idempotency-Replayed']).toBe('true')
  })

  it('rejects the same key with a different body', () => {
    call('POST', '/batches/apply', { batch_id: 'batch-1' }, 'same')
    expect(call('POST', '/batches/apply', { batch_id: 'batch-1', item_ids: [1] }, 'same').status).toBe(422)
  })

  it('answers 404 for an unknown batch', () => {
    expect(call('POST', '/batches/apply', { batch_id: 'nope' }, 'k').status).toBe(404)
  })
})

describe('mock control', () => {
  it('reset restores the initial state', () => {
    call('POST', '/batches/apply', { batch_id: 'batch-1' }, 'k1')
    expect(call('POST', '/reset').status).toBe(204)
    const again = data<BatchResult>(call('POST', '/batches/apply', { batch_id: 'batch-1' }, 'k1'))
    expect(again.failed).toHaveLength(FAILED_ON_FIRST_APPLY)
  })

  it('answers 404 for an unknown endpoint', () => {
    expect(call('GET', '/nope').status).toBe(404)
  })
})

describe('launch for one account', () => {
  const settings = { monthly_cap: 165000, pacing: 'even', status_at_write: 'paused' }
  const schrute = { id: 1, name: 'Schrute CDJR', manufacturer: 'stellantis', monthly_budget: 250_000 }
  const all = [1, 2, 3, 4, 5]
  const preview = (body: Record<string, unknown>) =>
    call('POST', '/launch/preview', { account: schrute, oem: 'stellantis', campaign_ids: all, settings, ...body })

  it('describes what the playbook launches and the OEM rulebooks', () => {
    const plan = data<{ campaigns: { share: number }[]; oems: { id: string; rules: number | null }[] }>(call('GET', '/launch/plan'))
    expect(plan.campaigns).toHaveLength(5)
    expect(plan.campaigns.reduce((sum, c) => sum + c.share, 0)).toBeCloseTo(1)
    expect(plan.oems.find((o) => o.id === 'stellantis')?.rules).toBe(35)
  })

  it('previews the account campaigns with a daily budget taken from the cap, holding the one that breaks a rule', () => {
    const result = data<BatchPreview>(preview({}))
    expect(result.total).toBe(5)
    const byName = Object.fromEntries(result.items.map((i) => [i.label, i]))
    expect(byName['New models · Search']).toMatchObject({ status: 'ready', before: 0, after: Math.round((165000 * 0.3) / 30) })
    expect(byName['Brand · Search'].hold_reason).toMatch(/STL-022/)
    expect(result.ready + result.held).toBe(5)
  })

  it('holds every campaign, with the reason, when the account has no Salesforce budget', () => {
    const result = data<BatchPreview>(preview({ account: { ...schrute, monthly_budget: null } }))
    expect(result.ready).toBe(0)
    expect(result.items.every((i) => /No active Salesforce budget for this account/.test(i.hold_reason ?? ''))).toBe(true)
  })

  it("holds every campaign when the cap is above the account's own monthly budget", () => {
    const result = data<BatchPreview>(preview({ settings: { ...settings, monthly_cap: 300_000 } }))
    expect(result.ready).toBe(0)
    expect(result.items[0].hold_reason).toMatch(/above this account's Salesforce-approved monthly budget of \$2,500\.00/)
  })

  it('applies the OEM rulebook only to accounts it belongs to, and not at all with No OEM', () => {
    expect(data<BatchPreview>(preview({ account: { ...schrute, manufacturer: 'toyota' } })).items[0].hold_reason).toMatch(
      /not a Stellantis account/,
    )
    const none = data<BatchPreview>(preview({ oem: 'none', account: { ...schrute, manufacturer: 'toyota' } }))
    expect(none.ready).toBe(5)
  })

  it('only previews the campaigns that were picked', () => {
    expect(data<BatchPreview>(preview({ campaign_ids: [1, 2] })).items.map((i) => i.id)).toEqual([1, 2])
  })

  it('validates the request', () => {
    expect(preview({ account: undefined }).status).toBe(422)
    expect(preview({ campaign_ids: [] }).status).toBe(422)
    expect(preview({ oem: 'nope' }).status).toBe(422)
    expect(preview({ settings: { ...settings, monthly_cap: 5000 } }).status).toBe(422)
  })

  it('writes nothing on preview; approving leaves receipts and a retryable partial failure', () => {
    const batch = data<BatchPreview>(preview({ oem: 'none' }))
    expect(data<unknown[]>(call('GET', `/batches/receipts?batch_id=${batch.batch_id}`))).toEqual([])

    const first = data<BatchResult>(call('POST', '/batches/apply', { batch_id: batch.batch_id }, 'l1'))
    expect(first.failed.map((f) => f.code).sort()).toEqual(['provider_rejected', 'rate_limited'])
    expect(first.applied.length + first.failed.length).toBe(5)

    const retry = data<BatchResult>(
      call('POST', '/batches/apply', { batch_id: batch.batch_id, item_ids: first.failed.map((f) => f.id) }, 'l2'),
    )
    expect(retry.failed).toEqual([])
    const receipts = data<{ steps: string[]; actor: string; summary: string }[]>(
      call('GET', `/batches/receipts?batch_id=${batch.batch_id}`),
    )
    expect(receipts).toHaveLength(5)
    expect(receipts[0]).toMatchObject({ actor: 'Demo strategist', steps: ['validated', 'compliance', 'dry-run', 'write'] })
    expect(receipts[0].summary).toContain('Schrute CDJR')
  })
})
