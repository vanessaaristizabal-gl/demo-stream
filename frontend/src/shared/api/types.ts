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
  /** Cents: this account's own monthly budget from Salesforce; null when it has none yet. */
  monthly_budget?: number | null
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

/** An ad account: one dealer on one provider, with its own monthly budget and its campaigns. */
export interface Account {
  id: number
  provider: 'google' | 'meta'
  external_id: string
  dealer_name: string
  manufacturer: string | null
  /** Cents; null when Salesforce has no budget for this account yet. */
  monthly_budget: number | null
  campaigns_count: number
  created_at: string
}

export interface AccountDetail extends Account {
  campaigns: Campaign[]
}

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
 * Playbooks (dev-only mock served by mock-backend/, not by Laravel): bulk operations across accounts that exercise the
 * behaviours the product has to handle (a preview with held items, a partial failure, a rate limit).
 */
export interface BatchChange {
  id: number
  /** What the item is: an account, a campaign. */
  label: string
  field: 'daily_budget' | 'monthly_budget'
  /** Cents. */
  before: number
  /** Cents. */
  after: number
  status: 'ready' | 'held'
  /** Why the item is held; null when it is ready. */
  hold_reason: string | null
}

export interface BatchPreview {
  batch_id: string
  total: number
  ready: number
  held: number
  items: BatchChange[]
}

export interface BatchFailure {
  id: number
  code: 'rate_limited' | 'provider_rejected' | 'held'
  message: string
  retryable: boolean
}

export interface BatchResult {
  batch_id: string
  applied: number[]
  failed: BatchFailure[]
}

export interface Dealer {
  id: string
  name: string
  city: string
}

export interface BatchReceipt {
  id: number
  batch_id: string
  label: string
  actor: string
  summary: string
  /** The governed write path, step by step: validated, compliance, dry-run, write. */
  steps: string[]
  at: string
}

export type LaunchOem = 'stellantis' | 'none'

/** What a playbook launches on one account, and which OEM rulebooks can be applied to it. */
export interface LaunchPlan {
  playbook: { id: string; name: string }
  oems: { id: LaunchOem; label: string; rules: number | null; source: string | null }[]
  /** The campaigns the playbook creates; `share` is the part of the account's monthly cap each one gets. */
  campaigns: { id: number; name: string; share: number }[]
}

/** Account settings for one launch. They start from the account's own values and change only when needed. */
export interface LaunchSettings {
  /** Cents; defaults to the account's own monthly budget. */
  monthly_cap: number
  pacing: 'even' | 'front_loaded'
  status_at_write: 'paused' | 'enabled'
}

export interface LaunchRequest {
  account: { id: number; name: string; manufacturer: string | null; monthly_budget: number | null }
  oem: LaunchOem
  campaign_ids: number[]
  settings: LaunchSettings
}

/** A manufacturer's rulebook version. Effective dates are ISO 8601; `effective_to` is null while it is the current one. */
export interface Rulebook {
  id: number
  manufacturer: string
  version: number
  effective_from: string
  effective_to: string | null
  rules: { id: string; field: string; operator: string; value?: unknown; message: string }[]
}
