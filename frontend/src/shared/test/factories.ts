import type {
  Campaign,
  ChangeRequest,
  LabChange,
  LabDeployOptions,
  LabReceipt,
  LabPreview,
  LabRow,
  LabRowsQuery,
  PlatformInfo,
  SandboxCampaign,
  SandboxCampaignDetail,
  SandboxDailyMetric,
  SandboxTotals,
} from '@/shared/api/types'

export function makeCampaign(overrides: Partial<Campaign> = {}): Campaign {
  return {
    id: 1,
    external_id: '123',
    name: 'Spring Camry',
    type: 'search',
    status: 'active',
    live: { name: 'Spring Camry', status: 'active', daily_budget: 10000 },
    locks: [],
    created_at: '2026-10-01T14:30:00+00:00',
    account: { id: 1, provider: 'google', external_id: '999', dealer_name: 'Acme Motors', manufacturer: 'toyota' },
    ...overrides,
  }
}

export function makeChangeRequest(overrides: Partial<ChangeRequest> = {}): ChangeRequest {
  return {
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
    requester: { id: 2, name: 'Sam Strategist' },
    approver: null,
    ...overrides,
  }
}

export function makeTotals(overrides: Partial<SandboxTotals> = {}): SandboxTotals {
  return {
    impressions: 12000,
    clicks: 540,
    cost: 150000,
    conversions: 31.5,
    conversions_value: 420000,
    ctr: 0.045,
    average_cpc: 278,
    cost_per_conversion: 4762,
    roas: 2.8,
    reach: null,
    frequency: null,
    cpm: null,
    ...overrides,
  }
}

export function makeSandboxCampaign(overrides: Partial<SandboxCampaign> = {}): SandboxCampaign {
  return {
    id: 1,
    platform: 'google',
    external_id: '4821907356',
    name: 'Camry - Search leads',
    goal: 'leads',
    status: 'active',
    daily_budget: 15000,
    created_at: '2026-10-19T14:30:00+00:00',
    totals: makeTotals(),
    ...overrides,
  }
}

export function makeDailyMetrics(days = 3): SandboxDailyMetric[] {
  return Array.from({ length: days }, (_, i) => ({
    date: `2026-10-${String(10 + i).padStart(2, '0')}`,
    impressions: 400 + i * 10,
    clicks: 18 + i,
    cost: 5000 + i * 100,
    conversions: 1.5,
    conversions_value: 14000,
    reach: null,
  }))
}

export function makeSandboxDetail(overrides: Partial<SandboxCampaignDetail> = {}): SandboxCampaignDetail {
  return {
    ...makeSandboxCampaign(),
    inputs: { vehicle: 'Camry', location: 'Austin', landing_url: 'https://dealer.example.com/camry' },
    structure: {
      campaign: {
        id: '4821907356',
        name: 'Camry - Search leads',
        status: 'ENABLED',
        advertising_channel_type: 'SEARCH',
        bidding_strategy_type: 'MAXIMIZE_CONVERSIONS',
      },
      groups: [
        {
          kind: 'ad_group',
          id: '4821907357',
          name: 'Camry - Buy',
          status: 'ENABLED',
          type: 'SEARCH_STANDARD',
          keywords: [
            { text: 'camry for sale', match_type: 'EXACT' },
            { text: 'buy camry', match_type: 'PHRASE' },
          ],
          ads: [
            {
              id: '4821907407',
              type: 'RESPONSIVE_SEARCH_AD',
              status: 'ENABLED',
              headlines: ['New Camry Deals', 'Schedule a Test Drive'],
              descriptions: ['Explore the Camry lineup.'],
              final_urls: ['https://dealer.example.com/camry'],
            },
          ],
        },
      ],
    },
    daily_metrics: makeDailyMetrics(),
    ...overrides,
  }
}

