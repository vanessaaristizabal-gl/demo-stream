import type { Campaign, SandboxCampaign } from '@/shared/api/types'

/** One line of the campaigns table: a live campaign (changed only through approval) or a simulated one (changed directly). */
export interface CampaignRow {
  key: string
  kind: 'live' | 'simulated'
  id: number
  name: string
  provider: 'google' | 'meta'
  /** The dealer for a live campaign; the demo sandbox for a simulated one. */
  owner: string
  status: string
  /** Cents; null when the provider did not report one. */
  daily_budget: number | null
  created_at: string
}

export const fromLive = (c: Campaign): CampaignRow => ({
  key: `live-${c.id}`,
  kind: 'live',
  id: c.id,
  name: c.name,
  provider: c.account?.provider ?? 'google',
  owner: c.account?.dealer_name ?? '—',
  status: c.status,
  daily_budget: c.live.daily_budget ?? null,
  created_at: c.created_at,
})

export const fromSimulated = (c: SandboxCampaign): CampaignRow => ({
  key: `simulated-${c.id}`,
  kind: 'simulated',
  id: c.id,
  name: c.name,
  provider: c.platform,
  owner: 'Demo sandbox',
  status: c.status,
  daily_budget: c.daily_budget,
  created_at: c.created_at,
})
