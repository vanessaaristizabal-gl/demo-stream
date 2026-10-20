export type Role = 'strategist' | 'approver' | 'admin'

export type ChangeStatus =
  'pending_approval' | 'approved' | 'applying' | 'blocked' | 'rejected' | 'applied' | 'partially_failed' | 'failed' | 'no_changes'

export interface User {
  id: number
  name: string
  email: string
  role: Role
}

export interface AdAccount {
  id: number
  provider: 'google' | 'meta'
  external_id: string
  dealer_name: string
  manufacturer: string | null
}

/** Editable campaign fields. daily_budget is in minor units (cents). */
export interface CampaignFields {
  name: string
  status: 'active' | 'paused'
  daily_budget: number | null
}

export interface Campaign {
  id: number
  external_id: string
  name: string
  type: string
  status: string
  live: Partial<CampaignFields> & Record<string, unknown>
  locks: string[]
  /** ISO 8601 with offset. Display with DateText / formatDate. */
  created_at: string
  account?: AdAccount
}

export type FieldDiff = Record<string, { old: unknown; new: unknown }>

export interface ChangeRequest {
  id: number
  campaign_id: number
  status: ChangeStatus
  changes: Partial<CampaignFields>
  diff: FieldDiff | null
  failure: Record<string, unknown> | null
  applied: string[] | null
  idempotency_key: string
  created_at: string
  campaign?: { id: number; name: string }
  requester?: { id: number; name: string }
  approver?: { id: number; name: string } | null
}

export interface ChangelogEntry {
  id: number
  source: 'platform' | 'external'
  field: string
  old_value: unknown
  new_value: unknown
  occurred_at: string
  campaign?: { id: number; name: string }
  actor?: { id: number; name: string } | null
  approver?: { id: number; name: string } | null
}

export interface Paginated<T> {
  data: T[]
  meta: { current_page: number; last_page: number; total: number }
}

/** Single resources come wrapped: { data: T }. */
export interface Resource<T> {
  data: T
}

export type SandboxPlatform = 'google' | 'meta'

/** Totals over the simulated 30 days. Money is cents, ctr is a fraction (0.045 = 4.5%). Meta-only fields are null for Google. */
export interface SandboxTotals {
  impressions: number
  clicks: number
  cost: number
  conversions: number
  conversions_value: number
  ctr: number
  average_cpc: number
  cost_per_conversion: number
  roas: number
  reach: number | null
  frequency: number | null
  cpm: number | null
}

export interface SandboxCampaign {
  id: number
  platform: SandboxPlatform
  external_id: string
  name: string
  goal: string
  status: string
  daily_budget: number
  created_at: string
  totals: SandboxTotals
}

export interface SandboxAd {
  id: string
  name?: string
  type?: string
  status: string
  [field: string]: unknown
}

/** An ad group (Google Ads) or an ad set (Meta), with its ads. */
export interface SandboxGroup {
  kind: 'ad_group' | 'ad_set'
  id: string
  name: string
  status: string
  ads: SandboxAd[]
  [field: string]: unknown
}

export interface SandboxDailyMetric {
  /** Bare date, YYYY-MM-DD. */
  date: string
  impressions: number
  clicks: number
  cost: number
  conversions: number
  conversions_value: number
  reach: number | null
}

export interface SandboxCampaignDetail extends SandboxCampaign {
  /** What the campaign was created or last edited with. */
  inputs: Omit<SandboxCampaignInput, 'platform' | 'goal' | 'daily_budget' | 'name'> & Partial<SandboxCampaignInput>
  structure: { campaign: Record<string, unknown>; groups: SandboxGroup[] }
  daily_metrics: SandboxDailyMetric[]
}

export interface SandboxCampaignInput {
  platform: SandboxPlatform
  name: string
  goal: string
  /** Cents. */
  daily_budget: number
  vehicle: string
  location: string
  landing_url: string
}

/** Only the fields to change. The platform cannot change after creation. */
export type SandboxCampaignUpdate = Partial<Omit<SandboxCampaignInput, 'platform'>> & { status?: 'active' | 'paused' }

export interface PlatformMetricInfo {
  key: string
  native: string
  label: string
  description: string
}

export interface PlatformInfo {
  platform: SandboxPlatform
  label: string
  hierarchy: string[]
  /** The native field that holds the goal: bidding_strategy_type (Google) or objective (Meta). */
  goal_setting: string
  goals: { value: string; label: string; native: string }[]
  units: string
  metrics: PlatformMetricInfo[]
}

/*
 * Practice lab (dev-only mock served by lab-api/, not by Laravel): three screens that exercise the backend
 * behaviours the product has to handle (a preview with holds, a partial failure, a lock, a dense list, a rate limit).
 */
export interface LabChange {
  id: number
  account: string
  field: 'daily_budget' | 'monthly_budget'
  /** Cents. */
  before: number
  /** Cents. */
  after: number
  status: 'ready' | 'held'
  /** Why the item is held; null when it is ready. */
  hold_reason: string | null
}

export interface LabPreview {
  batch_id: string
  total: number
  ready: number
  held: number
  items: LabChange[]
}

export interface LabApplyFailure {
  id: number
  code: 'rate_limited' | 'provider_rejected' | 'held'
  message: string
  retryable: boolean
}

export interface LabApplyResult {
  batch_id: string
  applied: number[]
  failed: LabApplyFailure[]
}

export type LabRowStatus = 'active' | 'paused' | 'limited' | 'ended'

export interface LabRow {
  id: number
  name: string
  dealer: string
  status: LabRowStatus
  /** Cents. */
  daily_budget: number
  /** Why the budget cannot be edited; null when it can. */
  locked_reason: string | null
}

export interface LabRowsQuery {
  page: number
  per_page: number
  status: LabRowStatus | ''
  q: string
  sort: 'name' | 'dealer' | 'status' | 'daily_budget' | ''
  dir: 'asc' | 'desc'
}

export interface LabDealer {
  id: string
  name: string
  city: string
}

export interface LabReceipt {
  id: number
  batch_id: string
  account: string
  actor: string
  summary: string
  /** The governed write path, step by step: validated, compliance, dry-run, write. */
  steps: string[]
  at: string
}

export type LabOem = 'stellantis' | 'none'

export interface LabDeployAccount {
  id: number
  name: string
  oem: 'stellantis' | 'toyota'
  /** Whether Salesforce has an active budget group for this campaign group. Without one the campaign holds at deploy. */
  budget_group: 'active' | 'none'
  /** Cents: the Salesforce-approved monthly envelope. A deploy may never go above it. */
  envelope: number
}

export interface LabDeployOptions {
  campaign_type: { id: string; label: string }
  oems: { id: LabOem; label: string; rules: number | null; source: string | null }[]
  accounts: LabDeployAccount[]
}

export interface LabDeploySettings {
  /** Cents. */
  monthly_cap: number
  pacing: 'even' | 'front_loaded'
  status_at_write: 'paused' | 'enabled'
}

export interface LabDeployRequest {
  oem: LabOem
  account_ids: number[]
  settings: LabDeploySettings
}