export function makePlatformCatalog(): PlatformInfo[] {
  return [
    {
      platform: 'google',
      label: 'Google Ads',
      hierarchy: ['Campaign', 'Ad group', 'Ad'],
      goal_setting: 'bidding_strategy_type',
      goals: [
        { value: 'leads', label: 'Leads', native: 'MAXIMIZE_CONVERSIONS' },
        { value: 'traffic', label: 'Traffic', native: 'MAXIMIZE_CLICKS' },
      ],
      units: 'The API reports money in micros; this sandbox returns integer cents.',
      metrics: [
        { key: 'impressions', native: 'metrics.impressions', label: 'Impressions', description: 'Times an ad was shown.' },
        { key: 'cost', native: 'metrics.cost_micros', label: 'Cost', description: 'Total spend.' },
      ],
    },
    {
      platform: 'meta',
      label: 'Meta Ads',
      hierarchy: ['Campaign', 'Ad set', 'Ad'],
      goal_setting: 'objective',
      goals: [
        { value: 'leads', label: 'Leads', native: 'OUTCOME_LEADS' },
        { value: 'awareness', label: 'Awareness', native: 'OUTCOME_AWARENESS' },
      ],
      units: 'The API reports spend as a decimal string; this sandbox returns integer cents.',
      metrics: [
        { key: 'reach', native: 'reach', label: 'Reach', description: 'Unique people who saw the ad.' },
        { key: 'cost', native: 'spend', label: 'Spend', description: 'Total spend.' },
      ],
    },
  ]
}

export function makeLabPreview(overrides: { ready?: number; held?: number } = {}): LabPreview {
  const ready = overrides.ready ?? 30
  const held = overrides.held ?? 3
  const items: LabChange[] = [
    ...Array.from({ length: ready }, (_, i) => ({
      id: i + 1,
      account: `Dealer ${String(i + 1).padStart(3, '0')}`,
      field: 'daily_budget' as const,
      before: 5000,
      after: 5500,
      status: 'ready' as const,
      hold_reason: null,
    })),
    ...Array.from({ length: held }, (_, i) => ({
      id: ready + i + 1,
      account: `Held dealer ${i + 1}`,
      field: 'daily_budget' as const,
      before: 8000,
      after: 8800,
      status: 'held' as const,
      hold_reason: 'Locked by manufacturer rule: budget changes need brand approval.',
    })),
  ]
  return { batch_id: 'batch-1', total: ready + held, ready, held, items }
}

export function makeLabRow(id: number, overrides: Partial<LabRow> = {}): LabRow {
  return {
    id,
    name: `Campaign ${String(id).padStart(4, '0')}`,
    dealer: 'Acme Motors',
    status: 'active',
    daily_budget: 5000,
    locked_reason: null,
    ...overrides,
  }
}

export const labQuery: LabRowsQuery = { page: 1, per_page: 50, status: '', q: '', sort: '', dir: 'asc' }

export function makeDeployOptions(): LabDeployOptions {
  return {
    campaign_type: { id: 'core-models-search', label: 'Core Models Search' },
    oems: [
      { id: 'stellantis', label: 'Stellantis', rules: 35, source: 'Shift Digital Integration Spec v2.4' },
      { id: 'none', label: 'No OEM', rules: null, source: null },
    ],
    accounts: [
      { id: 1, name: 'Schrute CDJR', oem: 'stellantis', budget_group: 'active', envelope: 250000 },
      { id: 2, name: 'Anderson CDJR', oem: 'stellantis', budget_group: 'none', envelope: 0 },
      { id: 3, name: 'Lakeside Toyota', oem: 'toyota', budget_group: 'active', envelope: 250000 },
    ],
  }
}

export const makeReceipt = (id: number, overrides: Partial<LabReceipt> = {}): LabReceipt => ({
  id,
  batch_id: 'deploy-1',
  account: 'Schrute CDJR',
  actor: 'Demo strategist',
  summary: 'Deployed Core Models Search (Stellantis rulebook)',
  steps: ['validated', 'compliance', 'dry-run', 'write'],
  at: '2026-10-20T15:30:00Z',
  ...overrides,
})
