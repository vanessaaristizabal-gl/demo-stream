import type { Page, Route } from '@playwright/test'

type Role = 'strategist' | 'approver' | 'admin'

interface MockOptions {
  role?: Role
  emergencyStop?: boolean
  locks?: string[]
  /** Force the next change submission to fail with this status/body. */
  submitError?: { status: number; body: { error: string; message: string } }
  /** Make toggling the emergency stop fail with a server error. */
  stopError?: boolean
  /** Make creating a sandbox campaign fail with this status/body. */
  sandboxError?: { status: number; body: { error: string; message: string } }
}

const SANDBOX_PLATFORMS = [
  {
    platform: 'google',
    label: 'Google Ads',
    hierarchy: ['Campaign', 'Ad group', 'Ad'],
    goal_setting: 'bidding_strategy_type',
    goals: [
      { value: 'leads', label: 'Leads', native: 'MAXIMIZE_CONVERSIONS' },
      { value: 'traffic', label: 'Traffic', native: 'MAXIMIZE_CLICKS' },
      { value: 'sales', label: 'Sales', native: 'MAXIMIZE_CONVERSION_VALUE' },
    ],
    units: 'The API reports money in micros (1,000,000 = 1 currency unit); this sandbox returns integer cents.',
    metrics: [
      { key: 'impressions', native: 'metrics.impressions', label: 'Impressions', description: 'Times an ad was shown on Google Search.' },
      { key: 'clicks', native: 'metrics.clicks', label: 'Clicks', description: 'Clicks on the ad.' },
      { key: 'ctr', native: 'metrics.ctr', label: 'CTR', description: 'Clicks divided by impressions.' },
      { key: 'cost', native: 'metrics.cost_micros', label: 'Cost', description: 'Total spend.' },
      { key: 'conversions', native: 'metrics.conversions', label: 'Conversions', description: 'Actions that matter to the dealer.' },
    ],
  },
  {
    platform: 'meta',
    label: 'Meta Ads',
    hierarchy: ['Campaign', 'Ad set', 'Ad'],
    goal_setting: 'objective',
    goals: [
      { value: 'leads', label: 'Leads', native: 'OUTCOME_LEADS' },
      { value: 'traffic', label: 'Traffic', native: 'OUTCOME_TRAFFIC' },
      { value: 'sales', label: 'Sales', native: 'OUTCOME_SALES' },
      { value: 'awareness', label: 'Awareness', native: 'OUTCOME_AWARENESS' },
    ],
    units: 'The Marketing API reports spend as a decimal string in the account currency; this sandbox returns integer cents.',
    metrics: [
      { key: 'impressions', native: 'impressions', label: 'Impressions', description: 'Times an ad was on screen.' },
      { key: 'reach', native: 'reach', label: 'Reach', description: 'Unique people who saw the ad.' },
      { key: 'cost', native: 'spend', label: 'Spend', description: 'Total spend.' },
    ],
  },
]

const sandboxTotals = (platform: string) => ({
  impressions: 12000,
  clicks: 540,
  cost: 150000,
  conversions: 31.5,
  conversions_value: 420000,
  ctr: 0.045,
  average_cpc: 278,
  cost_per_conversion: 4762,
  roas: 2.8,
  reach: platform === 'meta' ? 9000 : null,
  frequency: platform === 'meta' ? 1.33 : null,
  cpm: platform === 'meta' ? 1250 : null,
})

const sandboxCampaign = (id: number, input: Record<string, unknown>) => {
  const platform = String(input.platform)
  return {
    id,
    platform,
    external_id: platform === 'google' ? '4821907356' : '104829175530419',
    name: String(input.name),
    goal: String(input.goal),
    status: 'active',
    daily_budget: Number(input.daily_budget),
    created_at: '2026-10-19T14:30:00+00:00',
    totals: sandboxTotals(platform),
    inputs: {
      vehicle: String(input.vehicle ?? 'Camry'),
      location: String(input.location ?? 'Austin'),
      landing_url: String(input.landing_url ?? 'https://dealer.example.com/camry'),
    },
    structure: {
      campaign: { id: '4821907356', name: String(input.name), status: platform === 'google' ? 'ENABLED' : 'ACTIVE' },
      groups: [
        {
          kind: platform === 'google' ? 'ad_group' : 'ad_set',
          id: '4821907357',
          name: platform === 'google' ? 'Camry - Buy' : 'Local audience - Dallas',
          status: platform === 'google' ? 'ENABLED' : 'ACTIVE',
          ads: [{ id: '4821907407', name: 'Camry - Ad', status: platform === 'google' ? 'ENABLED' : 'ACTIVE' }],
        },
      ],
    },
    daily_metrics: Array.from({ length: 30 }, (_, i) => ({
      date: `2026-09-${String(20 + (i % 10)).padStart(2, '0')}`,
      impressions: 400 + i,
      clicks: 18,
      cost: 5000 + i * 10,
      conversions: 1.5,
      conversions_value: 14000,
      reach: platform === 'meta' ? 300 : null,
    })),
  }
}

const USERS: Record<Role, { id: number; name: string; email: string; role: Role }> = {
  strategist: { id: 1, name: 'Sam Strategist', email: 'strategist@example.com', role: 'strategist' },
  approver: { id: 2, name: 'Ana Approver', email: 'approver@example.com', role: 'approver' },
  admin: { id: 3, name: 'Adi Admin', email: 'admin@example.com', role: 'admin' },
}

