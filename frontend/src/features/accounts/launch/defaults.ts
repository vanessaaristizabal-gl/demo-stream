import type { Account, LaunchOem, LaunchSettings } from '@/shared/api/types'

export const MIN_CAP = 10_000

/** What a launch starts from: the account's own values. A change is the exception, made only for this launch. */
export const defaultSettings = (account: Account): LaunchSettings => ({
  monthly_cap: account.monthly_budget ?? MIN_CAP,
  pacing: 'even',
  status_at_write: 'paused',
})

/** The OEM rulebook that belongs to the account; accounts of a make without an encoded rulebook launch with none. */
export const defaultOem = (account: Account): LaunchOem => (account.manufacturer === 'stellantis' ? 'stellantis' : 'none')
