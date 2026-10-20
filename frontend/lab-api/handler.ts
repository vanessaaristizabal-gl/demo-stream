// The practice lab's mock backend. Pure and in-memory: the Vite plugin serves it in dev and Playwright, Vitest calls it directly.
// It behaves like the real backend the screens will sit on: a preview with holds, a partial apply whose failures are retryable,
// a locked field rejected with its reason, a 2,000-row list, and a rate limit.
import type {
  LabApplyFailure,
  LabApplyResult,
  LabChange,
  LabDeployAccount,
  LabDeployOptions,
  LabDeployRequest,
  LabPreview,
  LabReceipt,
  LabRow,
  LabRowStatus,
} from '../src/shared/api/types.ts'

export interface LabRequest {
  method: string
  /** Path after the `/api/lab` prefix, e.g. `/rows/12`. */
  path: string
  query: URLSearchParams
  headers: Record<string, string | undefined>
  body: unknown
}

export interface LabResponse {
  status: number
  body: unknown
  headers?: Record<string, string>
}

export const BATCH_SIZE = 300
export const ROW_COUNT = 2000
export const MAX_PER_PAGE = 100
/** Inline edits allowed per window before the server answers 429. */
export const EDIT_LIMIT = 5
export const EDIT_WINDOW_MS = 10_000
export const RATE_LIMIT_ITEMS = 5
export const FAILED_ON_FIRST_APPLY = 12

const HOLD_REASONS = ['Locked by manufacturer rule: budget changes need brand approval.', 'Over the compliance cap for this dealer group.']
const DEALERS = ['Acme Motors', 'Lakeside Toyota', 'Summit Ford', 'Riverside Honda', 'Bayview Chevrolet', 'Northgate Nissan', 'Peak Subaru']
const STATUSES: LabRowStatus[] = ['active', 'paused', 'limited', 'ended']
const DEPLOY_ACCOUNTS: LabDeployAccount[] = [
  { id: 1, name: 'Schrute CDJR', oem: 'stellantis', budget_group: 'active', envelope: 250_000 },
  { id: 2, name: 'Andy Mohr CDJR', oem: 'stellantis', budget_group: 'active', envelope: 300_000 },
  { id: 3, name: 'Allways Auto Group CDJR Atascosa', oem: 'stellantis', budget_group: 'active', envelope: 220_000 },
  { id: 4, name: 'Anderson CDJR', oem: 'stellantis', budget_group: 'none', envelope: 0 },
  { id: 5, name: 'Autonation CDJR Arapahoe', oem: 'stellantis', budget_group: 'active', envelope: 180_000 },
  { id: 6, name: 'Baker CDJR Coopersville', oem: 'stellantis', budget_group: 'active', envelope: 150_000 },
  { id: 7, name: 'Bayside CDJR Annapolis', oem: 'stellantis', budget_group: 'none', envelope: 0 },
  { id: 8, name: 'Beaver Motors CDJR', oem: 'stellantis', budget_group: 'active', envelope: 120_000 },
  { id: 9, name: 'Best CDJR', oem: 'stellantis', budget_group: 'active', envelope: 200_000 },
  { id: 10, name: 'Lakeside Toyota', oem: 'toyota', budget_group: 'active', envelope: 250_000 },
]
export const DEPLOY_OPTIONS: LabDeployOptions = {
  campaign_type: { id: 'core-models-search', label: 'Core Models Search' },
  oems: [
    { id: 'stellantis', label: 'Stellantis', rules: 35, source: 'Shift Digital Integration Spec v2.4 - 7/30/2025 + co-op rules' },
    { id: 'none', label: 'No OEM', rules: null, source: null },
  ],
  accounts: DEPLOY_ACCOUNTS,
}
const SORT_KEYS = ['name', 'dealer', 'status', 'daily_budget'] as const

const json = (status: number, body: unknown, headers?: Record<string, string>): LabResponse => ({ status, body, headers })
const error = (status: number, code: string, message: string, extra: Record<string, unknown> = {}, headers?: Record<string, string>) =>
  json(status, { error: code, message, ...extra }, headers)

const isHeld = (id: number): boolean => id % 20 === 0
const failsFirstApply = (id: number): boolean => id % 25 === 7

function buildChange(id: number): LabChange {
  const before = 5000 + (id % 7) * 500
  const held = isHeld(id)
  return {
    id,
    account: `${DEALERS[id % DEALERS.length]} · Search ${String(id).padStart(3, '0')}`,
    field: 'daily_budget',
    before,
    after: Math.round(before * 1.1),
    status: held ? 'held' : 'ready',
    hold_reason: held ? HOLD_REASONS[(id / 20) % HOLD_REASONS.length] : null,
  }
}

