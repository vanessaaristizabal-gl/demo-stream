// The playbooks' mock backend. Pure and in-memory: the Vite plugin serves it in dev and Playwright, Vitest calls it directly.
// It behaves like the real backend the screens will sit on: a preview with holds, a partial apply whose failures are retryable,
// and a launch for one account that holds what cannot go out, with the reason.
import type {
  BatchChange,
  BatchFailure,
  BatchPreview,
  BatchReceipt,
  BatchResult,
  LaunchPlan,
  LaunchRequest,
} from '../src/shared/api/types.ts'

export interface MockRequest {
  method: string
  /** Path after the `/api/playbooks` prefix, e.g. `/launch/preview`. */
  path: string
  query: URLSearchParams
  headers: Record<string, string | undefined>
  body: unknown
}

export interface MockResponse {
  status: number
  body: unknown
  headers?: Record<string, string>
}

export const BATCH_SIZE = 300
export const RATE_LIMIT_ITEMS = 5
export const FAILED_ON_FIRST_APPLY = 12

const HOLD_REASONS = ['Locked by manufacturer rule: budget changes need brand approval.', 'Over the compliance cap for this dealer group.']
const DEALERS = ['Acme Motors', 'Lakeside Toyota', 'Summit Ford', 'Riverside Honda', 'Bayview Chevrolet', 'Northgate Nissan', 'Peak Subaru']
/** What the playbook launches on one account. `share` is the part of the account's monthly cap each campaign gets. */
export const LAUNCH_PLAN: LaunchPlan = {
  playbook: { id: 'core-models', name: 'Core models' },
  oems: [
    { id: 'stellantis', label: 'Stellantis', rules: 35, source: 'Shift Digital Integration Spec v2.4 - 7/30/2025 + co-op rules' },
    { id: 'none', label: 'No OEM', rules: null, source: null },
  ],
  campaigns: [
    { id: 1, name: 'New models · Search', share: 0.3 },
    { id: 2, name: 'Used · Search', share: 0.2 },
    { id: 3, name: 'Brand · Search', share: 0.1 },
    { id: 4, name: 'Vehicle listing ads · PMAX', share: 0.25 },
    { id: 5, name: 'Core models · PMAX', share: 0.15 },
  ],
}
const money = (cents: number): string => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`

const json = (status: number, body: unknown, headers?: Record<string, string>): MockResponse => ({ status, body, headers })
const error = (status: number, code: string, message: string, extra: Record<string, unknown> = {}, headers?: Record<string, string>) =>
  json(status, { error: code, message, ...extra }, headers)

const isHeld = (id: number): boolean => id % 20 === 0
const failsFirstApply = (id: number): boolean => id % 25 === 7

function buildChange(id: number): BatchChange {
  const before = 5000 + (id % 7) * 500
  const held = isHeld(id)
  return {
    id,
    label: `${DEALERS[id % DEALERS.length]} · Search ${String(id).padStart(3, '0')}`,
    field: 'daily_budget',
    before,
    after: Math.round(before * 1.1),
    status: held ? 'held' : 'ready',
    hold_reason: held ? HOLD_REASONS[(id / 20) % HOLD_REASONS.length] : null,
  }
}

export function createMockBackend(options: { now?: () => number } = {}) {
  const now = options.now ?? Date.now

  interface Batch {
    items: BatchChange[]
    /** Items that fail on their first attempt, and why. Retrying them succeeds. */
    flaky: Map<number, 'rate_limited' | 'provider_rejected'>
    summary: string
    applied: Set<number>
    attempts: Map<number, number>
  }
  let batches: Map<string, Batch>
  let receipts: BatchReceipt[]
  let launches: number
  let idempotent: Map<string, { fingerprint: string; response: MockResponse }>

  /** Rebuilds the bulk batch (`batch-1`) and forgets its receipts. Launch batches are independent, so they are left alone. */
  function resetBulk(): void {
    const items = Array.from({ length: BATCH_SIZE }, (_, i) => buildChange(i + 1))
    const flaky = new Map<number, 'rate_limited' | 'provider_rejected'>()
    items
      .filter((c) => c.status === 'ready' && failsFirstApply(c.id))
      .forEach((c, i) => flaky.set(c.id, i < RATE_LIMIT_ITEMS ? 'rate_limited' : 'provider_rejected'))
    batches.set('batch-1', { items, flaky, summary: 'Daily budget raised by 10%', applied: new Set(), attempts: new Map() })
    receipts = receipts.filter((r) => r.batch_id !== 'batch-1')
  }

  function reset(): void {
    batches = new Map()
    receipts = []
    launches = 0
    idempotent = new Map()
    resetBulk()
  }
  reset()

  /** Replays a write with the same key and body; refuses the same key with a different body (like the Laravel backend). */
  function idempotently(req: MockRequest, run: () => MockResponse): MockResponse {
    const key = req.headers['idempotency-key']
    if (!key) return error(400, 'idempotency_key_required', 'Every write needs an Idempotency-Key header.')
    const fingerprint = `${req.method} ${req.path} ${JSON.stringify(req.body)}`
    const seen = idempotent.get(key)
    if (seen) {
      return seen.fingerprint === fingerprint
        ? { ...seen.response, headers: { ...seen.response.headers, 'Idempotency-Replayed': 'true' } }
        : error(422, 'idempotency_conflict', 'This Idempotency-Key was already used with a different request.')
    }
    const response = run()
    if (response.status < 500 && response.status !== 429) idempotent.set(key, { fingerprint, response })
    return response
  }

  const toPreview = (batchId: string, items: BatchChange[]): BatchPreview => {
    const held = items.filter((c) => c.status === 'held').length
    return { batch_id: batchId, total: items.length, ready: items.length - held, held, items }
  }

  function preview(): MockResponse {
    return json(200, { data: toPreview('batch-1', batches.get('batch-1')!.items) })
  }

  function apply(req: MockRequest): MockResponse {
    const input = (req.body ?? {}) as { batch_id?: unknown; item_ids?: unknown }
    const batch = typeof input.batch_id === 'string' ? batches.get(input.batch_id) : undefined
    if (!batch) return error(404, 'batch_not_found', 'No such batch.')
    if (input.item_ids !== undefined && !(Array.isArray(input.item_ids) && input.item_ids.every((n) => Number.isInteger(n)))) {
      return error(422, 'invalid_item_ids', 'item_ids must be a list of integers.')
    }
    const wanted = (input.item_ids as number[] | undefined) ?? batch.items.filter((c) => c.status === 'ready').map((c) => c.id)

    const okIds: number[] = []
    const failed: BatchFailure[] = []
    for (const id of wanted) {
      const change = batch.items.find((c) => c.id === id)
      if (!change) continue
      if (change.status === 'held') {
        failed.push({ id, code: 'held', message: change.hold_reason ?? 'Held.', retryable: false })
        continue
      }
      if (batch.applied.has(id)) continue
      const tries = (batch.attempts.get(id) ?? 0) + 1
      batch.attempts.set(id, tries)
      const why = batch.flaky.get(id)
      if (tries === 1 && why) {
        failed.push({
          id,
          code: why,
          message:
            why === 'rate_limited'
              ? 'Provider rate limit reached. Retry in 30 seconds.'
              : 'Provider rejected the update: the campaign is in its learning phase.',
          retryable: true,
        })
        continue
      }
      batch.applied.add(id)
      okIds.push(id)
      receipts.push({
        id: receipts.length + 1,
        batch_id: input.batch_id as string,
        label: change.label,
        actor: 'Demo strategist',
        summary: batch.summary,
        steps: ['validated', 'compliance', 'dry-run', 'write'],
        at: new Date(now()).toISOString(),
      })
    }
    const result: BatchResult = { batch_id: input.batch_id as string, applied: okIds, failed }
    return json(200, { data: result })
  }

  /**
   * A dry run of launching the playbook's campaigns on ONE account: nothing is written. Whatever cannot go out is held with
   * the reason, never dropped: no Salesforce budget for the account, a cap above the account's own monthly budget, an OEM
   * rulebook that does not apply to it, or a campaign that breaks a rule.
   */
  function launchPreview(req: MockRequest): MockResponse {
    const input = (req.body ?? {}) as Partial<LaunchRequest>
    const cap = input.settings?.monthly_cap
    const account = input.account
    if (!account || typeof account.id !== 'number' || !account.name) return error(422, 'no_account', 'Pick an account.')
    if (!Array.isArray(input.campaign_ids) || input.campaign_ids.length === 0)
      return error(422, 'no_campaigns', 'Pick at least one campaign to launch.')
    if (input.oem !== 'stellantis' && input.oem !== 'none') return error(422, 'invalid_oem', 'Unknown OEM rulebook.')
    if (typeof cap !== 'number' || !Number.isInteger(cap) || cap < 10_000)
      return error(422, 'invalid_cap', 'The monthly cap must be at least $100.00 (integer cents).')

    const wholeAccount: string | null =
      account.monthly_budget === null || account.monthly_budget === undefined
        ? 'No active Salesforce budget for this account. Its campaigns hold at launch until one exists in Salesforce.'
        : cap > account.monthly_budget
          ? `The monthly cap is above this account's Salesforce-approved monthly budget of ${money(account.monthly_budget)}.`
          : input.oem === 'stellantis' && account.manufacturer !== 'stellantis'
            ? `Blocked by the Stellantis rulebook: ${account.name} is not a Stellantis account, so the rulebook does not apply.`
            : null

    const items: BatchChange[] = LAUNCH_PLAN.campaigns
      .filter((c) => input.campaign_ids!.includes(c.id))
      .map((c) => {
        const rule =
          input.oem === 'stellantis' && c.name.startsWith('Brand') ? 'Blocked by rule STL-022: the 0% APR offer needs an end date.' : null
        const hold = wholeAccount ?? rule
        return {
          id: c.id,
          label: c.name,
          field: 'daily_budget' as const,
          before: 0,
          after: Math.round((cap * c.share) / 30),
          status: hold ? ('held' as const) : ('ready' as const),
          hold_reason: hold,
        }
      })

    const batchId = `launch-${++launches}`
    const flaky = new Map<number, 'rate_limited' | 'provider_rejected'>()
    items
      .filter((c) => c.status === 'ready')
      .forEach((c, i) => {
        if (i === 1) flaky.set(c.id, 'rate_limited')
        if (i === 3) flaky.set(c.id, 'provider_rejected')
      })
    const rulebook = input.oem === 'stellantis' ? 'Stellantis rulebook' : 'no OEM rulebook'
    batches.set(batchId, {
      items,
      flaky,
      summary: `Launched on ${account.name} (${rulebook}), ${input.settings?.pacing} pacing, ${input.settings?.status_at_write} at write`,
      applied: new Set(),
      attempts: new Map(),
    })
    return json(200, { data: toPreview(batchId, items) })
  }

  function handle(req: MockRequest): MockResponse {
    const method = req.method.toUpperCase()

    if (method === 'GET' && req.path === '/bulk/preview') return preview()
    if (method === 'POST' && req.path === '/batches/apply') return idempotently(req, () => apply(req))
    if (method === 'GET' && req.path === '/launch/plan') return json(200, { data: LAUNCH_PLAN })
    if (method === 'POST' && req.path === '/launch/preview') return launchPreview(req)
    if (method === 'GET' && req.path === '/batches/receipts') {
      const batchId = req.query.get('batch_id')
      return json(200, { data: receipts.filter((r) => !batchId || r.batch_id === batchId) })
    }
    if (method === 'POST' && req.path === '/reset') {
      resetBulk() // what a test needs between runs; launches never interfere with each other
      return json(204, null)
    }
    return error(404, 'not_found', 'No such playbooks endpoint.')
  }

  return { handle, reset }
}