/** In-memory fake of the Laravel API, with request logs so tests can assert on what the UI sent. */
export async function mockApi(
  page: Page,
  { role = 'strategist', emergencyStop = false, locks = [], submitError, stopError = false, sandboxError }: MockOptions = {},
) {
  const log = {
    submissions: [] as { headers: Record<string, string>; body: unknown }[],
    decisions: [] as string[],
    sandboxCreations: [] as { headers: Record<string, string>; body: unknown }[],
    sandboxEdits: [] as { headers: Record<string, string>; body: unknown }[],
    sandboxDeletions: [] as { headers: Record<string, string> }[],
  }
  const sandbox = [sandboxCampaign(1, { platform: 'google', name: 'Camry - Search leads', goal: 'leads', daily_budget: 15000 })]
  const user = USERS[role]

  const campaign = {
    id: 1,
    external_id: '123',
    name: 'Spring Camry',
    type: 'search',
    status: 'active',
    locks,
    created_at: '2026-10-01T14:30:00+00:00',
    live: { name: 'Spring Camry', status: 'active', daily_budget: 10000 },
    account: { id: 1, provider: 'google', external_id: '999', dealer_name: 'Acme Motors', manufacturer: 'toyota' },
  }
  const request = {
    id: 7,
    campaign_id: 1,
    status: 'pending_approval',
    changes: { status: 'paused' },
    diff: { status: { old: 'active', new: 'paused' } },
    failure: null,
    applied: null,
    idempotency_key: 'k',
    created_at: '2026-10-15T10:00:00Z',
    campaign: { id: 1, name: 'Spring Camry' },
    requester: { id: 1, name: 'Sam Strategist' },
    approver: null,
  }
  const json = (route: Route, body: unknown, status = 200) =>
    route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })

  await page.addInitScript(() => localStorage.setItem('stream.token', 'test-token'))

  // Match on pathname: a glob like **/api/** would also swallow Vite's /src/api/*.ts modules.
  await page.route(
    (url) => url.pathname.startsWith('/api/'),
    async (route) => {
      const req = route.request()
      const path = new URL(req.url()).pathname.replace('/api', '')
      const method = req.method()

      if (path.startsWith('/lab/')) return route.fallback() // the practice lab has its own mock, served by Vite (lab-api/)
      if (path === '/login') return json(route, { token: 'test-token', user })
      if (path === '/me') return json(route, user)
      if (path === '/logout') return route.fulfill({ status: 204 })
      if (path === '/emergency-stop') {
        if (method === 'POST' && stopError) return json(route, { message: 'The server could not be reached.' }, 500)
        if (method === 'POST') emergencyStop = JSON.parse(req.postData() ?? '{}').active
        return json(route, { active: emergencyStop })
      }
      if (path === '/campaigns') return json(route, { data: [campaign], meta: { current_page: 1, last_page: 1, total: 1 } })
      if (path === '/campaigns/1') return json(route, { data: campaign })
      if (path === '/campaigns/1/changes') {
        log.submissions.push({ headers: req.headers(), body: req.postDataJSON() })
        if (submitError) return json(route, submitError.body, submitError.status)
        return json(route, { data: { ...request, id: 8, status: 'pending_approval' } }, 201)
      }
      if (path === '/sandbox/catalog') return json(route, { data: { platforms: SANDBOX_PLATFORMS } })
      if (path === '/sandbox/campaigns' && method === 'POST') {
        log.sandboxCreations.push({ headers: req.headers(), body: req.postDataJSON() })
        if (sandboxError) return json(route, sandboxError.body, sandboxError.status)
        const created = sandboxCampaign(sandbox.length + 1, req.postDataJSON())
        sandbox.push(created)
        return json(route, { data: created }, 201)
      }
      if (path === '/sandbox/campaigns') {
        const rows = sandbox.map((c) => Object.fromEntries(Object.entries(c).filter(([k]) => k !== 'structure' && k !== 'daily_metrics')))
        return json(route, { data: rows, meta: { current_page: 1, last_page: 1, total: rows.length } })
      }
      const sandboxMatch = path.match(/^\/sandbox\/campaigns\/(\d+)$/)
      if (sandboxMatch) {
        const found = sandbox.find((c) => c.id === Number(sandboxMatch[1]))
        if (!found) return json(route, { message: 'Not found' }, 404)
        if (method === 'PATCH') {
          log.sandboxEdits.push({ headers: req.headers(), body: req.postDataJSON() })
          Object.assign(found, req.postDataJSON())
          return json(route, { data: found })
        }
        if (method === 'DELETE') {
          log.sandboxDeletions.push({ headers: req.headers() })
          sandbox.splice(sandbox.indexOf(found), 1)
          return route.fulfill({ status: 204 })
        }
        return json(route, { data: found })
      }
      if (path === '/change-requests') return json(route, { data: [request], meta: { current_page: 1, last_page: 1, total: 1 } })
      if (path === '/change-requests/7/approve') {
        log.decisions.push('approve')
        if (role === 'approver' && user.id === request.requester.id) {
          return json(route, { error: 'self_approval', message: 'A change cannot be approved by the person who requested it.' }, 403)
        }
        return json(route, { data: { id: 7, status: 'applied', approver: { id: user.id, name: user.name } } })
      }
      if (path === '/change-requests/7/reject') {
        log.decisions.push('reject')
        return json(route, { data: { id: 7, status: 'rejected', approver: { id: user.id, name: user.name } } })
      }
      if (path === '/changelog') {
        return json(route, {
          data: [
            {
              id: 1,
              source: 'external',
              field: 'daily_budget',
              old_value: 10000,
              new_value: 20000,
              occurred_at: '2026-10-15T09:00:00Z',
              campaign: { id: 1, name: 'Spring Camry' },
              actor: null,
              approver: null,
            },
          ],
        })
      }
      return json(route, { message: `Unmocked ${method} ${path}` }, 404)
    },
  )

  return log
}