function buildRow(id: number): LabRow {
  return {
    id,
    name: `Campaign ${String(id).padStart(4, '0')}`,
    dealer: DEALERS[id % DEALERS.length],
    status: STATUSES[id % STATUSES.length],
    daily_budget: 2000 + ((id * 37) % 90) * 100,
    locked_reason: id % 10 === 0 ? 'Locked by manufacturer rule: this budget is set by the brand programme.' : null,
  }
}

export function createLabApi(options: { now?: () => number } = {}) {
  const now = options.now ?? Date.now

  interface Batch {
    items: LabChange[]
    /** Items that fail on their first attempt, and why. Retrying them succeeds. */
    flaky: Map<number, 'rate_limited' | 'provider_rejected'>
    summary: string
    applied: Set<number>
    attempts: Map<number, number>
  }
  let batches: Map<string, Batch>
  let receipts: LabReceipt[]
  let deploys: number
  let rows: LabRow[]
  let edits: number[]
  let idempotent: Map<string, { fingerprint: string; response: LabResponse }>

  function reset(): void {
    const items = Array.from({ length: BATCH_SIZE }, (_, i) => buildChange(i + 1))
    const flaky = new Map<number, 'rate_limited' | 'provider_rejected'>()
    items
      .filter((c) => c.status === 'ready' && failsFirstApply(c.id))
      .forEach((c, i) => flaky.set(c.id, i < RATE_LIMIT_ITEMS ? 'rate_limited' : 'provider_rejected'))
    batches = new Map([['batch-1', { items, flaky, summary: 'Daily budget raised by 10%', applied: new Set(), attempts: new Map() }]])
    receipts = []
    deploys = 0
    rows = Array.from({ length: ROW_COUNT }, (_, i) => buildRow(i + 1))
    edits = []
    idempotent = new Map()
  }
  reset()

  /** Replays a write with the same key and body; refuses the same key with a different body (like the Laravel backend). */
  function idempotently(req: LabRequest, run: () => LabResponse): LabResponse {
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

  const toPreview = (batchId: string, items: LabChange[]): LabPreview => {
    const held = items.filter((c) => c.status === 'held').length
    return { batch_id: batchId, total: items.length, ready: items.length - held, held, items }
  }

  function preview(): LabResponse {
    return json(200, { data: toPreview('batch-1', batches.get('batch-1')!.items) })
  }

  function apply(req: LabRequest): LabResponse {
    const input = (req.body ?? {}) as { batch_id?: unknown; item_ids?: unknown }
    const batch = typeof input.batch_id === 'string' ? batches.get(input.batch_id) : undefined
    if (!batch) return error(404, 'batch_not_found', 'No such batch.')
    if (input.item_ids !== undefined && !(Array.isArray(input.item_ids) && input.item_ids.every((n) => Number.isInteger(n)))) {
      return error(422, 'invalid_item_ids', 'item_ids must be a list of integers.')
    }
    const wanted = (input.item_ids as number[] | undefined) ?? batch.items.filter((c) => c.status === 'ready').map((c) => c.id)

    const okIds: number[] = []
    const failed: LabApplyFailure[] = []
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
        account: change.account,
        actor: 'Demo strategist',
        summary: batch.summary,
        steps: ['validated', 'compliance', 'dry-run', 'write'],
        at: new Date(now()).toISOString(),
      })
    }
    const result: LabApplyResult = { batch_id: input.batch_id as string, applied: okIds, failed }
    return json(200, { data: result })
  }

  /** A dry run of a playbook deploy: nothing is written. Accounts that cannot deploy are held with the reason, never dropped. */
  function deployPreview(req: LabRequest): LabResponse {
    const input = (req.body ?? {}) as Partial<LabDeployRequest>
    const cap = input.settings?.monthly_cap
    if (!Array.isArray(input.account_ids) || input.account_ids.length === 0) return error(422, 'no_accounts', 'Pick at least one account.')
    if (input.oem !== 'stellantis' && input.oem !== 'none') return error(422, 'invalid_oem', 'Unknown OEM rulebook.')
    if (typeof cap !== 'number' || !Number.isInteger(cap) || cap < 10_000)
      return error(422, 'invalid_cap', 'The monthly cap must be at least $100.00 (integer cents).')

    const items: LabChange[] = input.account_ids.flatMap((id) => {
      const account = DEPLOY_ACCOUNTS.find((a) => a.id === id)
      if (!account) return []
      let hold: string | null = null
      if (input.oem === 'stellantis' && account.oem !== 'stellantis')
        hold = `Blocked by the Stellantis rulebook: ${account.name} is a Toyota rooftop and the rulebook does not apply.`
      else if (account.budget_group === 'none')
        hold = 'No active Salesforce budget for this campaign group. The campaign holds at deploy until one exists in Salesforce.'
      else if (cap > account.envelope)
        hold = `The monthly cap is above the Salesforce-approved envelope of $${(account.envelope / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}.`
      return [
        {
          id: account.id,
          account: account.name,
          field: 'monthly_budget' as const,
          before: 0,
          after: cap,
          status: hold ? ('held' as const) : ('ready' as const),
          hold_reason: hold,
        },
      ]
    })

    const batchId = `deploy-${++deploys}`
    const flaky = new Map<number, 'rate_limited' | 'provider_rejected'>()
    items
      .filter((c) => c.status === 'ready')
      .forEach((c, i) => {
        if (i === 1) flaky.set(c.id, 'rate_limited')
        if (i === 3) flaky.set(c.id, 'provider_rejected')
      })
    const label = input.oem === 'stellantis' ? 'Stellantis rulebook' : 'no OEM rulebook'
    batches.set(batchId, {
      items,
      flaky,
      summary: `Deployed Core Models Search (${label}), ${input.settings?.pacing} pacing, ${input.settings?.status_at_write} at write`,
      applied: new Set(),
      attempts: new Map(),
    })
    return json(200, { data: toPreview(batchId, items) })
  }

  function listRows(req: LabRequest): LabResponse {
    const q = req.query
    const perPage = Math.min(Math.max(Number(q.get('per_page') ?? 50) || 50, 1), MAX_PER_PAGE)
    const page = Math.max(Number(q.get('page') ?? 1) || 1, 1)
    const status = q.get('status') ?? ''
    const text = (q.get('q') ?? '').trim().toLowerCase()
    const sortKey = (SORT_KEYS as readonly string[]).includes(q.get('sort') ?? '') ? (q.get('sort') as (typeof SORT_KEYS)[number]) : null
    const dir = q.get('dir') === 'desc' ? -1 : 1

    let result = rows.filter((r) => (!status || r.status === status) && (!text || `${r.name} ${r.dealer}`.toLowerCase().includes(text)))
    if (sortKey) {
      result = [...result].sort((a, b) => {
        const x = a[sortKey]
        const y = b[sortKey]
        return dir * (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y)))
      })
    }
    const total = result.length
    const lastPage = Math.max(1, Math.ceil(total / perPage))
    return json(200, {
      data: result.slice((page - 1) * perPage, page * perPage),
      meta: { total, page, per_page: perPage, last_page: lastPage },
    })
  }

  function updateRow(req: LabRequest, id: number): LabResponse {
    return idempotently(req, () => {
      const row = rows.find((r) => r.id === id)
      if (!row) return error(404, 'row_not_found', 'No such campaign.')
      if (row.locked_reason) return error(423, 'field_locked', row.locked_reason, { field: 'daily_budget' })

      const t = now()
      edits = edits.filter((at) => t - at < EDIT_WINDOW_MS)
      if (edits.length >= EDIT_LIMIT) {
        const retryAfter = Math.max(1, Math.ceil((edits[0] + EDIT_WINDOW_MS - t) / 1000))
        return error(
          429,
          'rate_limited',
          `Too many edits. Retry in ${retryAfter} seconds.`,
          { retry_after: retryAfter },
          { 'Retry-After': String(retryAfter) },
        )
      }

      const budget = (req.body as { daily_budget?: unknown } | null)?.daily_budget
      if (typeof budget !== 'number' || !Number.isInteger(budget) || budget < 100) {
        return error(422, 'invalid_budget', 'The daily budget must be at least $1.00 (integer cents).')
      }
      edits.push(t)
      row.daily_budget = budget
      return json(200, { data: row })
    })
  }

  function handle(req: LabRequest): LabResponse {
    const method = req.method.toUpperCase()
    const rowMatch = /^\/rows\/(\d+)$/.exec(req.path)

    if (method === 'GET' && req.path === '/bulk/preview') return preview()
    if (method === 'POST' && req.path === '/bulk/apply') return idempotently(req, () => apply(req))
    if (method === 'GET' && req.path === '/deploy/options') return json(200, { data: DEPLOY_OPTIONS })
    if (method === 'POST' && req.path === '/deploy/preview') return deployPreview(req)
    if (method === 'GET' && req.path === '/deploy/receipts') {
      const batchId = req.query.get('batch_id')
      return json(200, { data: receipts.filter((r) => !batchId || r.batch_id === batchId) })
    }
    if (method === 'GET' && req.path === '/rows') return listRows(req)
    if (method === 'PATCH' && rowMatch) return updateRow(req, Number(rowMatch[1]))
    if (method === 'POST' && req.path === '/reset') {
      reset()
      return json(204, null)
    }
    return error(404, 'not_found', 'No such lab endpoint.')
  }

  return { handle, reset }
}
